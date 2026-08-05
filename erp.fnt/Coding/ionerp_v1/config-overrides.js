const path = require('path');
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Enable persistent caching for faster builds
  config.cache = {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
    cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
  };

  // Add path aliases for shorter imports
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
    '@/components': path.resolve(__dirname, 'src/components'),
    '@/pages': path.resolve(__dirname, 'src/pages'),
    '@/utils': path.resolve(__dirname, 'src/utils'),
    '@/hooks': path.resolve(__dirname, 'src/hooks'),
    '@/contexts': path.resolve(__dirname, 'src/contexts'),
    '@/types': path.resolve(__dirname, 'src/types'),
  };

  // Optimize moment.js by ignoring locales
  config.plugins.push(
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    })
  );

  // Production-specific optimizations
  if (env === 'production') {
    // Optimize bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 10,
        maxAsyncRequests: 10,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 20,
          },
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            chunks: 'all',
            priority: 30,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 40,
          },
        },
      },
      usedExports: true,
      sideEffects: false,
    };
  }

  return config;
};
