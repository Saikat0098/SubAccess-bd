import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Key, Clock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { IOrder } from '../../types';
import { CredentialModal } from '../../components/CredentialModal';
import api from '../../lib/api';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
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
      console.error('Fetch user orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeSubscriptions = orders.filter((o) => o.orderStatus === 'completed');
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending');
  const totalSpentBDT = orders
    .filter((o) => o.paymentStatus === 'verified')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card */}
      <div className="p-6 sm:p-8 bg-[#09090b] border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="relative z-10">
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-bold uppercase tracking-wider">
            Verified SubAccess Customer
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
            Manage your digital access keys, monitor verification status, and retrieve login credentials securely.
          </p>
        </div>

        <Link
          to="/products"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 shrink-0 self-start md:self-auto relative z-10"
        >
          <Sparkles className="w-4 h-4" /> Browse Catalog
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bento Box 1 */}
        <div className="bg-[#09090b] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Subscriptions</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-extrabold text-white">{activeSubscriptions.length}</p>
            <p className="text-[10px] text-emerald-400 font-bold mt-1">Credentials Active & Ready</p>
          </div>
        </div>

        {/* Bento Box 2 */}
        <div className="bg-[#09090b] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Orders</p>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-extrabold text-amber-400">{pendingOrders.length}</p>
            <p className="text-[10px] text-slate-400 mt-1">bKash/Nagad Trx Verifications</p>
          </div>
        </div>

        {/* Bento Box 3 */}
        <div className="bg-[#09090b] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spent (BDT)</p>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-extrabold text-indigo-400">৳ {totalSpentBDT.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 mt-1">Verified Purchases</p>
          </div>
        </div>
      </div>

      {/* Orders Bento Table Box */}
      <div className="bg-[#09090b] border border-slate-800 rounded-2xl p-0 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
          <div>
            <h3 className="font-bold text-sm text-white">Recent Orders Stream</h3>
            <p className="text-[10px] text-slate-500">Track delivery status & view assigned subscription credentials</p>
          </div>
          <Link to="/user/orders" className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1">
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading order stream...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No orders logged yet.</div>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((ord) => (
                <div
                  key={ord._id}
                  className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400">#{ord.orderNumber}</span>
                      <span className="text-xs font-bold text-white">
                        {ord.items.map((i) => i.title).join(', ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      ৳{ord.totalAmount} via <strong className="text-slate-300">{ord.paymentMethod}</strong> (TrxID: <span className="font-mono text-white">{ord.transactionId}</span>)
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase ${
                        ord.orderStatus === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : ord.orderStatus === 'cancelled'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {ord.orderStatus}
                    </span>

                    {ord.orderStatus === 'completed' && ord.deliveredCredentials?.length > 0 && (
                      <button
                        onClick={() => setSelectedCredentialOrder(ord)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition"
                      >
                        View Keys
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Credential Modal */}
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
