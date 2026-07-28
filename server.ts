import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module এ __dirname তৈরি করা
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env ফাইল লোড করা - সঠিক পাথে
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';

import { connectDB } from './server/config/db.js';
import { initSocket } from './server/socket.js';
import { errorHandler } from './server/middleware/errorHandler.js';

import authRoutes from './server/routes/authRoutes.js';
import productRoutes from './server/routes/productRoutes.js';
import categoryRoutes from './server/routes/categoryRoutes.js';
import orderRoutes from './server/routes/orderRoutes.js';
import paymentRoutes from './server/routes/paymentRoutes.js';
import couponRoutes from './server/routes/couponRoutes.js';
import reviewRoutes from './server/routes/reviewRoutes.js';
import ticketRoutes from './server/routes/ticketRoutes.js';
import notificationRoutes from './server/routes/notificationRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';

// Seed models
import { User } from './server/models/User.js';
import { Category } from './server/models/Category.js';
import { Product } from './server/models/Product.js';
import { Settings } from './server/models/Settings.js';
import { Coupon } from './server/models/Coupon.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const server = http.createServer(app);
  
  // Debug: Check if .env is loading
  console.log("✅ MONGODB_URI:", process.env.MONGODB_URI ? 'Loaded ✅' : 'Not Loaded ❌');
  console.log("✅ EMAIL_HOST:", process.env.EMAIL_HOST || 'Not Set');
  console.log("✅ NODE_ENV:", process.env.NODE_ENV || 'development');

  // Initialize Socket.IO
  initSocket(server);

  // Security and Middlewares
  app.use(helmet({ 
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate Limiter
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, message: 'Too many requests, please try again later.' },
    validate: { xForwardedForHeader: false, default: false },
  });
  app.use('/api', apiLimiter);

  // Connect Database
  const dbConnected = await connectDB();

  // Seed default data if database is ready
  if (dbConnected) {
    try {
      await seedDatabase();
    } catch (err) {
      console.error('❌ Seed error:', err);
    }
  }

  // Register API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'SubAccess BD API',
      timestamp: new Date(),
      env: process.env.NODE_ENV,
    });
  });

  // Global Express Error Handler
  app.use(errorHandler);

  // Vite Middleware for Dev vs Static for Prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SubAccess BD Production Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // Settings seed
  const settingsCount = await Settings.countDocuments();
  if (settingsCount === 0) {
    await Settings.create({
      siteName: 'SubAccess BD',
      tagline: 'Professional Digital Subscription Marketplace in Bangladesh',
      bkashNumber: process.env.BKASH_NUMBER || '01712345678',
      nagadNumber: process.env.NAGAD_NUMBER || '01812345678',
      rocketNumber: process.env.ROCKET_NUMBER || '01912345678',
      helplineEmail: process.env.HELPLINE_EMAIL || 'support@subaccessbd.com',
      helplinePhone: process.env.HELPLINE_PHONE || '+8801712345678',
      noticeBannerText: '🎉 Flash Sale: Get 10% OFF on all Netflix & Canva Pro Subscriptions! Use Code: SUBBD10',
    });
    console.log('✅ Settings seeded');
  }

  // Admin User seed
  const adminEmail = (process.env.ADMIN_INITIAL_EMAIL || 'admin@subaccessbd.com').toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: 'SubAccess Admin',
      email: adminEmail,
      password: process.env.ADMIN_INITIAL_PASSWORD || 'AdminPassword123!',
      role: 'admin',
      isEmailVerified: true,
      phone: '01712345678',
    });
    console.log(`👤 Seeded Default Super Admin: ${adminEmail}`);
  }

  // Categories seed
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    const catEntertainment = await Category.create({
      name: 'Entertainment & Streaming',
      slug: 'entertainment',
      description: 'Netflix, Prime Video, Spotify Premium, YouTube Premium',
      icon: 'Tv',
      isFeatured: true,
    });

    const catDesign = await Category.create({
      name: 'Productivity & Design',
      slug: 'productivity-design',
      description: 'Canva Pro, Figma Pro, Adobe Creative Cloud, MS 365',
      icon: 'Palette',
      isFeatured: true,
    });

    const catAI = await Category.create({
      name: 'AI & Developer Tools',
      slug: 'ai-developer-tools',
      description: 'ChatGPT Plus, JetBrains All Products, Claude Pro',
      icon: 'Cpu',
      isFeatured: true,
    });

    const catEdu = await Category.create({
      name: 'Education & Learning',
      slug: 'education-learning',
      description: 'Coursera Plus, LinkedIn Learning, Skillshare',
      icon: 'GraduationCap',
      isFeatured: true,
    });

    // Seed Products
    await Product.create([
      {
        title: 'Netflix Ultra HD 4K (Shared Profile)',
        slug: 'netflix-4k-shared',
        category: catEntertainment._id,
        price: 280,
        discountPrice: 250,
        duration: '1 Month Shared',
        accessType: 'credentials',
        description: 'Enjoy Netflix Ultra HD 4K streaming on 1 device with private PIN locked profile. Smooth playback with 100% replacement warranty.',
        features: ['4K Ultra HD Streaming', '1 Device Private Profile', 'PIN Code Lock Protection', '30 Days Full Replacement Guarantee', 'Bangla Subtitles Support'],
        stockQuantity: 50,
        image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80',
        isPopular: true,
        deliveryTimeText: 'Instant Delivery (1-10 Mins)',
      },
      {
        title: 'Canva Pro Lifetime (Email Invite)',
        slug: 'canva-pro-lifetime-invite',
        category: catDesign._id,
        price: 199,
        discountPrice: 150,
        duration: 'Lifetime Brand Edu Access',
        accessType: 'invite_link',
        description: 'Upgrade your personal Canva account to Canva Pro! Access 100M+ premium assets, photos, videos, font brand kits, and AI background remover.',
        features: ['Upgrade Existing Account', '100M+ Premium Stock Photos & Videos', 'One-Click AI Background Remover', 'Unlimited Brand Kits & Fonts', '100% Safe & Instant Upgrade'],
        stockQuantity: 100,
        image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80',
        isPopular: true,
        deliveryTimeText: 'Instant Email Invite (2 Mins)',
      },
      {
        title: 'ChatGPT Plus (Shared Subscription)',
        slug: 'chatgpt-plus-shared',
        category: catAI._id,
        price: 450,
        discountPrice: 390,
        duration: '1 Month Access',
        accessType: 'credentials',
        description: 'Get access to GPT-4o, DALL-E 3 image generation, Web Browsing, Voice Mode, and custom GPTs.',
        features: ['Access to GPT-4o & GPT-4o mini', 'DALL-E 3 AI Image Generation', 'Custom GPTs & Data Analysis', 'Fast Response Times', '30 Days Replacement Guarantee'],
        stockQuantity: 30,
        image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80',
        isPopular: true,
        deliveryTimeText: '10-30 Mins Delivery',
      },
      {
        title: 'JetBrains All Products Pack Key',
        slug: 'jetbrains-all-products-pack',
        category: catAI._id,
        price: 990,
        discountPrice: 850,
        duration: '1 Year License Key',
        accessType: 'license_key',
        description: 'Official 1-Year Educational License Key for IntelliJ IDEA, PyCharm, WebStorm, CLion, DataGrip, Rider, and PHPStorm.',
        features: ['Includes IntelliJ, PyCharm, WebStorm & 10+ IDEs', 'Official Personal License Key', 'Supports Windows, Mac & Linux', 'Full Plugins & Updates Access'],
        stockQuantity: 25,
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
        isPopular: false,
        deliveryTimeText: 'Instant Activation Key',
      },
      {
        title: 'Spotify Premium (Personal Upgrade)',
        slug: 'spotify-premium-upgrade',
        category: catEntertainment._id,
        price: 180,
        discountPrice: 140,
        duration: '1 Month Upgrade',
        accessType: 'invite_link',
        description: 'Listen to ad-free music, offline music downloads, high-fidelity audio quality on your own existing Spotify account.',
        features: ['Upgrade Your Own Account', 'Zero Ad Interruptions', 'Offline Music Downloads', 'Highest Audio Quality (320kbps)'],
        stockQuantity: 80,
        image: 'https://images.unsplash.com/photo-1611339555312-e607c8352fa7?w=600&auto=format&fit=crop&q=80',
        isPopular: true,
        deliveryTimeText: 'Instant Invite Link',
      },
      {
        title: 'Coursera Plus Subscription',
        slug: 'coursera-plus-monthly',
        category: catEdu._id,
        price: 650,
        discountPrice: 550,
        duration: '1 Month Full Access',
        accessType: 'credentials',
        description: 'Unlimited access to 7,000+ courses, hands-on projects, and job-ready certificate programs from Google, IBM, Meta & Top Universities.',
        features: ['7,000+ Verified Courses', 'Earn Shareable Certificates', 'Google & Meta Professional Certificates', 'Full Access to Hands-on Labs'],
        stockQuantity: 40,
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
        isPopular: false,
        deliveryTimeText: '15 Mins Delivery',
      },
    ]);
    console.log('✅ Categories & Products seeded');
  }

  // Coupon Seed
  const couponCount = await Coupon.countDocuments();
  if (couponCount === 0) {
    await Coupon.create({
      code: 'SUBBD10',
      discountPercentage: 10,
      maxDiscountBDT: 500,
      minSpendBDT: 200,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
    });
    console.log('✅ Coupon seeded');
  }

  console.log('🌱 Database seeding completed!');
}

startServer();