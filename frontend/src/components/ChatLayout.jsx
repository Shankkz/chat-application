import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import CallModal from './CallModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5005';

export default function ChatLayout({ currentUser, onLogout, token }) {
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({}); // { [senderId]: count }

  const usersRef = useRef([]);
  const activeChatUserRef = useRef(null); // ref so socket listeners can read latest value

  // WebRTC States
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const connectionRef = useRef();
  const streamRef = useRef();

  // Keep activeChatUserRef in sync
  useEffect(() => {
    activeChatUserRef.current = activeChatUser;
  }, [activeChatUser]);

  useEffect(() => {
    // Connect to Socket.io
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit('user_connected', currentUser._id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connect error:', err);
    });

    newSocket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    // Global receive_message handler for unread counts + new contact appearance
    newSocket.on('receive_message', async (message) => {
      const senderId = message.sender;
      const activeChat = activeChatUserRef.current;

      // If the message is from someone other than the active chat → increment badge
      if (!activeChat || activeChat._id !== senderId) {
        setUnreadCounts(prev => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1
        }));
      }

      // If sender is not yet in the users list → fetch and add them
      const alreadyInList = usersRef.current.some(u => u._id === senderId);
      if (!alreadyInList && senderId !== currentUser._id) {
        try {
          const response = await axios.get(`${API_URL}/users/${senderId}`);
          const newUser = response.data;
          setUsers(prev => {
            const updated = [newUser, ...prev];
            usersRef.current = updated;
            return updated;
          });
        } catch (err) {
          console.error('Failed to fetch new contact', err);
        }
      }
    });

    // WebRTC Listeners
    newSocket.on('incoming_call', (data) => {
      setReceivingCall(true);
      const callerName = usersRef.current.find(u => u._id === data.from)?.name || 'Someone';
      setCaller({ id: data.from, name: callerName });
      setCallerSignal(data.signal);
    });

    return () => newSocket.close();
  }, [currentUser._id]);

  useEffect(() => {
    // Fetch available users
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/users`);
        const fetchedUsers = response.data.filter(u => u._id !== currentUser._id);
        setUsers(fetchedUsers);
        usersRef.current = fetchedUsers;
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };
    fetchUsers();
  }, [currentUser._id]);

  // Clear unread count when opening a chat
  const handleSelectChatUser = (user) => {
    setActiveChatUser(user);
    setUnreadCounts(prev => {
      const updated = { ...prev };
      delete updated[user._id];
      return updated;
    });
  };

  // WebRTC Methods
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
    setCallEnded(false);

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });
    connectionRef.current = peer;

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', { to: idToCall, candidate: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peer.onnegotiationneeded = async () => {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('call_user', { userToCall: idToCall, signalData: peer.localDescription, from: currentUser._id });
      } catch (err) {
        console.error(err);
      }
    };

    socket.on('call_accepted', async (signal) => {
      setCallAccepted(true);
      await peer.setRemoteDescription(new RTCSessionDescription(signal));
    });

    socket.on('ice_candidate', async (candidate) => {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding received ice candidate', e);
      }
    });

    socket.on('call_ended', () => {
      handleEndCall(false);
    });
  };

  const answerCall = async () => {
    setCallAccepted(true);
    setReceivingCall(false);

    const stream = await getMediaStream();
    if (!stream) return;

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });
    connectionRef.current = peer;

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', { to: caller.id, candidate: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    socket.on('ice_candidate', async (candidate) => {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding received ice candidate', e);
      }
    });

    socket.on('call_ended', () => {
      handleEndCall(false);
    });

    await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit('answer_call', { signal: peer.localDescription, to: caller.id });
  };

  const handleEndCall = (emit = true) => {
    setCallEnded(true);
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
    <div className="h-screen w-full flex items-center justify-center p-4 sm:p-8">
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

      <div className="w-full h-full max-w-6xl flex rounded-3xl overflow-hidden shadow-neu-flat bg-neu-bg">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 h-full border-r border-neu-dark/30">
          <Sidebar 
            users={users} 
            activeChatUser={activeChatUser} 
            setActiveChatUser={handleSelectChatUser}
            currentUser={currentUser}
            onLogout={onLogout}
            onlineUsers={onlineUsers}
            unreadCounts={unreadCounts}
          />
        </div>

        {/* Main Chat Area */}
        <div className="hidden md:flex w-2/3 h-full flex-col">
          {activeChatUser ? (
            <ChatArea 
              currentUser={currentUser} 
              activeChatUser={activeChatUser} 
              socket={socket} 
              onCallUser={() => callUser(activeChatUser._id)}
              onlineUsers={onlineUsers}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-neu-textMuted bg-neu-bg shadow-neu-pressed m-4 rounded-3xl">
              <p className="text-xl">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
