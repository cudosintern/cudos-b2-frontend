# IONERP Build Performance Monitor (Enhanced)
# PowerShell script for Windows

param(
    [switch]$Fast = $false,
    [switch]$Vanilla = $false
)

Write-Host "=====================================" -ForegroundColor Green
Write-Host "IONERP Build Performance Monitor" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

$startTime = Get-Date
Write-Host "Starting build at: $startTime" -ForegroundColor Yellow

# Determine which build command to use
$buildCommand = if ($Vanilla) { "build:vanilla" } elseif ($Fast) { "build:fast" } else { "build" }
Write-Host "Build command: npm run $buildCommand" -ForegroundColor Cyan
Write-Host ""

# Check system resources
try {
    $memory = Get-WmiObject -Class Win32_ComputerSystem -ErrorAction SilentlyContinue
    if ($memory) {
        $totalRAM = [math]::Round($memory.TotalPhysicalMemory / 1GB, 2)
        Write-Host "System Info:" -ForegroundColor Cyan
        Write-Host "  Total RAM: $totalRAM GB" -ForegroundColor White
    }
    
    $freeSpace = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'" -ErrorAction SilentlyContinue
    if ($freeSpace) {
        $freeSpaceGB = [math]::Round($freeSpace.FreeSpace/1GB, 2)
        Write-Host "  Free Disk Space: $freeSpaceGB GB" -ForegroundColor White
    }
    
    $nodeVersion = & node --version 2>$null
    $npmVersion = & npm --version 2>$null
    if ($nodeVersion -and $npmVersion) {
        Write-Host "  Node.js: $nodeVersion" -ForegroundColor White
        Write-Host "  NPM: $npmVersion" -ForegroundColor White
    }
} catch {
    Write-Host "  System info not available" -ForegroundColor Yellow
}
Write-Host ""

# Clean cache first
Write-Host "Cleaning cache..." -ForegroundColor Yellow
try {
    & npm run clean
    Write-Host "Cache cleaned successfully" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not clean cache" -ForegroundColor Yellow
}
Write-Host ""

# Run the build
Write-Host "Starting optimized build..." -ForegroundColor Yellow
Write-Host "Command: npm run $buildCommand" -ForegroundColor Gray

try {
    & npm run $buildCommand
    $buildSuccess = $LASTEXITCODE -eq 0
} catch {
    $buildSuccess = $false
    Write-Host "Build failed with error: $($_.Exception.Message)" -ForegroundColor Red
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
if ($buildSuccess) {
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
}
Write-Host "Build finished at: $endTime" -ForegroundColor Green
Write-Host "Build duration: $($duration.TotalMinutes.ToString('F1')) minutes ($($duration.TotalSeconds.ToString('F0')) seconds)" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check build results
if (Test-Path "build" -and $buildSuccess) {
    try {
        $buildSize = (Get-ChildItem -Path "build" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        $buildSizeMB = [math]::Round($buildSize / 1MB, 2)
        
        Write-Host ""
        Write-Host "Build Results:" -ForegroundColor Cyan
        Write-Host "  Build folder size: $buildSizeMB MB" -ForegroundColor White
        
        # Check for main bundle files
        if (Test-Path "build\static\js") {
            $jsFiles = Get-ChildItem -Path "build\static\js" -Filter "*.js" -ErrorAction SilentlyContinue | Sort-Object Length -Descending
            if ($jsFiles) {
                Write-Host "  JavaScript bundles:" -ForegroundColor White
                foreach ($file in $jsFiles | Select-Object -First 5) {
                    $sizeMB = [math]::Round($file.Length / 1MB, 2)
                    Write-Host "    $($file.Name): $sizeMB MB" -ForegroundColor Gray
                }
            }
        }
        
        # Performance analysis
        if ($duration.TotalMinutes -lt 5) {
            Write-Host ""
            Write-Host "🎉 Excellent! Build time under 5 minutes!" -ForegroundColor Green
        } elseif ($duration.TotalMinutes -lt 10) {
            Write-Host ""
            Write-Host "👍 Good! Build time under 10 minutes." -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "⚠️  Build time over 10 minutes. Consider further optimizations." -ForegroundColor Red
        }
    } catch {
        Write-Host "Could not analyze build results: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} elseif (-not $buildSuccess) {
    Write-Host ""
    Write-Host "Build failed. Try running with -Vanilla switch for fallback:" -ForegroundColor Red
    Write-Host "  .\build-monitor.ps1 -Vanilla" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
