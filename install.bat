@echo off
setlocal EnableDelayedExpansion
title Argus Global Intelligence - Autonomous Installer

:: ==========================================
:: 1. UAC / Administrator Rights Check
:: ==========================================
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo [!] Administratorrechte werden benoetigt. Fordere Rechte an...
    goto UACPrompt
) else ( goto :RunSetup )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    set params= %*
    echo UAC.ShellExecute "cmd.exe", "/c ""%~s0"" %params%", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B

:RunSetup
cd /d "%~dp0"

:: Set Colors
color 0B
echo =======================================================
echo          ARGUS COMMAND CENTER - SETUP
echo =======================================================
echo.
echo [*] Initialisiere autonomes Setup...
echo.

:: ==========================================
:: 2. Check and Install Python
:: ==========================================
echo [*] Pruefe Python Installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Python ist nicht installiert. Lade Python herunter...
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe' -OutFile 'python_installer.exe'"
    echo [*] Installiere Python still im Hintergrund...
    start /wait python_installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    del python_installer.exe
    echo [*] Python wurde erfolgreich installiert.
    :: Refresh Path for the current session
    set "PATH=%PATH%;C:\Program Files\Python311\;C:\Program Files\Python311\Scripts\"
) else (
    echo [+] Python ist bereits installiert.
)

:: ==========================================
:: 3. Check and Install Docker Desktop
:: ==========================================
echo.
echo [*] Pruefe Docker Installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker ist nicht installiert. Lade Docker Desktop herunter (dies kann einige Minuten dauern)...
    powershell -Command "Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe' -OutFile 'DockerInstaller.exe'"
    echo [*] Installiere Docker Desktop still im Hintergrund...
    start /wait DockerInstaller.exe install --quiet --accept-license
    del DockerInstaller.exe
    echo [*] Docker Desktop wurde erfolgreich installiert!
    :: Set path for current session
    set "PATH=%PATH%;C:\Program Files\Docker\Docker\resources\bin"
) else (
    echo [+] Docker ist bereits installiert.
)

:: ==========================================
:: 4. Start Docker Daemon and Wait
:: ==========================================
echo.
echo [*] Pruefe Docker Daemon Status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Starte Docker Desktop...
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else (
        echo [!] Docker Desktop Executable nicht gefunden. Bitte starte Docker manuell!
    )
    
    echo [*] Warte auf Docker Engine (dies kann bis zu 2 Minuten dauern)...
    :WaitForDocker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo    ...warte auf Engine...
        goto WaitForDocker
    )
    echo [+] Docker Engine ist nun online!
)

:: ==========================================
:: 5. Build and Run System
:: ==========================================
echo.
echo [*] Baue und Starte Argus Container System...
docker compose up --build -d

:: ==========================================
:: 6. Setup Python Companion App
:: ==========================================
echo.
echo [*] Richte Windows Taskleisten-Companion ein...
python -m pip install pystray Pillow psutil requests --quiet
start "" pythonw argus_tray.py

:: ==========================================
:: 7. Create Desktop Shortcut
:: ==========================================
echo.
echo [*] Erstelle Desktop Shortcut...
set SHORTCUT_PATH=%USERPROFILE%\Desktop\Argus Dashboard.url
echo [InternetShortcut] > "%SHORTCUT_PATH%"
echo URL=http://localhost:3000 >> "%SHORTCUT_PATH%"
echo IconIndex=0 >> "%SHORTCUT_PATH%"
echo IconFile=C:\Windows\System32\shell32.dll >> "%SHORTCUT_PATH%"

echo.
echo =======================================================
echo          INSTALLATION ABGESCHLOSSEN
echo =======================================================
echo [+] Die Argus Companion App laeuft in der Taskleiste.
echo [+] Das Dashboard oeffnet sich in 3 Sekunden...
timeout /t 3 >nul
start http://localhost:3000
exit
