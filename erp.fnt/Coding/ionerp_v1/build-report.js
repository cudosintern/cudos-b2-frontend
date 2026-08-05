#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Enhanced analysis with exact format matching
function createBuildReport(command, startTime, endTime, success = true) {
  const duration = endTime - startTime;
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  // Format like: "1.6 minutes (93 seconds)"
  const formattedDuration = minutes > 0 
    ? `${(duration / (1000 * 60)).toFixed(1)} minutes (${seconds} seconds)`
    : `${seconds} seconds`;

  const buildInfo = getBuildInfo();
  const timestamp = new Date(endTime).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  console.log('\n' + '='.repeat(50));
  console.log('\x1b[32m\x1b[1m🚀 Build completed successfully!\x1b[0m');
  console.log(`\x1b[36mBuild finished at: \x1b[33m${timestamp}\x1b[0m`);
  console.log(`\x1b[36mBuild duration: \x1b[32m\x1b[1m${formattedDuration}\x1b[0m`);
  
  if (buildInfo) {
    console.log(`\x1b[36mTotal build size: \x1b[33m${formatSize(buildInfo.totalSize)}\x1b[0m`);
    console.log(`\x1b[36mFiles generated: \x1b[33m${buildInfo.fileCount}\x1b[0m`);
    
    // Show largest chunks
    const chunks = getLargestChunks();
    if (chunks.length > 0) {
      console.log(`\x1b[36mLargest chunks:\x1b[0m`);
      chunks.slice(0, 3).forEach(chunk => {
        console.log(`  \x1b[33m${chunk.name}\x1b[0m: \x1b[32m${formatSize(chunk.size)}\x1b[0m`);
      });
    }
  }
  
  console.log('='.repeat(50));
  
  // Performance badge
  const performanceInfo = getPerformanceInfo(duration);
  console.log(`\x1b[${performanceInfo.color}m${performanceInfo.badge}\x1b[0m`);
  console.log('='.repeat(50));
}

function getBuildInfo() {
  try {
    const buildPath = path.join(process.cwd(), 'build');
    if (!fs.existsSync(buildPath)) return null;

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

function getLargestChunks() {
  try {
    const jsPath = path.join(process.cwd(), 'build', 'static', 'js');
    if (!fs.existsSync(jsPath)) return [];
    
    const files = fs.readdirSync(jsPath)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const filePath = path.join(jsPath, file);
        const stat = fs.statSync(filePath);
        return { name: file, size: stat.size };
      })
      .sort((a, b) => b.size - a.size);
    
    return files;
  } catch (error) {
    return [];
  }
}

function formatSize(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function getPerformanceInfo(duration) {
  const minutes = duration / (1000 * 60);
  
  if (minutes < 1.5) {
    return { badge: '🚀 BLAZING FAST BUILD!', color: '32;1' }; // Bright green
  } else if (minutes < 3) {
    return { badge: '⚡ EXCELLENT PERFORMANCE', color: '32' }; // Green
  } else if (minutes < 5) {
    return { badge: '✅ GOOD PERFORMANCE', color: '36' }; // Cyan
  } else if (minutes < 10) {
    return { badge: '⏱️  AVERAGE PERFORMANCE', color: '33' }; // Yellow
  } else {
    return { badge: '🐌 NEEDS OPTIMIZATION', color: '31' }; // Red
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2] || 'npm run build:fast';
  const startTime = Date.now();
  
  console.log('\x1b[36m🚀 Build Analysis Started\x1b[0m');
  console.log('\x1b[90m' + '='.repeat(50) + '\x1b[0m');
  
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    const endTime = Date.now();
    createBuildReport(command, startTime, endTime, true);
  } catch (error) {
    const endTime = Date.now();
    createBuildReport(command, startTime, endTime, false);
    process.exit(1);
  }
}

module.exports = { createBuildReport };
