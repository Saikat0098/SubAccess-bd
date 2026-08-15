import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { ICartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: ICartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const navigate = useNavigate();

  const totalBDT = cart.reduce((sum, item) => {
    const price = item.product.discountPrice && item.product.discountPrice < item.product.price
      ? item.product.discountPrice
      : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-white flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bold text-base text-white">Your Cart ({cart.length})</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-4">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold text-white text-base">Your cart is empty</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Browse our marketplace to get Netflix, Canva Pro, ChatGPT Plus & more.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const price = item.product.discountPrice && item.product.discountPrice < item.product.price
                      ? item.product.discountPrice
                      : item.product.price;

                    return (
                      <div
                        key={item.product._id}
                        className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3"
                      >
                        <img
                          src={item.product.image || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=200'}
                          alt={item.product.title}
                          className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-800"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-white truncate">{item.product.title}</h4>
                          <span className="text-[10px] text-sky-400 font-medium">{item.product.duration}</span>
                          <div className="text-xs font-bold text-emerald-400 mt-1">৳{price} x {item.quantity}</div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
                            <button
                              onClick={() => onUpdateQuantity(item.product._id, item.quantity - 1)}
                              className="px-2 py-0.5 text-xs text-slate-300 hover:text-white font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.product._id, item.quantity + 1)}
                              className="px-2 py-0.5 text-xs text-slate-300 hover:text-white font-bold"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => onRemoveItem(item.product._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-slate-800 bg-slate-950 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-medium">Subtotal</span>
                    <span className="text-xl font-extrabold text-white">৳{totalBDT}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Instant delivery via bKash, Nagad & Rocket payment verification.</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
