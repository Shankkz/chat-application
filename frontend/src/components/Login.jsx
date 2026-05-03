import { useState } from 'react';

// Validation helpers
const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
const isValidPhone = (val) => /^\+?[0-9]{7,15}$/.test(val.trim().replace(/\s/g, ''));

export default function Login({ onSendOtp, onVerifyOtp }) {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine type as user types
  const identifierType = identifier.includes('@')
    ? 'email'
    : /[0-9]/.test(identifier)
    ? 'phone'
    : null;

  const validateIdentifier = () => {
    if (!identifier.trim()) return 'Email or phone number is required.';
    if (identifier.includes('@')) {
      if (!isValidEmail(identifier)) return 'Please enter a valid email address.';
    } else {
      if (!isValidPhone(identifier)) return 'Please enter a valid phone number.';
    }
    return null;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const validationError = validateIdentifier();
    if (validationError) { setErrorMsg(validationError); return; }
    if (!name.trim()) { setErrorMsg('Name is required.'); return; }

    setErrorMsg('');
    setLoading(true);
    const result = await onSendOtp(identifier.trim(), name.trim());
    setLoading(false);

    if (result && result.error) {
      setErrorMsg(result.error);
    } else if (result) {
      setGeneratedOtp(result);
      setStep(2);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setOtpError('Enter 6-digit OTP.'); return; }
    setLoading(true);
    await onVerifyOtp(identifier.trim(), otp.trim());
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-900 bg-mesh relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>

      <div className="glass-panel p-10 rounded-[2.5rem] w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-primary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-brand transform rotate-12 transition-transform hover:rotate-0 duration-500">
            <span className="text-white text-3xl font-bold">W</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            {step === 1 ? 'Welcome' : 'Verify'}
          </h1>
          <p className="text-light-300/60 mt-2 font-medium">
            {step === 1 ? 'Connect with the world' : `Code sent to ${identifier}`}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl mb-8 animate-shake">
            {errorMsg}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-light-300/80 ml-1">Account Info</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email or phone"
                className="glass-input w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-light-300/80 ml-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we call you?"
                className="glass-input w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 rounded-2xl shadow-brand transition-all transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Get Started'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center mb-8">
              <p className="text-light-300/50 text-xs uppercase tracking-widest mb-2 font-bold">Testing Code</p>
              <p className="text-brand-primary text-4xl font-mono tracking-[0.2em] font-black">{generatedOtp}</p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="glass-input w-full text-center text-3xl font-mono tracking-[0.3em] py-5"
              />
              {otpError && <p className="text-red-400 text-xs mt-2 text-center">{otpError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 rounded-2xl shadow-brand transition-all transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-light-300/40 text-sm hover:text-white transition-colors font-medium"
            >
              Change account details
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
