import { config } from '@tamagui/config/v3'
import { createTamagui } from '@tamagui/core'

const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    // Custom brand themes for CCOPINAI
    brand_light: {
      ...config.themes.light,
      background: '#ffffff',
      backgroundHover: '#f8f9fa',
      backgroundPress: '#e9ecef',
      backgroundFocus: '#e9ecef',
      borderColor: '#dee2e6',
      borderColorHover: '#adb5bd',
      color: '#212529',
      colorHover: '#495057',
      colorPress: '#6c757d',
      colorFocus: '#495057',
      placeholderColor: '#6c757d',
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
    brand_dark: {
      ...config.themes.dark,
      background: '#000000',
      backgroundHover: '#1c1c1e',
      backgroundPress: '#2c2c2e',
      backgroundFocus: '#2c2c2e',
      borderColor: '#38383a',
      borderColorHover: '#48484a',
      color: '#ffffff',
      colorHover: '#f2f2f7',
      colorPress: '#e5e5ea',
      colorFocus: '#f2f2f7',
      placeholderColor: '#8e8e93',
      // iOS dark system colors
      blue: '#0A84FF',
      green: '#30D158',
      red: '#FF453A',
      orange: '#FF9F0A',
      yellow: '#FFD60A',
      purple: '#BF5AF2',
      pink: '#FF375F',
      gray: '#8E8E93',
    },
  },
})

export type AppConfig = typeof appConfig

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig 