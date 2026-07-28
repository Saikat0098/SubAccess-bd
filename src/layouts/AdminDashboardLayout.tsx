import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationToast } from '../components/NotificationToast';

export const AdminDashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const navItems = [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Manage Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Products Catalog', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: Layers },
    { name: 'Verify Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Customer Accounts', path: '/admin/users', icon: Users },
    { name: 'Discount Coupons', path: '/admin/coupons', icon: Tag },
    { name: 'Customer Reviews', path: '/admin/reviews', icon: Star },
    { name: 'Support Inbox', path: '/admin/support', icon: Headphones },
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
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 md:px-8 bg-[#09090b]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Realtime Engine Connected
            </div>
          </div>
          <div className="flex items-center gap-4">
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
