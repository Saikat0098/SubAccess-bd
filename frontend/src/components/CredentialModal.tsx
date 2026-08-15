import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Key, ShieldCheck, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { IDeliveredCredential } from '../types';

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  credentials: IDeliveredCredential[];
  deliveryInstructions?: string;
}

export const CredentialModal: React.FC<CredentialModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  credentials,
  deliveryInstructions,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showValues, setShowValues] = useState<{ [key: number]: boolean }>({});

  const handleCopy = (val: string, idx: number) => {
    navigator.clipboard.writeText(val);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleShow = (idx: number) => {
    setShowValues((prev) => ({ ...prev, [idx]: !prev[idx] }));
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Delivered Credentials & Keys</h3>
                  <p className="text-xs text-slate-400">Order #{orderNumber}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {credentials && credentials.length > 0 ? (
                credentials.map((cred, idx) => {
                  const isVisible = showValues[idx];
                  const isLink = cred.value.startsWith('http://') || cred.value.startsWith('https://');

                  return (
                    <div key={idx} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                      <div className="text-xs text-slate-400 font-medium mb-1">{cred.label}</div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-mono text-sm font-semibold text-sky-400 break-all select-all">
                          {isLink ? (
                            <a
                              href={cred.value}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 underline text-sky-400 hover:text-sky-300"
                            >
                              {cred.value} <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : isVisible ? (
                            cred.value
                          ) : (
                            '••••••••••••••••'
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!isLink && (
                            <button
                              type="button"
                              onClick={() => toggleShow(idx)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                              title={isVisible ? 'Hide Password' : 'Show Password'}
                            >
                              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(cred.value, idx)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedIndex === idx ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl text-center text-xs text-slate-400">
                  No explicit credential fields specified. See instructions below.
                </div>
              )}

              {deliveryInstructions && (
                <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Usage & Setup Instructions:
                  </span>
                  <p className="text-slate-300 leading-relaxed pt-1 whitespace-pre-wrap">{deliveryInstructions}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
