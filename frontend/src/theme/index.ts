export const lightTheme = {
  colors: {
    // Background colors
    background: '#ffffff',
    backgroundSecondary: '#f8f9fa',
    backgroundTertiary: '#e9ecef',
    
    // Text colors
    text: '#212529',
    textSecondary: '#495057',
    textTertiary: '#6c757d',
    
    // Border colors
    border: '#dee2e6',
    borderHover: '#adb5bd',
    
    // Brand colors
    primary: '#007AFF',
    primaryHover: '#0056CC',
    secondary: '#6c757d',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    
    // Semantic colors
    info: '#007AFF',
    
    // iOS system colors
    blue: '#007AFF',
    green: '#34C759',
    red: '#FF3B30',
    orange: '#FF9500',
    yellow: '#FFCC00',
    purple: '#AF52DE',
    pink: '#FF2D92',
    gray: '#8E8E93',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
}

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    // Background colors
    background: '#000000',
    backgroundSecondary: '#1c1c1e',
    backgroundTertiary: '#2c2c2e',
    
    // Text colors
    text: '#ffffff',
    textSecondary: '#f2f2f7',
    textTertiary: '#8e8e93',
    
    // Border colors
    border: '#38383a',
    borderHover: '#48484a',
    
    // Brand colors (adjusted for dark mode)
    primary: '#0A84FF',
    primaryHover: '#409CFF',
    
    // iOS dark system colors
    blue: '#0A84FF',
    green: '#30D158',
    red: '#FF453A',
    orange: '#FF9F0A',
    yellow: '#FFD60A',
    purple: '#BF5AF2',
    pink: '#FF375F',
  },
}

export type Theme = typeof lightTheme

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const

export type ThemeName = keyof typeof themes 