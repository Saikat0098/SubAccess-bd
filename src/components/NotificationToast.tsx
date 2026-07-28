import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const NotificationToast: React.FC = () => {
  const { toastNotification, clearToast } = useSocket();

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        clearToast();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification, clearToast]);

  return (
    <AnimatePresence>
      {toastNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-sky-500/40 text-white p-4 rounded-xl shadow-2xl backdrop-blur-lg flex items-start gap-3"
        >
          <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg shrink-0 mt-0.5">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-sky-400">{toastNotification.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastNotification.message}</p>
          </div>
          <button
            onClick={clearToast}
            className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
