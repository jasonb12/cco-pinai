/**
 * Authentication Store - Zustand
 * Based on PRD-UI.md specifications
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  signOut: () => void;
  reset: () => void;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

const initialState = {
  user: null,
  session: null,
  profile: null,
  isLoading: false,
  isAuthenticated: false,
};

export const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setSession: (session) => set({ 
        session, 
        user: session?.user || null,
        isAuthenticated: !!session?.user 
      }),
      
      setProfile: (profile) => set({ profile }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      updateProfile: (updates) => set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null
      })),
      
      signOut: () => set(initialState),
      
      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hook for easy consumption
export const useAuthStore = () => authStore();