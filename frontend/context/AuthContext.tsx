'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiGetMe, apiGetNotifications, apiLogin, apiLogout, apiRegister } from '@/lib/api';
import { User } from '@/lib/types';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  unreadCount: number;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('fmc_auth_token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiGetMe();
      setUser(data.user);
      setToken(savedToken);
      refreshNotifications();
    } catch {
      localStorage.removeItem('fmc_auth_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNotifications = async () => {
    try {
      const notifs = await apiGetNotifications();
      setUnreadCount(notifs.unread_count || 0);
    } catch {
      // Ignore if unauthenticated
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiLogin(email, password);
    localStorage.setItem('fmc_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    refreshNotifications();
    return res.user;
  };

  const register = async (userData: any): Promise<User> => {
    const res = await apiRegister(userData);
    localStorage.setItem('fmc_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    refreshNotifications();
    return res.user;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // Proceed with local logout regardless
    }
    localStorage.removeItem('fmc_auth_token');
    setUser(null);
    setToken(null);
    setUnreadCount(0);
    toast.info('Signed out successfully.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        unreadCount,
        login,
        register,
        logout,
        refreshUser,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
