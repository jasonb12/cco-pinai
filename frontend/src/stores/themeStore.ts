/**
 * Theme Store - Zustand
 * Based on PRD-UI.md specifications with Tamagui integration
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  // State
  mode: ThemeMode;
  systemTheme: 'light' | 'dark';
  activeTheme: 'light' | 'dark';
  
  // Actions
  setMode: (mode: ThemeMode) => void;
  setSystemTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  reset: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  const colorScheme = Appearance.getColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
};

const getActiveTheme = (mode: ThemeMode, systemTheme: 'light' | 'dark'): 'light' | 'dark' => {
  return mode === 'system' ? systemTheme : mode;
};

export const themeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'system',
      systemTheme: getSystemTheme(),
      activeTheme: getActiveTheme('system', getSystemTheme()),
      
      setMode: (mode) => set((state) => ({
        mode,
        activeTheme: getActiveTheme(mode, state.systemTheme)
      })),
      
      setSystemTheme: (systemTheme) => set((state) => ({
        systemTheme,
        activeTheme: getActiveTheme(state.mode, systemTheme)
      })),
      
      toggleTheme: () => set((state) => {
        const newMode = state.activeTheme === 'light' ? 'dark' : 'light';
        return {
          mode: newMode,
          activeTheme: newMode
        };
      }),
      
      reset: () => {
        const systemTheme = getSystemTheme();
        set({
          mode: 'system',
          systemTheme,
          activeTheme: systemTheme
        });
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        mode: state.mode,
      }),
    }
  )
);

// Hook for easy consumption
export const useThemeStore = () => themeStore();

// Setup system theme listener
if (typeof window !== 'undefined') {
  Appearance.addChangeListener(({ colorScheme }) => {
    const systemTheme = colorScheme === 'dark' ? 'dark' : 'light';
    themeStore.getState().setSystemTheme(systemTheme);
  });
}