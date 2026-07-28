import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { ICoupon } from '../../types';
import api from '../../lib/api';

export const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(300);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coupons');
      if (res.data.success) {
        setCoupons(res.data.coupons);
      }
    } catch (err) {
      console.error('Fetch coupons error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    try {
      setCreating(true);
      const res = await api.post('/coupons', {
        code,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount),
      });

      if (res.data.success) {
        setCoupons([...coupons, res.data.coupon]);
        setCode('');
      }
    } catch (err) {
      alert('Failed to create coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await api.patch(`/coupons/${id}/toggle`);
      if (res.data.success) {
        setCoupons(coupons.map((c) => (c._id === id ? res.data.coupon : c)));
      }
    } catch (err) {
      alert('Failed to toggle coupon status');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this promo coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(coupons.filter((c) => c._id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Discount Promo Coupons</h1>
        <p className="text-xs text-slate-400 mt-1">Manage percentage or fixed BDT discount promo codes for checkout</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit">
          <h3 className="font-bold text-base text-white">Create Promo Code</h3>

          <form onSubmit={handleCreateCoupon} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Coupon Code *</label>
              <input
                type="text"
                placeholder="e.g. SUBBD10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e: any) => setDiscountType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed BDT (৳)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Discount Value *</label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Min Order Amount (BDT)</label>
              <input
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition"
            >
              {creating ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2 space-y-3">
          {loading ? (
            <div className="h-48 bg-slate-900 rounded-2xl animate-pulse" />
          ) : coupons.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              No coupons created yet.
            </div>
          ) : (
            coupons.map((c) => {
              const val = c.discountValue || c.discountPercentage;
              const isFixed = c.discountType === 'fixed';

              return (
                <div key={c._id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-sky-400 uppercase">{c.code}</span>
                      <button
                        onClick={() => handleToggleActive(c._id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}
                      >
                        {c.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 font-bold mt-1">
                      Discount: {isFixed ? `৳${val}` : `${val}%`} OFF
                    </p>
                    <p className="text-[11px] text-slate-400">Min Order: ৳{c.minOrderAmount || c.minSpendBDT || 0}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteCoupon(c._id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
