import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiSend, FiVideo } from 'react-icons/fi';
import MessageBubble from './MessageBubble';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

export default function ChatArea({ currentUser, activeChatUser, socket, onCallUser, onlineUsers }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const isOnline = onlineUsers.includes(activeChatUser._id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${API_URL}/messages/${currentUser._id}/${activeChatUser._id}`);
        setMessages(response.data);
        scrollToBottom();
      } catch (error) {
        console.error('Failed to fetch messages', error);
      }
    };
    
    if (activeChatUser) {
      fetchMessages();
    }
  }, [currentUser._id, activeChatUser]);

  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (message) => {
        // Only add messages from the OTHER user — our own are already added locally on send
        if (message.sender === activeChatUser._id && message.receiver === currentUser._id) {
          message.status = 'read';
          socket.emit('message_status_update', { messageId: message._id, status: 'read', senderId: message.sender });
          setMessages(prev => [...prev, message]);
        }
      };

      const handleTyping = ({ senderId }) => {
        if (senderId === activeChatUser._id) setIsTyping(true);
      };

      const handleStopTyping = ({ senderId }) => {
        if (senderId === activeChatUser._id) setIsTyping(false);
      };

      const handleStatusUpdate = ({ messageId, status }) => {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status } : m));
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('typing', handleTyping);
      socket.on('stop_typing', handleStopTyping);
      socket.on('message_status_update', handleStatusUpdate);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('typing', handleTyping);
        socket.off('stop_typing', handleStopTyping);
        socket.off('message_status_update', handleStatusUpdate);
      };
    }
  }, [socket, activeChatUser, currentUser._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (socket && activeChatUser) {
      socket.emit('typing', { senderId: currentUser._id, receiverId: activeChatUser._id });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { senderId: currentUser._id, receiverId: activeChatUser._id });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      sender: currentUser._id,
      receiver: activeChatUser._id,
      text: newMessage.trim(),
    };

    try {
      const response = await axios.post(`${API_URL}/messages`, messageData);
      setMessages(prev => [...prev, response.data]); // Locally append the message
      socket.emit('send_message', response.data);
      socket.emit('stop_typing', { senderId: currentUser._id, receiverId: activeChatUser._id });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const formatLastSeen = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-neu-bg rounded-tr-3xl rounded-br-3xl">
      {/* Header */}
      <div className="p-4 border-b border-neu-dark/30 flex justify-between items-center shadow-neu-sm z-10 bg-neu-bg rounded-tr-3xl">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-neu-text font-bold shadow-neu-pressed">
            {activeChatUser.name?.charAt(0).toUpperCase() || activeChatUser.username?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <h2 className="font-semibold text-neu-text text-lg">{activeChatUser.name || activeChatUser.username}</h2>
            <p className="text-xs text-neu-textMuted">
              {isOnline ? 'Online' : `Last seen ${formatLastSeen(activeChatUser.lastSeen)}`}
            </p>
          </div>
        </div>

        <button 
          onClick={onCallUser}
          className="p-3 rounded-full text-neu-primary hover:shadow-neu-flat active:shadow-neu-pressed transition-all"
          title="Video Call"
        >
          <FiVideo size={22} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <MessageBubble 
            key={msg._id || idx} 
            message={msg} 
            isOwnMessage={msg.sender === currentUser._id} 
          />
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-neu-bg text-neu-textMuted px-4 py-2 rounded-2xl shadow-neu-flat text-sm italic">
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-neu-bg border-t border-neu-dark/30 rounded-br-3xl">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 bg-neu-bg text-neu-text px-6 py-4 rounded-2xl outline-none shadow-neu-pressed transition-all focus:shadow-neu-inset-sm placeholder-neu-textMuted/50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-4 rounded-2xl bg-neu-bg text-neu-primary shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed transition-all disabled:opacity-50 disabled:shadow-neu-flat"
          >
            <FiSend size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}
