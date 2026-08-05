#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}.${Math.floor(remainingSeconds/6)} minutes (${seconds} seconds)`;
  }
  return `${seconds} seconds`;
}

function formatSize(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function getBuildInfo() {
  try {
    const buildPath = path.join(process.cwd(), 'build');
    if (!fs.existsSync(buildPath)) {
      return null;
    }

    const staticPath = path.join(buildPath, 'static');
    let totalSize = 0;
    let fileCount = 0;

    function calculateSize(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          calculateSize(filePath);
        } else {
          totalSize += stat.size;
          fileCount++;
        }
      });
    }

    if (fs.existsSync(staticPath)) {
      calculateSize(staticPath);
    }

    return { totalSize, fileCount };
  } catch (error) {
    return null;
  }
}

function printBuildAnalysis(command, startTime, endTime, success = true) {
  const duration = endTime - startTime;
  const buildInfo = getBuildInfo();
  
  console.log(`${colors.green}${'='.repeat(50)}${colors.reset}`);
  
  if (success) {
    console.log(`${colors.green}${colors.bold}🚀 Build completed successfully!${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}❌ Build failed!${colors.reset}`);
  }
  
  console.log(`${colors.blue}Command: ${colors.cyan}${command}${colors.reset}`);
  console.log(`${colors.blue}Build finished at: ${colors.yellow}${new Date(endTime).toLocaleString()}${colors.reset}`);
  console.log(`${colors.blue}Build duration: ${colors.green}${colors.bold}${formatTime(duration)}${colors.reset}`);
  
  if (buildInfo) {
    console.log(`${colors.blue}Total build size: ${colors.yellow}${formatSize(buildInfo.totalSize)}${colors.reset}`);
    console.log(`${colors.blue}Files generated: ${colors.yellow}${buildInfo.fileCount}${colors.reset}`);
  }
  
  console.log(`${colors.green}${'='.repeat(50)}${colors.reset}`);
  
  // Performance rating
  const minutes = duration / (1000 * 60);
  let rating = '';
  if (minutes < 2) {
    rating = `${colors.green}⚡ EXCELLENT (< 2 min)${colors.reset}`;
  } else if (minutes < 5) {
    rating = `${colors.blue}🚀 GOOD (< 5 min)${colors.reset}`;
  } else if (minutes < 10) {
    rating = `${colors.yellow}⏱️ AVERAGE (< 10 min)${colors.reset}`;
  } else {
    rating = `${colors.red}🐌 SLOW (> 10 min)${colors.reset}`;
  }
  
  console.log(`${colors.blue}Performance: ${rating}`);
  console.log(`${colors.green}${'='.repeat(50)}${colors.reset}`);
}

// Main execution
if (require.main === module) {
  const command = process.argv[2] || 'npm run build:fast';
  const startTime = Date.now();
  
  console.log(`${colors.cyan}🚀 Starting build analysis...${colors.reset}`);
  console.log(`${colors.blue}Command: ${colors.yellow}${command}${colors.reset}`);
  console.log(`${colors.blue}Started at: ${colors.yellow}${new Date(startTime).toLocaleString()}${colors.reset}`);
  console.log(`${colors.green}${'='.repeat(50)}${colors.reset}`);
  
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    const endTime = Date.now();
    printBuildAnalysis(command, startTime, endTime, true);
  } catch (error) {
    const endTime = Date.now();
    printBuildAnalysis(command, startTime, endTime, false);
    process.exit(1);
  }
}

module.exports = { printBuildAnalysis, formatTime, formatSize };
