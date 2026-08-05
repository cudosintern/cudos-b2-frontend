# Dynamic Multi-Instance Deployment Guide

This guide explains how to deploy multiple instances of the Ion ERP application with dynamic organization names on the same server.

## 🚀 Overview

The dynamic build system allows you to create unlimited deployments with unique:
- Organization names (e.g., `snps`, `xyz`, `abc`)
- Environment types (production, qa, dev, staging)
- Base paths and routing
- Automatically generated configurations

## 📋 Deployment Name Format

The deployment name follows this pattern:
```
erp[_organization][_environment]
```

### Examples:
- `erp` → Production deployment (`/erp/`)
- `erp_snps` → SNPS organization production (`/erp_snps/`)
- `erp_xyz_qa` → XYZ organization QA (`/erp_xyz/`)
- `erp_abc_dev` → ABC organization development (`/erp_abc/`)
- `erp_company_staging` → Company organization staging (`/erp_company/`)

## 🛠️ Build Commands

### Using npm scripts:
```bash
# Primary deployment command
npm run build:deploy <deployment-name>

# Examples:
npm run build:deploy erp                    # Production
npm run build:deploy erp_snps              # SNPS organization
npm run build:deploy erp_xyz_qa            # XYZ organization QA
npm run build:deploy erp_abc_dev           # ABC organization Dev
npm run build:deploy erp_company_staging   # Company organization Staging

# With custom environment file:
npm run build:deploy erp_snps_qa .env.custom
```

### Using PowerShell (Windows):
```powershell
npm run build:deploy:ps <deployment-name>

# Examples:
npm run build:deploy:ps erp_snps
npm run build:deploy:ps erp_xyz_qa
```

### Direct script execution:
```bash
# Node.js
node build-deploy.js erp_snps_qa
node build-deploy.js erp_xyz .env.custom

# PowerShell
powershell -ExecutionPolicy Bypass -File build-deploy.ps1 erp_snps_qa
```

## 📁 Generated Directory Structure

Each deployment creates its own build directory:

```
build/                    # erp (production)
build_snps/              # erp_snps (SNPS production)
build_snps_qa/           # erp_snps_qa (SNPS QA)
build_xyz_dev/           # erp_xyz_dev (XYZ development)
build_company_staging/   # erp_company_staging (Company staging)
```

## 🌐 URL Mapping

| Deployment Name | URL Path | Build Directory |
|----------------|----------|----------------|
| `erp` | `/erp/` | `build/` |
| `erp_snps` | `/erp_snps/` | `build_snps/` |
| `erp_xyz_qa` | `/erp_xyz/` | `build_xyz_qa/` |
| `erp_abc_dev` | `/erp_abc/` | `build_abc_dev/` |
| `erp_company_staging` | `/erp_company/` | `build_company_staging/` |

## 🔧 Environment Configuration

The system automatically selects environment files based on the deployment name:

- **Production**: `.env.production` (default)
- **QA**: `.env.qa`
- **Development**: `.env.development`
- **Staging**: `.env.staging`

### Environment File Examples:

**.env.production**
```env
REACT_APP_ENV=production
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_TITLE=Ion ERP
GENERATE_SOURCEMAP=false
```

**.env.qa**
```env
REACT_APP_ENV=qa
REACT_APP_API_URL=https://api-qa.yourdomain.com
REACT_APP_TITLE=Ion ERP QA
GENERATE_SOURCEMAP=false
```

## 🎯 Build Process

When you run a build command, the system:

1. **Parses** the deployment name to extract organization and environment
2. **Generates** dynamic configuration (homepage, basename, title)
3. **Updates** package.json temporarily
4. **Sets** environment variables
5. **Builds** the React application
6. **Creates** environment-specific build directory
7. **Generates** .htaccess file for Apache
8. **Creates** deployment-info.json metadata
9. **Restores** original package.json

## 🚀 Server Deployment

### Apache Setup

Upload each build directory to your web server:

```
/var/www/html/
├── erp/                 # Main production
├── erp_snps/           # SNPS organization
├── erp_xyz/            # XYZ organization
└── erp_company/        # Company organization
```

The generated .htaccess files handle:
- Client-side routing
- Security headers
- Gzip compression
- Browser caching

### Nginx Setup

For Nginx, create location blocks for each deployment:

```nginx
# Main production
location /erp/ {
    alias /var/www/html/erp/;
    try_files $uri $uri/ /erp/index.html;
}

# SNPS organization
location /erp_snps/ {
    alias /var/www/html/erp_snps/;
    try_files $uri $uri/ /erp_snps/index.html;
}

# XYZ organization
location /erp_xyz/ {
    alias /var/www/html/erp_xyz/;
    try_files $uri $uri/ /erp_xyz/index.html;
}
```

## 📊 Monitoring and Testing

### Check Deployment Status:
```bash
npm run status:deployment
```

### Test All Deployments:
```bash
npm run test:deployment
```

### Manual Testing:
```bash
# Test specific deployment
node build-deploy.js erp_test_org
```

## 🔍 Troubleshooting

### Common Issues:

1. **Build fails**: Check environment file exists
2. **Routing issues**: Verify basename matches URL path
3. **Assets not loading**: Check homepage in package.json
4. **Permission errors**: Ensure scripts have execute permissions

### Debug Information:

Each deployment creates a `deployment-info.json` file:
```json
{
  "deployment": {
    "homepage": "/erp_snps/",
    "basename": "/erp_snps",
    "buildDir": "build_snps",
    "title": "Ion ERP SNPS",
    "orgName": "snps",
    "environment": "production"
  },
  "buildTime": "2025-01-17T10:30:00.000Z",
  "version": "0.1.0"
}
```

## 📝 Examples

### Scenario 1: Multiple Organizations
```bash
# Create deployments for different organizations
npm run build:deploy erp_snps      # SNPS production
npm run build:deploy erp_xyz       # XYZ production
npm run build:deploy erp_abc       # ABC production
```

### Scenario 2: Different Environments
```bash
# Create QA environment for SNPS
npm run build:deploy erp_snps_qa

# Create development environment for XYZ
npm run build:deploy erp_xyz_dev

# Create staging environment for ABC
npm run build:deploy erp_abc_staging
```

### Scenario 3: Custom Environment Files
```bash
# Use custom environment file
npm run build:deploy erp_snps .env.custom
npm run build:deploy erp_xyz_qa .env.special
```

## 🎉 Benefits

✅ **Unlimited organizations** - Add as many as needed  
✅ **Flexible naming** - Use any organization name  
✅ **Environment separation** - QA, dev, staging support  
✅ **Automatic configuration** - No manual setup required  
✅ **Apache/Nginx ready** - Generated .htaccess files  
✅ **Easy deployment** - Single command builds  
✅ **Comprehensive testing** - Built-in test suite  

## 🔒 Security

- Source maps disabled in production
- Security headers automatically added
- Source files protected by .htaccess
- Each deployment isolated by path

## 📞 Support

For issues or questions:
1. Check build logs for error messages
2. Run `npm run status:deployment` to check current deployments
3. Run `npm run test:deployment` to test the system
4. Verify environment files exist and are properly configured
