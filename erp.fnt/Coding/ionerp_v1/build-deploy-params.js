const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to parse command line parameters
function parseCommandLineParams(args) {
  const params = {};
  
  args.forEach(arg => {
    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      // Remove quotes if present
      params[key] = value.replace(/^['"]|['"]$/g, '');
    }
  });
  
  return params;
}

// Function to determine if homepage is a URL or path
function parseHomepage(homepage) {
  if (homepage.startsWith('http://') || homepage.startsWith('https://')) {
    // URL format - use root deployment
    return {
      isUrl: true,
      homepage: "/",
      basename: "",
      deploymentUrl: homepage,
      orgName: homepage.includes('mit') ? 'MIT' : 'WWW'
    };
  } else {
    // Path format like 'erp_qa'
    const parts = homepage.split('_');
    const baseApp = parts[0]; // e.g., 'erp'
    const orgName = parts.slice(1).join('_'); // e.g., 'qa' or 'mit_qa'
    
    return {
      isUrl: false,
      homepage: `/${homepage}/`,
      basename: `/${homepage}`,
      deploymentUrl: null,
      orgName: orgName || baseApp
    };
  }
}

// Function to generate deployment title
function generateTitle(homepageConfig, environment = 'production') {
  const envSuffix = environment === 'production' ? '' : ` ${environment.toUpperCase()}`;
  
  if (homepageConfig.isUrl) {
    return `Ion ERP ${homepageConfig.orgName}${envSuffix}`;
  } else {
    const orgName = homepageConfig.orgName.toUpperCase();
    return `Ion ERP ${orgName}${envSuffix}`;
  }
}

// Function to update package.json homepage
function updatePackageJsonHomepage(homepage) {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Store original homepage
  const originalHomepage = packageJson.homepage;
  
  // Update homepage
  packageJson.homepage = homepage;
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`✓ Updated package.json homepage to: ${homepage}`);
  
  return originalHomepage;
}

// Function to update App.tsx basename
function updateAppTsxBasename(basename) {
  const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
  let appTsxContent = fs.readFileSync(appTsxPath, 'utf8');
  
  // Store original content
  const originalContent = appTsxContent;
  
  // Update the basename line
  const basenameRegex = /const basename = process\.env\.REACT_APP_BASENAME \|\| "[^"]*";/;
  const replacement = `const basename = process.env.REACT_APP_BASENAME || "${basename}";`;
  
  appTsxContent = appTsxContent.replace(basenameRegex, replacement);
  
  fs.writeFileSync(appTsxPath, appTsxContent);
  console.log(`✓ Updated App.tsx basename to: ${basename}`);
  
  return originalContent;
}

// Function to update .env.production API URL
function updateEnvProductionApiUrl(apiUrl) {
  const envPath = path.join(__dirname, '.env.production');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Store original content
  const originalContent = envContent;
  
  // Update API URL
  envContent = envContent.replace(
    /REACT_APP_API_URL=.*/,
    `REACT_APP_API_URL=${apiUrl}`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✓ Updated .env.production API URL to: ${apiUrl}`);
  
  return originalContent;
}

// Function to generate .htaccess file
function generateHtaccess(homepageConfig, buildDir) {
  let htaccessContent;
  
  if (homepageConfig.isUrl) {
    // Domain-based deployment - root .htaccess
    htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
`;
  } else {
    // Path-based deployment
    const basePath = homepageConfig.homepage.replace(/\/$/, ''); // Remove trailing slash
    htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase ${basePath}/
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . ${basePath}/index.html [L]
</IfModule>
`;
  }

  const htaccessPath = path.join(__dirname, buildDir, '.htaccess');
  fs.writeFileSync(htaccessPath, htaccessContent);
  console.log(`✓ Generated .htaccess file`);
}

// Function to update index.html title
function updateIndexHtmlTitle(title, buildDir) {
  const indexHtmlPath = path.join(__dirname, buildDir, 'index.html');
  let indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Update title
  indexHtmlContent = indexHtmlContent.replace(
    /<title>.*<\/title>/,
    `<title>${title}</title>`
  );
  
  fs.writeFileSync(indexHtmlPath, indexHtmlContent);
  console.log(`✓ Updated index.html title to: ${title}`);
}

// Function to create deployment info
function createDeploymentInfo(params, homepageConfig, title, buildDir) {
  const deploymentInfo = {
    deployment: {
      method: 'parameter-based',
      homepage: homepageConfig.homepage,
      basename: homepageConfig.basename,
      apiUrl: params.API,
      title: title,
      buildDir: buildDir,
      orgName: homepageConfig.orgName,
      isUrlDeploy: homepageConfig.isUrl,
      deploymentUrl: homepageConfig.deploymentUrl,
      parameters: params
    },
    buildTime: new Date().toISOString(),
    version: require('./package.json').version
  };
  
  const deploymentInfoPath = path.join(__dirname, buildDir, 'deployment-info.json');
  fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✓ Created deployment-info.json`);
}

// Function to format build time
function formatBuildTime(seconds) {
  if (seconds < 60) {
    return `${seconds.toFixed(2)} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Please specify deployment parameters');
    console.log('Usage: npm run build:params homepage=<path|url> API=<api-url>');
    console.log('Examples:');
    console.log('  npm run build:params homepage=erp_qa API=http://10.91.5.97:8000');
    console.log('  npm run build:params homepage=erp_mit API=https://mit.ion-education.in/mit_backend');
    console.log('  npm run build:params homepage=https://mit.ion-education.in API=https://mit.ion-education.in/mit_backend');
    console.log('  npm run build:params homepage="erp_qa" API="http://10.91.5.97:8000/"');
    console.log('');
    console.log('Parameters:');
    console.log('  homepage - Can be a path (erp_qa) or full URL (https://mit.ion-education.in)');
    console.log('  API      - Backend API URL');
    process.exit(1);
  }
  
  // Parse parameters
  const params = parseCommandLineParams(args);
  
  if (!params.homepage || !params.API) {
    console.error('❌ Both homepage and API parameters are required');
    console.log('Example: npm run build:params homepage=erp_qa API=http://10.91.5.97:8000');
    process.exit(1);
  }
  
  // Parse homepage configuration
  const homepageConfig = parseHomepage(params.homepage);
  const title = generateTitle(homepageConfig);
  const buildDir = 'build';
  
  console.log(`🎯 Deploying with parameters...`);
  console.log(`📂 Build directory: ${buildDir}`);
  console.log(`🌐 Homepage: ${homepageConfig.homepage}`);
  console.log(`🔗 Basename: ${homepageConfig.basename}`);
  console.log(`🔌 API URL: ${params.API}`);
  console.log(`🏷️  Title: ${title}`);
  console.log(`🏢 Organization: ${homepageConfig.orgName}`);
  if (homepageConfig.deploymentUrl) {
    console.log(`🌍 Deployment URL: ${homepageConfig.deploymentUrl}`);
  }
  console.log('─'.repeat(50));
  
  // Store original files for restoration
  let originalPackageJson, originalAppTsx, originalEnv;
  
  try {
    // Store original package.json
    originalPackageJson = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
    
    // Update files
    updatePackageJsonHomepage(homepageConfig.homepage);
    originalAppTsx = updateAppTsxBasename(homepageConfig.basename);
    originalEnv = updateEnvProductionApiUrl(params.API);
    
    // Set environment variable for basename
    process.env.REACT_APP_BASENAME = homepageConfig.basename;
    
    console.log(`🚀 Building application...`);
    const startTime = Date.now();
    
    // Build the application
    execSync('env-cmd -f .env.production react-app-rewired build', { 
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env, REACT_APP_BASENAME: homepageConfig.basename }
    });
    
    const endTime = Date.now();
    const buildTime = (endTime - startTime) / 1000;
    
    console.log(`✓ Build completed successfully in ${buildTime.toFixed(2)} seconds`);
    
    // Post-build updates
    updateIndexHtmlTitle(title, buildDir);
    generateHtaccess(homepageConfig, buildDir);
    createDeploymentInfo(params, homepageConfig, title, buildDir);
    
    console.log('─'.repeat(50));
    console.log(`🎉 Deployment successful!`);
    console.log(`⏱️  Build time: ${formatBuildTime(buildTime)}`);
    console.log(`📦 Build artifacts: ${buildDir}/`);
    console.log(`🚀 Deploy the contents of ${buildDir}/ to your server`);
    console.log(`🌐 Application will be available at: ${homepageConfig.homepage}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    // Restore original files
    if (originalPackageJson) {
      fs.writeFileSync(path.join(__dirname, 'package.json'), originalPackageJson);
      console.log('✓ Restored original package.json');
    }
    if (originalAppTsx) {
      fs.writeFileSync(path.join(__dirname, 'src', 'App.tsx'), originalAppTsx);
      console.log('✓ Restored original App.tsx');
    }
    
    // Note: Keep .env.production updated as requested
    console.log('📝 Note: .env.production remains updated with new API URL');
  }
}

// Run the script
main();
