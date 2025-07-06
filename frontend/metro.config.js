const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web platform-specific extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.ts', 'web.tsx', 'web.js', 'web.jsx'];

module.exports = config;