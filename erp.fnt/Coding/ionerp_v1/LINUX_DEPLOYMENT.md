# IONERP Linux Server Deployment Guide

## Quick Fix for Rocky Linux 8 Server

### Problem
```bash
spawn react-app-rewired ENOENT
```

### Solution
Use the standard React Scripts build instead of react-app-rewired:

```bash
# Option 1: Use the Linux build script (Recommended)
chmod +x build-linux.sh
./build-linux.sh

# Option 2: Use npm scripts
npm run build:server

# Option 3: Direct command
NODE_OPTIONS="--max-old-space-size=8192" GENERATE_SOURCEMAP=false npm run build:vanilla
```

## Server Environment Setup

### 1. Node.js Requirements
```bash
# Check Node.js version (minimum 16.x)
node --version

# If Node.js is not installed or outdated:
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs -y
```

### 2. Build Dependencies
```bash
# Install build tools if needed
sudo yum groupinstall "Development Tools" -y
sudo yum install python3 make gcc gcc-c++ -y

# Clear npm cache
npm cache clean --force

# Install dependencies
npm install
```

### 3. Memory Optimization
```bash
# For servers with limited memory, set swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Build Commands for Different Scenarios

### Production Server (Recommended)
```bash
# Using the Linux script
./build-linux.sh

# Or using npm
npm run build:server
```

### If you need react-app-rewired features
```bash
# Install globally (not recommended for production)
npm install -g react-app-rewired

# Or ensure it's in local node_modules
npm install react-app-rewired --save-dev

# Then use
npm run build:rewired
```

### Fallback build (if above fails)
```bash
# Direct react-scripts build with optimizations
NODE_OPTIONS="--max-old-space-size=8192" \
GENERATE_SOURCEMAP=false \
DISABLE_ESLINT_PLUGIN=true \
npx react-scripts build
```

## Environment Variables for Server

Create a `.env.server` file:
```bash
REACT_APP_API_URL=http://your-api-server:port
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true
NODE_OPTIONS=--max-old-space-size=8192
TSC_COMPILE_ON_ERROR=true
SKIP_PREFLIGHT_CHECK=true
CI=false
```

## Troubleshooting Common Issues

### 1. ENOENT errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 2. Memory issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"
```

### 3. Permission issues (if running as root)
```bash
# Create a non-root user for builds (recommended)
useradd -m ionuser
chown -R ionuser:ionuser /path/to/ionerp_v1
su - ionuser
cd /path/to/ionerp_v1
npm run build:server
```

### 4. TypeScript compilation issues
```bash
# Clean TypeScript cache
rm -f .tsbuildinfo
npm run clean
npm run build:server
```

## Server Deployment Steps

1. **Prepare the server:**
   ```bash
   cd /path/to/ionerp_v1
   npm install --production=false
   ```

2. **Build the application:**
   ```bash
   ./build-linux.sh
   ```

3. **Deploy the build:**
   ```bash
   # Copy build folder to web server directory
   sudo cp -r build/* /var/www/html/erp/
   
   # Or for Apache
   sudo cp -r build/* /var/www/html/
   
   # Set proper permissions
   sudo chown -R apache:apache /var/www/html/
   sudo chmod -R 755 /var/www/html/
   ```

## Performance Monitoring

Check build performance:
```bash
# Time the build
time ./build-linux.sh

# Monitor memory usage during build
watch -n 1 'free -h && ps aux | grep node'
```

## Expected Results

- **Build time**: 3-7 minutes (depending on server specs)
- **Build size**: ~4-6 MB (gzipped)
- **Memory usage**: Peak ~6-8 GB during build

## Advanced Configuration

### For CI/CD pipelines:
```bash
#!/bin/bash
export CI=true
export NODE_OPTIONS="--max-old-space-size=8192"
npm ci --silent
npm run build:server
```

### For Docker containers:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=8192"
RUN npm run build:server
```

This guide should resolve your Rocky Linux 8 server build issues!
