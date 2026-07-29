import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  CreditCard,
  Tag,
  Star,
  Headphones,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
  CheckCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationToast } from '../components/NotificationToast';
import { getSocket } from '../lib/socket';
import api from '../lib/api';

interface INotificationItem {
  id: string;
  title: string;
  message: string;
  customerName?: string;
  orderNumber?: string;
  time: string;
  isRead: boolean;
  type?: string;
  link?: string;
}

export const AdminDashboardLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const [pendingPayments, setPendingPayments] = useState<number>(0);
  const [pendingTickets, setPendingTickets] = useState<number>(0);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (loading || !user || user.role !== 'admin') return;

    fetchInitialCounts();
    fetchNotifications();

    const socket = getSocket();
    socket.emit('join_admin');

    const handleNewOrder = (data: any) => {
      if (data?.pendingOrdersCount !== undefined) {
        setPendingOrders(data.pendingOrdersCount);
      } else {
        setPendingOrders((prev) => prev + 1);
      }
      if (data?.pendingPaymentsCount !== undefined) {
        setPendingPayments(data.pendingPaymentsCount);
      }

      const ord = data?.order || data;
      const orderNum = ord?.orderNumber || '';
      const custName = ord?.customerName || 'Customer';
      const prodTitle = ord?.items?.[0]?.title || 'Product';

      const newNotif: INotificationItem = {
        id: 'notif_' + Date.now(),
        title: '🔔 New Order Received',
        message: `${prodTitle} - Customer: ${custName}`,
        customerName: custName,
        orderNumber: orderNum,
        time: 'Just now',
        isRead: false,
        type: 'order',
        link: '/admin/orders',
      };

      setNotifications((prev) => [newNotif, ...prev]);

      if (soundEnabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
          // ignore audio error
        }
      }
    };

    const handleNewTicket = (data: any) => {
      if (data?.pendingTicketsCount !== undefined) {
        setPendingTickets(data.pendingTicketsCount);
      } else {
        setPendingTickets((prev) => prev + 1);
      }

      const ticketNum = data?.ticketId || data?.ticket?.ticketId || '';
      const custName = data?.customerName || data?.ticket?.customerName || 'Customer';
      const subject = data?.subject || data?.ticket?.subject || 'Support Ticket';

      const newNotif: INotificationItem = {
        id: 'notif_ticket_' + Date.now(),
        title: '📩 New Support Ticket',
        message: `#${ticketNum}: ${subject} (${custName})`,
        customerName: custName,
        time: 'Just now',
        isRead: false,
        type: 'ticket',
        link: '/admin/support',
      };

      setNotifications((prev) => [newNotif, ...prev]);

      if (soundEnabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
          // ignore audio error
        }
      }
    };

    const handlePendingCount = (data: any) => {
      if (data?.pendingOrdersCount !== undefined) setPendingOrders(data.pendingOrdersCount);
      if (data?.pendingPaymentsCount !== undefined) setPendingPayments(data.pendingPaymentsCount);
      if (data?.pendingTicketsCount !== undefined) setPendingTickets(data.pendingTicketsCount);
    };

    const handlePaymentApproved = (data: any) => {
      if (data?.pendingOrdersCount !== undefined) setPendingOrders(data.pendingOrdersCount);
      if (data?.pendingPaymentsCount !== undefined) setPendingPayments(data.pendingPaymentsCount);
    };

    const handlePaymentRejected = (data: any) => {
      if (data?.pendingOrdersCount !== undefined) setPendingOrders(data.pendingOrdersCount);
      if (data?.pendingPaymentsCount !== undefined) setPendingPayments(data.pendingPaymentsCount);
    };

    const handleGenericNotification = (data: any) => {
      if (data?.title) {
        setNotifications((prev) => [
          {
            id: 'notif_' + Date.now(),
            title: data.title,
            message: data.message || '',
            time: 'Just now',
            isRead: false,
            link: data.link || '/admin/orders',
          },
          ...prev,
        ]);
      }
    };

    socket.on('new-order', handleNewOrder);
    socket.on('new-ticket', handleNewTicket);
    socket.on('pending-order-count', handlePendingCount);
    socket.on('payment-approved', handlePaymentApproved);
    socket.on('payment-rejected', handlePaymentRejected);
    socket.on('notification', handleGenericNotification);
    socket.on('dashboard-update', handlePendingCount);
    socket.on('badge-update', handlePendingCount);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('new-ticket', handleNewTicket);
      socket.off('pending-order-count', handlePendingCount);
      socket.off('payment-approved', handlePaymentApproved);
      socket.off('payment-rejected', handlePaymentRejected);
      socket.off('notification', handleGenericNotification);
      socket.off('dashboard-update', handlePendingCount);
      socket.off('badge-update', handlePendingCount);
    };
  }, [loading, user, soundEnabled]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center p-4">
        <div className="bg-[#09090b] border border-slate-800 p-8 rounded-2xl text-center max-w-md w-full shadow-2xl flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <h3 className="text-sm font-bold text-white">Authenticating Admin Session</h3>
            <p className="text-xs text-slate-400 mt-1">Verifying security token and loading SubAccess BD dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center p-4">
        <div className="bg-[#09090b] border border-slate-800 p-8 rounded-2xl text-center max-w-md w-full shadow-2xl">
          <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">Admin Security Restriction</h3>
          <p className="text-xs text-slate-400 mb-6">
            You are logged in as a normal user account or guest. Admin privileges required.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            Login as Admin
          </Link>
        </div>
      </div>
    );
  }

  const fetchInitialCounts = async () => {
    try {
      const res = await api.get('/admin/analytics');
      if (res.data?.success && res.data.analytics) {
        setPendingOrders(res.data.analytics.pendingOrdersCount || 0);
        setPendingPayments(res.data.analytics.pendingPaymentsCount || 0);
        setPendingTickets(res.data.analytics.pendingTicketsCount || 0);
      }
    } catch (err) {
      console.error('Fetch analytics counts error:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success && res.data.notifications) {
        const formatted = res.data.notifications.map((n: any) => ({
          id: n._id,
          title: n.title,
          message: n.message,
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: n.isRead,
          link: n.link,
        }));
        setNotifications(formatted);
      }
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.put('/notifications/read-all');
    } catch (err) {
      // ignore
    }
  };

  const handleMarkSingleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const navItems = [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    {
      name: `Manage Orders${pendingOrders > 0 ? ` (${pendingOrders})` : ''}`,
      path: '/admin/orders',
      icon: ShoppingBag,
      badge: pendingOrders > 0 ? pendingOrders : null,
      badgeColor: 'bg-amber-500 text-black font-extrabold',
    },
    { name: 'Products Catalog', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: Layers },
    {
      name: `Verify Payments${pendingPayments > 0 ? ` (${pendingPayments})` : ''}`,
      path: '/admin/payments',
      icon: CreditCard,
      badge: pendingPayments > 0 ? pendingPayments : null,
      badgeColor: 'bg-pink-500 text-white font-extrabold',
    },
    { name: 'Customer Accounts', path: '/admin/users', icon: Users },
    { name: 'Discount Coupons', path: '/admin/coupons', icon: Tag },
    { name: 'Customer Reviews', path: '/admin/reviews', icon: Star },
    {
      name: `Support Inbox${pendingTickets > 0 ? ` (${pendingTickets})` : ''}`,
      path: '/admin/support',
      icon: Headphones,
      badge: pendingTickets > 0 ? pendingTickets : null,
      badgeColor: 'bg-purple-500 text-white font-extrabold',
    },
    { name: 'System Settings', path: '/admin/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#09090b] border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-md shadow-indigo-600/30">
            S
          </div>
          <span className="font-bold text-white text-lg tracking-tight">SubAccess BD</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#09090b] border-r border-slate-800 p-5 flex flex-col justify-between transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Admin Header Logo */}
          <div className="flex items-center gap-3 pb-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-600/30">
              S
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight leading-none">SubAccess BD</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Control Panel</p>
            </div>
          </div>

          {/* Admin User Info Card */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex-shrink-0 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold text-xs">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">Senior Admin</p>
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-2 mb-2">
              Management
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] shadow-sm animate-pulse ${
                        item.badgeColor || 'bg-amber-500 text-black'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            to="/products"
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold text-center block transition"
          >
            ← Public Storefront
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0c0c0e]">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 md:px-8 bg-[#09090b] relative z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Socket.IO Real-time Engine Connected
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Order sound alerts enabled' : 'Order sound alerts muted'}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Notification Bell Panel Toggle */}
            <div className="relative">
              <button
                onClick={() => setNotifPanelOpen(!notifPanelOpen)}
                className="relative p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition flex items-center justify-center"
              >
                <Bell className="w-4 h-4 text-slate-200" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-sky-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#09090b] animate-bounce">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Panel */}
              {notifPanelOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-[#09090b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-sky-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Order Notifications ({unreadNotifCount})
                      </h4>
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <CheckCheck className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">No recent order alerts</div>
                    ) : (
                      notifications.slice(0, 15).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            handleMarkSingleRead(notif.id);
                            if (notif.link) {
                              navigate(notif.link);
                              setNotifPanelOpen(false);
                            }
                          }}
                          className={`p-3.5 transition hover:bg-slate-800/40 cursor-pointer flex items-start gap-3 ${
                            !notif.isRead ? 'bg-sky-500/5 border-l-2 border-sky-500' : 'opacity-75'
                          }`}
                        >
                          <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 text-xs mt-0.5 flex-shrink-0">
                            🛍️
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                              <span className="text-[10px] text-slate-500">{notif.time}</span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium mt-0.5 line-clamp-2">{notif.message}</p>
                            {!notif.isRead && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-sky-500/20 text-sky-400 text-[9px] font-bold rounded">
                                UNREAD
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 border-t border-slate-800 bg-slate-900/30 text-center">
                    <Link
                      to="/admin/orders"
                      onClick={() => setNotifPanelOpen(false)}
                      className="text-[11px] font-bold text-indigo-400 hover:underline"
                    >
                      View All Orders →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/admin/products"
              className="text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-md shadow-indigo-600/20"
            >
              + Add Product
            </Link>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      <NotificationToast />
    </div>
  );
};
