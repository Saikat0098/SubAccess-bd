import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Zap, Shield, Check, Star } from 'lucide-react';
import { IProduct } from '../types';

 

interface ProductCardProps {
  product: IProduct;

  onAddToCart: (product: IProduct) =>   void;
  
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const discountPercent =
    product.discountPrice && product.discountPrice < product.price
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

  const currentPrice = product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price;

  

  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-sky-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10 flex flex-col h-full relative">
      {/* Popular Badge */}
      {product.isPopular && (
        <span className="absolute top-3 left-3 z-10 bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow flex items-center gap-1">
          <Star className="w-3 h-3 fill-slate-950" /> Popular
        </span>
      )}

      {/* Discount Badge */}
      {discountPercent > 0 && (
        <span className="absolute top-3 right-3 z-10 bg-rose-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
          {discountPercent}% OFF
        </span>
      )}

      {/* Image Banner */}
      <Link to={`/products/${product.slug}`} className="block relative h-44 overflow-hidden bg-slate-950">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Duration & Delivery Tag */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-semibold text-[11px] border border-slate-700">
              {product.duration}
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
              <Zap className="w-3 h-3" /> {product.deliveryTimeText}
            </span>
          </div>

          <Link to={`/products/${product.slug}`} className="block">
            <h3 className="font-bold text-white text-base leading-snug group-hover:text-sky-400 transition line-clamp-2">
              {product.title}
            </h3>
          </Link>

          {/* Key Features bullet snippet */}
          {product.features && product.features.length > 0 && (
            <ul className="mt-3 space-y-1">
              {product.features.slice(0, 2).map((feat, idx) => (
                <li key={idx} className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{feat}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pricing and Action */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Price</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-white">৳{currentPrice}</span>
              {product.discountPrice && product.discountPrice < product.price && (
                <span className="text-xs text-slate-500 line-through">৳{product.price}</span>
              )}
            </div>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/20 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};
