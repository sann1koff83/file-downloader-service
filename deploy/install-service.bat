@echo off
setlocal EnableDelayedExpansion

set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set SERVICE_NAME=FileDownloaderService
set SERVICE_EXE=%SCRIPT_DIR%FileDownloaderService.exe
set SERVICE_XML=%SCRIPT_DIR%FileDownloaderService.xml
set APP_ENTRY=%ROOT_DIR%\dist\app.js
set CONFIG_FILE=%ROOT_DIR%\config.json

echo ==========================================
echo Installing !SERVICE_NAME!...
echo Root dir: %ROOT_DIR%
echo Service exe: !SERVICE_EXE!
echo ==========================================

if not exist "!SERVICE_EXE!" (
    echo ERROR: Service executable not found: !SERVICE_EXE!
    pause
    exit /b 1
)

if not exist "!SERVICE_XML!" (
    echo ERROR: Service XML not found: !SERVICE_XML!
    pause
    exit /b 1
)

if not exist "!APP_ENTRY!" (
    echo ERROR: Build output not found: !APP_ENTRY!
    echo Run deploy\build.bat first
    pause
    exit /b 1
)

if not exist "!CONFIG_FILE!" (
    echo ERROR: Config file not found: !CONFIG_FILE!
    pause
    exit /b 1
)

echo Stopping old service if exists...
"!SERVICE_EXE!" stop >nul 2>nul

timeout /t 2 /nobreak >nul

echo Uninstalling old service if exists...
"!SERVICE_EXE!" uninstall >nul 2>nul

timeout /t 2 /nobreak >nul

echo Installing new service...
"!SERVICE_EXE!" install
if errorlevel 1 (
    echo ERROR: service install failed
    pause
    exit /b 1
)

timeout /t 2 /nobreak >nul

echo Starting service...
"!SERVICE_EXE!" start
if errorlevel 1 (
    echo ERROR: service start failed
    pause
    exit /b 1
)

echo !SERVICE_NAME! installed and started successfully
pause
exit /b 0