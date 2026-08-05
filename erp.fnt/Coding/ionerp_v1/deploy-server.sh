#!/bin/bash

# IONERP Server Deployment Script
# Handles fresh deployment on Rocky Linux server

echo "🚀 IONERP Server Deployment"
echo "============================"
echo "⏰ Started: $(date)"
echo "🖥️ Server: $(hostname)"
echo "💻 OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2 2>/dev/null || uname -a)"

# Check if we have the required tools
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "📦 Node: $(node --version)"
echo "📦 npm: $(npm --version)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Make sure you're in the project directory."
    exit 1
fi

echo ""
echo "🔧 Step 1: Installing dependencies..."
npm install --production=false
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🔧 Step 2: Building application..."

# Try different build methods
BUILD_SUCCESS=false

# Method 1: Server-optimized build
echo "🧪 Trying server-optimized build..."
if npm run build:server 2>/dev/null; then
    BUILD_SUCCESS=true
    echo "✅ Server build successful!"
fi

# Method 2: Fast build with server env (fallback)
if [ "$BUILD_SUCCESS" = false ]; then
    echo "🧪 Trying fast build with server environment..."
    if npx env-cmd -f .env.server npm run build:fast 2>/dev/null; then
        BUILD_SUCCESS=true
        echo "✅ Fast build with server env successful!"
    fi
fi

# Method 3: Standard React Scripts (final fallback)
if [ "$BUILD_SUCCESS" = false ]; then
    echo "🧪 Trying standard React Scripts build..."
    if GENERATE_SOURCEMAP=false npx react-scripts build; then
        BUILD_SUCCESS=true
        echo "✅ Standard build successful!"
    fi
fi

if [ "$BUILD_SUCCESS" = false ]; then
    echo "❌ All build methods failed!"
    exit 1
fi

# Verify build output
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build 2>/dev/null | cut -f1 || echo "unknown")
    FILE_COUNT=$(find build -type f | wc -l 2>/dev/null || echo "unknown")
    
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================"
    echo "📦 Build size: $BUILD_SIZE"
    echo "📁 Files: $FILE_COUNT"
    echo "📍 Location: $(pwd)/build"
    echo ""
    echo "🚀 Ready to deploy to web server!"
    echo "📋 Next steps:"
    echo "   1. Copy 'build' folder to your web server"
    echo "   2. Configure web server to serve static files"
    echo "   3. Set up proper routing for React app"
else
    echo "❌ Build directory not found!"
    exit 1
fi
