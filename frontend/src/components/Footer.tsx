import React from 'react';
import { ShieldCheck, Zap, Headphones, RefreshCw, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Instant Delivery</h4>
              <p className="text-xs text-slate-400">Automated / 1-15 Mins</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">100% Guaranteed</h4>
              <p className="text-xs text-slate-400">Full Replacement Warranty</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">24/7 Support</h4>
              <p className="text-xs text-slate-400">Live Ticket & WhatsApp</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Manual Payment</h4>
              <p className="text-xs text-slate-400">bKash, Nagad & Rocket</p>
            </div>
          </div>
        </div>

        {/* Links & Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-extrabold text-base">
                S
              </div>
              <span className="font-extrabold text-lg text-white">SubAccess BD</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Bangladesh's most trusted digital subscription marketplace. Buy Netflix 4K, Canva Pro, ChatGPT Plus, Spotify, and JetBrains licenses securely via bKash, Nagad & Rocket.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Popular Services</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/products?search=netflix" className="hover:text-sky-400 transition">Netflix Ultra HD 4K</a></li>
              <li><a href="/products?search=canva" className="hover:text-sky-400 transition">Canva Pro Lifetime</a></li>
              <li><a href="/products?search=chatgpt" className="hover:text-sky-400 transition">ChatGPT Plus Subscription</a></li>
              <li><a href="/products?search=spotify" className="hover:text-sky-400 transition">Spotify Premium Upgrade</a></li>
              <li><a href="/products?search=jetbrains" className="hover:text-sky-400 transition">JetBrains All Products Pack</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Payment Methods</h4>
            <p className="text-xs text-slate-400 mb-3">We accept all major mobile banking wallets in Bangladesh:</p>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-pink-900/40 border border-pink-500/30 text-pink-300 font-bold text-xs rounded">bKash</span>
              <span className="px-2.5 py-1 bg-orange-900/40 border border-orange-500/30 text-orange-300 font-bold text-xs rounded">Nagad</span>
              <span className="px-2.5 py-1 bg-purple-900/40 border border-purple-500/30 text-purple-300 font-bold text-xs rounded">Rocket</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Customer Support</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-sky-400" /> support@subaccessbd.com</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-400" /> +880 1712-345678</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-400" /> Gulshan, Dhaka 1212, Bangladesh</li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-900 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} SubAccess BD. Production SaaS Subscription Marketplace.</p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
