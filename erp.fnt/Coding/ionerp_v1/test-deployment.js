#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing Dynamic Multi-Instance Deployment System\n');

// Test configurations - now with dynamic organization names
const testConfigs = [
  { deploymentName: 'erp', expected: '/erp', buildDir: 'build' },
  { deploymentName: 'erp_snps', expected: '/erp_snps', buildDir: 'build_snps' },
  { deploymentName: 'erp_snps_qa', expected: '/erp_snps', buildDir: 'build_snps_qa' },
  { deploymentName: 'erp_xyz_dev', expected: '/erp_xyz', buildDir: 'build_xyz_dev' },
  { deploymentName: 'erp_abc_staging', expected: '/erp_abc', buildDir: 'build_abc_staging' }
];

function testDeploymentConfig(deploymentName, expectedBasename, expectedBuildDir) {
  console.log(`Testing ${deploymentName} deployment...`);
  
  try {
    // Run the deployment
    console.log(`  → Building ${deploymentName}...`);
    execSync(`node build-deploy.js ${deploymentName}`, { 
      stdio: 'pipe',
      cwd: __dirname
    });
    
    // Check if build directory exists
    const buildPath = path.join(__dirname, expectedBuildDir);
    
    if (!fs.existsSync(buildPath)) {
      throw new Error(`Build directory ${expectedBuildDir} not found`);
    }
    console.log(`  ✓ Build directory created: ${expectedBuildDir}`);
    
    // Check .htaccess file
    const htaccessPath = path.join(buildPath, '.htaccess');
    if (!fs.existsSync(htaccessPath)) {
      throw new Error('.htaccess file not found');
    }
    
    const htaccessContent = fs.readFileSync(htaccessPath, 'utf8');
    if (!htaccessContent.includes(`RewriteBase ${expectedBasename}/`)) {
      throw new Error(`RewriteBase not set correctly in .htaccess`);
    }
    console.log(`  ✓ .htaccess file generated with correct RewriteBase`);
    
    // Check deployment-info.json
    const deploymentInfoPath = path.join(buildPath, 'deployment-info.json');
    if (!fs.existsSync(deploymentInfoPath)) {
      throw new Error('deployment-info.json not found');
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
    if (deploymentInfo.basename !== expectedBasename) {
      throw new Error(`Basename mismatch: expected ${expectedBasename}, got ${deploymentInfo.basename}`);
    }
    console.log(`  ✓ deployment-info.json created with correct basename`);
    
    // Check index.html
    const indexPath = path.join(buildPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error('index.html not found');
    }
    
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    if (!indexContent.includes(`<base href="${expectedBasename}/"`)) {
      throw new Error(`Base href not set correctly in index.html`);
    }
    console.log(`  ✓ index.html updated with correct base href`);
    
    console.log(`  🎉 ${deploymentName} deployment test passed!\n`);
    return true;
    
  } catch (error) {
    console.log(`  ❌ ${deploymentName} deployment test failed: ${error.message}\n`);
    return false;
  }
}

function testPackageJsonRestore() {
  console.log('Testing package.json restoration...');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  const originalContent = fs.readFileSync(packageJsonPath, 'utf8');
  const originalPackage = JSON.parse(originalContent);
  
  if (originalPackage.homepage !== '/erp/') {
    console.log('  ❌ package.json was not restored to original state');
    return false;
  }
  
  console.log('  ✓ package.json restored to original state\n');
  return true;
}

function cleanup() {
  console.log('🧹 Cleaning up test artifacts...');
  
  // Get all build directories that match our test pattern
  const buildDirs = ['build_snps', 'build_snps_qa', 'build_xyz_dev', 'build_abc_staging'];
  
  buildDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true });
      console.log(`  ✓ Removed ${dir}`);
    }
  });
  
  console.log('');
}

// Run tests
async function runTests() {
  let passedTests = 0;
  let totalTests = testConfigs.length + 1; // +1 for package.json restore test
  
  // Test each configuration
  for (const config of testConfigs) {
    if (testDeploymentConfig(config.deploymentName, config.expected, config.buildDir)) {
      passedTests++;
    }
  }
  
  // Test package.json restoration
  if (testPackageJsonRestore()) {
    passedTests++;
  }
  
  // Cleanup
  cleanup();
  
  // Summary
  console.log('📊 Test Results:');
  console.log(`  Passed: ${passedTests}/${totalTests}`);
  console.log(`  Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('  🎉 All tests passed! Dynamic multi-instance deployment is working correctly.');
    console.log('  📝 You can now use deployment names like:');
    console.log('     • erp (production)');
    console.log('     • erp_snps (SNPS organization)');
    console.log('     • erp_xyz_qa (XYZ organization QA)');
    console.log('     • erp_abc_dev (ABC organization development)');
    console.log('     • erp_company_staging (Company organization staging)');
    process.exit(0);
  } else {
    console.log('  ❌ Some tests failed. Please check the issues above.');
    process.exit(1);
  }
}

// Run the tests
runTests();
