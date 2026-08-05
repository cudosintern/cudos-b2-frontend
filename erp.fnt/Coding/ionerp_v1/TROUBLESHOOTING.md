# IONERP Build Troubleshooting Guide

## Quick Fixes for Common Issues

### 1. CSS Loading Errors
If you see errors like "Unknown word" in CSS files:
```bash
# Use vanilla React Scripts as fallback
npm run build:vanilla
```

### 2. Out of Memory Errors
```bash
# Increase Node.js memory limit
set NODE_OPTIONS=--max-old-space-size=8192
npm run build:fast
```

### 3. TypeScript Compilation Errors
```bash
# Clean TypeScript cache
npm run clean
npm run build:fast
```

### 4. Webpack Configuration Issues
If react-app-rewired causes problems:
```bash
# Use standard React Scripts
npm run build:vanilla
npm run start:vanilla
```

### 5. Dependency Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run build:fast
```

## Build Commands Reference

| Command | Purpose | Speed | Use Case |
|---------|---------|-------|----------|
| `npm run build:fast` | Ultra-fast build | ⚡⚡⚡ | Development testing |
| `npm run build:vanilla` | Fallback build | ⚡⚡ | Troubleshooting |
| `npm run build` | Production build | ⚡ | Final deployment |
| `npm run build:analyze` | Bundle analysis | ⚡ | Performance audit |

## Performance Monitoring

### PowerShell (Recommended)
```powershell
# Run with monitoring
.\build-monitor.ps1 -Fast

# Fallback if issues occur
.\build-monitor.ps1 -Vanilla
```

### Command Line
```bash
# Basic build
npm run build:fast

# With timing
echo "Start: %time%" & npm run build:fast & echo "End: %time%"
```

## Expected Build Times

| System Specs | Expected Time | Status |
|--------------|---------------|--------|
| 16GB RAM, SSD, i7 | 3-5 minutes | ✅ Excellent |
| 8GB RAM, SSD, i5 | 5-8 minutes | ✅ Good |
| 4GB RAM, HDD | 10-15 minutes | ⚠️ Consider upgrade |

## Optimization Checklist

- [ ] Node.js version 16+ installed
- [ ] At least 4GB free disk space
- [ ] Close unnecessary applications
- [ ] Use SSD storage (recommended)
- [ ] Run `npm run clean` before major builds
- [ ] Consider upgrading to 16GB+ RAM for best performance

## Still Having Issues?

1. **Check Node.js version**: `node --version` (should be 16+)
2. **Check available memory**: Task Manager → Performance → Memory
3. **Check disk space**: Ensure 5GB+ free space
4. **Try safe mode**: Use `npm run build:vanilla`
5. **Check for background processes**: Close IDEs, browsers during build

## Getting Help

If builds are still slow after following this guide:
1. Run `npm run build:analyze` to identify large dependencies
2. Check the generated `BUILD_OPTIMIZATION_GUIDE.md`
3. Consider removing unused dependencies
4. Implement lazy loading for large components
