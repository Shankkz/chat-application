import { useState, useRef, useEffect } from 'react';
import { FiLogOut, FiSearch, FiMoreVertical, FiEdit2, FiImage } from 'react-icons/fi';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

export default function Sidebar({ users, activeChatUser, setActiveChatUser, currentUser, onLogout, onUpdateUser, onlineUsers, unreadCounts }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [newName, setNewName] = useState(currentUser.name);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === currentUser.name) {
      setShowEditModal(false);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await axios.put(`${API_URL}/users/${currentUser._id}/name`, { name: newName });
      if (onUpdateUser) onUpdateUser(response.data);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update name', error);
      alert('Failed to update name');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const response = await axios.put(`${API_URL}/users/${currentUser._id}/avatar`, {
            profilePicture: reader.result
          });
          if (onUpdateUser) onUpdateUser(response.data);
          setShowDropdown(false);
        } catch (error) {
          console.error('Failed to upload avatar', error);
          alert('Failed to upload avatar');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-white/5">
      {/* Header */}
      <div className="p-5 flex justify-between items-center bg-white/[0.01] backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary p-[2px] hover:scale-105 active:scale-95 transition-all focus:outline-none"
            title="Change Avatar"
          >
            <div className="w-full h-full rounded-[14px] bg-dark-900 flex items-center justify-center text-white font-bold text-xl overflow-hidden relative group">
              {currentUser.profilePicture ? (
                <img src={currentUser.profilePicture} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name?.charAt(0).toUpperCase()
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <FiImage size={16} className="text-white" />
              </div>
            </div>
          </button>
          <div className="hidden lg:block">
            <h2 className="font-bold text-white leading-none">{currentUser.name}</h2>
            <span className="text-xs text-brand-primary font-medium">My Profile</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2.5 rounded-xl text-light-300/60 hover:bg-white/5 hover:text-white transition-all"
          >
            <FiMoreVertical size={20} />
          </button>

          {showDropdown && (
            <div className="absolute top-12 right-0 w-48 bg-dark-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <button
                onClick={() => { setShowDropdown(false); setShowEditModal(true); }}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-all flex items-center space-x-3"
              >
                <FiEdit2 size={16} />
                <span>Change Name</span>
              </button>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-all flex items-center space-x-3"
              >
                <FiImage size={16} />
                <span>Change Avatar</span>
              </button>
            </div>
          )}

          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2.5 rounded-xl text-light-300/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Logout"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>


      {/* <div className="px-5 py-4">
        <div className="relative group">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-light-300/30 group-focus-within:text-brand-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:bg-white/10 focus:border-brand-primary/20 transition-all placeholder:text-light-300/20"
          />
        </div>
      </div> */}

      {/* Users List */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {users.length === 0 ? (
          <div className="text-center py-10 px-6">
            <p className="text-light-300/20 text-sm">No active conversations.<br />Invite someone to start chatting!</p>
          </div>
        ) : (
          users.map(user => {
            const isActive = activeChatUser && activeChatUser._id === user._id;
            const isOnline = onlineUsers.includes(user._id);
            const unread = unreadCounts?.[user._id] || 0;

            return (
              <div
                key={user._id}
                onClick={() => setActiveChatUser(user)}
                className={`flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-300 group ${isActive
                  ? 'bg-brand-primary/10 border border-brand-primary/10'
                  : 'hover:bg-white/[0.03] border border-transparent'
                  }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold transition-all duration-500 overflow-hidden ${isActive ? 'bg-brand-primary text-white scale-105' : 'bg-white/5 text-light-300 group-hover:bg-white/10'
                    }`}>
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  {isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-primary rounded-full border-[3px] border-dark-900 shadow-lg"></div>
                  )}
                </div>

                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold truncate transition-colors ${isActive ? 'text-white' : 'text-light-300 group-hover:text-white'}`}>
                      {user.name}
                    </h3>
                    <span className="text-[10px] text-light-300/30 font-medium">12:45 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-light-300/40 text-xs truncate font-medium">
                      {isOnline ? 'Active now' : 'Offline'}
                    </p>
                    {unread > 0 && !isActive && (
                      <div className="bg-brand-primary text-white text-[10px] font-black w-5 h-5 rounded-lg flex items-center justify-center shadow-brand animate-pulse">
                        {unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Edit Name Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-dark-900/60">
          <div className="glass-panel w-full max-w-sm rounded-[2rem] p-6 animate-slideIn">
            <h3 className="text-xl font-bold text-white mb-4">Change Name</h3>
            <form onSubmit={handleUpdateName}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="glass-input w-full mb-6"
                placeholder="Enter new name"
                autoFocus
                maxLength={30}
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-light-300 hover:text-white hover:bg-white/10 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !newName.trim()}
                  className="flex-1 py-3 rounded-xl bg-brand-primary text-white font-bold shadow-brand hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showLogoutConfirm && (
        <ConfirmModal
          title="Log Out"
          message="Are you sure you want to log out of your account?"
          confirmLabel="Log Out"
          confirmDanger
          onConfirm={onLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}
