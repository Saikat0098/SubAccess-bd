import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { ImageUploader } from '../../components/ImageUploader';

export const UserSecurity: React.FC = () => {
  const { user, checkAuth } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProfile) return;

    try {
      setSavingProfile(true);
      await api.put('/auth/profile', { name, phone, address, avatar });
      if (checkAuth) await checkAuth();
      toast.success('Profile details updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (savingPass) return;

    try {
      setSavingPass(true);
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password update failed');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Profile & Account Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Manage personal contact details, delivery address, profile picture and password</p>
      </div>

      {/* Profile Form */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <User className="w-5 h-5 text-sky-400" /> Personal Account Profile
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address (Read-only)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-slate-950/50 border border-slate-800/50 text-slate-500 text-xs rounded-xl px-4 py-2.5 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Phone (Bangladesh)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01712345678"
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div>
            <ImageUploader
              label="Avatar / Profile Picture"
              helperText="Upload profile photo to ImgBB (JPG, PNG, WEBP)"
              value={avatar}
              compact
              onChange={(url) => setAvatar(typeof url === 'string' ? url : url[0] || '')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Default Delivery Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. House 12, Road 4, Dhanmondi, Dhaka 1205"
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-400" /> Change Login Password
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Current Password *</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">New Password (Min 6 chars) *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={savingPass}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" /> {savingPass ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
