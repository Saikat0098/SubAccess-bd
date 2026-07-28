import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { IOrder } from '../../types';
import api from '../../lib/api';

export const MyCredentials: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPass, setShowPass] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my-orders');
      if (res.data.success) {
        setOrders(res.data.orders.filter((o: IOrder) => o.deliveredCredentials?.length > 0));
      }
    } catch (err) {
      console.error('Fetch credentials error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(val);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Delivered Credentials & Keys</h1>
        <p className="text-xs text-slate-400 mt-1">Access your account passwords, invite links, PINs and license codes</p>
      </div>

      {loading ? (
        <div className="h-48 bg-slate-900 rounded-2xl animate-pulse" />
      ) : orders.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
          <Key className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Delivered Credentials</h3>
          <p className="text-xs text-slate-400">Credentials will appear here as soon as your order is completed.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((ord) => (
            <div key={ord._id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {ord.items.map((i) => i.title).join(', ')}
                  </h3>
                  <span className="text-[11px] text-sky-400 font-mono">Order #{ord.orderNumber}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(ord.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-3">
                {ord.deliveredCredentials.map((cred, idx) => {
                  const keyId = `${ord._id}_${idx}`;
                  const isVisible = showPass[keyId];
                  const isLink = cred.value.startsWith('http://') || cred.value.startsWith('https://');

                  return (
                    <div key={idx} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">{cred.label}</span>
                        <span className="font-mono text-xs font-bold text-sky-400 break-all">
                          {isLink ? (
                            <a href={cred.value} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">
                              {cred.value} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : isVisible ? (
                            cred.value
                          ) : (
                            '••••••••••••••••'
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isLink && (
                          <button
                            onClick={() => setShowPass((p) => ({ ...p, [keyId]: !p[keyId] }))}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                          >
                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleCopy(cred.value)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          {copiedKey === cred.value ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedKey === cred.value ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {ord.deliveryInstructions && (
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300">
                  <span className="font-bold text-amber-400 block mb-1">Setup Instructions:</span>
                  <p className="whitespace-pre-wrap">{ord.deliveryInstructions}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
