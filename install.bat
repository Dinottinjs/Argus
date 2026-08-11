@echo off
setlocal
title Argus Setup Bootstrapper

:: Check for Admin rights
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Fordere Administratorrechte an...
    goto UACPrompt
) else ( goto RunSetup )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    set params= %*
    :: Relaunch this batch file as admin
    echo UAC.ShellExecute "cmd.exe", "/c """"%~s0"""" %params%", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B

:RunSetup
cd /d "%~dp0"

:: Launch the robust PowerShell installer
powershell -NoProfile -ExecutionPolicy Bypass -File "install.ps1"
