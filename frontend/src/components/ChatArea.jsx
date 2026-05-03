import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiSend, FiVideo, FiMoreVertical, FiSmile, FiPaperclip, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import MessageBubble from './MessageBubble';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

export default function ChatArea({ currentUser, activeChatUser, socket, onCallUser, onlineUsers, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOnline = onlineUsers.includes(activeChatUser._id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${API_URL}/messages/${currentUser._id}/${activeChatUser._id}`);
        setMessages(response.data);
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error('Failed to fetch messages', error);
      }
    };

    if (activeChatUser) {
      fetchMessages();
      setShowDropdown(false); // Reset dropdown on chat change
    }
  }, [currentUser._id, activeChatUser]);

  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (message) => {
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
    if (!newMessage.trim() && !selectedImage) return;

    const messageData = {
      sender: currentUser._id,
      receiver: activeChatUser._id,
      text: newMessage.trim(),
      imageUrl: selectedImage
    };

    try {
      const response = await axios.post(`${API_URL}/messages`, messageData);
      setMessages(prev => [...prev, response.data]);
      socket.emit('send_message', response.data);
      socket.emit('stop_typing', { senderId: currentUser._id, receiverId: activeChatUser._id });
      setNewMessage('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm(`Are you sure you want to clear this chat with ${activeChatUser.name}?`)) return;
    
    try {
      await axios.put(`${API_URL}/messages/clear`, {
        userId: currentUser._id,
        chatUserId: activeChatUser._id
      });
      setMessages([]); // Clear locally
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to clear chat', error);
      alert('Failed to clear chat');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 relative">
      {/* Mesh Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex-shrink-0 p-4 px-8 flex justify-between items-center glass-panel border-0 border-b border-white/5 z-20">
        <div className="flex items-center space-x-3 md:space-x-5">
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-xl text-light-300/60 hover:bg-white/5 transition-all"
          >
            <FiArrowLeft size={24} />
          </button>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white font-bold text-lg border border-white/10 overflow-hidden">
              {activeChatUser.profilePicture ? (
                <img src={activeChatUser.profilePicture} alt={activeChatUser.name} className="w-full h-full object-cover" />
              ) : (
                activeChatUser.name?.charAt(0).toUpperCase()
              )}
            </div>
            {isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-primary rounded-full border-[3px] border-dark-800 shadow-lg animate-pulse"></div>}
          </div>
          <div>
            <h2 className="font-bold text-white text-xl tracking-tight leading-none">{activeChatUser.name}</h2>
            <p className="text-xs text-brand-primary font-bold mt-1">
              {isOnline ? 'Active Now' : 'Last seen recently'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onCallUser}
            className="p-3 rounded-2xl bg-white/5 text-brand-primary border border-white/10 hover:bg-brand-primary hover:text-white transition-all transform active:scale-95 shadow-soft"
          >
            <FiVideo size={20} />
          </button>
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-3 rounded-2xl text-light-300/40 hover:text-white hover:bg-white/5 transition-all"
            >
              <FiMoreVertical size={20} />
            </button>
            
            {showDropdown && (
              <div className="absolute top-14 right-0 w-48 bg-dark-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <button 
                  onClick={handleClearChat}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-all flex items-center space-x-3"
                >
                  <FiTrash2 size={16} />
                  <span>Clear Chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 space-y-6 relative z-10 custom-scrollbar">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg._id || idx}
            message={msg}
            isOwnMessage={msg.sender === currentUser._id}
          />
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 text-light-300/60 px-5 py-3 rounded-2xl rounded-tl-none border border-white/5 text-xs font-bold animate-pulse">
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 md:p-6 bg-white/[0.01] backdrop-blur-md relative z-20 border-t border-white/5 flex flex-col space-y-3">
        {/* Image Preview */}
        {selectedImage && (
          <div className="relative self-start ml-2 md:ml-12">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
              <img src={selectedImage} alt="Preview" className="h-32 object-cover" />
              <button 
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 bg-dark-900/80 hover:bg-red-500 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-3 md:space-x-4 max-w-5xl mx-auto relative">
          
          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-0 z-50" ref={emojiPickerRef}>
              <EmojiPicker 
                theme="dark" 
                onEmojiClick={(emojiData) => {
                  setNewMessage(prev => prev + emojiData.emoji);
                }} 
              />
            </div>
          )}

          <div className="flex space-x-1">
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 rounded-xl text-light-300/40 hover:text-white hover:bg-white/5 transition-all"
            >
              <FiSmile size={22} />
            </button>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-light-300/40 hover:text-white hover:bg-white/5 transition-all hidden sm:block"
            >
              <FiPaperclip size={22} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type your message..."
            className="flex-1 glass-input py-3.5 px-5 text-sm"
          />

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3.5 rounded-xl bg-brand-primary text-white shadow-brand hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <FiSend size={22} />
          </button>
        </form>
      </div>
    </div>
  );
}
