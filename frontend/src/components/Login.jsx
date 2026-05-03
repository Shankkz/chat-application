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
      if (!isValidEmail(identifier)) return 'Please enter a valid email address (e.g. user@example.com).';
    } else {
      if (!isValidPhone(identifier)) return 'Please enter a valid phone number (7–15 digits, optionally starting with +).';
    }
    return null;
  };

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value);
    setErrorMsg('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const validationError = validateIdentifier();
    if (validationError) { setErrorMsg(validationError); return; }
    if (!name.trim()) { setErrorMsg('Name is required to register or identify yourself.'); return; }
    if (name.trim().length < 2) { setErrorMsg('Name must be at least 2 characters.'); return; }

    setErrorMsg('');
    setLoading(true);
    const result = await onSendOtp(identifier.trim(), name.trim());
    setLoading(false);

    if (result && result.error) {
      setErrorMsg(result.error);
    } else if (result) {
      setGeneratedOtp(result);
      setStep(2);
    } else {
      setErrorMsg('Failed to send OTP. Please try again.');
    }
  };

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    setOtpError('');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setOtpError('Please enter the full 6-digit OTP.'); return; }
    setLoading(true);
    await onVerifyOtp(identifier.trim(), otp.trim());
    setLoading(false);
  };

  const inputClass = (hasError) =>
    `w-full bg-neu-bg text-neu-text px-4 py-3 rounded-xl outline-none transition-all placeholder-neu-textMuted/50 ${
      hasError ? 'shadow-[inset_2px_2px_5px_rgba(239,68,68,0.3),inset_-2px_-2px_5px_rgba(239,68,68,0.1)]' : 'shadow-neu-pressed focus:shadow-neu-inset-sm'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-neu-bg p-8 rounded-3xl shadow-neu-flat w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neu-text">
            {step === 1 ? 'Welcome' : 'Enter OTP'}
          </h1>
          <p className="text-neu-textMuted text-sm mt-2">
            {step === 1
              ? 'Log in with your email or phone number'
              : `OTP sent for ${identifier}`}
          </p>
        </div>

        {/* Step 1 — Identifier + Name */}
        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
            {/* Identifier field */}
            <div>
              <label className="block text-neu-textMuted text-sm font-medium mb-2">
                Email or Phone Number
                {identifierType && (
                  <span className="ml-2 text-xs text-neu-primary">
                    ({identifierType === 'email' ? '📧 Email detected' : '📱 Phone detected'})
                  </span>
                )}
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={handleIdentifierChange}
                onBlur={() => { const err = validateIdentifier(); if (err) setErrorMsg(err); }}
                placeholder="e.g. user@example.com or +91XXXXXXXXXX"
                className={inputClass(errorMsg && !errorMsg.includes('Name'))}
                autoComplete="username"
                required
              />
            </div>

            {/* Name field */}
            <div>
              <label className="block text-neu-textMuted text-sm font-medium mb-2">
                Full Name <span className="text-neu-textMuted/50 text-xs">(required)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                placeholder="Enter your full name"
                className={inputClass(errorMsg && errorMsg.includes('Name'))}
                autoComplete="name"
                required
              />
            </div>

            {/* Inline error */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm px-4 py-3 rounded-xl">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neu-bg text-neu-primary font-semibold py-3 px-4 rounded-xl shadow-neu-sm hover:shadow-neu-flat active:shadow-neu-pressed transition-all duration-200 disabled:opacity-60"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          /* Step 2 — OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
            {/* OTP display box */}
            <div className="bg-neu-primary/10 border border-neu-primary/30 p-4 rounded-xl text-center">
              <p className="text-neu-textMuted text-xs mb-1">Your OTP (for testing)</p>
              <p className="text-neu-primary text-3xl font-mono tracking-[0.3em] font-bold">{generatedOtp}</p>
            </div>

            <div>
              <label className="block text-neu-textMuted text-sm font-medium mb-2">
                6-Digit OTP
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={handleOtpChange}
                placeholder="——————"
                maxLength={6}
                className={`w-full bg-neu-bg text-neu-text text-center tracking-[0.5em] font-mono text-2xl px-4 py-3 rounded-xl outline-none transition-all ${
                  otpError
                    ? 'shadow-[inset_2px_2px_5px_rgba(239,68,68,0.3),inset_-2px_-2px_5px_rgba(239,68,68,0.1)]'
                    : 'shadow-neu-pressed focus:shadow-neu-inset-sm'
                } placeholder-neu-textMuted/30`}
                required
              />
              {otpError && (
                <p className="text-red-400 text-xs mt-2 ml-1">{otpError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-neu-bg text-neu-primary font-semibold py-3 px-4 rounded-xl shadow-neu-sm hover:shadow-neu-flat active:shadow-neu-pressed transition-all duration-200 disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); setOtpError(''); }}
              className="w-full text-neu-textMuted text-sm hover:text-neu-text transition-colors"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
