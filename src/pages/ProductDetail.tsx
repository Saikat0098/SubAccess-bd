import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Zap,
  ShieldCheck,
  Check,
  Star,
  ArrowLeft,
  Clock,
  Key,
  ThumbsUp,
  MessageSquare,
  Plus,
  Edit3,
  CheckCircle2,
  Lock,
  X,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { IProduct, IReview } from '../types';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const ProductDetail: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onAddToCart } = useOutletContext<{ onAddToCart: (product: IProduct) => void }>();

  const [product, setProduct] = useState<IProduct | null>(null);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [stats, setStats] = useState<{
    averageRating: number;
    totalReviews: number;
    ratingCounts: Record<number, number>;
  }>({
    averageRating: 5.0,
    totalReviews: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  const [eligibility, setEligibility] = useState<{
    canReview: boolean;
    hasReviewed: boolean;
    existingReview?: IReview;
    orderId?: string;
    orderNumber?: string;
    message?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<'newest' | 'rating_high' | 'rating_low' | 'helpful'>('newest');

  // Review Form Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (idOrSlug) {
      fetchProductDetails();
    }
  }, [idOrSlug, sortOption, user]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${idOrSlug}`);
      if (res.data.success) {
        const prod = res.data.product;
        setProduct(prod);

        // Fetch reviews with stats
        const revRes = await api.get(`/reviews?productId=${prod._id}&sort=${sortOption}`);
        if (revRes.data.success) {
          setReviews(revRes.data.reviews || []);
          if (revRes.data.stats) {
            setStats(revRes.data.stats);
          }
        }

        // Check review eligibility if user is logged in
        if (user) {
          try {
            const eligRes = await api.get(`/reviews/eligibility?productId=${prod._id}`);
            if (eligRes.data.success) {
              setEligibility(eligRes.data);
              if (eligRes.data.existingReview) {
                setReviewRating(eligRes.data.existingReview.rating);
                setReviewTitle(eligRes.data.existingReview.title || '');
                setReviewComment(eligRes.data.existingReview.comment || '');
                setReviewImages(eligRes.data.existingReview.images || []);
              }
            }
          } catch (e) {
            setEligibility(null);
          }
        } else {
          setEligibility(null);
        }
      }
    } catch (err) {
      console.error('Error fetching product detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantBuy = () => {
    if (product) {
      onAddToCart(product);
      navigate('/checkout');
    }
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setReviewImages([...reviewImages, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (idx: number) => {
    setReviewImages(reviewImages.filter((_, i) => i !== idx));
  };

  const handleOpenReviewModal = () => {
    if (eligibility?.existingReview) {
      setReviewRating(eligibility.existingReview.rating);
      setReviewTitle(eligibility.existingReview.title || '');
      setReviewComment(eligibility.existingReview.comment || '');
      setReviewImages(eligibility.existingReview.images || []);
    } else {
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
      setReviewImages([]);
    }
    setReviewError('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || submittingReview) return;

    if (!reviewTitle.trim() || !reviewComment.trim()) {
      setReviewError('Review title and description are required.');
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError('');

      if (eligibility?.hasReviewed && eligibility.existingReview) {
        // Update existing review
        const res = await api.put(`/reviews/${eligibility.existingReview._id}`, {
          rating: reviewRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
          images: reviewImages,
        });

        if (res.data.success) {
          setShowReviewModal(false);
          fetchProductDetails();
        } else {
          setReviewError(res.data.message || 'Failed to update review.');
        }
      } else {
        // Create new review
        const res = await api.post('/reviews', {
          product: product._id,
          rating: reviewRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
          images: reviewImages,
        });

        if (res.data.success) {
          setShowReviewModal(false);
          fetchProductDetails();
        } else {
          setReviewError(res.data.message || 'Failed to submit review.');
        }
      }
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleToggleHelpful = async (reviewId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const res = await api.post(`/reviews/${reviewId}/helpful`);
      if (res.data.success) {
        setReviews((prev) =>
          prev.map((r) => {
            if (r._id === reviewId) {
              const currentHelpfulUsers = r.helpfulUsers || [];
              const hasVoted = currentHelpfulUsers.includes(user.id);
              const updatedUsers = hasVoted
                ? currentHelpfulUsers.filter((id) => id !== user.id)
                : [...currentHelpfulUsers, user.id];

              return {
                ...r,
                helpfulVotes: res.data.helpfulVotes,
                helpfulUsers: updatedUsers,
              };
            }
            return r;
          })
        );
      }
    } catch (err) {
      console.error('Helpful vote error:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="h-96 bg-slate-900 rounded-3xl animate-pulse border border-slate-800" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h3 className="font-bold text-lg text-white">Subscription Not Found</h3>
        <p className="text-xs text-slate-400">The requested subscription service does not exist or was removed.</p>
        <Link to="/products" className="px-6 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl inline-block">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const currentPrice =
    product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price;

  const ratingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return 'Excellent';
      case 4:
        return 'Very Good';
      case 3:
        return 'Good';
      case 2:
        return 'Fair';
      case 1:
        return 'Poor';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back button */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Left: Image Banner & Badges */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video group">
            <img
              src={product.image || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800'}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          </div>

          <div className="flex flex-wrap gap-2.5">
            <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-sky-400 font-bold text-xs rounded-xl flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Duration: {product.duration}
            </span>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> {product.deliveryTimeText}
            </span>
            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold text-xs rounded-xl flex items-center gap-1.5">
              <Key className="w-4 h-4" /> Access: {product.accessType}
            </span>
          </div>
        </div>

        {/* Right: Purchase Specs */}
        <div className="space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex text-amber-400 items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(stats.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600 fill-slate-800'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-extrabold text-white">{stats.averageRating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({stats.totalReviews} verified reviews)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{product.title}</h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">{product.description}</p>

            {/* Pricing */}
            <div className="mt-6 p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-white">৳{currentPrice}</span>
              {product.discountPrice && product.discountPrice < product.price && (
                <span className="text-sm text-slate-500 line-through">৳{product.price}</span>
              )}
              <span className="ml-auto text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                In Stock ({product.stockQuantity} Left)
              </span>
            </div>

            {/* Features Checklist */}
            {product.features && product.features.length > 0 && (
              <div className="mt-6 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Features Included:</h4>
                <ul className="space-y-2">
                  {product.features.map((feat, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                      <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-6 border-t border-slate-800">
            <div className="flex gap-3">
              <button
                onClick={() => onAddToCart(product)}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition border border-slate-700 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-sky-400" /> Add to Cart
              </button>
              <button
                onClick={handleInstantBuy}
                className="flex-1 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2"
              >
                Buy Now (৳{currentPrice})
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Replacement Warranty & Instant Verification Included
            </p>
          </div>
        </div>
      </div>

      {/* REVIEWS MODULE - VERIFIED PURCHASER REVIEW SYSTEM */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
        {/* Header & Rating Breakdown */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Customer Ratings & Reviews
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              All reviews are submitted exclusively by customers with a verified, completed order.
            </p>
          </div>

          {/* Review Permission & Action Button */}
          <div>
            {!user ? (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-2.5 text-xs text-slate-400">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Log in with a customer account to check review eligibility</span>
                <Link to="/login" className="px-3 py-1.5 bg-sky-600 text-white font-bold rounded-xl text-[11px]">
                  Login
                </Link>
              </div>
            ) : eligibility?.canReview ? (
              eligibility.hasReviewed ? (
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Review Submitted
                  </span>
                  <button
                    onClick={handleOpenReviewModal}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition"
                  >
                    <Edit3 className="w-4 h-4 text-sky-400" /> Edit Your Review
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleOpenReviewModal}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4" /> Write a Verified Review
                </button>
              )
            ) : (
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-2.5 text-xs text-slate-400 max-w-md">
                <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0" />
                <span>
                  <strong>Verified Buyers Only:</strong> Reviews are locked to customers with a completed purchase order for this product.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-950 border border-slate-800/80 rounded-2xl">
          {/* Rating Summary */}
          <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-800">
            <span className="text-5xl font-black text-white">{stats.averageRating.toFixed(1)}</span>
            <div className="flex text-amber-400 my-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(stats.averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-700 fill-slate-900'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-400">Based on {stats.totalReviews} verified purchases</span>
          </div>

          {/* Rating Distribution Bars */}
          <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.ratingCounts[stars] || 0;
              const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 text-slate-400 font-bold flex items-center gap-1">
                    {stars} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-slate-500 text-[11px]">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-300">
            Showing {reviews.length} Verified Customer Reviews
          </span>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Sort By:</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="newest">Most Recent</option>
              <option value="rating_high">Highest Rated</option>
              <option value="rating_low">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="p-12 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-xs font-bold text-slate-300">No Verified Reviews Yet</h4>
            <p className="text-xs text-slate-500">Be the first verified customer to share your subscription experience!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const reviewUserObj = typeof rev.user === 'object' ? rev.user : null;
              const hasVotedHelpful = user && rev.helpfulUsers?.includes(user.id);

              return (
                <div
                  key={rev._id}
                  className="p-5 bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-2xl space-y-3 transition shadow-lg"
                >
                  {/* User Header & Badges */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-600/20 border border-sky-500/30 text-sky-400 font-extrabold text-sm flex items-center justify-center">
                        {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{rev.userName}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] rounded-md flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Verified Purchase
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {new Date(rev.createdAt).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-800 fill-slate-900'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="space-y-1.5">
                    {rev.title && <h4 className="font-bold text-sm text-white">{rev.title}</h4>}
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{rev.comment}</p>
                  </div>

                  {/* Review Attachments / Images */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {rev.images.map((img, iIdx) => (
                        <a
                          key={iIdx}
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="w-16 h-16 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 hover:border-sky-500 transition"
                        >
                          <img src={img} alt={`Review photo ${iIdx + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Helpful Voting Bar */}
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Was this review helpful to you?</span>
                    <button
                      onClick={() => handleToggleHelpful(rev._id)}
                      className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition ${
                        hasVotedHelpful
                          ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{rev.helpfulVotes || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WRITE / EDIT REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  {eligibility?.hasReviewed ? 'Edit Your Verified Review' : 'Write a Verified Review'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified Order #{eligibility?.orderNumber || 'COMPLETED'}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Interactive Star Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Overall Rating *</label>
                <div className="flex items-center gap-2 bg-slate-950 p-3.5 border border-slate-800 rounded-2xl">
                  <div className="flex gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewRating(star)}
                        className="p-1 transition transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating || reviewRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700 fill-slate-900'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="ml-auto font-bold text-xs text-sky-400">
                    {ratingLabel(hoverRating || reviewRating)}
                  </span>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Review Headline / Summary *</label>
                <input
                  type="text"
                  placeholder="e.g., Fast credentials delivery & working Netflix Premium!"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Detailed Experience Description *</label>
                <textarea
                  rows={4}
                  placeholder="Describe account stability, customer service speed, or warranty responsiveness..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* Optional Images */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Optional Photo Screenshots (URLs)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {reviewImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {reviewImages.map((img, idx) => (
                      <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-700">
                        <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute inset-0 bg-slate-950/80 text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
                >
                  {submittingReview
                    ? 'Submitting...'
                    : eligibility?.hasReviewed
                    ? 'Update Review'
                    : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
