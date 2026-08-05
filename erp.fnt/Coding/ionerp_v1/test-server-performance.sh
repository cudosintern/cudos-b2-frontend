#!/bin/bash

# IONERP Server Performance Test Script
# This script tests different build configurations on Rocky Linux server

echo "🔬 IONERP Server Performance Test"
echo "=================================="
echo "🖥️ Server: $(hostname)"
echo "💻 OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2 2>/dev/null || uname -a)"
echo "🧠 CPU: $(nproc) cores"
echo "💾 Memory: $(free -h | grep Mem | awk '{print $2}') available"
echo "📦 Node: $(node --version 2>/dev/null || echo 'Not installed')"
echo "📦 npm: $(npm --version 2>/dev/null || echo 'Not installed')"
echo "⏰ Test started: $(date)"
echo "=================================="

# Function to run a build test
run_build_test() {
    local test_name="$1"
    local build_command="$2"
    
    echo ""
    echo "🧪 Testing: $test_name"
    echo "📝 Command: $build_command"
    echo "⏱️ Starting build..."
    
    # Clean previous build
    rm -rf build 2>/dev/null
    
    # Time the build
    start_time=$(date +%s)
    
    # Run the build
    if eval $build_command; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        
        # Get build info
        if [ -d "build" ]; then
            build_size=$(du -sh build 2>/dev/null | cut -f1 || echo "unknown")
            file_count=$(find build -type f | wc -l 2>/dev/null || echo "unknown")
            
            echo "✅ SUCCESS: ${duration}s (${build_size}, ${file_count} files)"
            
            # Performance rating
            if [ $duration -lt 120 ]; then
                echo "🚀 EXCELLENT (< 2 min)"
            elif [ $duration -lt 300 ]; then
                echo "⚡ GOOD (< 5 min)"
            elif [ $duration -lt 600 ]; then
                echo "✅ AVERAGE (< 10 min)"
            else
                echo "⏱️ SLOW (> 10 min)"
            fi
        else
            echo "❌ FAILED: Build directory not created"
        fi
    else
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo "❌ FAILED: Build command failed after ${duration}s"
    fi
}

# Test different build configurations
echo ""
echo "🧪 Running build performance tests..."

# Test 1: Ultra-fast server build (Linux environment only)
run_build_test "Ultra-Fast Server Build" "npm run build:server"

# Test 2: Enhanced Linux build script
run_build_test "Enhanced Linux Script" "npm run build:linux"

# Test 3: Fast build with server env
run_build_test "Fast Build + Server ENV" "env-cmd -f .env.server npm run build:fast"

# Test 4: Fallback build (if available)
if [ -f "package.server.json" ]; then
    run_build_test "Fallback Build (server config)" "cp package.server.json package.json && npm install --production && npm run build"
fi

echo ""
echo "=================================="
echo "🏁 Performance test completed!"
echo "⏰ Test finished: $(date)"
echo ""
echo "🎯 Target: < 2 minutes (like Windows development)"
echo "💡 If builds are slow, check:"
echo "   - Available memory (needs 8GB+)"
echo "   - CPU cores (more = faster)"
echo "   - Disk I/O performance"
echo "   - Node.js version (v18+ recommended)"
echo "=================================="
