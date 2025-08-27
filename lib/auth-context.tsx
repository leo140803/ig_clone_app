// lib/auth-context.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { saveToken, getToken, deleteToken } from './storage';
import type { AuthResponse, User } from '../types/api';

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  signup: (p: { username: string; email: string; password: string; name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      if (t) {
        setToken(t);
        try {
          const me = await api<User>('/users/me', { token: t });
          setUser(me);
        } catch {
          await deleteToken();
          setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (login: string, password: string) => {
    const res = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { login, password },
    });
    await saveToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const signup = async (p: { username: string; email: string; password: string; name?: string }) => {
    const res = await api<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: { user: p }, // penting: backend kamu expect nested { user: {...} }
    });
    await saveToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    await deleteToken();
    setUser(null);
    setToken(null);
  };

  const refreshMe = async () => {
    if (!token) return;
    const me = await api<User>('/users/me', { token });
    setUser(me);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, signup, logout, refreshMe }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
