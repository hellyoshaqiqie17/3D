'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginDemo: () => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    studioName?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  syncSession: () => Promise<void>;
}

function setClientCookies(user: User | null) {
  if (typeof document !== 'undefined') {
    if (user) {
      document.cookie = `hc_user_id=${encodeURIComponent(user.id)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `hc_session_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      document.cookie = `hc_user_id=; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `hc_session_user=; path=/; max-age=0; SameSite=Lax`;
    }
  }
}

function getInitialUser(): User | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('homecraft-auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.user) {
          setClientCookies(parsed.state.user);
          return parsed.state.user;
        }
      }
    } catch {}
  }
  return null;
}

const initialUser = getInitialUser();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: initialUser,
      isAuthenticated: !!initialUser,
      isLoading: false,
      isInitialized: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            set({
              isLoading: false,
              error: data.message || 'Authentication failed. Please verify credentials.',
            });
            return { success: false, message: data.message };
          }

          setClientCookies(data.user);

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });

          return { success: true, message: data.message };
        } catch (err: any) {
          const msg = err.message || 'Network error occurred during sign-in.';
          set({ isLoading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      loginDemo: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'lead.architect@atelier3d.com',
              password: 'demo-studio-key',
            }),
          });

          const data = await res.json();

          if (data.success && data.user) {
            setClientCookies(data.user);
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              error: null,
            });
            return { success: true, message: 'Welcome back, Lead Architect.' };
          }

          set({ isLoading: false });
          return { success: false };
        } catch (err) {
          set({ isLoading: false });
          return { success: false };
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isGoogle: true, provider: 'google' }),
          });

          const data = await res.json();

          if (data.success && data.user) {
            setClientCookies(data.user);
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              error: null,
            });
            return { success: true, message: 'Google Workspace authenticated.' };
          }

          set({ isLoading: false });
          return { success: false, message: 'Google sign in failed.' };
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
          return { success: false, message: err.message };
        }
      },

      register: async ({ name, email, password, studioName }) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, studioName }),
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            set({
              isLoading: false,
              error: data.message || 'Failed to create studio account.',
            });
            return { success: false, message: data.message };
          }

          setClientCookies(data.user);

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });

          return { success: true, message: data.message };
        } catch (err: any) {
          const msg = err.message || 'Network error occurred during registration.';
          set({ isLoading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (err) {
          console.error('Error logging out:', err);
        }
        setClientCookies(null);
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          error: null,
        });
      },

      syncSession: async () => {
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              setClientCookies(data.user);
              set({ user: data.user, isAuthenticated: true, isInitialized: true });
              return;
            }
          }
        } catch (err) {
          console.error('Failed to sync auth session:', err);
        }

        // If server had no cookie but localStorage has user, ensure client cookies are set
        const currentUser = get().user;
        if (currentUser) {
          setClientCookies(currentUser);
          set({ isInitialized: true });
        } else {
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: 'homecraft-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
