@echo off
setlocal EnableDelayedExpansion

set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set APP_ENTRY=%ROOT_DIR%\dist\app.js
set CONFIG_FILE=%ROOT_DIR%\config.json

echo ==========================================
echo Running FileDownloaderService locally...
echo Root dir: %ROOT_DIR%
echo ==========================================

cd /d "%ROOT_DIR%"
if errorlevel 1 (
    echo ERROR: cannot change directory to %ROOT_DIR%
    pause
    exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: node not found in PATH
    pause
    exit /b 1
)

if not exist "%APP_ENTRY%" (
    echo ERROR: build output not found: %APP_ENTRY%
    echo Run deploy\build.bat first
    pause
    exit /b 1
)

if not exist "%CONFIG_FILE%" (
    echo ERROR: config file not found: %CONFIG_FILE%
    pause
    exit /b 1
)

echo Starting application...
node "%APP_ENTRY%"
set EXIT_CODE=%ERRORLEVEL%

echo Application stopped with exit code %EXIT_CODE%
pause
exit /b %EXIT_CODE%