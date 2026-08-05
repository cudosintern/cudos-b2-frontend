@echo off
echo =====================================
echo IONERP Build Performance Monitor
echo =====================================
echo.
echo Starting build at: %date% %time%
echo.

REM Record start time
set start_time=%time%

REM Run the build
call npm run build:fast

REM Record end time
set end_time=%time%

echo.
echo =====================================
echo Build completed at: %date% %end_time%
echo Started at: %start_time%
echo =====================================

REM Calculate and display build size
if exist build (
    echo.
    echo Build folder size:
    powershell -command "Get-ChildItem -Path 'build' -Recurse | Measure-Object -Property Length -Sum | Select-Object @{Name='Size(MB)';Expression={[math]::Round($_.Sum/1MB,2)}}"
    
    echo.
    echo Build folder structure:
    tree build /F
)

pause
