import * as React from 'react';
import { TamaguiProvider, Theme } from '@tamagui/core';
import { useThemeStore } from '../stores/themeStore';
import config from '../../tamagui.config';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const AppThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { activeTheme, setSystemTheme } = useThemeStore();

  React.useEffect(() => {
    // Listen for system theme changes
    const { Appearance } = require('react-native');
    const subscription = Appearance.addChangeListener(
      ({ colorScheme }: { colorScheme: 'light' | 'dark' | null }) => {
        setSystemTheme(colorScheme === 'dark' ? 'dark' : 'light');
      }
    );

    return () => subscription?.remove();
  }, [setSystemTheme]);

  return (
    <TamaguiProvider config={config}>
      <Theme name={activeTheme === 'dark' ? 'brand_dark' : 'brand_light'}>
        {children}
      </Theme>
    </TamaguiProvider>
  );
}; 