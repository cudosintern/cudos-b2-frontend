#!/bin/bash
# Simple build timer script

echo "🚀 Starting IONERP Build Performance Test"
echo "========================================"

# Get start time
START_TIME=$(date +%s)
echo "⏰ Build started at: $(date)"
echo ""

# Check system info
echo "💻 System Information:"
echo "  Node.js version: $(node --version)"
echo "  NPM version: $(npm --version)"
echo "  Available RAM: $(free -h | awk '/^Mem:/ {print $7}' 2>/dev/null || echo 'Not available on Windows')"
echo ""

# Run the build
echo "🔨 Running optimized build..."
npm run build:fast

# Get end time and calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "========================================"
echo "✅ Build completed!"
echo "⏰ Build finished at: $(date)"
echo "🕐 Total build time: ${MINUTES}m ${SECONDS}s"

# Check build size if successful
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build 2>/dev/null | cut -f1)
    echo "📦 Build size: $BUILD_SIZE"
    
    echo ""
    echo "📁 Build contents:"
    ls -la build/static/js/ 2>/dev/null | head -10
fi

echo "========================================"
