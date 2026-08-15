import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Users, Package, CreditCard, Clock, ArrowRight, TrendingUp, CheckCircle, AlertCircle, Activity, Headphones, Radio } from 'lucide-react';
import { IAnalytics, IOrder, IPayment, IActivityLog } from '../../types';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<IAnalytics | null>(null);
  const [recentOrders, setRecentOrders] = useState<IOrder[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<IPayment[]>([]);
  const [activityLogs, setActivityLogs] = useState<IActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    const socket = getSocket();
    socket.emit('join_admin');

    // Realtime Socket Event Handlers
    const handleNewOrder = (data: any) => {
      fetchDashboardData();
    };

    const handleDashboardUpdate = (data: any) => {
      fetchDashboardData();
    };

    socket.on('new-order', handleNewOrder);
    socket.on('payment-approved', handleDashboardUpdate);
    socket.on('payment-rejected', handleDashboardUpdate);
    socket.on('dashboard-update', handleDashboardUpdate);
    socket.on('pending-order-count', handleDashboardUpdate);
    socket.on('order:created', handleNewOrder);
    socket.on('order:updated', handleDashboardUpdate);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('payment-approved', handleDashboardUpdate);
      socket.off('payment-rejected', handleDashboardUpdate);
      socket.off('dashboard-update', handleDashboardUpdate);
      socket.off('pending-order-count', handleDashboardUpdate);
      socket.off('order:created', handleNewOrder);
      socket.off('order:updated', handleDashboardUpdate);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
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
      {/* Page Title & Realtime Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-emerald-400 animate-pulse" /> Live Admin Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time sales revenue, pending order queues & MongoDB live socket synchronization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-full border border-emerald-500/20 font-bold uppercase flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Socket.IO Engine Live
          </span>
        </div>
      </div>

      {/* Live Counter Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Pending Orders */}
        <div className="bg-[#09090b] border border-amber-500/30 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Pending Orders</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-black text-white">{analytics?.pendingOrdersCount || 0}</h3>
            <p className="text-[10px] text-amber-300/80 font-medium mt-1">🟡 Awaiting Fulfillment</p>
          </div>
        </div>

        {/* Card 2: Pending Payments */}
        <div className="bg-[#09090b] border border-pink-500/30 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">Pending Payments</span>
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse"></span>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-black text-white">{analytics?.pendingPaymentsCount || 0}</h3>
            <p className="text-[10px] text-pink-300/80 font-medium mt-1">💳 TrxID Verification Queue</p>
          </div>
        </div>

        {/* Card 3: Completed Orders */}
        <div className="bg-[#09090b] border border-emerald-500/30 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total Customers</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-black text-white">{analytics?.totalCustomersCount || 0}</h3>
            <p className="text-[10px] text-emerald-400/80 font-medium mt-1">🟢 Active Customer Accounts</p>
          </div>
        </div>

        {/* Card 4: Total Revenue BDT */}
        <div className="bg-[#09090b] border border-indigo-500/30 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Lifetime Revenue</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl md:text-3xl font-black text-emerald-400">
              ৳{(analytics?.totalRevenueBDT || 0).toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">
              Today: ৳{(analytics?.todaysRevenueBDT || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Bento Column: Urgent Verification Queue Box */}
        <div className="md:col-span-1 md:row-span-2 bg-[#09090b] border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Payment Verification Queue</p>
              <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded font-black">
                {analytics?.pendingPaymentsCount || 0} PENDING
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {pendingPayments.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">No pending payments awaiting review.</p>
              ) : (
                pendingPayments.slice(0, 5).map((pt) => {
                  const ord = typeof pt.order === 'object' && pt.order ? (pt.order as any) : null;
                  return (
                    <div key={pt._id} className="border-l-2 border-amber-500 pl-3 py-1.5 bg-slate-950/80 rounded-r-xl p-2.5 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{pt.paymentMethod}</span>
                        <span className="font-mono text-[10px] text-amber-400 font-bold">{pt.transactionId}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Sender: {pt.senderPhone} | <span className="text-emerald-400 font-bold">৳{pt.amount}</span>
                      </p>
                      {ord && <p className="text-[9px] text-sky-400 font-mono">#{ord.orderNumber}</p>}
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
                          {ord.orderStatus === 'pending' ? '🟡 Pending' : ord.orderStatus === 'completed' ? '🟢 Completed' : '🔴 Cancelled'}
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

      {/* System Activity Logs Section */}
      {activityLogs.length > 0 && (
        <div className="bg-[#09090b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> System Activity Audit Log
            </h4>
            <span className="text-[10px] text-slate-500">Live Audit Stream</span>
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
