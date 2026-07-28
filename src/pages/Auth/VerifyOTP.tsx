import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const VerifyOTP: React.FC = () => {
  const { verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otpCode) return;

    try {
      setLoading(true);
      setError('');
      const res = await verifyOTP(email, otpCode);
      if (res.success) {
        navigate('/user');
      } else {
        setError(res.message || 'OTP verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      setResending(true);
      setError('');
      const res = await resendOTP(email);
      if (res.success) {
        setMessage('A new 6-digit verification code has been sent to your email.');
      } else {
        setError(res.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setError('Resend OTP error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-2xl flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6 animate-bounce" />
          </div>
          <h1 className="text-2xl font-black text-white">Verify Your Email</h1>
          <p className="text-xs text-slate-400">
            Enter the 6-digit OTP code sent to <strong className="text-white">{email}</strong>
          </p>
        </div>

        {message && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl text-center font-mono font-bold">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
              6-Digit OTP Verification Code *
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-sky-400 text-center font-mono font-black text-2xl tracking-[12px] rounded-2xl py-3 focus:outline-none focus:border-sky-500"
              required
            />
            <p className="text-[11px] text-slate-500 text-center mt-2">Code expires in 5 minutes.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : 'Verify OTP & Log In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-xs text-slate-400 hover:text-sky-400 font-semibold flex items-center justify-center gap-1.5 mx-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            Didn't receive code? Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
};
