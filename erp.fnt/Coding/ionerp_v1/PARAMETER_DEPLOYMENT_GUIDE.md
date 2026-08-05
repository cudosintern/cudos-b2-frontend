# Parameter-Based Deployment Guide

## Overview
The new parameter-based deployment system allows you to specify homepage and API URL as command-line parameters, making it perfect for CI/CD pipelines like Jenkins.

## Command Format
```bash
npm run build:params homepage=<path|url> API=<api-url>
```

## Deployment Examples

### 1. Path-Based Deployment (Traditional)
For applications deployed on a path like `/erp_qa/` or `/erp_mit/`:
```bash
# QA Environment
npm run build:params homepage=erp_qa API=http://10.91.5.97:8000

# MIT Organization
npm run build:params homepage=erp_mit API=https://mit.ion-education.in/mit_backend

# Development Environment
npm run build:params homepage=erp_dev API=http://192.168.1.100:8001
```

### 2. URL-Based Deployment (Domain Root)
For applications deployed on a domain root:
```bash
# MIT Subdomain
npm run build:params homepage=https://mit.ion-education.in API=https://mit.ion-education.in/mit_backend

# Main Domain
npm run build:params homepage=https://www.ion-education.in API=https://www.ion-education.in/erp_backend

# Custom Domain
npm run build:params homepage=https://erp.mycompany.com API=https://api.mycompany.com/v1
```

### 3. Quoted Parameters (Jenkins Compatible)
For use in shell scripts and Jenkins pipelines:
```bash
npm run build:params homepage="erp_qa" API="http://10.91.5.97:8000"
npm run build:params homepage="https://mit.ion-education.in" API="https://mit.ion-education.in/mit_backend"
```

## Jenkins Pipeline Example

### Declarative Pipeline
```groovy
pipeline {
    agent any
    
    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['qa', 'staging', 'production'],
            description: 'Deployment environment'
        )
        string(
            name: 'HOMEPAGE',
            defaultValue: 'erp_qa',
            description: 'Homepage path or URL'
        )
        string(
            name: 'API_URL',
            defaultValue: 'http://10.91.5.97:8000',
            description: 'Backend API URL'
        )
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Build') {
            steps {
                script {
                    sh "npm run build:params homepage=\"${params.HOMEPAGE}\" API=\"${params.API_URL}\""
                }
            }
        }
        
        stage('Deploy') {
            steps {
                // Deploy build/ directory to your server
                sh 'rsync -av build/ user@server:/path/to/deployment/'
            }
        }
    }
}
```

### Scripted Pipeline
```groovy
node {
    stage('Checkout') {
        checkout scm
    }
    
    stage('Install') {
        sh 'npm ci'
    }
    
    stage('Build') {
        def homepage = env.HOMEPAGE ?: 'erp_qa'
        def apiUrl = env.API_URL ?: 'http://10.91.5.97:8000'
        
        sh "npm run build:params homepage=\"${homepage}\" API=\"${apiUrl}\""
    }
    
    stage('Deploy') {
        sh 'tar -czf build.tar.gz build/'
        // Deploy to server
    }
}
```

## What Gets Generated

### For Path-Based Deployment (`homepage=erp_qa`)
- **package.json homepage**: `/erp_qa/`
- **App.tsx basename**: `/erp_qa`
- **Assets URLs**: `/erp_qa/static/...`
- **Title**: `Ion ERP QA`
- **.htaccess**: Path-based routing rules
- **Available at**: `https://yourserver.com/erp_qa/`

### For URL-Based Deployment (`homepage=https://mit.ion-education.in`)
- **package.json homepage**: `/`
- **App.tsx basename**: ``
- **Assets URLs**: `/static/...`
- **Title**: `Ion ERP MIT`
- **.htaccess**: Domain root routing rules
- **Available at**: `https://mit.ion-education.in/`

## Generated Files
1. **build/** - Optimized production build
2. **build/.htaccess** - Apache configuration for SPA routing
3. **build/deployment-info.json** - Complete deployment metadata
4. **Updated .env.production** - API URL remains updated

## Environment Variables Set During Build
- `REACT_APP_BASENAME` - Set to the calculated basename
- All variables from `.env.production` including the updated `REACT_APP_API_URL`

## Error Handling
The script validates that both `homepage` and `API` parameters are provided and will exit with an error if either is missing.

## File Restoration
After the build completes:
- ✅ **package.json** - Restored to original state
- ✅ **App.tsx** - Restored to original state  
- ❗ **.env.production** - Keeps the new API URL (as requested)

## Parameter Formats Supported

### Homepage Parameter
- **Path format**: `erp_qa`, `erp_mit`, `erp_staging`
- **URL format**: `https://mit.ion-education.in`, `https://www.ion-education.in`

### API Parameter  
- **Local development**: `http://127.0.0.1:8001`, `http://localhost:8000`
- **Network servers**: `http://10.91.5.97:8000`, `http://192.168.1.100:8001`
- **Production domains**: `https://mit.ion-education.in/mit_backend`, `https://api.company.com/v1`

## Comparison with Other Methods

| Method | Command | Use Case |
|--------|---------|----------|
| **Standard** | `npm run build` | Manual builds with current config |
| **Dynamic** | `npm run build:deploy erp_mit` | Predefined deployment configurations |  
| **URL-based** | `npm run build:deploy https://mit.ion-education.in` | URL-specific deployments |
| **Parameter-based** | `npm run build:params homepage=erp_qa API=http://10.91.5.97:8000` | **CI/CD pipelines, flexible parameters** |

The parameter-based method is ideal for automated deployments where you need maximum flexibility and control over both the frontend routing and backend API configuration.
