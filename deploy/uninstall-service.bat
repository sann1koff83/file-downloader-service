@echo off
setlocal EnableDelayedExpansion

set SCRIPT_DIR=%~dp0
set SERVICE_NAME=FileDownloaderService
set SERVICE_EXE=%SCRIPT_DIR%FileDownloaderService.exe

echo ==========================================
echo Uninstalling !SERVICE_NAME!...
echo Service exe: !SERVICE_EXE!
echo ==========================================

if not exist "!SERVICE_EXE!" (
    echo ERROR: Service executable not found: !SERVICE_EXE!
    pause
    exit /b 1
)

echo Stopping service if running...
"!SERVICE_EXE!" stop >nul 2>nul

timeout /t 2 /nobreak >nul

echo Uninstalling service...
"!SERVICE_EXE!" uninstall
if errorlevel 1 (
    echo ERROR: service uninstall failed
    pause
    exit /b 1
)

echo !SERVICE_NAME! uninstalled successfully
pause
exit /b 0