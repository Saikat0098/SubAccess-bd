import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, ShieldAlert, UserCheck, UserX, Search, KeyRound, CheckCircle2, Trash2, Ban } from 'lucide-react';
import { IUser } from '../../types';
import api from '../../lib/api';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState<IUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Fetch admin users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (userId: string) => {
    if (!confirm('Promote this user to Admin role?')) return;
    try {
      const res = await api.patch(`/admin/users/${userId}/promote`);
      if (res.data.success) {
        setUsers(users.map((u) => (u._id === userId ? res.data.user : u)));
      }
    } catch (err) {
      alert('Promote user failed');
    }
  };

  const handleDemote = async (userId: string) => {
    if (!confirm('Demote this admin to regular User role?')) return;
    try {
      const res = await api.patch(`/admin/users/${userId}/demote`);
      if (res.data.success) {
        setUsers(users.map((u) => (u._id === userId ? res.data.user : u)));
      }
    } catch (err) {
      alert('Demote user failed');
    }
  };

  const handleToggleBlock = async (userId: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle-block`);
      if (res.data.success) {
        setUsers(users.map((u) => (u._id === userId ? res.data.user : u)));
      }
    } catch (err) {
      alert('Toggle block failed');
    }
  };

  const handleVerifyEmail = async (userId: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/verify-email`);
      if (res.data.success) {
        setUsers(users.map((u) => (u._id === userId ? res.data.user : u)));
      }
    } catch (err) {
      alert('Email verification failed');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Permanently delete this user account? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
    } catch (err) {
      alert('Delete user failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword) return;

    try {
      setResetting(true);
      const res = await api.patch(`/admin/users/${resetModalUser._id}/reset-password`, {
        newPassword,
      });
      if (res.data.success) {
        alert(res.data.message);
        setResetModalUser(null);
        setNewPassword('');
      }
    } catch (err) {
      alert('Reset password failed');
    } finally {
      setResetting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Customer & Staff Accounts</h1>
        <p className="text-xs text-slate-400 mt-1">Manage registered users, roles, email verification, block/unblock & password resets</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search Name, Email, or Mobile Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-sky-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${roleFilter === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            All Accounts ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('user')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${roleFilter === 'user' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            Customers ({users.filter(u => u.role === 'user').length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${roleFilter === 'admin' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            Admins ({users.filter(u => u.role === 'admin').length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 bg-slate-900 rounded-2xl animate-pulse" />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
                <th className="p-4">Customer</th>
                <th className="p-4">Mobile Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u._id || u.id} className="hover:bg-slate-800/50 transition">
                  <td className="p-4">
                    <p className="font-bold text-white">{u.name}</p>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                  </td>
                  <td className="p-4 font-mono text-slate-300">{u.phone || 'N/A'}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 space-y-1">
                    <div>
                      {u.isEmailVerified ? (
                        <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Verified</span>
                      ) : (
                        <button
                          onClick={() => handleVerifyEmail(u._id || u.id)}
                          className="text-amber-400 hover:underline font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                        >
                          Verify Email
                        </button>
                      )}
                    </div>
                    {u.isBlocked && (
                      <span className="text-rose-400 font-bold text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 block w-fit">Blocked</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => setResetModalUser(u)}
                      title="Reset Password"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition inline-flex items-center"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleBlock(u._id || u.id)}
                      title={u.isBlocked ? 'Unblock User' : 'Block User'}
                      className={`p-1.5 rounded-lg transition inline-flex items-center ${u.isBlocked ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>

                    {u.role !== 'admin' ? (
                      <button
                        onClick={() => handlePromote(u._id || u.id)}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded-lg transition"
                      >
                        Promote Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDemote(u._id || u.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-lg transition"
                      >
                        Demote User
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteUser(u._id || u.id)}
                      title="Delete User"
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition inline-flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-lg text-white">
              Reset Password for {resetModalUser.name}
            </h3>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">New Password (Min 6 chars) *</label>
                <input
                  type="password"
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-sky-500"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl"
                >
                  {resetting ? 'Resetting...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};