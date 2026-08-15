import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import { MainLayout } from './layouts/MainLayout';
import { UserDashboardLayout } from './layouts/UserDashboardLayout';
import { AdminDashboardLayout } from './layouts/AdminDashboardLayout';

// Public Pages
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';
import { OrderTracking } from './pages/OrderTracking';

// Auth Pages
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { VerifyOTP } from './pages/Auth/VerifyOTP';
import { ForgotPassword } from './pages/Auth/ForgotPassword';

// User Dashboard Pages
import { UserDashboard } from './pages/user/UserDashboard';
import { MyOrders } from './pages/user/MyOrders';
import { MySubscriptions } from './pages/user/MySubscriptions';
import { MyCredentials } from './pages/user/MyCredentials';
import { UserNotifications } from './pages/user/UserNotifications';
import { UserSupport } from './pages/user/UserSupport';
import { UserSecurity } from './pages/user/UserSecurity';

// Admin Dashboard Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminSupport } from './pages/admin/AdminSupport';
import { AdminSettings } from './pages/admin/AdminSettings';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #1e293b',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#0f172a',
                },
              },
              error: {
                iconTheme: {
                  primary: '#f43f5e',
                  secondary: '#0f172a',
                },
              },
            }}
          />
          <BrowserRouter>
            <Routes>
              {/* Public Storefront Routes */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:idOrSlug" element={<ProductDetail />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="track-order" element={<OrderTracking />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="verify-otp" element={<VerifyOTP />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
              </Route>

              {/* User Customer Dashboard Routes */}
              <Route path="/user" element={<UserDashboardLayout />}>
                <Route index element={<UserDashboard />} />
                <Route path="orders" element={<MyOrders />} />
                <Route path="subscriptions" element={<MySubscriptions />} />
                <Route path="credentials" element={<MyCredentials />} />
                <Route path="notifications" element={<UserNotifications />} />
                <Route path="support" element={<UserSupport />} />
                <Route path="security" element={<UserSecurity />} />
              </Route>

              {/* Admin Dashboard Routes */}
              <Route path="/admin" element={<AdminDashboardLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Fallback Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
