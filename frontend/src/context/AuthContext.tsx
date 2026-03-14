'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, User, setTokens, clearTokens, getAccessToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await auth.me();
      setUser(userData);
    } catch {
      setUser(null);
    }
  }, []);

  // On mount, check if user is already logged in
  useEffect(() => {
    const init = async () => {
      const token = getAccessToken();
      if (token) {
        await refreshUser();
      }
      setLoading(false);
    };
    init();
  }, [refreshUser]);

  const login = async (username: string, password: string) => {
    const data = await auth.login({ username, password });
    setTokens(data.access, data.refresh);
    setUser(data.user);
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
  }) => {
    const response = await auth.register(data);
    setTokens(response.tokens.access, response.tokens.refresh);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch {
      // Even if server-side logout fails, clear local state
    }
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
