@echo off
setlocal EnableDelayedExpansion
title Argus Dashboard Installer
color 0b

:: Banner
echo ========================================================
echo                 ARGUS DASHBOARD INSTALLER               
echo             (Real-time Global Intelligence)             
echo ========================================================
echo.

:: Check Docker
echo [*] Checking Prerequisites...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker is not installed or not running.
    echo Please install Docker Desktop and start it before continuing.
    pause
    exit /b 1
)
echo [+] Docker found.

:: Simulated Progress Bar via PowerShell
powershell -Command "$Host.UI.RawUI.WindowTitle = 'Argus Installation Progress'; $total = 100; for ($i = 0; $i -le $total; $i += 5) { Write-Progress -Activity 'Installing Engines & Modules...' -Status \"$i`% Complete\" -PercentComplete $i; Start-Sleep -Milliseconds 150 }"

echo.
echo [*] Preparing Environment...
if not exist "backend\.env" (
    copy ".env.example" "backend\.env" >nul
)
if not exist "frontend\.env.local" (
    echo NEXT_PUBLIC_API_URL=http://localhost:8000 > "frontend\.env.local"
)
echo [+] Environment prepared.

echo.
echo [*] Building and Starting Docker Containers...
echo This may take several minutes on the first run.
docker compose up --build -d

echo.
echo [*] Creating Desktop Shortcut...
set SHORTCUT_NAME=Argus Dashboard
set SHORTCUT_PATH=%USERPROFILE%\Desktop\%SHORTCUT_NAME%.url
echo [InternetShortcut] > "%SHORTCUT_PATH%"
echo URL=http://localhost:3000 >> "%SHORTCUT_PATH%"
echo IconIndex=0 >> "%SHORTCUT_PATH%"
echo IconFile=%SystemRoot%\system32\SHELL32.dll >> "%SHORTCUT_PATH%"
echo [+] Shortcut created at %SHORTCUT_PATH%

echo.
echo [*] Installing Host Integration (System Tray)...
python -m pip install pystray pillow psutil >nul 2>&1
start "" pythonw argus_tray.py

echo.
echo ========================================================
echo [+] INSTALLATION COMPLETE!
echo [!] Argus is starting in the background. 
echo [!] It may take a minute for the web server to become ready.
echo [!] You can launch Argus using the shortcut on your desktop,
echo [!] or via the Argus icon in your Windows Taskbar (System Tray).
echo ========================================================
pause
