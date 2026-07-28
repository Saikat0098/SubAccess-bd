import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Users, Package, CreditCard, Clock, ArrowRight, TrendingUp, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { IAnalytics, IOrder, IPayment, IActivityLog } from '../../types';
import api from '../../lib/api';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<IAnalytics | null>(null);
  const [recentOrders, setRecentOrders] = useState<IOrder[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<IPayment[]>([]);
  const [activityLogs, setActivityLogs] = useState<IActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, logsRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/activity-logs').catch(() => ({ data: { success: false, logs: [] } })),
      ]);

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.analytics);
        setRecentOrders(analyticsRes.data.recentOrders || []);
        setRecentTransactions(analyticsRes.data.recentTransactions || []);
      }

      if (logsRes.data?.success) {
        setActivityLogs(logsRes.data.logs || []);
      }
    } catch (err) {
      console.error('Fetch admin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingPayments = recentTransactions.filter((pt) => pt.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Bento Live Analytics & Operations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time revenue metrics, pending payment verification queues & order activity stream directly from MongoDB
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            MongoDB Live Sync
          </span>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Bento Metric 1: Monthly Revenue */}
        <div className="md:col-span-2 bg-[#09090b] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div>
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Monthly Revenue (Verified)</p>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-4xl font-extrabold text-white mt-2">
              ৳{(analytics?.monthlyRevenueBDT || 0).toLocaleString()}
            </h3>
          </div>
          <div className="flex items-end gap-2 mt-6">
            <div className="h-8 w-2.5 bg-sky-500/20 rounded-t-sm"></div>
            <div className="h-12 w-2.5 bg-sky-500/30 rounded-t-sm"></div>
            <div className="h-6 w-2.5 bg-sky-500/20 rounded-t-sm"></div>
            <div className="h-16 w-2.5 bg-sky-500/40 rounded-t-sm"></div>
            <div className="h-20 w-2.5 bg-sky-500/60 rounded-t-sm"></div>
            <div className="h-24 w-2.5 bg-sky-600 rounded-t-sm"></div>
            <div className="h-14 w-2.5 bg-sky-500/40 rounded-t-sm"></div>
            <div className="h-28 w-2.5 bg-emerald-500 rounded-t-sm"></div>
            <span className="text-xs text-emerald-400 font-bold ml-4 mb-1 flex items-center gap-1">
              Total Lifetime: ৳{(analytics?.totalRevenueBDT || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Bento Metric 2: Today's Revenue */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue</p>
          <h4 className="text-3xl font-extrabold text-emerald-400 mt-2">৳{(analytics?.todayRevenueBDT || 0).toLocaleString()}</h4>
          <div className="mt-4 text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold uppercase">
            Today's Verified Orders
          </div>
        </div>

        {/* Bento Metric 3: Customers & Active Products */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Customers</p>
            <h4 className="text-3xl font-extrabold text-white mt-1">{analytics?.totalCustomersCount || 0}</h4>
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Active Products:</span>
            <span className="font-bold text-sky-400">{analytics?.totalProductsCount || 0}</span>
          </div>
        </div>

        {/* Bento Column: Verification Queue (Urgent Box) */}
        <div className="md:col-span-1 md:row-span-2 bg-[#09090b] border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl pointer-events-none"></div>
          <div>
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Payment Verification Queue</p>
              <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded font-bold">
                {analytics?.pendingPaymentsCount || 0} PENDING
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {pendingPayments.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">No pending payments awaiting review.</p>
              ) : (
                pendingPayments.slice(0, 4).map((pt) => {
                  const ordNum = typeof pt.order === 'object' && pt.order ? pt.order.orderNumber : '';
                  return (
                    <div key={pt._id} className="border-l-2 border-amber-500 pl-3 py-1 bg-slate-950/60 rounded-r-lg p-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{pt.paymentMethod}</span>
                        <span className="font-mono text-[10px] text-amber-400">{pt.transactionId}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Sender: {pt.senderPhone} | ৳{pt.amount}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Link
            to="/admin/payments"
            className="w-full mt-6 py-2.5 text-center text-xs font-bold border border-amber-500/30 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition block shadow-md"
          >
            Verify Payment Queue ({analytics?.pendingPaymentsCount || 0}) →
          </Link>
        </div>

        {/* Bento Main Section: Live Orders Stream */}
        <div className="md:col-span-3 md:row-span-2 bg-[#09090b] border border-slate-800 rounded-2xl p-0 flex flex-col overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-sky-400" />
              Live Orders Stream (MongoDB)
            </h4>
            <Link to="/admin/orders" className="text-[10px] text-sky-400 font-bold uppercase tracking-wider hover:underline">
              View All Orders ({recentOrders.length})
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading live MongoDB orders...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No orders logged in MongoDB yet.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="text-[10px] text-slate-500 uppercase font-bold bg-slate-900/50">
                  <tr className="border-b border-slate-800">
                    <th className="px-6 py-3">Order ID</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Payment</th>
                    <th className="px-6 py-3">TrxID</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-slate-800/50">
                  {recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-3 font-mono text-sky-400 font-bold">#{ord.orderNumber}</td>
                      <td className="px-6 py-3 text-white font-semibold">
                        {ord.customerName}
                        <span className="block text-[10px] text-slate-500 font-normal">{ord.customerPhone}</span>
                      </td>
                      <td className="px-6 py-3 text-slate-300">{ord.paymentMethod}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-400">{ord.transactionId}</td>
                      <td className="px-6 py-3 font-extrabold text-emerald-400">৳{ord.totalAmount}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                            ord.orderStatus === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : ord.orderStatus === 'cancelled'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Activity Logs Feed Section */}
      {activityLogs.length > 0 && (
        <div className="bg-[#09090b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> System Activity Log Stream
            </h4>
            <span className="text-[10px] text-slate-500">Live Audit Trail</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activityLogs.slice(0, 6).map((log) => (
              <div key={log._id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-purple-400">{log.action}</span>
                  <span className="text-slate-500">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 font-medium truncate">{log.details || log.action}</p>
                {log.userName && <p className="text-[10px] text-slate-500">By: {log.userName}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
