const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define base deployment configuration
const baseDeploymentConfig = {
  production: {
    envFile: '.env.production',
    titleSuffix: ''
  },
  qa: {
    envFile: '.env.qa',
    titleSuffix: ' QA'
  },
  dev: {
    envFile: '.env.development',
    titleSuffix: ' Development'
  },
  staging: {
    envFile: '.env.staging',
    titleSuffix: ' Staging'
  }
};

// Function to parse deployment input and extract homepage and API URL
function parseDeploymentInput(input) {
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    // For non-URL deployments (like erp_mit, erp_qa), use localhost
    return {
      isUrl: false,
      homepage: null,
      apiUrl: 'http://127.0.0.1:8001',
      originalInput: input
    };
  }

  const url = new URL(input);
  
  // Check if the input already contains a backend path
  if (url.pathname && url.pathname !== '/') {
    // Full backend URL provided (e.g., https://mit.ion-education.in/mit_backend)
    const homepage = `${url.protocol}//${url.hostname}`;
    return {
      isUrl: true,
      homepage: homepage,
      apiUrl: input,
      originalInput: input,
      isFullBackendUrl: true
    };
  } else {
    // Only domain provided (e.g., https://mit.ion-education.in)
    const domain = url.hostname;
    let apiUrl;
    
    if (domain.includes('mit.ion-education.in')) {
      apiUrl = `${input.replace(/\/$/, '')}/mit_backend`;
    } else if (domain.includes('www.ion-education.in')) {
      apiUrl = `${input.replace(/\/$/, '')}/erp_backend`;
    } else {
      // Custom domain - default to erp_backend
      apiUrl = `${input.replace(/\/$/, '')}/erp_backend`;
    }
    
    return {
      isUrl: true,
      homepage: input,
      apiUrl: apiUrl,
      originalInput: input,
      isFullBackendUrl: false
    };
  }
}

// Function to generate deployment config dynamically
function generateDeploymentConfig(deploymentName) {
  const deploymentInfo = parseDeploymentInput(deploymentName);
  
  // Handle URL-based deployments
  if (deploymentInfo.isUrl) {
    const url = new URL(deploymentInfo.originalInput);
    const domain = url.hostname;
    
    // Determine organization name from domain
    let orgName = 'WWW';
    if (domain.includes('mit.ion-education.in') || deploymentInfo.apiUrl.includes('/mit_backend')) {
      orgName = 'MIT';
    } else if (domain.includes('www.ion-education.in')) {
      orgName = 'WWW';
    } else {
      orgName = domain.split('.')[0].toUpperCase();
    }
    
    return {
      homepage: "/",  // Root deployment for domain
      basename: "",   // Empty basename for domain root
      buildDir: "build",
      title: `Ion ERP ${orgName}`,
      envFile: '.env.production',
      orgName: orgName.toLowerCase(),
      environment: 'production',
      deploymentName: deploymentInfo.homepage,
      isDomainDeploy: true,
      apiUrl: deploymentInfo.apiUrl
    };
  }
  
  // Handle non-URL deployments (like erp_mit, erp_qa)
  const parts = deploymentName.split('_');
  const baseApp = parts[0]; // e.g., 'erp'
  const orgName = parts.slice(1, -1).join('_'); // e.g., 'mit' or 'xyz'
  const environment = parts[parts.length - 1]; // e.g., 'qa', 'dev', 'staging'
  
  // If no environment specified, assume production
  const env = baseDeploymentConfig[environment] ? environment : 'production';
  const actualOrgName = baseDeploymentConfig[environment] ? orgName : parts.slice(1).join('_');
  
  const basePath = actualOrgName ? `${baseApp}_${actualOrgName}` : baseApp;
  const title = actualOrgName ? 
    `Ion ERP ${actualOrgName.toUpperCase()}${baseDeploymentConfig[env].titleSuffix}` : 
    `Ion ERP${baseDeploymentConfig[env].titleSuffix}`;
  
  return {
    homepage: `/${basePath}/`,
    basename: `/${basePath}`,
    buildDir: "build", // Always use build directory
    title: title,
    envFile: baseDeploymentConfig[env].envFile,
    orgName: actualOrgName,
    environment: env,
    deploymentName: deploymentName,
    isDomainDeploy: false,
    apiUrl: deploymentInfo.apiUrl
  };
}

function updatePackageJson(config) {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Update homepage
  packageJson.homepage = config.homepage;
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`✓ Updated package.json homepage to: ${config.homepage}`);
}

function updateAppTsx(config) {
  const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
  let appTsxContent = fs.readFileSync(appTsxPath, 'utf8');
  
  // Replace the basename in Router component
  const routerRegex = /<Router\s+basename="[^"]*"/g;
  const replacement = `<Router basename="${config.basename}"`;
  
  appTsxContent = appTsxContent.replace(routerRegex, replacement);
  
  fs.writeFileSync(appTsxPath, appTsxContent);
  console.log(`✓ Updated App.tsx basename to: ${config.basename}`);
}

function updateIndexHtml(config, buildDir) {
  const indexHtmlPath = path.join(__dirname, buildDir, 'index.html');
  
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Update title
    htmlContent = htmlContent.replace(/<title>.*?<\/title>/, `<title>${config.title}</title>`);
    
    // Update base href if needed
    if (!htmlContent.includes('<base href=')) {
      htmlContent = htmlContent.replace(
        '<head>',
        `<head>\n    <base href="${config.homepage}">`
      );
    } else {
      htmlContent = htmlContent.replace(
        /<base href="[^"]*"/,
        `<base href="${config.homepage}"`
      );
    }
    
    fs.writeFileSync(indexHtmlPath, htmlContent);
    console.log(`✓ Updated index.html for ${config.title}`);
  }
}

function generateHtaccess(config, buildDir) {
  // For domain deployments (homepage="/"), use root-based .htaccess
  const isRootDeployment = config.homepage === "/";
  
  const htaccessContent = isRootDeployment ? 
    `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
` : 
    `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase ${config.homepage}
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . ${config.homepage}index.html [L]
</IfModule>
`;

  const htaccessPath = path.join(__dirname, buildDir, '.htaccess');
  fs.writeFileSync(htaccessPath, htaccessContent);
  console.log(`✓ Generated .htaccess file for ${config.title}`);
}

function createDeploymentInfo(config, buildDir) {
  const deploymentInfo = {
    deployment: config,
    buildTime: new Date().toISOString(),
    version: require('./package.json').version,
    basename: config.basename,
    homepage: config.homepage
  };
  
  const deploymentInfoPath = path.join(__dirname, buildDir, 'deployment-info.json');
  fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✓ Created deployment-info.json`);
}

function buildApp(config, envFile) {
  console.log(`🚀 Building application for ${config.deploymentName}...`);
  
  const startTime = Date.now();
  let originalEnvContent = null;
  const envPath = path.join(__dirname, envFile);
  
  try {
    // For domain deployments, update the .env.production file directly
    if (config.isDomainDeploy && config.apiUrl) {
      // Read and backup original .env content
      originalEnvContent = fs.readFileSync(envPath, 'utf8');
      
      // Update the API URL in the file
      const updatedContent = originalEnvContent.replace(
        /REACT_APP_API_URL=.*/,
        `REACT_APP_API_URL=${config.apiUrl}`
      );
      
      // Write updated content to .env.production
      fs.writeFileSync(envPath, updatedContent);
      console.log(`✓ Updated ${envFile} with API URL: ${config.apiUrl}`);
    }
    
    // Set environment variable for basename
    process.env.REACT_APP_BASENAME = config.basename;
    
    // Build the application
    execSync(`env-cmd -f ${envFile} react-app-rewired build`, { 
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env, REACT_APP_BASENAME: config.basename }
    });
    
    const endTime = Date.now();
    const buildTime = (endTime - startTime) / 1000; // Convert to seconds
    
    console.log(`✓ Build completed successfully in ${buildTime.toFixed(2)} seconds`);
    
    return {
      success: true,
      buildTime: buildTime,
      buildTimeFormatted: formatBuildTime(buildTime),
      originalEnvContent: originalEnvContent
    };
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    
    // Restore original .env content if there was an error
    if (originalEnvContent) {
      fs.writeFileSync(envPath, originalEnvContent);
      console.log('✓ Restored original .env.production content');
    }
    
    process.exit(1);
  } finally {
    // No cleanup needed - we're updating .env.production directly
  }
}

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

function main() {
  const args = process.argv.slice(2);
  const deploymentName = args[0];
  const customEnvFile = args[1];
  
  if (!deploymentName) {
    console.error('❌ Please specify a deployment name or URL');
    console.log('Usage: node build-deploy.js <deployment-name|url> [env-file]');
    console.log('Examples:');
    console.log('  node build-deploy.js erp                                           # Production build');
    console.log('  node build-deploy.js erp_mit                                       # Production build for MIT org');
    console.log('  node build-deploy.js erp_mit_qa                                    # QA build for MIT org');
    console.log('  node build-deploy.js https://www.ion-education.in                  # Domain deployment → /erp_backend');
    console.log('  node build-deploy.js https://mit.ion-education.in                  # MIT subdomain → /mit_backend');
    console.log('  node build-deploy.js https://mit.ion-education.in/mit_backend      # Full backend URL');
    console.log('  node build-deploy.js erp_mit .env.custom                           # Custom env file');
    console.log('');
    console.log('API URL patterns:');
    console.log('  • https://www.ion-education.in              → https://www.ion-education.in/erp_backend');
    console.log('  • https://mit.ion-education.in              → https://mit.ion-education.in/mit_backend');
    console.log('  • https://mit.ion-education.in/mit_backend  → https://mit.ion-education.in/mit_backend');
    console.log('  • erp_mit (local)                           → http://127.0.0.1:8001');
    process.exit(1);
  }
  
  // Generate dynamic configuration
  const config = generateDeploymentConfig(deploymentName);
  const envFile = customEnvFile || config.envFile;
  
  console.log(`🎯 Deploying ${config.title}...`);
  console.log(`📂 Build directory: ${config.buildDir}`);
  console.log(`🌐 Homepage: ${config.homepage}`);
  console.log(`🔗 Basename: ${config.basename}`);
  console.log(`📄 Environment file: ${envFile}`);
  if (config.orgName) {
    console.log(`🏢 Organization: ${config.orgName.toUpperCase()}`);
  }
  console.log(`🚀 Environment: ${config.environment}`);
  if (config.apiUrl) {
    console.log(`🔌 API URL: ${config.apiUrl}`);
  }
  console.log('─'.repeat(50));
  
  // Store original package.json
  const originalPackageJson = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
  
  try {
    // Update package.json
    updatePackageJson(config);
    
    // Update App.tsx
    updateAppTsx(config);
    
    // Build the application
    const buildResult = buildApp(config, envFile);
    
    // Post-build updates (directly to build directory)
    updateIndexHtml(config, config.buildDir);
    generateHtaccess(config, config.buildDir);
    createDeploymentInfo(config, config.buildDir);
    
    console.log('─'.repeat(50));
    console.log(`🎉 Deployment successful!`);
    console.log(`⏱️  Build time: ${buildResult.buildTimeFormatted}`);
    console.log(`📦 Build artifacts: ${config.buildDir}/`);
    console.log(`🚀 Deploy the contents of ${config.buildDir}/ to your server`);
    console.log(`🌐 Application will be available at: ${config.homepage}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    // Restore original package.json (but keep updated .env.production)
    fs.writeFileSync(path.join(__dirname, 'package.json'), originalPackageJson);
    console.log('✓ Restored original package.json');
    
    // Note: .env.production remains updated with the new API URL
  }
}

// Run the script
main();
