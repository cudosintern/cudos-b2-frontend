param(
    [Parameter(Mandatory=$true)]
    [string]$DeploymentName,
    [string]$CustomEnvFile = $null
)

# Define base deployment configuration
$baseDeploymentConfig = @{
    production = @{
        envFile = ".env.production"
        titleSuffix = ""
    }
    qa = @{
        envFile = ".env.qa"
        titleSuffix = " QA"
    }
    dev = @{
        envFile = ".env.development"
        titleSuffix = " Development"
    }
    staging = @{
        envFile = ".env.staging"
        titleSuffix = " Staging"
    }
}

# Function to generate deployment config dynamically
function New-DeploymentConfig($deploymentName) {
    $parts = $deploymentName -split '_'
    $baseApp = $parts[0]  # e.g., 'erp'
    $orgName = if ($parts.Length -gt 2) { ($parts[1..($parts.Length-2)] -join '_') } else { $null }
    $environment = if ($parts.Length -gt 1) { $parts[-1] } else { 'production' }
    
    # If no environment specified, assume production
    $env = if ($baseDeploymentConfig.ContainsKey($environment)) { $environment } else { 'production' }
    $actualOrgName = if ($baseDeploymentConfig.ContainsKey($environment)) { $orgName } else { ($parts[1..($parts.Length-1)] -join '_') }
    
    $basePath = if ($actualOrgName) { "$baseApp" + "_$actualOrgName" } else { $baseApp }
    $title = if ($actualOrgName) { 
        "Ion ERP $($actualOrgName.ToUpper())$($baseDeploymentConfig[$env].titleSuffix)" 
    } else { 
        "Ion ERP$($baseDeploymentConfig[$env].titleSuffix)" 
    }
    
    return @{
        homepage = "/$basePath/"
        basename = "/$basePath"
        buildDir = "build"
        title = $title
        envFile = $baseDeploymentConfig[$env].envFile
        orgName = $actualOrgName
        environment = $env
        deploymentName = $deploymentName
    }
}

function Update-PackageJson($config) {
    $packageJsonPath = Join-Path $PSScriptRoot "package.json"
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    
    $packageJson.homepage = $config.homepage
    
    $packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath
    Write-Host "✓ Updated package.json homepage to: $($config.homepage)" -ForegroundColor Green
}

function Update-AppTsx($config) {
    $appTsxPath = Join-Path $PSScriptRoot "src\App.tsx"
    $appTsxContent = Get-Content $appTsxPath -Raw
    
    $appTsxContent = $appTsxContent -replace '<Router\s+basename="[^"]*"', "<Router basename=`"$($config.basename)`""
    
    Set-Content $appTsxPath $appTsxContent
    Write-Host "✓ Updated App.tsx basename to: $($config.basename)" -ForegroundColor Green
}

function Update-IndexHtml($config, $buildDir) {
    $indexHtmlPath = Join-Path $PSScriptRoot "$buildDir\index.html"
    
    if (Test-Path $indexHtmlPath) {
        $htmlContent = Get-Content $indexHtmlPath -Raw
        
        $htmlContent = $htmlContent -replace '<title>.*?</title>', "<title>$($config.title)</title>"
        
        if ($htmlContent -notmatch '<base href=') {
            $htmlContent = $htmlContent -replace '<head>', "<head>`n    <base href=`"$($config.homepage)`">"
        } else {
            $htmlContent = $htmlContent -replace '<base href="[^"]*"', "<base href=`"$($config.homepage)`""
        }
        
        Set-Content $indexHtmlPath $htmlContent
        Write-Host "✓ Updated index.html for $($config.title)" -ForegroundColor Green
    }
}

function New-Htaccess($config, $buildDir) {
    $htaccessContent = @"
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase $($config.homepage)
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . $($config.homepage)index.html [L]
</IfModule>
"@

    $htaccessPath = Join-Path $PSScriptRoot "$buildDir\.htaccess"
    Set-Content $htaccessPath $htaccessContent
    Write-Host "✓ Generated .htaccess file for $($config.title)" -ForegroundColor Green
}

function New-DeploymentInfo($config, $buildDir) {
    $packageJson = Get-Content (Join-Path $PSScriptRoot "package.json") -Raw | ConvertFrom-Json
    
    $deploymentInfo = @{
        deployment = $config
        buildTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        version = $packageJson.version
        basename = $config.basename
        homepage = $config.homepage
    }
    
    $deploymentInfoPath = Join-Path $PSScriptRoot "$buildDir\deployment-info.json"
    $deploymentInfo | ConvertTo-Json -Depth 100 | Set-Content $deploymentInfoPath
    Write-Host "✓ Created deployment-info.json" -ForegroundColor Green
}

function Invoke-AppBuild($config, $envFile) {
    Write-Host "🚀 Building application for $($config.deploymentName)..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        # Set environment variable for basename
        $env:REACT_APP_BASENAME = $config.basename
        
        $buildCommand = "env-cmd -f $envFile react-app-rewired build"
        Invoke-Expression $buildCommand
        
        $endTime = Get-Date
        $buildTime = ($endTime - $startTime).TotalSeconds
        $buildTimeFormatted = Format-BuildTime $buildTime
        
        Write-Host "✓ Build completed successfully in $buildTimeFormatted" -ForegroundColor Green
        
        return @{
            success = $true
            buildTime = $buildTime
            buildTimeFormatted = $buildTimeFormatted
        }
    } catch {
        Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

function Format-BuildTime($seconds) {
    if ($seconds -lt 60) {
        return "$($seconds.ToString('F2')) seconds"
    } elseif ($seconds -lt 3600) {
        $minutes = [Math]::Floor($seconds / 60)
        $remainingSeconds = $seconds % 60
        return "$($minutes)m $($remainingSeconds.ToString('F0'))s"
    } else {
        $hours = [Math]::Floor($seconds / 3600)
        $minutes = [Math]::Floor(($seconds % 3600) / 60)
        $remainingSeconds = $seconds % 60
        return "$($hours)h $($minutes)m $($remainingSeconds.ToString('F0'))s"
    }
}

# Main execution
if (-not $DeploymentName) {
    Write-Host "❌ Please specify a deployment name" -ForegroundColor Red
    Write-Host "Usage: build-deploy.ps1 <deployment-name> [env-file]" -ForegroundColor Yellow
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  build-deploy.ps1 erp                    # Production build" -ForegroundColor Gray
    Write-Host "  build-deploy.ps1 erp_snps              # Production build for SNPS org" -ForegroundColor Gray
    Write-Host "  build-deploy.ps1 erp_snps_qa           # QA build for SNPS org" -ForegroundColor Gray
    Write-Host "  build-deploy.ps1 erp_xyz_dev           # Development build for XYZ org" -ForegroundColor Gray
    Write-Host "  build-deploy.ps1 erp_abc_staging       # Staging build for ABC org" -ForegroundColor Gray
    Write-Host "  build-deploy.ps1 erp_snps .env.custom  # Custom env file" -ForegroundColor Gray
    exit 1
}

# Generate dynamic configuration
$config = New-DeploymentConfig $DeploymentName
$envFile = if ($CustomEnvFile) { $CustomEnvFile } else { $config.envFile }

Write-Host "🎯 Deploying $($config.title)..." -ForegroundColor Cyan
Write-Host "📂 Build directory: $($config.buildDir)" -ForegroundColor Yellow
Write-Host "🌐 Homepage: $($config.homepage)" -ForegroundColor Yellow
Write-Host "🔗 Basename: $($config.basename)" -ForegroundColor Yellow
Write-Host "📄 Environment file: $envFile" -ForegroundColor Yellow
if ($config.orgName) {
    Write-Host "🏢 Organization: $($config.orgName.ToUpper())" -ForegroundColor Yellow
}
Write-Host "🚀 Environment: $($config.environment)" -ForegroundColor Yellow
Write-Host ("─" * 50) -ForegroundColor Gray

# Store original package.json
$originalPackageJson = Get-Content (Join-Path $PSScriptRoot "package.json") -Raw

try {
    # Update package.json
    Update-PackageJson $config
    
    # Update App.tsx
    Update-AppTsx $config
    
    # Build the application
    $buildResult = Invoke-AppBuild $config $envFile
    
    # Post-build updates (directly to build directory)
    Update-IndexHtml $config $config.buildDir
    New-Htaccess $config $config.buildDir
    New-DeploymentInfo $config $config.buildDir
    
    Write-Host ("─" * 50) -ForegroundColor Gray
    Write-Host "🎉 Deployment successful!" -ForegroundColor Green
    Write-Host "⏱️  Build time: $($buildResult.buildTimeFormatted)" -ForegroundColor Yellow
    Write-Host "📦 Build artifacts: $($config.buildDir)/" -ForegroundColor Yellow
    Write-Host "🚀 Deploy the contents of $($config.buildDir)/ to your server" -ForegroundColor Yellow
    Write-Host "🌐 Application will be available at: $($config.homepage)" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Restore original package.json
    Set-Content (Join-Path $PSScriptRoot "package.json") $originalPackageJson
    Write-Host "✓ Restored original package.json" -ForegroundColor Green
}
