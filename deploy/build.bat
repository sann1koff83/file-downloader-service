@echo off
setlocal

set ROOT_DIR=%~dp0..

echo Building project...
cd /d %ROOT_DIR%

call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo ERROR: build failed
    pause
    exit /b 1
)

echo Build completed successfully
pause
exit /b 0