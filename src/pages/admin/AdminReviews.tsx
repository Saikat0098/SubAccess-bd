import React, { useState, useEffect } from 'react';
import {
  Star,
  Trash2,
  Eye,
  EyeOff,
  Award,
  Search,
  Filter,
  ShieldCheck,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { IReview } from '../../types';
import api from '../../lib/api';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'hidden' | 'featured'>('all');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reviews/admin/all?filter=${filter}&search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error('Fetch admin reviews error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleToggleHide = async (id: string) => {
    try {
      const res = await api.patch(`/reviews/${id}/toggle-hide`);
      if (res.data.success) {
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, isHidden: res.data.isHidden } : r))
        );
        toast.success(res.data.isHidden ? 'Review hidden' : 'Review unhidden');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle visibility status');
    }
  };

  const handleToggleFeature = async (id: string) => {
    try {
      const res = await api.patch(`/reviews/${id}/toggle-feature`);
      if (res.data.success) {
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, isFeatured: res.data.isFeatured } : r))
        );
        toast.success(res.data.isFeatured ? 'Review featured' : 'Review unfeatured');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle featured status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/reviews/${id}`);
      if (res.data.success) {
        setReviews(reviews.filter((r) => r._id !== id));
        toast.success('Review deleted');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-sky-400" /> Customer Reviews Moderation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage, feature, hide, or audit verified customer product reviews in MongoDB
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-sky-400 font-bold text-xs rounded-xl">
            Total Reviews: {reviews.length}
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            type="text"
            placeholder="Search reviews by user name, headline, or text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-sky-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 font-bold rounded-lg transition ${
                filter === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('featured')}
              className={`px-3 py-1.5 font-bold rounded-lg transition ${
                filter === 'featured' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Featured
            </button>
            <button
              onClick={() => setFilter('hidden')}
              className={`px-3 py-1.5 font-bold rounded-lg transition ${
                filter === 'hidden' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hidden
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-slate-900 rounded-2xl animate-pulse" />
          <div className="h-48 bg-slate-900 rounded-2xl animate-pulse" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
          No customer reviews found matching your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => {
            const productObj = typeof r.product === 'object' ? r.product : null;
            const orderObj = typeof r.order === 'object' ? r.order : null;

            return (
              <div
                key={r._id}
                className={`p-5 bg-slate-900 border rounded-2xl space-y-3.5 transition relative ${
                  r.isHidden
                    ? 'border-rose-900/50 bg-slate-950/50 opacity-75'
                    : r.isFeatured
                    ? 'border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'border-slate-800'
                }`}
              >
                {/* Product & Order Context */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 text-[11px]">
                  <div className="flex items-center gap-2 truncate max-w-[70%]">
                    {productObj?.image && (
                      <img
                        src={productObj.image}
                        alt=""
                        className="w-6 h-6 rounded-md object-cover shrink-0"
                      />
                    )}
                    <span className="font-bold text-white truncate">
                      {productObj?.title || 'Product'}
                    </span>
                  </div>

                  {orderObj?.orderNumber && (
                    <span className="font-mono text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                      Order #{orderObj.orderNumber}
                    </span>
                  )}
                </div>

                {/* User & Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{r.userName}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] rounded-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  </div>

                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700 fill-slate-900'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  {r.title && <h4 className="font-bold text-xs text-white">{r.title}</h4>}
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{r.comment}</p>
                </div>

                {/* Images */}
                {r.images && r.images.length > 0 && (
                  <div className="flex gap-2">
                    {r.images.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer">
                        <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-800" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Controls Bar */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>

                  <div className="flex items-center gap-2">
                    {/* Feature button */}
                    <button
                      onClick={() => handleToggleFeature(r._id)}
                      className={`p-1.5 rounded-lg border font-bold flex items-center gap-1 transition ${
                        r.isFeatured
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title={r.isFeatured ? 'Unfeature Review' : 'Feature Review'}
                    >
                      <Award className="w-3.5 h-3.5" />
                    </button>

                    {/* Hide button */}
                    <button
                      onClick={() => handleToggleHide(r._id)}
                      className={`p-1.5 rounded-lg border font-bold flex items-center gap-1 transition ${
                        r.isHidden
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title={r.isHidden ? 'Unhide Review' : 'Hide Review'}
                    >
                      {r.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition"
                      title="Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
