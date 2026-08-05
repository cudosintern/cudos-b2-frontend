#!/bin/bash
# IONERP Linux Server Build Script - ULTRA-FAST VERSION
# Optimized for Rocky Linux/RHEL servers with same performance as Windows

set -e  # Exit on any error

echo "🚀 IONERP Ultra-Fast Linux Server Build"
echo "========================================"

# Record start time
START_TIME=$(date +%s)
echo "⏰ Build started at: $(date)"

# Check Node.js version and memory
NODE_VERSION=$(node --version 2>/dev/null || echo "not found")
TOTAL_MEM=$(free -h | awk '/^Mem:/ {print $2}' || echo "unknown")
echo "📋 Node.js: $NODE_VERSION | Memory: $TOTAL_MEM"

# Detect CPU cores for parallel processing
CPU_CORES=$(nproc 2>/dev/null || echo "1")
echo "🔧 CPU Cores: $CPU_CORES"

# Set ultra-fast environment variables
export NODE_OPTIONS="--max-old-space-size=8192 --no-warnings --max-semi-space-size=1024"
export GENERATE_SOURCEMAP=false
export DISABLE_ESLINT_PLUGIN=true
export TSC_COMPILE_ON_ERROR=true
export SKIP_PREFLIGHT_CHECK=true
export REACT_APP_DISABLE_TYPE_CHECK=true
export CI=true
export FORCE_COLOR=0

echo "⚡ Ultra-fast optimizations enabled"

# Clean previous builds
echo "🧹 Cleaning cache and previous builds..."
npm run clean || rm -rf build node_modules/.cache .tsbuildinfo 2>/dev/null

# Ensure dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "⚠️  Dependencies missing, installing..."
    npm install --production=false
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

# Verify key packages are available
if [ ! -f "node_modules/.bin/env-cmd" ] && [ ! -f "node_modules/env-cmd/package.json" ]; then
    echo "⚠️  env-cmd missing, installing..."
    npm install env-cmd
fi

# Try optimized build methods (in order of preference)
echo "🚀 Starting ultra-fast build process..."

if command -v env-cmd >/dev/null 2>&1 && [ -f ".env.server" ]; then
    echo "✅ Using ultra-fast server environment (.env.server)"
    if command -v react-app-rewired >/dev/null 2>&1 || [ -f "node_modules/.bin/react-app-rewired" ]; then
        echo "� Using react-app-rewired with ULTRA-FAST optimizations (same as Windows)"
        npx env-cmd -f .env.server react-app-rewired build
    else
        echo "⚡ Installing react-app-rewired for ultra-fast builds..."
        npm install react-app-rewired --save-dev
        npx env-cmd -f .env.server react-app-rewired build
    fi
elif command -v react-app-rewired >/dev/null 2>&1 || [ -f "node_modules/.bin/react-app-rewired" ]; then
    echo "🔧 Using react-app-rewired with webpack optimizations"
    npx react-app-rewired build
else
    echo "🔧 Using standard react-scripts (fallback)"
    npx react-scripts build
fi

# Calculate build time and show results
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))
MINUTES=$((BUILD_TIME / 60))
SECONDS=$((BUILD_TIME % 60))

# Check build success
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build 2>/dev/null | cut -f1 || echo "unknown")
    FILE_COUNT=$(find build -type f | wc -l 2>/dev/null || echo "unknown")
    
    echo ""
    echo "=================================================="
    echo "🚀 Build completed successfully!"
    echo "⏰ Build finished at: $(date)"
    if [ $MINUTES -gt 0 ]; then
        echo "⚡ Build duration: ${MINUTES}.$(($SECONDS * 10 / 60)) minutes ($BUILD_TIME seconds)"
    else
        echo "⚡ Build duration: $BUILD_TIME seconds"
    fi
    echo "📦 Total build size: $BUILD_SIZE"
    echo "📁 Files generated: $FILE_COUNT"
    echo "=================================================="
    
    # Performance rating
    if [ $BUILD_TIME -lt 120 ]; then
        echo "🚀 EXCELLENT PERFORMANCE (< 2 min)"
    elif [ $BUILD_TIME -lt 300 ]; then
        echo "⚡ GOOD PERFORMANCE (< 5 min)"
    elif [ $BUILD_TIME -lt 600 ]; then
        echo "✅ AVERAGE PERFORMANCE (< 10 min)"
    else
        echo "⏱️ NEEDS OPTIMIZATION (> 10 min)"
    fi
    
    echo "=================================================="
    echo "🎉 IONERP is ready for deployment!"
    echo "📍 Deploy the 'build' folder to your web server"
    
    # Show largest files for analysis
    echo ""
    echo "📊 Largest build files:"
    find build -name "*.js" -type f -exec ls -lh {} \; 2>/dev/null | sort -k5 -hr | head -3 | awk '{print "  " $9 ": " $5}' || echo "  No JS files found"
    
else
    echo ""
    echo "=================================================="
    echo "❌ Build failed - build directory not created"
    echo "⏰ Failed after $BUILD_TIME seconds"
    echo "=================================================="
    exit 1
fi
