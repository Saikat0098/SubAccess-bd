import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import http from 'http';
import path from 'path';
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
import uploadRoutes from './server/routes/uploadRoutes.js';

// Seed models
import { User } from './server/models/User.js';
import { Category } from './server/models/Category.js';
import { Product } from './server/models/Product.js';
import { Settings } from './server/models/Settings.js';
import { Coupon } from './server/models/Coupon.js';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const server = http.createServer(app);

  // Initialize Socket.IO
  initSocket(server);

  // Security and Middlewares
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
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
      console.error('Seed error:', err);
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
  app.use('/api/upload', uploadRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'SubAccess BD API',
      timestamp: new Date(),
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
  });
}

async function seedDatabase() {
  // Settings seed
  const settingsCount = await Settings.countDocuments();
  if (settingsCount === 0) {
    await Settings.create({
      siteName: 'SubAccess BD',
      tagline: 'Professional Digital Subscription Marketplace in Bangladesh',
      bkashNumber: '01712345678',
      nagadNumber: '01812345678',
      rocketNumber: '01912345678',
      helplineEmail: 'support@subaccessbd.com',
      helplinePhone: '+8801712345678',
      noticeBannerText: '🎉 Flash Sale: Get 10% OFF on all Netflix & Canva Pro Subscriptions! Use Code: SUBBD10',
    });
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
  }
}

startServer();







 