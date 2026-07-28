import React, { useState, useEffect } from 'react';
import { ShoppingBag, Key, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { IOrder } from '../../types';
import { CredentialModal } from '../../components/CredentialModal';
import api from '../../lib/api';

export const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredentialOrder, setSelectedCredentialOrder] = useState<IOrder | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my-orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Fetch my orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">My Orders & Invoices</h1>
        <p className="text-xs text-slate-400 mt-1">Full history of your subscription orders and payment records</p>
      </div>

      {loading ? (
        <div className="h-64 bg-slate-900 rounded-2xl animate-pulse" />
      ) : orders.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Orders Found</h3>
          <p className="text-xs text-slate-400">You have not submitted any subscription orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div key={ord._id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-sky-400">#{ord.orderNumber}</span>
                  <span className="text-xs text-slate-400">({new Date(ord.createdAt).toLocaleDateString()})</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ord.orderStatus === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : ord.orderStatus === 'cancelled'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    Status: {ord.orderStatus}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                {ord.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{item.title} ({item.duration})</span>
                    <span className="text-slate-300">৳{item.price} x {item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Payment details */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Paid: </span>
                  <strong className="text-emerald-400">৳{ord.totalAmount}</strong>
                  <span className="text-slate-400 ml-2">via {ord.paymentMethod} (TrxID: {ord.transactionId})</span>
                </div>

                {ord.orderStatus === 'completed' && ord.deliveredCredentials?.length > 0 && (
                  <button
                    onClick={() => setSelectedCredentialOrder(ord)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <Key className="w-4 h-4" /> View Credentials
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
