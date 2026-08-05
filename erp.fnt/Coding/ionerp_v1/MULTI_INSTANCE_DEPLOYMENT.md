# Multi-Instance Deployment Guide

This guide explains how to deploy multiple instances of the Ion ERP application on the same server using dynamic build configurations.

## Overview

The dynamic build system allows you to create multiple deployments of your React application with different:
- Base paths (homepage URLs)
- Router basenames
- Build directories
- Environment configurations
- Automatically generated .htaccess files

## Available Environments

- **erp**: Production environment (`/erp/`)
- **erp_qa**: QA environment (`/erp_qa/`)
- **erp_dev**: Development environment (`/erp_dev/`)
- **erp_staging**: Staging environment (`/erp_staging/`)

## Build Commands

### Using Node.js (Recommended)

```bash
# Build for production
npm run build:erp

# Build for QA
npm run build:erp_qa

# Build for development
npm run build:erp_dev

# Build for staging
npm run build:erp_staging

# Build with fast settings
npm run build:erp:fast
npm run build:erp_qa:fast
```

### Using PowerShell (Windows)

```powershell
# Build for production
npm run build:erp:ps

# Build for QA
npm run build:erp_qa:ps

# Build for development  
npm run build:erp_dev:ps

# Build for staging
npm run build:erp_staging:ps
```

### Manual Build (Advanced)

```bash
# Using Node.js script
node build-deploy.js erp_qa .env.staging

# Using PowerShell script
powershell -ExecutionPolicy Bypass -File build-deploy.ps1 erp_qa .env.staging
```

## What Happens During Build

1. **Package.json Update**: Homepage is temporarily updated
2. **App.tsx Update**: Router basename is updated
3. **Environment Variables**: `REACT_APP_BASENAME` is set
4. **Build Process**: React app is built with environment-specific settings
5. **Post-Build Processing**:
   - Updates index.html with correct title and base href
   - Generates .htaccess file for Apache
   - Creates deployment-info.json with build metadata
   - Copies build files to environment-specific directory
6. **Cleanup**: Original package.json is restored

## Generated Files

Each build creates:
- `build_[environment]/` - Build artifacts directory
- `build_[environment]/.htaccess` - Apache configuration
- `build_[environment]/deployment-info.json` - Build metadata

## Server Deployment

### Apache Setup

1. Upload the contents of `build_[environment]/` to your web server
2. Ensure the directory structure on your server matches:
   ```
   /var/www/html/
   ├── erp/          # Production build
   ├── erp_qa/       # QA build
   ├── erp_dev/      # Development build
   └── erp_staging/  # Staging build
   ```

3. The .htaccess file will handle:
   - Client-side routing
   - Security headers
   - Gzip compression
   - Browser caching
   - Source file protection

### Nginx Setup

For Nginx, you'll need to configure similar rules manually:

```nginx
# Production instance
location /erp/ {
    alias /var/www/html/erp/;
    try_files $uri $uri/ /erp/index.html;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
}

# QA instance
location /erp_qa/ {
    alias /var/www/html/erp_qa/;
    try_files $uri $uri/ /erp_qa/index.html;
    
    # Same headers as above
}
```

## Environment Configuration

Create environment-specific `.env` files:

### .env.production
```
REACT_APP_ENV=production
REACT_APP_BASENAME=/erp
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_TITLE=Ion ERP
GENERATE_SOURCEMAP=false
```

### .env.qa
```
REACT_APP_ENV=qa
REACT_APP_BASENAME=/erp_qa
REACT_APP_API_URL=https://api-qa.yourdomain.com
REACT_APP_TITLE=Ion ERP QA
GENERATE_SOURCEMAP=false
```

## Adding New Environments

1. Edit `build-deploy.js` and `build-deploy.ps1`
2. Add new environment to `deploymentConfigs`:
   ```javascript
   erp_demo: {
     homepage: "/erp_demo/",
     basename: "/erp_demo",
     buildDir: "build_demo",
     title: "Ion ERP Demo"
   }
   ```

3. Add corresponding npm scripts to package.json:
   ```json
   "build:erp_demo": "node build-deploy.js erp_demo .env.demo"
   ```

4. Create `.env.demo` file with appropriate settings

## Troubleshooting

### Common Issues

1. **Build fails**: Check that all environment files exist
2. **Routing issues**: Verify basename matches server path
3. **Assets not loading**: Check homepage setting in package.json
4. **Permission errors**: Ensure build scripts have execute permissions

### Debugging

Check the generated `deployment-info.json` for build details:
```json
{
  "deployment": {
    "homepage": "/erp_qa/",
    "basename": "/erp_qa",
    "buildDir": "build_qa",
    "title": "Ion ERP QA"
  },
  "buildTime": "2025-01-17T10:30:00.000Z",
  "version": "0.1.0"
}
```

## Best Practices

1. **Test locally**: Use `npm run preview:erp` to test builds
2. **Environment separation**: Use different API endpoints for each environment
3. **Database isolation**: Each environment should have its own database
4. **Monitoring**: Set up monitoring for each deployment
5. **Automated deployment**: Consider CI/CD pipelines for automatic deployment

## Security Considerations

- Source maps are disabled in production builds
- .htaccess prevents access to source files
- Security headers are automatically added
- Each environment is isolated by path

## Support

For issues or questions:
1. Check the build logs for error messages
2. Verify environment configuration files
3. Test the .htaccess file separately
4. Check server logs for deployment issues
