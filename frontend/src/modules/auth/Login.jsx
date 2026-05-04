import { useState } from 'react';
import { ButtonSpinner } from '../../shared/Loader';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-(]{7,20}$/;

const validate = (identifier, name) => {
  if (!identifier.trim()) return 'Email or phone number is required.';
  const raw = identifier.trim();
  if (!EMAIL_RE.test(raw) && !PHONE_RE.test(raw.replace(/\s/g, ''))) {
    return 'Please enter a valid email address or phone number.';
  }
  if (!name.trim()) return 'Name is required.';
  return null;
};

export default function Login({ onSendOtp, onVerifyOtp }) {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false); // one-shot guard

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (submitted) return;

    // Real-time validation feedback on submit
    const error = validate(identifier, name);
    if (error) { setErrorMsg(error); return; }

    setErrorMsg('');
    setSubmitted(true);
    setLoading(true);

    const result = await onSendOtp(identifier.trim(), name.trim());
    setLoading(false);
    setSubmitted(false); // re-enable after response

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result) {
      setGeneratedOtp(result);
      setStep(2);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code.'); return; }
    if (submitted) return;

    setOtpError('');
    setSubmitted(true);
    setLoading(true);

    await onVerifyOtp(identifier.trim(), otp.trim());

    setLoading(false);
    setSubmitted(false);
  };

  // Live identifier validation hint
  const identifierHint = (() => {
    if (!identifier.trim()) return null;
    const raw = identifier.trim();
    if (EMAIL_RE.test(raw)) return { ok: true, msg: 'Valid email ✓' };
    if (PHONE_RE.test(raw.replace(/\s/g, ''))) return { ok: true, msg: 'Valid phone ✓' };
    if (raw.includes('@')) return { ok: false, msg: 'Invalid email format.' };
    return { ok: false, msg: 'Invalid phone number format.' };
  })();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-900 bg-mesh relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

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
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-light-300/80 ml-1">Email or Phone</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setErrorMsg(''); }}
                placeholder="you@example.com or +1234567890"
                className="glass-input w-full"
                autoComplete="username"
              />
              {identifierHint && (
                <p className={`text-xs ml-1 mt-1 ${identifierHint.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {identifierHint.msg}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-light-300/80 ml-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                placeholder="How should we call you?"
                className="glass-input w-full"
                autoComplete="name"
                minLength={2}
                maxLength={40}
              />
              {name.trim().length > 0 && name.trim().length < 2 && (
                <p className="text-xs ml-1 mt-1 text-red-400">Name must be at least 2 characters.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || submitted}
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 rounded-2xl shadow-brand transition-all transform active:scale-[0.98] disabled:opacity-60 flex items-center justify-center space-x-2"
            >
              {loading ? <><ButtonSpinner /><span>Sending…</span></> : <span>Get Started</span>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center mb-8">
              <p className="text-light-300/50 text-xs uppercase tracking-widest mb-2 font-bold">Testing Code</p>
              <p className="text-brand-primary text-4xl font-mono tracking-[0.2em] font-black">{generatedOtp}</p>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                placeholder="000000"
                className="glass-input w-full text-center text-3xl font-mono tracking-[0.3em] py-5"
                autoComplete="one-time-code"
              />
              {otpError && <p className="text-red-400 text-xs mt-2 text-center">{otpError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || submitted || otp.length !== 6}
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 rounded-2xl shadow-brand transition-all transform active:scale-[0.98] disabled:opacity-60 flex items-center justify-center space-x-2"
            >
              {loading ? <><ButtonSpinner /><span>Verifying…</span></> : <span>Verify &amp; Continue</span>}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); setOtpError(''); setSubmitted(false); }}
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
