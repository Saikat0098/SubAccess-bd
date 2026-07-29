import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { ICategory } from '../../types';
import api from '../../lib/api';
import { ImageUploader } from '../../components/ImageUploader';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Tv');
  const [categoryImage, setCategoryImage] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    try {
      setCreating(true);
      const res = await api.post('/categories', { name, slug, description, icon, image: categoryImage });
      if (res.data.success) {
        setCategories([...categories, res.data.category]);
        setName('');
        setSlug('');
        setDescription('');
        setCategoryImage('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      const res = await api.delete(`/categories/${id}`);
      if (res.data.success) {
        setCategories(categories.filter((c) => c._id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Marketplace Categories</h1>
        <p className="text-xs text-slate-400 mt-1">Organize streaming, design, AI & developer products</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit">
          <h3 className="font-bold text-base text-white">Add Category</h3>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Category Name *</label>
              <input
                type="text"
                placeholder="e.g. AI Tools"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                }}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Slug *</label>
              <input
                type="text"
                placeholder="ai-tools"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Icon Identifier</label>
              <input
                type="text"
                placeholder="Tv, Palette, Cpu, GraduationCap"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5"
              />
            </div>

            <div>
              <ImageUploader
                label="Category Banner / Icon Image"
                value={categoryImage}
                compact
                onChange={(url) => setCategoryImage(typeof url === 'string' ? url : url[0] || '')}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition"
            >
              {creating ? 'Saving...' : 'Create Category'}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="md:col-span-2 space-y-3">
          {loading ? (
            <div className="h-48 bg-slate-900 rounded-2xl animate-pulse" />
          ) : (
            categories.map((cat) => (
              <div
                key={cat._id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                  <span className="text-[10px] text-sky-400 font-mono">slug: {cat.slug}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{cat.description}</p>
                </div>
                <button
                  onClick={() => handleDelete(cat._id)}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
