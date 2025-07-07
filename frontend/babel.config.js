module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Fix web runtime error: Cannot use 'import.meta' outside a module
      '@babel/plugin-syntax-import-meta',
      'babel-plugin-transform-import-meta',
      [
        '@tamagui/babel-plugin',
        {
          config: './tamagui.config.ts',
          components: ['tamagui'],
          logTimings: true,
        },
      ],
    ],
  };
}; 