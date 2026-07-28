import React, { useState } from 'react';
import { Search, ShieldCheck, Clock, CheckCircle2, XCircle, Key } from 'lucide-react';
import { IOrder } from '../types';
import { CredentialModal } from '../components/CredentialModal';
import api from '../lib/api';

export const OrderTracking: React.FC = () => {
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCredentialOrder, setSelectedCredentialOrder] = useState<IOrder | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setSearched(true);
      const res = await api.get(`/orders/track/${encodeURIComponent(query.trim())}`);
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Track order error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-white">Live Order Tracking</h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Enter your Order Number (e.g. SUB-20260727-xxxx), Phone Number, or Transaction ID to check verification status.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleTrack} className="flex gap-3 max-w-lg mx-auto">
        <input
          type="text"
          placeholder="Order #, Phone, or bKash/Nagad TrxID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-sky-600/20 flex items-center gap-2 shrink-0"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Searching...' : 'Track Order'}
        </button>
      </form>

      {/* Search Results List */}
      {searched && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              No orders found matching "{query}". Please check your Order Number or Transaction ID and try again.
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <span className="font-mono text-sm font-bold text-sky-400">#{order.orderNumber}</span>
                    <span className="text-xs text-slate-400 ml-2">({order.customerName})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        order.orderStatus === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : order.orderStatus === 'cancelled'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      Status: {order.orderStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Total Amount</span>
                    <span className="font-bold text-white">৳{order.totalAmount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Payment Method</span>
                    <span className="font-bold text-white">{order.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Payment Status</span>
                    <span className="font-bold text-white uppercase">{order.paymentStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date</span>
                    <span className="font-bold text-white">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 pt-2">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Order Items:</span>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-xs font-bold text-slate-200">
                      • {item.title} ({item.duration}) - ৳{item.price}
                    </div>
                  ))}
                </div>

                {/* Delivered Credentials Button if completed */}
                {order.orderStatus === 'completed' && order.deliveredCredentials?.length > 0 && (
                  <div className="pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedCredentialOrder(order)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
                    >
                      <Key className="w-4 h-4" /> View Credentials & Keys
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Credential Viewer Modal */}
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
