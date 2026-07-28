import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, Star, Sparkles, Check, ArrowRight, HelpCircle, Tv, Palette, Cpu, GraduationCap, Headphones } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { IProduct, ICategory, IReview } from '../types';
import api from '../lib/api';

export const Home: React.FC = () => {
  const { onAddToCart } = useOutletContext<{ onAddToCart: (product: IProduct) => void }>();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, revRes] = await Promise.all([
        api.get('/products?popular=true'),
        api.get('/categories'),
        api.get('/reviews'),
      ]);

      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (catRes.data.success) setCategories(catRes.data.categories);
      if (revRes.data.success) setReviews(revRes.data.reviews);
    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const categoryIconMap: { [key: string]: any } = {
    Tv: Tv,
    Palette: Palette,
    Cpu: Cpu,
    GraduationCap: GraduationCap,
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold mb-6"
          >
            <Sparkles className="w-4 h-4" /> #1 Digital Subscription Marketplace in Bangladesh
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto"
          >
            Get Premium Digital Subscriptions with{' '}
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Instant bKash, Nagad & Rocket
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Access Netflix Ultra HD 4K, Canva Pro, ChatGPT Plus, Spotify Premium & JetBrains licenses with 100% replacement warranty and fast delivery.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/products"
              className="px-8 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-2xl shadow-xl shadow-sky-600/30 text-sm transition flex items-center gap-2"
            >
              Explore All Subscriptions <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/track-order"
              className="px-8 py-3.5 bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-white font-extrabold rounded-2xl text-sm transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Track My Order
            </Link>
          </motion.div>

          {/* Payment Partner Logos */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 pt-8 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Accepted Payment Wallets:</span>
            <span className="px-3 py-1 bg-pink-950/60 border border-pink-500/40 text-pink-300 font-extrabold text-xs rounded-lg shadow">
              bKash
            </span>
            <span className="px-3 py-1 bg-orange-950/60 border border-orange-500/40 text-orange-300 font-extrabold text-xs rounded-lg shadow">
              Nagad
            </span>
            <span className="px-3 py-1 bg-purple-950/60 border border-purple-500/40 text-purple-300 font-extrabold text-xs rounded-lg shadow">
              Rocket
            </span>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Categories</h2>
            <p className="text-xs text-slate-400 mt-1">Browse subscriptions by category type</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const IconComponent = categoryIconMap[cat.icon || 'Tv'] || Tv;
            return (
              <Link
                key={cat._id}
                to={`/products?category=${cat.slug}`}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-sky-500/50 hover:bg-slate-800/80 transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-white group-hover:text-sky-400 transition">{cat.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{cat.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured & Popular Subscriptions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Trending Subscriptions</h2>
            <p className="text-xs text-slate-400 mt-1">Most ordered premium tools & streaming services in Bangladesh</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1">
            Browse All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-slate-900/50 border border-slate-800/80 rounded-3xl">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl font-extrabold text-white">How SubAccess BD Works</h2>
          <p className="text-xs text-slate-400 mt-2">Get your active subscription credentials in 3 easy steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 font-extrabold text-xl flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
              1
            </div>
            <h3 className="font-bold text-base text-white">Select Subscription</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Choose Netflix 4K, Canva Pro, ChatGPT Plus, or Spotify and add it to your cart.
            </p>
          </div>

          <div className="p-6">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 text-pink-400 font-extrabold text-xl flex items-center justify-center mx-auto mb-4 border border-pink-500/20">
              2
            </div>
            <h3 className="font-bold text-base text-white">Pay via Mobile Banking</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Send Money via bKash, Nagad or Rocket and submit your Transaction ID (TrxID).
            </p>
          </div>

          <div className="p-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 font-extrabold text-xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              3
            </div>
            <h3 className="font-bold text-base text-white">Get Instant Access</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Log into your User Dashboard to view your delivered credentials, PIN code, or invite link.
            </p>
          </div>
        </div>
      </section>

      {/* Verified Reviews Section */}
      {reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-white">Customer Feedback</h2>
            <p className="text-xs text-slate-400 mt-1">Real reviews from Bangladeshi professionals and students</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.slice(0, 3).map((rev) => (
              <div key={rev._id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">"{rev.comment}"</p>
                <div className="text-xs font-bold text-sky-400 pt-2 border-t border-slate-800">{rev.userName}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs Section */}
      <section id="faqs" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-sky-400" /> Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-400 mt-1">Everything you need to know about SubAccess BD</p>
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <h3 className="font-bold text-sm text-white">How quickly will I receive my subscription credentials?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Most orders are processed within 1 to 15 minutes after payment verification. You will see your credentials directly in your User Dashboard under "Delivered Credentials".
            </p>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <h3 className="font-bold text-sm text-white">What happens if my subscription account stops working?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              All subscriptions come with a 100% full replacement guarantee. You can open a Support Ticket in your User Dashboard, and our support team will instantly issue a replacement account or key.
            </p>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <h3 className="font-bold text-sm text-white">Can I track my order without logging in?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Yes! Use our public <Link to="/track-order" className="text-sky-400 underline">Order Tracking</Link> tool by entering your Order Number or Mobile Number.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
