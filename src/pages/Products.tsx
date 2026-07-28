import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { Search, Filter, Sparkles, X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { IProduct, ICategory } from '../types';
import api from '../lib/api';

export const Products: React.FC = () => {
  const { onAddToCart } = useOutletContext<{ onAddToCart: (product: IProduct) => void }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedCategory = searchParams.get('category') || '';
  const searchFilter = searchParams.get('search') || '';

  useEffect(() => {
    fetchProductsAndCategories();
  }, [selectedCategory, searchFilter]);

  const fetchProductsAndCategories = async () => {
    try {
      setLoading(true);
      let url = '/products?';
      if (selectedCategory) url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (searchFilter) url += `search=${encodeURIComponent(searchFilter)}&`;

      const [prodRes, catRes] = await Promise.all([
        api.get(url),
        api.get('/categories'),
      ]);

      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      console.error('Error loading products marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Marketplace Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse active Netflix, Canva Pro, ChatGPT, Spotify & developer software subscriptions
          </p>
        </div>

        {/* Active Filters */}
        {(selectedCategory || searchFilter) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Filtering by:</span>
            {selectedCategory && (
              <span className="px-3 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold rounded-lg flex items-center gap-1">
                Cat: {selectedCategory}
                <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => handleCategorySelect('')} />
              </span>
            )}
            {searchFilter && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold rounded-lg flex items-center gap-1">
                Query: "{searchFilter}"
                <X className="w-3.5 h-3.5 cursor-pointer" onClick={clearFilters} />
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-rose-400 hover:underline font-semibold ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => handleCategorySelect('')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
            !selectedCategory
              ? 'bg-sky-600 text-white border-sky-500 shadow-lg shadow-sky-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => handleCategorySelect(cat.slug)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              selectedCategory === cat.slug
                ? 'bg-sky-600 text-white border-sky-500 shadow-lg shadow-sky-600/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Subscriptions Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search filters or browse all categories to find available accounts and keys.
          </p>
          <button
            onClick={clearFilters}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
};
