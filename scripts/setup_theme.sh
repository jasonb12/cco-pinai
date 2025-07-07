#!/bin/bash

# Setup Theme Framework for CCOPINAI
echo "🎨 Setting up Tamagui theme framework..."

# Ensure we're in the project root
if [ ! -d "frontend" ]; then
  echo "❌ Error: This script must be run from the project root directory"
  echo "   Current directory: $(pwd)"
  echo "   Expected structure: ./frontend/ should exist"
  exit 1
fi

cd frontend

# Install core theme dependencies with correct versions
echo "📦 Installing Tamagui core and navigation dependencies..."
npm install \
  @tamagui/config@^1.130.8 \
  @tamagui/core@^1.130.8 \
  @tamagui/animations-react-native@^1.130.8 \
  @tamagui/button@^1.130.8 \
  @tamagui/card@^1.130.8 \
  @tamagui/text@^1.130.8 \
  @tamagui/input@^1.130.8 \
  @tamagui/sheet@^1.130.8 \
  @tamagui/separator@^1.130.8 \
  @tamagui/scroll-view@^1.130.8 \
  tamagui@^1.130.8 \
  @react-navigation/native@^6.1.9 \
  @react-navigation/bottom-tabs@^6.5.11 \
  react-native-safe-area-context@^4.8.2 \
  react-native-screens@^3.27.0 \
  react-native-gesture-handler@^2.14.1 \
  @expo/vector-icons@^14.0.0 \
  react-native-reanimated@~3.16.1 \
  zustand@^4.4.7

# Install dev dependencies
echo "🔧 Installing dev dependencies..."
npm install --save-dev \
  @tamagui/babel-plugin@^1.130.8

echo "✅ Core theme dependencies installed!"

# Create theme configuration files
echo "📝 Creating theme configuration..."

# Only create config if it doesn't exist
if [ ! -f "tamagui.config.ts" ]; then
  echo "📄 Creating tamagui.config.ts..."
  cat > tamagui.config.ts << 'EOF'
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
EOF
else
  echo "📄 tamagui.config.ts already exists, skipping..."
fi

# Return to project root
cd ..

echo "✅ Theme framework setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Dependencies are installed with correct versions"
echo "2. Tamagui config created with v3 imports"
echo "3. Theme store is ready in frontend/src/stores/themeStore.ts"
echo "4. Update your App.tsx to use AppThemeProvider"
echo ""
echo "📚 Documentation:"
echo "- Tamagui: https://tamagui.dev"
echo "- Theme configuration: ./frontend/tamagui.config.ts"
echo "- Theme store: ./frontend/src/stores/themeStore.ts"
echo ""
echo "🔧 Monorepo commands:"
echo "- npm run frontend    # Start frontend development server"
echo "- npm run backend     # Start backend server"
echo "- npm run dev         # Start both frontend and backend" 