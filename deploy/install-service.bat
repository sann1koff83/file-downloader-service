@echo off
setlocal

set ROOT_DIR=%~dp0..
set SERVICE_EXE=%~dp0FileDownloaderService.exe

echo Installing service...
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

echo Stopping old service if exists...
"%SERVICE_EXE%" stop >nul 2>nul

echo Uninstalling old service if exists...
"%SERVICE_EXE%" uninstall >nul 2>nul

echo Installing new service...
"%SERVICE_EXE%" install
if not "%errorlevel%"=="0" (
    echo ERROR: service install failed
    pause
    exit /b 1
)

echo Starting service...
"%SERVICE_EXE%" start
if not "%errorlevel%"=="0" (
    echo ERROR: service start failed
    pause
    exit /b 1
)

echo Service installed and started successfully
pause
exit /b 0