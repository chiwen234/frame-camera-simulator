@echo off
setlocal
cd /d "%~dp0"
title FRAME / CAMERA COMPANY SIMULATOR v2.0
echo.
echo   FRAME / CAMERA COMPANY SIMULATOR v2.0
echo   Reference-driven industrial design, 2026
echo.
echo   [1] Desktop app  (recommended, full local cache support)
echo   [2] Web browser
echo.
choice /c 12 /n /t 8 /d 1 >nul
if errorlevel 2 goto browser

if exist "%~dp0desktop-app\FRAME.exe" (
  echo   Starting desktop app...
  start "" "%~dp0desktop-app\FRAME.exe"
  exit /b 0
)
echo   Desktop build not found, falling back to the browser.
goto browser

:browser
echo   Opening index.html in your default browser...
start "" "%~dp0index.html"
if errorlevel 1 (
  echo.
  echo   Could not start the browser. Please open index.html manually.
  echo   Tip: if the reference library cannot persist its cache on file://,
  echo        run a local server:  python -m http.server 8000
  echo        then open http://127.0.0.1:8000
  pause
)
exit /b 0
