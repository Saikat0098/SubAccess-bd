import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { INotification } from '../../types';
import api from '../../lib/api';

export const UserNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Notifications</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time order updates, support responses & system announcements</p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={markAllRead}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-48 bg-slate-900 rounded-2xl animate-pulse" />
      ) : notifications.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Notifications</h3>
          <p className="text-xs text-slate-400">You're all caught up! New updates will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded-2xl border transition ${
                notif.isRead ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-900 border-sky-500/40 shadow-lg'
              }`}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-white">{notif.title}</h4>
                <span className="text-[10px] text-slate-500">{new Date(notif.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
