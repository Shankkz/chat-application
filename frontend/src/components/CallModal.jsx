import { FiPhoneOff, FiPhoneCall } from 'react-icons/fi';

export default function CallModal({
  call,
  acceptedCall,
  remoteVideoRef,
  localVideoRef,
  answerCall,
  rejectCall,
  endCall,
  isCalling
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-neu-bg p-6 rounded-3xl shadow-neu-flat w-full max-w-2xl flex flex-col items-center">
        
        {/* Title / Status */}
        <h2 className="text-2xl font-bold text-neu-text mb-6">
          {acceptedCall ? 'Active Video Call' : (isCalling ? 'Calling...' : `Incoming Call from ${call?.name || 'Unknown'}`)}
        </h2>

        {/* Video Streams */}
        <div className="w-full flex flex-col md:flex-row gap-4 mb-8 justify-center items-center">
          {/* Local Video */}
          <div className="relative w-full md:w-1/2 aspect-video bg-neu-dark rounded-2xl overflow-hidden shadow-neu-inset-sm">
            <video playsInline muted ref={localVideoRef} autoPlay className="w-full h-full object-cover mirror" />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">You</div>
          </div>
          
          {/* Remote Video (Only if accepted) */}
          {acceptedCall && (
            <div className="relative w-full md:w-1/2 aspect-video bg-neu-dark rounded-2xl overflow-hidden shadow-neu-inset-sm">
              <video playsInline ref={remoteVideoRef} autoPlay className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">Remote</div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex space-x-6">
          {!acceptedCall && !isCalling && (
            <button
              onClick={answerCall}
              className="w-16 h-16 rounded-full bg-neu-bg text-neu-primary flex items-center justify-center shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed transition-all"
              title="Answer Call"
            >
              <FiPhoneCall size={28} />
            </button>
          )}

          <button
            onClick={acceptedCall || isCalling ? endCall : rejectCall}
            className="w-16 h-16 rounded-full bg-neu-bg text-red-500 flex items-center justify-center shadow-neu-flat hover:shadow-neu-sm active:shadow-neu-pressed transition-all"
            title="End Call"
          >
            <FiPhoneOff size={28} />
          </button>
        </div>

      </div>
    </div>
  );
}
