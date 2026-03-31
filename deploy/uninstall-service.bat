@echo off
setlocal

set SERVICE_EXE=%~dp0FileDownloaderService.exe

echo Stopping service...
"%SERVICE_EXE%" stop >nul 2>nul

echo Uninstalling service...
"%SERVICE_EXE%" uninstall

pause
exit /b 0