import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setToken: (token) => {
    set({ accessToken: token, isAuthenticated: !!token });
  },

  setUser: (user) => {
    set({ user });
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/auth/me');
      set({ user: res.data?.data?.user ?? res.data?.user, isAuthenticated: true });
    } catch (err) {
      set({ user: null, accessToken: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken } = res.data?.data ?? res.data;
      set({ user, accessToken, isAuthenticated: true });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed';
      return { success: false, error: msg };
    }
  },

  register: async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const { user, accessToken } = res.data?.data ?? res.data;
      set({ user, accessToken, isAuthenticated: true });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed';
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },
  
  updateProfile: async (updates) => {
    try {
      const res = await api.put('/auth/me', updates);
      set({ user: res.data?.data?.user ?? res.data?.user });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  }
}));
