import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { IUser } from '../types';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; message?: string; requiresVerification?: boolean; email?: string }>;
  verifyOTP: (email: string, otpCode: string) => Promise<{ success: boolean; message?: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; message?: string }>;
  googleLogin: (name: string, email: string, googleId: string, avatar?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (name: string, phone?: string, avatar?: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    const token = localStorage.getItem('subaccess_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      localStorage.removeItem('subaccess_token');
      localStorage.removeItem('subaccess_refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('subaccess_token', res.data.tokens.accessToken);
        localStorage.setItem('subaccess_refresh_token', res.data.tokens.refreshToken);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, phone });
      if (res.data.success) {
        if (!res.data.requiresVerification && res.data.tokens) {
          localStorage.setItem('subaccess_token', res.data.tokens.accessToken);
          localStorage.setItem('subaccess_refresh_token', res.data.tokens.refreshToken);
          setUser(res.data.user);
        }
        return {
          success: true,
          requiresVerification: Boolean(res.data.requiresVerification),
          message: res.data.message,
          email: res.data.email || email,
        };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const verifyOTP = async (email: string, otpCode: string) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otpCode });
      if (res.data.success) {
        localStorage.setItem('subaccess_token', res.data.tokens.accessToken);
        localStorage.setItem('subaccess_refresh_token', res.data.tokens.refreshToken);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'OTP verification failed' };
    }
  };

  const resendOTP = async (email: string) => {
    try {
      const res = await api.post('/auth/resend-otp', { email });
      if (res.data.success) {
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Resend OTP failed' };
    }
  };

  const googleLogin = async (name: string, email: string, googleId: string, avatar?: string) => {
    try {
      const res = await api.post('/auth/google', { name, email, googleId, avatar });
      if (res.data.success) {
        localStorage.setItem('subaccess_token', res.data.tokens.accessToken);
        localStorage.setItem('subaccess_refresh_token', res.data.tokens.refreshToken);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Google Auth failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('subaccess_token');
    localStorage.removeItem('subaccess_refresh_token');
    setUser(null);
  };

  const updateProfile = async (name: string, phone?: string, avatar?: string) => {
    try {
      const res = await api.put('/auth/profile', { name, phone, avatar });
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Profile update failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyOTP,
        resendOTP,
        googleLogin,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
