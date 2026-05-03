import { FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff } from 'react-icons/fi';

export default function CallModal({ call, acceptedCall, localVideoRef, remoteVideoRef, answerCall, rejectCall, endCall, isCalling }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-dark-900/80">
      <div className="glass-panel w-full max-w-4xl h-[80vh] rounded-[3rem] flex flex-col relative">

        {/* Remote Video (Full Screen) */}
        <div className="absolute inset-0 bg-dark-800">
          {acceptedCall ? (
            <video
              playsInline
              ref={remoteVideoRef}
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-8">
              <div className="w-32 h-32 rounded-full bg-brand-primary/20 flex items-center justify-center animate-pulse border border-brand-primary/30">
                <div className="w-24 h-24 rounded-full bg-brand-primary flex items-center justify-center text-white text-4xl font-bold">
                  {call?.name?.charAt(0) || 'C'}
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                  {isCalling ? `Calling ${call?.name}...` : `${call?.name} is calling...`}
                </h2>
                <p className="text-brand-primary font-bold uppercase tracking-[0.3em] text-sm">
                  {acceptedCall ? 'Connected' : 'End-to-End Encrypted'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Floating) */}
        <div className="absolute top-8 right-8 w-48 h-64 glass-panel rounded-3xl z-10 border-2 border-white/10 shadow-2xl">
          <video
            playsInline
            muted
            ref={localVideoRef}
            autoPlay
            className="w-full h-full object-cover"
          />
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center space-x-6 px-10 py-6 glass-panel rounded-full border-white/10 shadow-2xl">
          {!acceptedCall && !isCalling ? (
            <>
              <button
                onClick={answerCall}
                className="w-16 h-16 rounded-full bg-brand-primary text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-brand"
              >
                <FiVideo size={28} />
              </button>
              <button
                onClick={rejectCall}
                className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
              >
                <FiPhoneOff size={28} />
              </button>
            </>
          ) : (
            <>
              <button className="w-14 h-14 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all">
                <FiMic size={24} />
              </button>
              <button className="w-14 h-14 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all">
                <FiVideo size={24} />
              </button>
              <div className="w-[1px] h-10 bg-white/10 mx-2"></div>
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
              >
                <FiPhoneOff size={28} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
