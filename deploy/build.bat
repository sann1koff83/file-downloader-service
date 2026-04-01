@echo off
setlocal EnableDelayedExpansion

set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set APP_ENTRY=%ROOT_DIR%\dist\app.js

echo ==========================================
echo Building project...
echo Root dir: %ROOT_DIR%
echo ==========================================

cd /d "%ROOT_DIR%"
if errorlevel 1 (
    echo ERROR: cannot change directory to %ROOT_DIR%
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm not found in PATH
    pause
    exit /b 1
)

if not exist "%ROOT_DIR%\package-lock.json" (
    echo ERROR: package-lock.json not found
    pause
    exit /b 1
)

echo Installing dependencies...
call npm ci
if errorlevel 1 (
    echo ERROR: npm ci failed
    pause
    exit /b 1
)

echo Building project...
call npm run build
if errorlevel 1 (
    echo ERROR: build failed
    pause
    exit /b 1
)

if not exist "%APP_ENTRY%" (
    echo ERROR: build output not found: %APP_ENTRY%
    pause
    exit /b 1
)

echo Build completed successfully
pause
exit /b 0