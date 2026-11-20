'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/services/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'waiter' | 'kitchen';
  phone?: string;
  permissions?: {
    manageMenu?: boolean;
    manageTables?: boolean;
    manageOrders?: boolean;
    viewReports?: boolean;
    manageStaff?: boolean;
    managePayments?: boolean;
  };
  restaurant: any;
}

interface AuthContextType {
  user: User | null;
  restaurant: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      setRestaurant(data.restaurant);
    } catch {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setUser(null);
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('admin_token', data.token);
    setUser(data.user);
    setRestaurant(data.restaurant);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    setRestaurant(null);
    window.location.href = '/admin/login';
  };

  return (
    <AuthContext.Provider value={{ user, restaurant, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
