import React, { useState } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { ShoppingBag, Tag, ShieldCheck, Check, ArrowRight, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PaymentModal } from '../components/PaymentModal';
import { ICartItem, ISettings } from '../types';
import api from '../lib/api';

export const Checkout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cart, setCart, settings } = useOutletContext<{
    cart: ICartItem[];
    setCart: (cart: ICartItem[]) => void;
    settings?: ISettings;
  }>();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  const [selectedMethod, setSelectedMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  const subtotalBDT = cart.reduce((sum, item) => {
    const price = item.product.discountPrice && item.product.discountPrice < item.product.price
      ? item.product.discountPrice
      : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const discountBDT = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotalBDT = Math.max(0, subtotalBDT - discountBDT);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      setCouponError('');
      const res = await api.post('/coupons/apply', {
        code: couponInput.trim(),
        cartTotal: subtotalBDT,
      });

      if (res.data.success) {
        setAppliedCoupon({
          code: res.data.couponCode,
          discountAmount: res.data.discountAmount,
        });
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
    }
  };

  const handleOpenPaymentModal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      alert('Please fill in your name, email and mobile number.');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setPaymentModalOpen(true);
  };

  const handleFinalSubmitPayment = async (paymentData: { transactionId: string; senderPhone: string; paymentScreenshot?: string }) => {
    try {
      setSubmitting(true);

      const items = cart.map((item) => {
        const price = item.product.discountPrice && item.product.discountPrice < item.product.price
          ? item.product.discountPrice
          : item.product.price;
        return {
          product: item.product._id,
          title: item.product.title,
          price,
          quantity: item.quantity,
          duration: item.product.duration,
          accessType: item.product.accessType,
        };
      });

      const res = await api.post('/orders', {
        customerName,
        customerEmail,
        customerPhone,
        items,
        totalAmount: finalTotalBDT,
        discountAmount: discountBDT,
        couponCode: appliedCoupon?.code || '',
        paymentMethod: selectedMethod,
        transactionId: paymentData.transactionId,
        senderPhone: paymentData.senderPhone,
        paymentScreenshot: paymentData.paymentScreenshot,
      });

      if (res.data.success) {
        setCart([]);
        setPaymentModalOpen(false);
        setOrderSuccess(res.data.order);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-black text-white">Order Submitted Successfully!</h1>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-left space-y-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Order Number:</span>
            <span className="font-mono font-bold text-sky-400">{orderSuccess.orderNumber}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Total Payable:</span>
            <span className="font-bold text-emerald-400">৳{orderSuccess.totalAmount}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Payment Wallet:</span>
            <span className="font-bold text-white">{orderSuccess.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Transaction ID:</span>
            <span className="font-mono text-white">{orderSuccess.transactionId}</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Our automated verification engine is reviewing your transaction ID. Your credentials will appear in your{' '}
          <Link to="/user/orders" className="text-sky-400 underline font-bold">
            User Dashboard
          </Link>{' '}
          in 1 to 15 minutes.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            to="/user/orders"
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/20"
          >
            Go to My Orders
          </Link>
          <Link
            to="/track-order"
            className="px-6 py-3 bg-slate-900 border border-slate-800 text-white font-bold text-xs rounded-xl"
          >
            Track Order Status
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="font-bold text-lg text-white">Your Cart is Empty</h3>
        <p className="text-xs text-slate-400">Add subscriptions from our marketplace to proceed to checkout.</p>
        <Link to="/products" className="inline-block px-6 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl">
          Browse Subscriptions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-3xl font-black text-white">Checkout & Payment</h1>

      <form onSubmit={handleOpenPaymentModal} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Contact Info & Wallet Selector */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h3 className="font-bold text-base text-white">1. Customer Contact Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address (For Delivery) *</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Phone Number (Bangladesh) *</label>
                <input
                  type="text"
                  placeholder="e.g. 01712345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h3 className="font-bold text-base text-white">2. Select Payment Wallet</h3>

            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setSelectedMethod('bKash')}
                className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 ${
                  selectedMethod === 'bKash'
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-black text-sm">bKash</span>
                <span className="text-[10px] text-slate-400">Send Money / Cash In</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('Nagad')}
                className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 ${
                  selectedMethod === 'Nagad'
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-black text-sm">Nagad</span>
                <span className="text-[10px] text-slate-400">Send Money / Cash In</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('Rocket')}
                className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 ${
                  selectedMethod === 'Rocket'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-black text-sm">Rocket</span>
                <span className="text-[10px] text-slate-400">Send Money</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h3 className="font-bold text-base text-white">Order Summary</h3>

            {/* Cart Items */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => {
                const price = item.product.discountPrice && item.product.discountPrice < item.product.price
                  ? item.product.discountPrice
                  : item.product.price;
                return (
                  <div key={item.product._id} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white truncate max-w-[180px]">{item.product.title}</p>
                      <p className="text-[10px] text-sky-400">{item.product.duration}</p>
                    </div>
                    <span className="font-bold text-white">৳{price} x {item.quantity}</span>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Input */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Have a Promo Coupon?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SUBBD10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs uppercase px-3 py-2 rounded-xl focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Coupon '{appliedCoupon.code}' applied (-৳{appliedCoupon.discountAmount})
                </p>
              )}
              {couponError && <p className="text-[11px] text-rose-400">{couponError}</p>}
            </div>

            {/* Calculation */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>৳{subtotalBDT}</span>
              </div>
              {discountBDT > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Discount</span>
                  <span>-৳{discountBDT}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                <span>Total Payable</span>
                <span className="text-xl text-emerald-400">৳{finalTotalBDT}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 mt-2"
            >
              Continue to {selectedMethod} Payment
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        selectedMethod={selectedMethod}
        amountBDT={finalTotalBDT}
        settings={settings}
        onSubmitPayment={handleFinalSubmitPayment}
        loading={submitting}
      />
    </div>
  );
};
