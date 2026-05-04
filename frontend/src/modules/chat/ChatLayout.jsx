import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import client from '../../api/client';
import Sidebar from '../users/Sidebar';
import ChatArea from './ChatArea';
import CallModal from '../../shared/CallModal';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5005';

export default function ChatLayout({ currentUser, onLogout, onUpdateUser }) {
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  const usersRef = useRef([]);
  const activeChatUserRef = useRef(null);

  // WebRTC States
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const connectionRef = useRef();
  const streamRef = useRef();

  useEffect(() => {
    activeChatUserRef.current = activeChatUser;
  }, [activeChatUser]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('user_connected', currentUser._id);
    });

    newSocket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('receive_message', async (message) => {
      const senderId = message.sender;
      const activeChat = activeChatUserRef.current;

      if (!activeChat || activeChat._id !== senderId) {
        setUnreadCounts(prev => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1
        }));
      }

      const alreadyInList = usersRef.current.some(u => u._id === senderId);
      if (!alreadyInList && senderId !== currentUser._id) {
        try {
          const { data } = await client.get(`/users/${senderId}`);
          setUsers(prev => {
            const updated = [data, ...prev];
            usersRef.current = updated;
            return updated;
          });
        } catch (err) {
          console.error('Failed to fetch new contact', err);
        }
      }
    });

    newSocket.on('incoming_call', (data) => {
      setReceivingCall(true);
      const callerName = usersRef.current.find(u => u._id === data.from)?.name || 'Someone';
      setCaller({ id: data.from, name: callerName });
      setCallerSignal(data.signal);
    });

    newSocket.on('call_ended', () => handleEndCall(false));

    return () => newSocket.close();
  }, [currentUser._id]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await client.get('/users');
        const fetchedUsers = data.filter(u => u._id !== currentUser._id);
        setUsers(fetchedUsers);
        usersRef.current = fetchedUsers;
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };
    fetchUsers();
  }, [currentUser._id]);

  const handleSelectChatUser = (user) => {
    setActiveChatUser(user);
    setUnreadCounts(prev => {
      const updated = { ...prev };
      delete updated[user._id];
      return updated;
    });
  };

  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Failed to get media devices', err);
      return null;
    }
  };

  const callUser = async (idToCall) => {
    const stream = await getMediaStream();
    if (!stream) return;
    setIsCalling(true);

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    connectionRef.current = peer;
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) socket.emit('ice_candidate', { to: idToCall, candidate: event.candidate });
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    peer.onnegotiationneeded = async () => {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('call_user', { userToCall: idToCall, signalData: peer.localDescription, from: currentUser._id });
      } catch (err) { console.error(err); }
    };

    socket.on('call_accepted', async (signal) => {
      setCallAccepted(true);
      await peer.setRemoteDescription(new RTCSessionDescription(signal));
    });

    socket.on('ice_candidate', async (candidate) => {
      try { await peer.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { }
    });
  };

  const answerCall = async () => {
    setCallAccepted(true);
    setReceivingCall(false);
    const stream = await getMediaStream();
    if (!stream) return;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    connectionRef.current = peer;
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) socket.emit('ice_candidate', { to: caller.id, candidate: event.candidate });
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit('answer_call', { signal: peer.localDescription, to: caller.id });
  };

  const handleEndCall = (emit = true) => {
    setCallAccepted(false);
    setReceivingCall(false);
    setIsCalling(false);

    if (emit && connectionRef.current) {
      const peerId = activeChatUser?._id || caller?.id;
      if (peerId) socket.emit('end_call', { to: peerId });
    }

    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const showCallModal = receivingCall || callAccepted || isCalling;

  return (
    <div className="h-full w-full flex items-center justify-center p-0 md:p-8 bg-dark-900 bg-mesh relative overflow-hidden">
      {showCallModal && (
        <CallModal
          call={caller}
          acceptedCall={callAccepted}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          answerCall={answerCall}
          rejectCall={() => handleEndCall(true)}
          endCall={() => handleEndCall(true)}
          isCalling={isCalling}
        />
      )}

      <div className="w-full h-full max-w-7xl flex md:rounded-[2.5rem] glass-panel relative z-10 border-0 md:border border-white/5 overflow-hidden">
        <div className="w-full md:w-[380px] h-full flex-shrink-0">
          <Sidebar
            users={users}
            activeChatUser={activeChatUser}
            setActiveChatUser={handleSelectChatUser}
            currentUser={currentUser}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
            onlineUsers={onlineUsers}
            unreadCounts={unreadCounts}
          />
        </div>

        <div className="hidden md:flex flex-1 h-full flex-col min-w-0 bg-white/[0.01]">
          {activeChatUser ? (
            <ChatArea
              currentUser={currentUser}
              activeChatUser={activeChatUser}
              socket={socket}
              onCallUser={() => callUser(activeChatUser._id)}
              onlineUsers={onlineUsers}
              onBack={() => setActiveChatUser(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center p-12">
              <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center shadow-soft border border-white/5 animate-bounce-slow">
                <span className="text-brand-primary text-5xl font-black">W</span>
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">WhatsApp Premium</h2>
                <p className="text-light-300/30 font-medium mt-2 max-w-xs mx-auto">Select a friend from the sidebar to start a secure conversation.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
