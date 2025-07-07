/**
 * App Navigator - Main Navigation Container
 * Based on PRD-UI.md navigation specifications
 */
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

// Import navigation stacks
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

// Import theme and auth
import { AppThemeProvider } from '../ThemeProvider';
import { useThemeStore } from '../../stores/themeStore';
import { supabase } from '../../config/supabase';
import { User } from '@supabase/auth-js';

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeTheme } = useThemeStore();

  useEffect(() => {
    // Check initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };
    
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    // You can add a loading screen here
    return null;
  }

  return (
    <AppThemeProvider>
      <NavigationContainer>
        {user ? <MainTabs /> : <AuthStack />}
        <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
      </NavigationContainer>
    </AppThemeProvider>
  );
} 