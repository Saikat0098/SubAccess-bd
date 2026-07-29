import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  Search,
  Key,
  Bell,
  Headphones,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationToast } from '../components/NotificationToast';

export const UserDashboardLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center p-4">
        <div className="bg-[#09090b] border border-slate-800 p-8 rounded-2xl text-center max-w-md w-full shadow-2xl flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <h3 className="text-sm font-bold text-white">Authenticating Session</h3>
            <p className="text-xs text-slate-400 mt-1">Checking customer authorization...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center p-4">
        <div className="bg-[#09090b] border border-slate-800 p-8 rounded-2xl text-center max-w-md w-full shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-2">Access Restricted</h3>
          <p className="text-xs text-slate-400 mb-6">Please log in to your SubAccess BD customer account to continue.</p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard Overview', path: '/user', icon: Sparkles, end: true },
    { name: 'My Orders & Invoices', path: '/user/orders', icon: ShoppingBag },
    { name: 'Order Tracking', path: '/track-order', icon: Search },
    { name: 'Active Subscriptions', path: '/user/subscriptions', icon: CreditCard },
    { name: 'Delivered Credentials & Keys', path: '/user/credentials', icon: Key },
    { name: 'Notifications', path: '/user/notifications', icon: Bell },
    { name: 'Support Tickets', path: '/user/support', icon: Headphones },
    { name: 'Profile & Security', path: '/user/security', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-[#09090b] border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-md shadow-indigo-600/30">
            S
          </div>
          <span className="font-bold text-white text-lg tracking-tight">SubAccess BD</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#09090b] border-r border-slate-800 p-5 flex flex-col justify-between transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 pb-2 border-b border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-600/30">
              S
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight leading-none">SubAccess BD</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Customer Panel</p>
            </div>
          </Link>

          {/* User Profile Summary */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex-shrink-0 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold text-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-2 mb-2">
              Dashboard Navigation
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
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            to="/products"
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold text-center block transition"
          >
            ← Back to Store
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0c0c0e]">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 md:px-8 bg-[#09090b]">
          <p className="text-xs font-medium text-slate-400">
            Welcome back, <strong className="text-white font-bold">{user.name}</strong>
          </p>
          <Link
            to="/products"
            className="text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-md shadow-indigo-600/20"
          >
            Browse Products
          </Link>
        </header>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      <NotificationToast />
    </div>
  );
};
