import { FiLogOut } from 'react-icons/fi';

export default function Sidebar({ users, activeChatUser, setActiveChatUser, currentUser, onLogout, onlineUsers, unreadCounts }) {
  return (
    <div className="flex flex-col h-full bg-neu-bg">
      {/* Header */}
      <div className="p-4 border-b border-neu-dark/30 flex justify-between items-center bg-neu-bg shadow-neu-sm z-10 rounded-tl-3xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-primary font-bold">
            {currentUser.name?.charAt(0).toUpperCase() || currentUser.username?.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-neu-text">{currentUser.name || currentUser.username}</span>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 rounded-full text-neu-textMuted hover:text-red-400 hover:shadow-neu-pressed transition-all"
          title="Logout"
        >
          <FiLogOut size={20} />
        </button>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {users.length === 0 ? (
          <p className="text-neu-textMuted text-center mt-4 text-sm">No contacts yet.<br/>Other users will appear here when they message you.</p>
        ) : (
          users.map(user => {
            const isActive = activeChatUser && activeChatUser._id === user._id;
            const isOnline = onlineUsers.includes(user._id);
            const unread = unreadCounts?.[user._id] || 0;

            const formatLastSeen = (date) => {
              if (!date) return 'Offline';
              return new Date(date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            };

            return (
              <div 
                key={user._id}
                onClick={() => setActiveChatUser(user)}
                className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                  isActive ? 'shadow-neu-pressed bg-neu-bg' : 'shadow-neu-flat hover:shadow-neu-sm bg-neu-bg'
                }`}
              >
                {/* Avatar + online dot */}
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${isActive ? 'text-neu-primary shadow-neu-flat' : 'text-neu-text shadow-neu-pressed'}`}>
                    {user.name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-neu-primary rounded-full border-2 border-neu-bg"></div>
                  )}
                </div>

                {/* Name + status */}
                <div className="ml-4 flex-1 min-w-0">
                  <h3 className="text-neu-text font-medium truncate">{user.name || user.username}</h3>
                  <p className="text-neu-textMuted text-sm truncate">
                    {isOnline ? 'Online' : formatLastSeen(user.lastSeen)}
                  </p>
                </div>

                {/* Unread badge */}
                {unread > 0 && !isActive && (
                  <div className="ml-2 flex-shrink-0 w-6 h-6 rounded-full bg-neu-primary flex items-center justify-center shadow-neu-sm animate-pulse">
                    <span className="text-white text-xs font-bold">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
