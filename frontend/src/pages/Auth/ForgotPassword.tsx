import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import api from '../../lib/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError('');
      // Request password reset trigger
      await api.post('/auth/resend-otp', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white">Reset Account Password</h1>
          <p className="text-xs text-slate-400">Enter your email address to receive password reset OTP instructions</p>
        </div>

        {submitted ? (
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Reset Code Sent</h3>
            <p className="text-xs text-slate-400">
              We sent a verification code to <strong className="text-white">{email}</strong>.
            </p>
            <Link
              to={`/verify-otp?email=${encodeURIComponent(email)}`}
              className="inline-block px-5 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl mt-2"
            >
              Proceed to Verify
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-sky-500"
                  required
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400 pt-2">
          Remember password?{' '}
          <Link to="/login" className="text-sky-400 font-bold hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};
