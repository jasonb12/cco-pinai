import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceVariant: string;
  surfaceContainer: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary colors
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  
  // Secondary colors
  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  
  // Status colors
  success: string;
  successContainer: string;
  warning: string;
  warningContainer: string;
  error: string;
  errorContainer: string;
  
  // Border colors
  border: string;
  borderVariant: string;
  
  // Shadow colors
  shadow: string;
  shadowVariant: string;
  
  // Tab bar colors
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
}

const lightColors: ThemeColors = {
  // Background colors
  background: '#ffffff',
  surface: '#f8fafc',
  surfaceVariant: '#f1f5f9',
  surfaceContainer: '#e2e8f0',
  
  // Text colors
  text: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  
  // Primary colors
  primary: '#3b82f6',
  primaryContainer: '#dbeafe',
  onPrimary: '#ffffff',
  
  // Secondary colors
  secondary: '#10b981',
  secondaryContainer: '#d1fae5',
  onSecondary: '#ffffff',
  
  // Status colors
  success: '#10b981',
  successContainer: '#dcfce7',
  warning: '#f59e0b',
  warningContainer: '#fef3c7',
  error: '#ef4444',
  errorContainer: '#fee2e2',
  
  // Border colors
  border: '#e5e7eb',
  borderVariant: '#d1d5db',
  
  // Shadow colors
  shadow: '#00000010',
  shadowVariant: '#00000020',
  
  // Tab bar colors
  tabBarBackground: '#ffffff',
  tabBarBorder: '#e5e7eb',
  tabBarActive: '#3b82f6',
  tabBarInactive: '#6b7280',
};

const darkColors: ThemeColors = {
  // Background colors
  background: '#0f172a',
  surface: '#1e293b',
  surfaceVariant: '#334155',
  surfaceContainer: '#475569',
  
  // Text colors
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  
  // Primary colors
  primary: '#60a5fa',
  primaryContainer: '#1e40af',
  onPrimary: '#ffffff',
  
  // Secondary colors
  secondary: '#34d399',
  secondaryContainer: '#065f46',
  onSecondary: '#ffffff',
  
  // Status colors
  success: '#34d399',
  successContainer: '#064e3b',
  warning: '#fbbf24',
  warningContainer: '#92400e',
  error: '#f87171',
  errorContainer: '#991b1b',
  
  // Border colors
  border: '#475569',
  borderVariant: '#64748b',
  
  // Shadow colors
  shadow: '#00000030',
  shadowVariant: '#00000050',
  
  // Tab bar colors
  tabBarBackground: '#1e293b',
  tabBarBorder: '#334155',
  tabBarActive: '#60a5fa',
  tabBarInactive: '#94a3b8',
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'ccopinai_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);
  
  // Load theme from storage on mount
  useEffect(() => {
    loadThemeFromStorage();
  }, []);
  
  const loadThemeFromStorage = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        setThemeModeState(storedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme to storage:', error);
    }
  };
  
  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };
  
  // Determine actual theme based on mode and system preference
  const getActualTheme = (): 'light' | 'dark' => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  };
  
  const actualTheme = getActualTheme();
  const isDark = actualTheme === 'dark';
  
  const theme: Theme = {
    mode: themeMode,
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
  
  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
  };
  
  // Show loading state while theme is being loaded
  if (isLoading) {
    return null;
  }
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper hook for easy access to theme colors
export function useThemeColors(): ThemeColors {
  const { theme } = useTheme();
  return theme.colors;
} 