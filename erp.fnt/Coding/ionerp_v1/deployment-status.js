#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📊 Dynamic Multi-Instance Deployment Status\n');

function findDeploymentDirs() {
  const directories = [];
  
  // Check for main build directory
  if (fs.existsSync(path.join(__dirname, 'build'))) {
    // Try to read deployment-info.json to get deployment details
    const deploymentInfoPath = path.join(__dirname, 'build', 'deployment-info.json');
    let deploymentInfo = null;
    
    try {
      if (fs.existsSync(deploymentInfoPath)) {
        deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    if (deploymentInfo && deploymentInfo.deployment) {
      directories.push({
        name: deploymentInfo.deployment.title,
        dir: 'build',
        url: deploymentInfo.deployment.homepage,
        deploymentName: deploymentInfo.deployment.deploymentName || 'erp'
      });
    } else {
      // Default fallback
      directories.push({
        name: 'Production',
        dir: 'build',
        url: '/erp/',
        deploymentName: 'erp'
      });
    }
  }
  
  return directories;
}

function checkDeployment(deployment) {
  const buildPath = path.join(__dirname, deployment.dir);
  const status = {
    name: deployment.name,
    dir: deployment.dir,
    url: deployment.url,
    exists: false,
    hasHtaccess: false,
    hasDeploymentInfo: false,
    buildTime: null,
    version: null,
    size: null
  };
  
  if (fs.existsSync(buildPath)) {
    status.exists = true;
    
    // Check .htaccess
    const htaccessPath = path.join(buildPath, '.htaccess');
    status.hasHtaccess = fs.existsSync(htaccessPath);
    
    // Check deployment-info.json
    const deploymentInfoPath = path.join(buildPath, 'deployment-info.json');
    if (fs.existsSync(deploymentInfoPath)) {
      status.hasDeploymentInfo = true;
      try {
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
        status.buildTime = deploymentInfo.buildTime;
        status.version = deploymentInfo.version;
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Calculate directory size
    try {
      const stats = fs.statSync(buildPath);
      if (stats.isDirectory()) {
        status.size = getFolderSize(buildPath);
      }
    } catch (e) {
      // Ignore size calculation errors
    }
  }
  
  return status;
}

function getFolderSize(folderPath) {
  let totalSize = 0;
  
  function calculateSize(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        calculateSize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  }
  
  try {
    calculateSize(folderPath);
    return formatBytes(totalSize);
  } catch (e) {
    return 'Unknown';
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleString();
  } catch (e) {
    return 'Invalid Date';
  }
}

function displayStatus(status) {
  const statusIcon = status.exists ? '✅' : '❌';
  const htaccessIcon = status.hasHtaccess ? '✅' : '❌';
  const deploymentInfoIcon = status.hasDeploymentInfo ? '✅' : '❌';
  
  console.log(`${statusIcon} ${status.name} (${status.dir})`);
  console.log(`   URL: ${status.url}`);
  
  if (status.exists) {
    console.log(`   Size: ${status.size || 'Unknown'}`);
    console.log(`   .htaccess: ${htaccessIcon}`);
    console.log(`   Deployment Info: ${deploymentInfoIcon}`);
    
    if (status.hasDeploymentInfo) {
      console.log(`   Build Time: ${formatDate(status.buildTime)}`);
      console.log(`   Version: ${status.version || 'Unknown'}`);
    }
  } else {
    console.log(`   Status: Not built yet`);
  }
  
  console.log('');
}

function generateSummary(statuses) {
  const total = statuses.length;
  const built = statuses.filter(s => s.exists).length;
  const withHtaccess = statuses.filter(s => s.hasHtaccess).length;
  const withDeploymentInfo = statuses.filter(s => s.hasDeploymentInfo).length;
  
  console.log('📈 Summary:');
  console.log(`   Total Deployments Found: ${total}`);
  console.log(`   Built: ${built}/${total}`);
  console.log(`   With .htaccess: ${withHtaccess}/${total}`);
  console.log(`   With Deployment Info: ${withDeploymentInfo}/${total}`);
  console.log('');
  
  if (built > 0) {
    console.log('🚀 Ready to deploy:');
    statuses.filter(s => s.exists).forEach(s => {
      console.log(`   • ${s.name}: Upload ${s.dir}/ to server${s.url}`);
    });
    console.log('');
  }
  
  console.log('💡 To create new deployments, use:');
  console.log('   npm run build:deploy erp                    # Production');
  console.log('   npm run build:deploy erp_snps              # SNPS organization');
  console.log('   npm run build:deploy erp_xyz_qa            # XYZ organization QA');
  console.log('   npm run build:deploy erp_abc_dev           # ABC organization Dev');
  console.log('   npm run build:deploy erp_company_staging   # Company organization Staging');
  console.log('');
  console.log('🔧 Or use the PowerShell version:');
  console.log('   npm run build:deploy:ps erp_myorg');
}

// Main execution
function main() {
  const deploymentDirs = findDeploymentDirs();
  
  if (deploymentDirs.length === 0) {
    console.log('📭 No deployments found.');
    console.log('');
    console.log('💡 Create your first deployment:');
    console.log('   npm run build:deploy erp');
    console.log('   npm run build:deploy erp_mit');
    console.log('   npm run build:deploy erp_xyz_qa');
    return;
  }
  
  console.log(`📊 Found ${deploymentDirs.length} deployment(s) in build directory:\n`);
  
  const statuses = deploymentDirs.map(checkDeployment);
  
  statuses.forEach(displayStatus);
  generateSummary(statuses);
}

main();
