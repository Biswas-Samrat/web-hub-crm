import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Initialize from localStorage ─────────────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('webhub_token');
    const storedUser = localStorage.getItem('webhub_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('webhub_token');
        localStorage.removeItem('webhub_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('webhub_token', newToken);
    localStorage.setItem('webhub_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('webhub_token', newToken);
    localStorage.setItem('webhub_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('webhub_token');
    localStorage.removeItem('webhub_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('webhub_user', JSON.stringify(updatedUser));
    } catch {
      // Token expired — handled by interceptor
    }
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
