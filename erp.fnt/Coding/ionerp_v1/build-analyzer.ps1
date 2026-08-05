# Build Performance Analyzer - PowerShell Version
param(
    [string]$Command = "npm run build:fast"
)

# Color functions
function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Write-Header {
    param([string]$Text)
    Write-Host "=" * 50 -ForegroundColor Green
    Write-ColorText $Text "Green"
    Write-Host "=" * 50 -ForegroundColor Green
}

function Format-Duration {
    param([TimeSpan]$Duration)
    $totalSeconds = [math]::Floor($Duration.TotalSeconds)
    $minutes = [math]::Floor($totalSeconds / 60)
    $seconds = $totalSeconds % 60
    
    if ($minutes -gt 0) {
        $decimalMinutes = [math]::Round($Duration.TotalMinutes, 1)
        return "$decimalMinutes minutes ($totalSeconds seconds)"
    }
    return "$totalSeconds seconds"
}

function Format-Size {
    param([long]$Bytes)
    $mb = [math]::Round($Bytes / 1MB, 2)
    return "$mb MB"
}

function Get-BuildInfo {
    $buildPath = Join-Path $PWD "build"
    if (-not (Test-Path $buildPath)) {
        return $null
    }
    
    $staticPath = Join-Path $buildPath "static"
    if (-not (Test-Path $staticPath)) {
        return $null
    }
    
    $files = Get-ChildItem -Path $staticPath -Recurse -File
    $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
    $fileCount = $files.Count
    
    return @{
        TotalSize = $totalSize
        FileCount = $fileCount
    }
}

function Get-PerformanceRating {
    param([double]$Minutes)
    
    if ($Minutes -lt 2) {
        return @{ Text = "EXCELLENT (< 2 min)"; Color = "Green" }
    } elseif ($Minutes -lt 5) {
        return @{ Text = "GOOD (< 5 min)"; Color = "Cyan" }
    } elseif ($Minutes -lt 10) {
        return @{ Text = "AVERAGE (< 10 min)"; Color = "Yellow" }
    } else {
        return @{ Text = "SLOW (> 10 min)"; Color = "Red" }
    }
}

# Main execution
Write-ColorText "Starting build analysis..." "Cyan"
Write-ColorText "Command: $Command" "Blue"
Write-ColorText "Started at: $(Get-Date -Format 'MM/dd/yyyy HH:mm:ss')" "Blue"
Write-Header ""

$startTime = Get-Date

try {
    # Execute the build command
    Invoke-Expression $Command
    $success = $LASTEXITCODE -eq 0
} catch {
    $success = $false
}

$endTime = Get-Date
$duration = $endTime - $startTime

# Print analysis
if ($success) {
    Write-Header "Build completed successfully!"
} else {
    Write-Header "Build failed!"
}

Write-ColorText "Command: " "Blue" -NoNewline
Write-ColorText $Command "Cyan"

Write-ColorText "Build finished at: " "Blue" -NoNewline
Write-ColorText ($endTime.ToString("MM/dd/yyyy HH:mm:ss")) "Yellow"

Write-ColorText "Build duration: " "Blue" -NoNewline
Write-ColorText (Format-Duration $duration) "Green"

$buildInfo = Get-BuildInfo
if ($buildInfo) {
    Write-ColorText "Total build size: " "Blue" -NoNewline
    Write-ColorText (Format-Size $buildInfo.TotalSize) "Yellow"
    
    Write-ColorText "Files generated: " "Blue" -NoNewline
    Write-ColorText $buildInfo.FileCount "Yellow"
}

$rating = Get-PerformanceRating $duration.TotalMinutes
Write-ColorText "Performance: " "Blue" -NoNewline
Write-ColorText $rating.Text $rating.Color

Write-Host "=" * 50 -ForegroundColor Green

# Save results to file
$results = @{
    Command = $Command
    StartTime = $startTime
    EndTime = $endTime
    Duration = $duration
    Success = $success
    BuildInfo = $buildInfo
} | ConvertTo-Json -Depth 3

$results | Out-File -FilePath "build-analysis.json" -Encoding UTF8

Write-ColorText "Analysis saved to build-analysis.json" "Magenta"
