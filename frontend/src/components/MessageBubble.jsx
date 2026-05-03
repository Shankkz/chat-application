import { FiCheck, FiCheckCircle } from 'react-icons/fi';

export default function MessageBubble({ message, isOwnMessage }) {
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString([], options);
  };

  const renderStatus = () => {
    if (!isOwnMessage) return null;
    
    if (message.status === 'read') {
      return <FiCheckCircle className="text-blue-400 ml-1 inline" size={14} />;
    }
    if (message.status === 'delivered') {
      return <FiCheckCircle className="text-green-200 ml-1 inline" size={14} />;
    }
    // Default to sent
    return <FiCheck className="text-green-200 ml-1 inline" size={14} />;
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[70%] px-5 py-3 rounded-2xl relative group ${
          isOwnMessage 
            ? 'bg-neu-primaryDark text-white rounded-tr-sm shadow-neu-sm' 
            : 'bg-neu-bg text-neu-text rounded-tl-sm shadow-neu-flat'
        }`}
      >
        <p className="text-[15px] leading-relaxed break-words">{message.text}</p>
        <div className={`text-[11px] mt-1 flex items-center justify-end ${isOwnMessage ? 'text-green-100' : 'text-neu-textMuted'}`}>
          {formatTime(message.createdAt)}
          {renderStatus()}
        </div>
      </div>
    </div>
  );
}
