import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Check, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { ISettings } from '../../types';
import api from '../../lib/api';

export const AdminSettings: React.FC = () => {
  const [siteName, setSiteName] = useState('SubAccess BD');
  const [bkashNumber, setBkashNumber] = useState('01712345678');
  const [nagadNumber, setNagadNumber] = useState('01812345678');
  const [rocketNumber, setRocketNumber] = useState('01912345678');
  const [noticeActive, setNoticeActive] = useState(true);
  const [noticeBannerText, setNoticeBannerText] = useState(
    '🔥 Flash Sale: 10% OFF on Netflix & Canva Pro using code SUBBD10!'
  );
  const [supportEmail, setSupportEmail] = useState('support@subaccessbd.com');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success && res.data.settings) {
        const s = res.data.settings;
        setSiteName(s.siteName || 'SubAccess BD');
        setBkashNumber(s.bkashNumber || '01712345678');
        setNagadNumber(s.nagadNumber || '01812345678');
        setRocketNumber(s.rocketNumber || '01912345678');
        setNoticeActive(s.noticeActive ?? true);
        setNoticeBannerText(s.noticeBannerText || '');
        setSupportEmail(s.supportEmail || 'support@subaccessbd.com');
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      await api.put('/admin/settings', {
        siteName,
        bkashNumber,
        nagadNumber,
        rocketNumber,
        noticeActive,
        noticeBannerText,
        supportEmail,
      });

      toast.success('Storefront settings updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Marketplace & Payment Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Configure official bKash, Nagad & Rocket wallet numbers & announcement banner</p>
      </div>

      {savedMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-bold flex items-center gap-2">
          <Check className="w-4 h-4" /> {savedMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Mobile Wallets */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" /> Mobile Banking Wallet Numbers (Bangladesh)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-pink-400 mb-1">bKash Personal / Merchant</label>
              <input
                type="text"
                value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-orange-400 mb-1">Nagad Personal / Merchant</label>
              <input
                type="text"
                value={nagadNumber}
                onChange={(e) => setNagadNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-400 mb-1">Rocket Personal</label>
              <input
                type="text"
                value={rocketNumber}
                onChange={(e) => setRocketNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Announcement Banner */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-white">Storefront Notice Banner</h3>
            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={noticeActive}
                onChange={(e) => setNoticeActive(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-0"
              />
              Banner Active
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notice Banner Text</label>
            <input
              type="text"
              value={noticeBannerText}
              onChange={(e) => setNoticeBannerText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
            />
          </div>
        </div>

        {/* General */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="font-bold text-base text-white">General Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Marketplace Brand Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-sky-600/30 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </form>
    </div>
  );
};
