import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiVideo, FiMoreVertical, FiSmile, FiPaperclip, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import client from '../../api/client';
import MessageBubble from './MessageBubble';
import ConfirmModal from '../../shared/ConfirmModal';
import { MessageSkeleton, Spinner } from '../../shared/Loader';

const PAGE_SIZE = 50;

export default function ChatArea({ currentUser, activeChatUser, socket, onCallUser, onlineUsers, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef   = useRef(null);
  const messagesTopRef   = useRef(null);
  const dropdownRef      = useRef(null);
  const emojiPickerRef   = useRef(null);
  const fileInputRef     = useRef(null);
  const isOnline = onlineUsers.includes(activeChatUser._id);

  // ── Click-outside ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Fetch messages (initial) ─────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true);
    setPage(1);
    try {
      const { data } = await client.get(
        `/messages/${currentUser._id}/${activeChatUser._id}?page=1`
      );
      setMessages(data.messages);
      setHasMore(data.hasMore);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('[ChatArea] fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser._id, activeChatUser._id]);

  useEffect(() => {
    if (activeChatUser) {
      fetchMessages();
      setShowDropdown(false);
      setShowEmojiPicker(false);
    }
  }, [activeChatUser, fetchMessages]);

  // ── Load older messages on scroll to top ────────────────────────────────
  const handleScroll = async (e) => {
    if (e.target.scrollTop === 0 && hasMore && !loadingOlder) {
      setLoadingOlder(true);
      const nextPage = page + 1;
      try {
        const { data } = await client.get(
          `/messages/${currentUser._id}/${activeChatUser._id}?page=${nextPage}`
        );
        setMessages(prev => [...data.messages, ...prev]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      } catch (err) {
        console.error('[ChatArea] load older:', err);
      } finally {
        setLoadingOlder(false);
      }
    }
  };

  // ── Socket events ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onReceive = (message) => {
      if (message.sender === activeChatUser._id && message.receiver === currentUser._id) {
        message.status = 'read';
        socket.emit('message_status_update', { messageId: message._id, status: 'read', senderId: message.sender });
        setMessages(prev => [...prev, message]);
      }
    };
    const onTyping     = ({ senderId }) => { if (senderId === activeChatUser._id) setIsTyping(true); };
    const onStopTyping = ({ senderId }) => { if (senderId === activeChatUser._id) setIsTyping(false); };
    const onStatus     = ({ messageId, status }) =>
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status } : m));

    socket.on('receive_message',   onReceive);
    socket.on('typing',            onTyping);
    socket.on('stop_typing',       onStopTyping);
    socket.on('message_status_update', onStatus);

    return () => {
      socket.off('receive_message',   onReceive);
      socket.off('typing',            onTyping);
      socket.off('stop_typing',       onStopTyping);
      socket.off('message_status_update', onStatus);
    };
  }, [socket, activeChatUser, currentUser._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleTypingInput = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !activeChatUser) return;
    socket.emit('typing', { senderId: currentUser._id, receiverId: activeChatUser._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { senderId: currentUser._id, receiverId: activeChatUser._id });
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    const payload = {
      sender:   currentUser._id,
      receiver: activeChatUser._id,
      text:     newMessage.trim(),
      imageUrl: selectedImage,
    };

    try {
      const { data } = await client.post('/messages', payload);
      setMessages(prev => [...prev, data]);
      socket?.emit('send_message', data);
      socket?.emit('stop_typing', { senderId: currentUser._id, receiverId: activeChatUser._id });
      setNewMessage('');
      setSelectedImage(null);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('[ChatArea] send message:', err);
    }
  };

  const handleClearChat = async () => {
    try {
      // userId comes from JWT via auth middleware — only send chatUserId
      await client.put('/messages/clear', { chatUserId: activeChatUser._id });
      setMessages([]);
      setShowClearConfirm(false);
      setShowDropdown(false);
    } catch (err) {
      console.error('[ChatArea] clear chat:', err);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected after removal
    e.target.value = '';
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-dark-900 relative">
      {/* Mesh Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex-shrink-0 p-4 px-8 flex justify-between items-center glass-panel border-0 border-b border-white/5 z-20">
        <div className="flex items-center space-x-3 md:space-x-5">
          <button onClick={onBack} className="md:hidden p-2 rounded-xl text-light-300/60 hover:bg-white/5 transition-all">
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
            {isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-primary rounded-full border-[3px] border-dark-800 shadow-lg animate-pulse" />}
          </div>
          <div>
            <h2 className="font-bold text-white text-xl tracking-tight leading-none">{activeChatUser.name}</h2>
            <p className="text-xs text-brand-primary font-bold mt-1">
              {isOnline ? 'Active Now' : 'Last seen recently'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={onCallUser} className="p-3 rounded-2xl bg-white/5 text-brand-primary border border-white/10 hover:bg-brand-primary hover:text-white transition-all transform active:scale-95 shadow-soft">
            <FiVideo size={20} />
          </button>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowDropdown(!showDropdown)} className="p-3 rounded-2xl text-light-300/40 hover:text-white hover:bg-white/5 transition-all">
              <FiMoreVertical size={20} />
            </button>
            {showDropdown && (
              <div className="absolute top-14 right-0 w-48 bg-dark-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <button
                  onClick={() => { setShowDropdown(false); setShowClearConfirm(true); }}
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
      <div
        className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 space-y-6 relative z-10 custom-scrollbar"
        onScroll={handleScroll}
      >
        {/* Load older indicator */}
        {loadingOlder && (
          <div className="flex justify-center py-2"><Spinner size={24} /></div>
        )}

        <div ref={messagesTopRef} />

        {loadingMessages ? (
          <MessageSkeleton />
        ) : (!messages || messages.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <FiSend size={32} className="text-brand-primary" />
            </div>
            <p className="text-white text-sm font-bold uppercase tracking-widest">No messages yet</p>
            <p className="text-light-300 text-xs mt-1">Start the conversation below!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            msg && (
              <MessageBubble
                key={msg._id || idx}
                message={msg}
                isOwnMessage={msg.sender && currentUser && String(msg.sender) === String(currentUser._id)}
              />
            )
          ))
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 text-light-300/60 px-5 py-3 rounded-2xl rounded-tl-none border border-white/5 text-xs font-bold animate-pulse">
              Typing…
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
                onClick={removeSelectedImage}
                className="absolute top-2 right-2 bg-dark-900/80 hover:bg-red-500 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-3 md:space-x-4 max-w-5xl mx-auto relative">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-0 z-50" ref={emojiPickerRef}>
              <EmojiPicker
                theme="dark"
                onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
              />
            </div>
          )}

          <div className="flex space-x-1">
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 rounded-xl text-light-300/40 hover:text-white hover:bg-white/5 transition-all">
              <FiSmile size={22} />
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl text-light-300/40 hover:text-white hover:bg-white/5 transition-all hidden sm:block">
              <FiPaperclip size={22} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          <input
            type="text"
            value={newMessage}
            onChange={handleTypingInput}
            placeholder="Type your message…"
            className="flex-1 glass-input py-3.5 px-5 text-sm"
          />

          <button
            type="submit"
            disabled={!newMessage.trim() && !selectedImage}
            className="p-3.5 rounded-xl bg-brand-primary text-white shadow-brand hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <FiSend size={22} />
          </button>
        </form>
      </div>

      {showClearConfirm && (
        <ConfirmModal
          title="Clear Chat"
          message={`All messages with ${activeChatUser.name} will be removed for you. This cannot be undone.`}
          confirmLabel="Clear"
          confirmDanger
          onConfirm={handleClearChat}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}
