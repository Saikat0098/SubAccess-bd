import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { NotificationToast } from '../components/NotificationToast';
import { ICartItem, ISettings } from '../types';
import api from '../lib/api';

export const MainLayout: React.FC = () => {
  const [cart, setCart] = useState<ICartItem[]>(() => {
    const saved = localStorage.getItem('subaccess_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [settings, setSettings] = useState<ISettings | undefined>();

  useEffect(() => {
    localStorage.setItem('subaccess_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.warn('Could not load site settings');
    }
  };

  const handleAddToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product._id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      <Header
        cart={cart}
        onOpenCart={() => setCartOpen(true)}
        noticeBannerText={settings?.noticeActive ? settings?.noticeBannerText : undefined}
      />

      <main className="flex-1">
        <Outlet context={{ onAddToCart: handleAddToCart, cart, setCart, settings }} />
      </main>

      <Footer />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      <NotificationToast />
    </div>
  );
};
