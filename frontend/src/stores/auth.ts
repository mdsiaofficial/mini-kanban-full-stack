'use client';

import { create } from 'zustand';
import { User } from '@/types';
import { authApi, usersApi } from '@/lib/api';
import { useSocketStore } from './socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  login: async (email: string, password: string) => {
    await authApi.login(email, password);
    const { data: user } = await usersApi.getMe();
    set({ user, isAuthenticated: true });
    useSocketStore.getState().connect();
  },
  
  register: async (email: string, password: string, name?: string) => {
    await authApi.register(email, password, name);
    const { data: user } = await usersApi.getMe();
    set({ user, isAuthenticated: true });
    useSocketStore.getState().connect();
  },
  
  logout: () => {
    authApi.logout().catch(() => {});
    useSocketStore.getState().disconnect();
    set({ user: null, isAuthenticated: false });
  },
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  checkAuth: async () => {
    try {
      const { data: user } = await usersApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
      useSocketStore.getState().connect();
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
