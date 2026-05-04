import { FiCheck, FiCheckCircle } from 'react-icons/fi';

export default function MessageBubble({ message, isOwnMessage }) {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    if (message.status === 'read') {
      return <FiCheckCircle className="text-brand-secondary ml-1" size={10} />;
    }
    return <FiCheck className="text-white/30 ml-1" size={10} />;
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} w-full group animate-slideIn`}>
      <div className={`max-w-[75%] md:max-w-[65%] relative transition-all duration-300 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div 
          className={`
            px-5 py-3.5 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-soft
            ${isOwnMessage 
              ? 'bg-gradient-to-br from-brand-primary to-brand-dark text-white rounded-tr-none' 
              : 'bg-white/5 border border-white/5 text-light-100 rounded-tl-none backdrop-blur-md'
            }
          `}
        >
          {message.imageUrl && (
            <img 
              src={message.imageUrl} 
              alt="attachment" 
              className={`max-w-full rounded-xl mb-2 object-cover max-h-64 ${!message.text ? 'mb-0' : ''}`}
            />
          )}
          {message.text && <span>{message.text}</span>}
          <div className={`flex items-center justify-end mt-1.5`}>
            <span className={`text-[9px] font-bold tracking-wider uppercase ${isOwnMessage ? 'text-white/60' : 'text-light-300/30'}`}>
              {formatTime(message.createdAt)}
            </span>
            {isOwnMessage && getStatusIcon()}
          </div>
        </div>
        
        {/* Hover Action */}
        <div className={`
          absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2
          ${isOwnMessage ? '-left-8' : '-right-8'}
        `}>
          <button className="p-1.5 rounded-lg text-light-300/20 hover:text-white hover:bg-white/5 transition-all">
            <FiCheck size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
