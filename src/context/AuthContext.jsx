import React, { createContext, useContext, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('kissan_auth_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('kissan_auth_token') || null;
  });

  const login = async (role, identifier, password) => {
    try {
      const res = await authService.login(role, identifier, password);
      if (res.user) {
        setUser(res.user);
        setToken(res.token || '');
        localStorage.setItem('kissan_auth_user', JSON.stringify(res.user));
        if (res.token) {
          localStorage.setItem('kissan_auth_token', res.token);
        }
        return { success: true };
      }
      return { success: false, error: 'Malformed response from authentication server.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (registrationData) => {
    try {
      const res = await authService.register(registrationData);
      if (res.user) {
        setUser(res.user);
        setToken(res.token || '');
        localStorage.setItem('kissan_auth_user', JSON.stringify(res.user));
        if (res.token) {
          localStorage.setItem('kissan_auth_token', res.token);
        }
        return { success: true };
      }
      return { success: false, error: 'Malformed response from registration server.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('kissan_auth_user');
    localStorage.removeItem('kissan_auth_token');
  };

  const updateVerification = (updates) => {
    setUser(prev => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updates };
      localStorage.setItem('kissan_auth_user', JSON.stringify(nextUser));

      // Persist to the local storage database so it survives logout/login
      const dbStr = localStorage.getItem('kissan_mock_users_db');
      if (dbStr) {
        try {
          const db = JSON.parse(dbStr);
          const updatedDb = db.map(u => u.id === nextUser.id ? { ...u, ...updates } : u);
          localStorage.setItem('kissan_mock_users_db', JSON.stringify(updatedDb));
        } catch (e) {
          console.error('Failed to update mock database', e);
        }
      }
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateVerification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
