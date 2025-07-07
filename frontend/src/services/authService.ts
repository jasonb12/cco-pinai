import { supabase } from '../config/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Complete the auth session for web browsers
WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface AuthUserSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  private static instance: AuthService;
  private currentSession: AuthUserSession | null = null;
  private sessionListeners: ((session: AuthUserSession | null) => void)[] = [];

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initializeAuth() {
    try {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        this.currentSession = this.mapSupabaseSession(session);
        this.notifySessionChange();
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event);
        
        if (session) {
          this.currentSession = this.mapSupabaseSession(session);
          await this.storeSession(this.currentSession);
        } else {
          this.currentSession = null;
          await this.clearStoredSession();
        }
        
        this.notifySessionChange();
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  private mapSupabaseSession(session: any): AuthUserSession {
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
        avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        provider: session.user.app_metadata?.provider,
        created_at: session.user.created_at,
        last_sign_in_at: session.user.last_sign_in_at,
      },
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
    };
  }

  private async storeSession(session: AuthUserSession) {
    try {
      await AsyncStorage.setItem('auth_session', JSON.stringify(session));
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  private async clearStoredSession() {
    try {
      await AsyncStorage.removeItem('auth_session');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  private notifySessionChange() {
    this.sessionListeners.forEach(listener => listener(this.currentSession));
  }

  public onSessionChange(listener: (session: AuthUserSession | null) => void) {
    this.sessionListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.sessionListeners.indexOf(listener);
      if (index > -1) {
        this.sessionListeners.splice(index, 1);
      }
    };
  }

  public getCurrentSession(): AuthUserSession | null {
    return this.currentSession;
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentSession?.user || null;
  }

  public isAuthenticated(): boolean {
    return !!this.currentSession;
  }

  // Email/Password Authentication
  public async signUp(data: SignUpData) {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      });

      if (error) {
        throw error;
      }

      return {
        user: authData.user,
        session: authData.session,
        needsVerification: !authData.session,
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Sign up failed');
    }
  }

  public async signIn(data: SignInData) {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      return authData;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Sign in failed');
    }
  }

  public async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Sign out failed');
    }
  }

  // OAuth Authentication
  public async signInWithGoogle() {
    try {
      // For web, use in-window redirect
      if (typeof window !== 'undefined') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          throw error;
        }

        return data;
      } else {
        // For mobile, use WebBrowser
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: 'audio-transcript-mcp',
          path: 'auth',
        });

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );

          if (result.type === 'success') {
            const url = result.url;
            const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
            
            if (params.get('error')) {
              throw new Error(params.get('error_description') || 'OAuth error');
            }
          }
        }

        return data;
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(error.message || 'Google sign in failed');
    }
  }

  public async signInWithApple() {
    try {
      // For web, use in-window redirect
      if (typeof window !== 'undefined') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: `${window.location.origin}/auth`,
          },
        });

        if (error) {
          throw error;
        }

        return data;
      } else {
        // For mobile, use WebBrowser
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: 'audio-transcript-mcp',
          path: 'auth',
        });

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (error) {
          throw error;
        }

        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );

          if (result.type === 'success') {
            const url = result.url;
            const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
            
            if (params.get('error')) {
              throw new Error(params.get('error_description') || 'OAuth error');
            }
          }
        }

        return data;
      }
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      throw new Error(error.message || 'Apple sign in failed');
    }
  }

  public async signInWithGitHub() {
    try {
      // For web, use in-window redirect
      if (typeof window !== 'undefined') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: `${window.location.origin}/auth`,
          },
        });

        if (error) {
          throw error;
        }

        return data;
      } else {
        // For mobile, use WebBrowser
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: 'audio-transcript-mcp',
          path: 'auth',
        });

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (error) {
          throw error;
        }

        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );

          if (result.type === 'success') {
            const url = result.url;
            const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
            
            if (params.get('error')) {
              throw new Error(params.get('error_description') || 'OAuth error');
            }
          }
        }

        return data;
      }
    } catch (error: any) {
      console.error('GitHub sign in error:', error);
      throw new Error(error.message || 'GitHub sign in failed');
    }
  }

  // Password Reset
  public async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'ccopinai://reset-password',
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Password reset failed');
    }
  }

  public async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Password update error:', error);
      throw new Error(error.message || 'Password update failed');
    }
  }

  // Email Verification
  public async resendVerification(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Resend verification error:', error);
      throw new Error(error.message || 'Failed to resend verification');
    }
  }

  // Profile Management
  public async updateProfile(updates: Partial<AuthUser>) {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        throw error;
      }

      // Update local session
      if (this.currentSession) {
        this.currentSession.user = { ...this.currentSession.user, ...updates };
        await this.storeSession(this.currentSession);
        this.notifySessionChange();
      }

      return { success: true };
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Profile update failed');
    }
  }

  // Session Management
  public async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      if (data.session) {
        this.currentSession = this.mapSupabaseSession(data.session);
        await this.storeSession(this.currentSession);
        this.notifySessionChange();
      }

      return data;
    } catch (error: any) {
      console.error('Session refresh error:', error);
      throw new Error(error.message || 'Session refresh failed');
    }
  }

  public async validateSession(): Promise<boolean> {
    try {
      if (!this.currentSession) {
        return false;
      }

      // Check if token is expired
      const now = Date.now() / 1000;
      if (this.currentSession.expires_at < now) {
        // Try to refresh
        await this.refreshSession();
        return !!this.currentSession;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  // Utility Methods
  public async getAccessToken(): Promise<string | null> {
    if (await this.validateSession()) {
      return this.currentSession?.access_token || null;
    }
    return null;
  }

  public async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default authService; 