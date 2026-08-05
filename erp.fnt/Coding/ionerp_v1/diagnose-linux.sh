#!/bin/bash

# IONERP Linux Build Diagnostic Script
# Identifies what's causing slow builds on Rocky Linux

echo "🔍 IONERP Linux Build Diagnostics"
echo "=================================="
echo "⏰ Started: $(date)"

# System information
echo ""
echo "🖥️ SYSTEM INFORMATION:"
echo "Server: $(hostname)"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2 2>/dev/null || uname -a)"
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"

# Hardware resources
echo ""
echo "🔧 HARDWARE RESOURCES:"
CPU_CORES=$(nproc 2>/dev/null || echo "unknown")
TOTAL_MEM=$(free -h | awk '/^Mem:/ {print $2}' || echo "unknown")
AVAILABLE_MEM=$(free -h | awk '/^Mem:/ {print $7}' || echo "unknown")
DISK_SPACE=$(df -h . | tail -1 | awk '{print $4}' || echo "unknown")

echo "CPU Cores: $CPU_CORES"
echo "Total Memory: $TOTAL_MEM"
echo "Available Memory: $AVAILABLE_MEM"
echo "Available Disk: $DISK_SPACE"

# Node.js environment
echo ""
echo "📦 NODE.JS ENVIRONMENT:"
if command -v node &> /dev/null; then
    echo "Node.js: $(node --version)"
    echo "npm: $(npm --version)"
    echo "Node path: $(which node)"
    echo "npm path: $(which npm)"
else
    echo "❌ Node.js not found"
fi

# Project dependencies check
echo ""
echo "📋 PROJECT DEPENDENCIES:"
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    
    # Check key dependencies
    if [ -d "node_modules" ]; then
        echo "✅ node_modules exists"
        NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "unknown")
        echo "node_modules size: $NODE_MODULES_SIZE"
        
        # Check specific packages
        if [ -f "node_modules/.bin/react-app-rewired" ]; then
            echo "✅ react-app-rewired available"
        else
            echo "⚠️ react-app-rewired missing"
        fi
        
        if [ -f "node_modules/.bin/env-cmd" ]; then
            echo "✅ env-cmd available"
        else
            echo "⚠️ env-cmd missing"
        fi
    else
        echo "❌ node_modules missing"
    fi
    
    # Check configuration files
    if [ -f ".env.server" ]; then
        echo "✅ .env.server found"
    else
        echo "⚠️ .env.server missing"
    fi
    
    if [ -f "config-overrides.js" ]; then
        echo "✅ config-overrides.js found"
    else
        echo "⚠️ config-overrides.js missing (webpack optimizations)"
    fi
else
    echo "❌ package.json not found"
fi

# Build cache check
echo ""
echo "💾 BUILD CACHE STATUS:"
if [ -d "node_modules/.cache" ]; then
    CACHE_SIZE=$(du -sh node_modules/.cache 2>/dev/null | cut -f1 || echo "unknown")
    echo "Cache exists: $CACHE_SIZE"
else
    echo "❌ No build cache found"
fi

# Performance bottleneck analysis
echo ""
echo "🔍 PERFORMANCE BOTTLENECK ANALYSIS:"

# Check if TypeScript compilation is the issue
TS_FILES=$(find src -name "*.ts" -o -name "*.tsx" | wc -l 2>/dev/null || echo "0")
echo "TypeScript files: $TS_FILES"

# Check large dependencies
echo ""
echo "📦 LARGEST DEPENDENCIES:"
if [ -d "node_modules" ]; then
    du -sh node_modules/* 2>/dev/null | sort -hr | head -5 | while read size dir; do
        echo "  $(basename "$dir"): $size"
    done
else
    echo "  No node_modules to analyze"
fi

# Recommendations
echo ""
echo "💡 PERFORMANCE RECOMMENDATIONS:"

if [ ! -f "config-overrides.js" ]; then
    echo "❗ CRITICAL: Missing webpack optimizations (config-overrides.js)"
fi

if [ ! -d "node_modules/.cache" ]; then
    echo "❗ CRITICAL: No build cache - first build will be slow"
fi

if [ "$CPU_CORES" = "1" ]; then
    echo "⚠️ WARNING: Only 1 CPU core - consider upgrading"
elif [ "$CPU_CORES" -lt "4" ]; then
    echo "⚠️ WARNING: Limited CPU cores ($CPU_CORES) - builds may be slower"
else
    echo "✅ GOOD: Sufficient CPU cores ($CPU_CORES)"
fi

# Memory check (extract numeric value)
MEM_GB=$(echo $AVAILABLE_MEM | sed 's/[^0-9.]*//g' | cut -d. -f1)
if [ -n "$MEM_GB" ] && [ "$MEM_GB" -lt "4" ]; then
    echo "⚠️ WARNING: Low available memory ($AVAILABLE_MEM) - may cause slow builds"
else
    echo "✅ GOOD: Sufficient memory ($AVAILABLE_MEM)"
fi

echo ""
echo "🚀 QUICK FIXES TO TRY:"
echo "1. npm run build:server:fast    # Use ultra-fast server build"
echo "2. ./build-linux.sh             # Use optimized Linux script"
echo "3. npm run clean && npm install # Clear cache and reinstall"
echo "4. npm run deploy:server        # Complete deployment script"

echo ""
echo "=================================="
echo "🔍 Diagnostic completed: $(date)"
