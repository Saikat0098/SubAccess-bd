import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Eye, EyeOff, Copy, Search, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { IProduct, ICategory } from '../../types';
import api from '../../lib/api';
import { ImageUploader } from '../../components/ImageUploader';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number>(500);
  const [discountPrice, setDiscountPrice] = useState<number>(399);
  const [duration, setDuration] = useState('1 Month');
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [deliveryTimeText, setDeliveryTimeText] = useState('Instant 1-15 Mins');
  const [accessType, setAccessType] = useState<'credentials' | 'invite_link' | 'license_key' | 'download_link'>('credentials');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('Ultra HD 4K, 1 Screen Access, Full Warranty');
  const [isPopular, setIsPopular] = useState(false);
  const [image, setImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const fetchProductsAndCategories = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?all=true'),
        api.get('/categories'),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (catRes.data.success) {
        setCategories(catRes.data.categories);
        if (catRes.data.categories.length > 0 && !category) {
          setCategory(catRes.data.categories[0].slug);
        }
      }
    } catch (err) {
      console.error('Fetch admin products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitle('');
    setPrice(500);
    setDiscountPrice(399);
    setDuration('1 Month');
    setStockQuantity(50);
    setDeliveryTimeText('Instant 1-15 Mins');
    setAccessType('credentials');
    setDescription('');
    setFeaturesText('Ultra HD 4K, 1 Screen Access, Full Warranty');
    setIsPopular(false);
    setImage('');
    setShowModal(true);
  };

  const handleOpenEdit = (p: IProduct) => {
    setEditingId(p._id);
    setTitle(p.title);
    setCategory(typeof p.category === 'object' ? p.category.slug : p.category);
    setPrice(p.price);
    setDiscountPrice(p.discountPrice || p.price);
    setDuration(p.duration);
    setStockQuantity(p.stockQuantity);
    setDeliveryTimeText(p.deliveryTimeText || 'Instant 1-15 Mins');
    setAccessType(p.accessType || 'credentials');
    setDescription(p.description || '');
    setFeaturesText(p.features ? p.features.join(', ') : '');
    setIsPopular(p.isPopular || false);
    setImage(p.image || '');
    setShowModal(true);
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await api.patch(`/products/${id}/toggle-active`);
      if (res.data.success) {
        setProducts(products.map((p) => (p._id === id ? res.data.product : p)));
        toast.success(res.data.message || 'Product status updated');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle active status');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.post(`/products/${id}/duplicate`);
      if (res.data.success) {
        setProducts([res.data.product, ...products]);
        toast.success('Product duplicated successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to duplicate product');
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      const payload = {
        title,
        category,
        price: Number(price),
        discountPrice: Number(discountPrice),
        duration,
        stockQuantity: Number(stockQuantity),
        deliveryTimeText,
        accessType,
        description,
        features: featuresText.split(',').map((s) => s.trim()).filter(Boolean),
        isPopular,
        image,
      };

      if (editingId) {
        const res = await api.put(`/products/${editingId}`, payload);
        if (res.data.success) {
          setProducts(products.map((p) => (p._id === editingId ? res.data.product : p)));
          toast.success('Product updated successfully');
        }
      } else {
        const res = await api.post('/products', payload);
        if (res.data.success) {
          setProducts([res.data.product, ...products]);
          toast.success('Product created successfully');
        }
      }

      setShowModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data.success) {
        setProducts(products.filter((p) => p._id !== id));
        toast.success('Product deleted successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.duration.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Subscription Products Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">Manage pricing, duration, stock, access type & images for subscription products</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-sky-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Subscription Product
        </button>
      </div>

      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search products by title or duration..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-sky-500"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
      </div>

      {loading ? (
        <div className="h-64 bg-slate-900 rounded-2xl animate-pulse" />
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
          No products found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div key={p._id} className={`p-5 bg-slate-900 border ${p.isActive ? 'border-slate-800' : 'border-rose-900/40 bg-slate-950/80'} rounded-2xl space-y-4 relative overflow-hidden`}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">{p.title}</h3>
                    {!p.isActive && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">Hidden</span>
                    )}
                  </div>
                  <span className="text-[11px] text-sky-400 font-semibold">{p.duration} • {p.accessType}</span>
                </div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  ৳{p.discountPrice || p.price}
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p>Stock: <strong className={p.stockQuantity > 0 ? 'text-white' : 'text-rose-400'}>{p.stockQuantity}</strong> remaining</p>
                <p>Delivery: <strong className="text-slate-300">{p.deliveryTimeText}</strong></p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(p._id)}
                    title={p.isActive ? 'Hide Product' : 'Activate Product'}
                    className={`p-2 rounded-lg text-xs transition ${p.isActive ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                  >
                    {p.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDuplicate(p._id)}
                    title="Duplicate Product"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p._id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 my-8">
            <h3 className="font-bold text-lg text-white">
              {editingId ? 'Edit Product' : 'Add New Subscription Product'}
            </h3>

            <form onSubmit={handleSubmitProduct} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Product Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Netflix Ultra HD 4K Shared Profile"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Category Slug *</label>
                  <input
                    type="text"
                    placeholder="e.g. entertainment"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Duration *</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Month / 1 Year"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Regular Price (BDT) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Discount Price (BDT)</label>
                  <input
                    type="number"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Access Type</label>
                  <select
                    value={accessType}
                    onChange={(e: any) => setAccessType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
                  >
                    <option value="credentials">Credentials (Email/Pass/PIN)</option>
                    <option value="invite_link">Invite Link / Team Upgrade</option>
                    <option value="license_key">License Key / Activation Code</option>
                    <option value="download_link">Download Link / Software</option>
                  </select>
                </div>
              </div>

              <div>
                <ImageUploader
                  label="Product Primary Image *"
                  helperText="Upload image directly to ImgBB (JPG, PNG, WEBP max 10MB)"
                  value={image}
                  onChange={(url) => setImage(typeof url === 'string' ? url : url[0] || '')}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Features (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Ultra HD 4K, 1 Screen, Warranty"
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-sky-600 focus:ring-0"
                />
                <label htmlFor="isPopular" className="text-xs text-slate-300">Mark as Popular / Featured product</label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl"
                >
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
