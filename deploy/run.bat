@echo off
setlocal

set ROOT_DIR=%~dp0..

cd /d %ROOT_DIR%

echo Starting application...
node dist\app.js

pause