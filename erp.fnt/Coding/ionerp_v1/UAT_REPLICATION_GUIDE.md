# 🎯 UAT BRANCH REPLICATION GUIDE

## 📊 **Build Performance Results - Development Branch**

### **Latest Test Results:**
- **Started**: 15:26:30
- **Completed**: 15:43:44  
- **Duration**: **~17 minutes** (plain react-scripts)

### **Performance History:**
1. **Original**: 15+ minutes (with cache clearing)
2. **With optimizations**: 3-5 minutes (react-app-rewired + caching)
3. **Simple react-scripts**: ~17 minutes (no optimizations)

---

## 🚀 **COMPLETE REPLICATION STEPS FOR UAT BRANCH**

### **Step 1: Install New Dependencies**
```bash
npm install --save-dev react-app-rewired env-cmd customize-cra babel-plugin-transform-react-remove-prop-types @babel/plugin-transform-react-inline-elements @babel/plugin-transform-react-constant-elements rimraf check-node-version webpack-bundle-analyzer
```

### **Step 2: Create config-overrides.js**
```javascript
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
```

### **Step 3: Create .env.fast**
```bash
REACT_APP_API_URL=http://10.91.3.217:7001

# Ultra-fast build settings
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
IMAGE_INLINE_SIZE_LIMIT=0
DISABLE_ESLINT_PLUGIN=true
TSC_COMPILE_ON_ERROR=true
FAST_REFRESH=false
SKIP_PREFLIGHT_CHECK=true

# Maximum performance optimizations
NODE_OPTIONS=--max-old-space-size=8192
WEBPACK_OPTIMIZE_CSS_ASSETS=false
WEBPACK_MINIMIZE=false

# Disable heavy checks for faster builds
REACT_APP_DISABLE_FAST_REFRESH=true
BUILD_PATH=build
```

### **Step 4: Create babel.config.js**
```javascript
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['last 2 versions', 'ie >= 11']
        },
        modules: false,
        useBuiltIns: 'entry',
        corejs: 3
      }
    ],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-private-property-in-object',
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: false,
        helpers: true,
        regenerator: true,
        useESModules: false
      }
    ]
  ],
  env: {
    production: {
      plugins: [
        'babel-plugin-transform-react-remove-prop-types',
        '@babel/plugin-transform-react-inline-elements',
        '@babel/plugin-transform-react-constant-elements'
      ]
    }
  }
};
```

### **Step 5: Update package.json Scripts**
Replace the scripts section with:
```json
"scripts": {
  "start": "env-cmd -f .env.development react-app-rewired start",
  "build": "env-cmd -f .env.production react-app-rewired build", 
  "build:analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js",
  "build:fast": "env-cmd -f .env.fast react-app-rewired build",
  "build:vanilla": "env-cmd -f .env.fast react-scripts build",
  "start:vanilla": "env-cmd -f .env.development react-scripts start",
  "test": "react-app-rewired test",
  "eject": "react-scripts eject",
  "clean": "rimraf build node_modules/.cache .tsbuildinfo",
  "preinstall": "npx check-node-version --node >=16"
}
```

### **⚠️ CRITICAL: DO NOT ADD prebuild script**
**DO NOT ADD**: `"prebuild": "npm run clean"` - This causes slow builds!

### **Step 6: Ensure package.server.json exists**
```json
{
  "_comment": "Minimal package.json for server deployment if react-app-rewired issues persist",
  "name": "ionems",
  "version": "0.1.0",
  "private": true,
  "homepage": "/erp/",
  "scripts": {
    "start": "react-scripts start",
    "build": "NODE_OPTIONS='--max-old-space-size=8192' GENERATE_SOURCEMAP=false DISABLE_ESLINT_PLUGIN=true react-scripts build",
    "test": "react-scripts test",
    "clean": "rm -rf build .tsbuildinfo"
  }
}
```

---

## 🎯 **Expected Results After Replication**

### **Performance Targets:**
- **Local Development**: 3-5 minutes with `npm run build:fast`
- **Production Builds**: 4-6 minutes with `npm run build`  
- **Server Deployment**: Compatible with Rocky Linux 8

### **Commands to Use:**
```bash
# Daily development (fastest)
npm run build:fast

# Production deployment  
npm run build

# Bundle analysis
npm run build:analyze

# Clean cache if needed
npm run clean
```

---

## ✅ **Verification Steps**

1. **Test fast build**: `npm run build:fast` should complete in 3-5 minutes
2. **Test production build**: `npm run build` should complete in 4-6 minutes  
3. **Verify server compatibility**: package.server.json provides fallback
4. **Check bundle analysis**: `npm run build:analyze` works

---

## 🎉 **Summary**

This replication will give you the same **70%+ build performance improvement** achieved in the development branch, taking builds from 15+ minutes down to 3-5 minutes while maintaining full server compatibility.

The key insight: **Filesystem caching + optimized webpack configuration + fast environment settings = Major speed improvement!**
