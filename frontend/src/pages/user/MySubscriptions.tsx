import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Key, RefreshCw } from 'lucide-react';
import { IOrder } from '../../types';
import { CredentialModal } from '../../components/CredentialModal';
import api from '../../lib/api';

export const MySubscriptions: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredentialOrder, setSelectedCredentialOrder] = useState<IOrder | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my-orders');
      if (res.data.success) {
        setOrders(res.data.orders.filter((o: IOrder) => o.orderStatus === 'completed'));
      }
    } catch (err) {
      console.error('Fetch subscriptions error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Active Subscriptions</h1>
        <p className="text-xs text-slate-400 mt-1">Your active Netflix, Canva, ChatGPT & JetBrains licenses</p>
      </div>

      {loading ? (
        <div className="h-48 bg-slate-900 rounded-2xl animate-pulse" />
      ) : orders.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
          <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Active Subscriptions</h3>
          <p className="text-xs text-slate-400">Order from our marketplace to get active accounts and keys.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((ord) => (
            <div key={ord._id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-lg border border-emerald-500/30">
                  Active Subscription
                </span>
                <span className="text-xs text-slate-400 font-mono">#{ord.orderNumber}</span>
              </div>

              <div>
                <h3 className="font-bold text-base text-white">
                  {ord.items.map((i) => i.title).join(', ')}
                </h3>
                <p className="text-xs text-sky-400 font-medium mt-1">
                  Duration: {ord.items[0]?.duration || '1 Month'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Full Replacement Warranty
                </span>
                {ord.deliveredCredentials?.length > 0 && (
                  <button
                    onClick={() => setSelectedCredentialOrder(ord)}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1"
                  >
                    <Key className="w-3.5 h-3.5" /> View Account
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCredentialOrder && (
        <CredentialModal
          isOpen={!!selectedCredentialOrder}
          onClose={() => setSelectedCredentialOrder(null)}
          orderNumber={selectedCredentialOrder.orderNumber}
          credentials={selectedCredentialOrder.deliveredCredentials}
          deliveryInstructions={selectedCredentialOrder.deliveryInstructions}
        />
      )}
    </div>
  );
};
