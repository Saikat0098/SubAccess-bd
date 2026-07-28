import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, ShieldCheck, ArrowRight, Smartphone } from 'lucide-react';
import { ISettings } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMethod: 'bKash' | 'Nagad' | 'Rocket';
  amountBDT: number;
  settings?: ISettings;
  onSubmitPayment: (data: { transactionId: string; senderPhone: string }) => void;
  loading: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedMethod,
  amountBDT,
  settings,
  onSubmitPayment,
  loading,
}) => {
  const [trxId, setTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const getNumber = () => {
    if (selectedMethod === 'bKash') return settings?.bkashNumber || '01712345678';
    if (selectedMethod === 'Nagad') return settings?.nagadNumber || '01812345678';
    return settings?.rocketNumber || '01912345678';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getNumber());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId.trim() || !senderPhone.trim()) {
      setError('Both Transaction ID and Sender Mobile Number are required.');
      return;
    }
    setError('');
    onSubmitPayment({
      transactionId: trxId.trim().toUpperCase(),
      senderPhone: senderPhone.trim(),
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                    selectedMethod === 'bKash'
                      ? 'bg-pink-500/20 text-pink-400 border-pink-500/40'
                      : selectedMethod === 'Nagad'
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                  }`}
                >
                  {selectedMethod}
                </div>
                <h3 className="font-bold text-lg text-white">Manual Payment Instructions</h3>
              </div>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Steps */}
            <div className="mt-5 space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Total Payable Amount</p>
                  <p className="text-2xl font-extrabold text-emerald-400">৳{amountBDT}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{selectedMethod} Personal Number</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-base font-extrabold text-white">{getNumber()}</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl text-xs space-y-2 text-slate-300 border border-slate-700/50">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-400" /> How to pay via {selectedMethod}:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed text-slate-300">
                  <li>Open your {selectedMethod} Mobile App or dial *247# / *167#.</li>
                  <li>Select <strong>Send Money</strong> or <strong>Cash In</strong> option.</li>
                  <li>Enter Number: <strong className="text-white font-mono">{getNumber()}</strong></li>
                  <li>Enter Amount: <strong className="text-emerald-400 font-bold">৳{amountBDT}</strong></li>
                  <li>After sending, copy the <strong>Transaction ID (TrxID)</strong> from confirmation SMS.</li>
                </ol>
              </div>

              {/* Form Input for TrxID and Sender Phone */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your {selectedMethod} Sender Mobile Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 01712345678"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Transaction ID (TrxID) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B8X9A721KL"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500 font-mono uppercase tracking-wider"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    'Submitting Order...'
                  ) : (
                    <>
                      Verify & Complete Order
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
