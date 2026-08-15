import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingBag, Key, ShieldCheck, Clock, CheckCircle2, Zap, AlertCircle } from 'lucide-react';
import { IOrder } from '../../types';
import { CredentialModal } from '../../components/CredentialModal';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../context/AuthContext';

export const MyOrders: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredentialOrder, setSelectedCredentialOrder] = useState<IOrder | null>(null);

  useEffect(() => {
    // If returning from Fast Pay with session_id query param, sync status immediately
    const sessionId = searchParams.get('session_id') || searchParams.get('sessionId');
    if (sessionId) {
      api.get(`/fastpay/sync-session/${sessionId}`)
        .catch((e) => console.log('FastPay sync check:', e?.message))
        .finally(() => {
          fetchOrders();
        });
    } else {
      fetchOrders();
    }

    // Socket real-time sync
    if (user?._id) {
      const socket = getSocket();
      socket.emit('join_user', user._id);

      const handleOrderUpdate = () => {
        fetchOrders();
      };

      socket.on('order:updated', handleOrderUpdate);
      socket.on('payment-approved', handleOrderUpdate);
      socket.on('order:created', handleOrderUpdate);

      return () => {
        socket.off('order:updated', handleOrderUpdate);
        socket.off('payment-approved', handleOrderUpdate);
        socket.off('order:created', handleOrderUpdate);
      };
    }
  }, [user]);

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
        <p className="text-xs text-slate-400 mt-1">Full history of your subscription orders, payment records, and delivery status</p>
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
          {orders.map((ord) => {
            const isPaymentVerified = ord.paymentStatus === 'verified';
            const isAwaitingAdmin = isPaymentVerified && ord.deliveryStatus !== 'delivered' && ord.orderStatus !== 'completed';

            return (
              <div key={ord._id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
                {/* Header row with Order #, Date, and Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-sky-400">#{ord.orderNumber}</span>
                    <span className="text-xs text-slate-400">({new Date(ord.createdAt).toLocaleDateString()})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Payment Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        ord.paymentStatus === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : ord.paymentStatus === 'rejected'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ord.paymentStatus === 'verified' ? '✓ Payment Completed' : `Payment: ${ord.paymentStatus}`}
                    </span>

                    {/* Order Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        ord.orderStatus === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : ord.orderStatus === 'processing'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : ord.orderStatus === 'cancelled'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      Order: {ord.orderStatus}
                    </span>

                    {/* Delivery Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        ord.deliveryStatus === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {ord.deliveryStatus === 'delivered' ? '✓ Delivered' : 'Delivery: Waiting for Admin'}
                    </span>
                  </div>
                </div>

                {/* Reassurance Banner for verified payments awaiting fulfillment */}
                {isAwaitingAdmin && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-400">Payment Completed Successfully!</strong>
                      <p className="text-emerald-300/90 text-[11px] mt-0.5">
                        Please wait while our admin prepares and delivers your subscription login credentials.
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="space-y-2">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">{item.title} ({item.duration} - {item.accessType})</span>
                      <span className="text-slate-300 font-mono">৳{item.price} x {item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Payment details and actions */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Total: </span>
                    <strong className="text-emerald-400 font-mono text-sm">৳{ord.totalAmount}</strong>
                    <span className="text-slate-400 ml-2">
                      via <strong className="text-white">{ord.paymentMethod}</strong>
                      {ord.transactionId ? (
                        <> (TrxID: <span className="font-mono text-sky-400 font-bold">{ord.transactionId}</span>)</>
                      ) : null}
                    </span>
                  </div>

                  {ord.orderStatus === 'completed' && ord.deliveredCredentials?.length > 0 && (
                    <button
                      onClick={() => setSelectedCredentialOrder(ord)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                    >
                      <Key className="w-4 h-4" /> View Credentials
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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

