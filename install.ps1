$ErrorActionPreference = 'Stop'
$ProgressPreference = 'Continue'

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "         ARGUS COMMAND CENTER - AUTONOMOUS SETUP" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Initialisiere..." -ForegroundColor Gray

# 1. Python Check & Install
Write-Host "`n[*] Pruefe Python Installation..." -ForegroundColor Cyan
try {
    $pythonVersion = & python --version 2>&1
    Write-Host "[+] Python ist bereits installiert: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[!] Python nicht gefunden. Starte Download..." -ForegroundColor Yellow
    $pyUrl = "https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe"
    $pyFile = "$env:TEMP\python_installer.exe"
    
    # Progress Bar is shown automatically by Invoke-WebRequest in PowerShell
    Invoke-WebRequest -Uri $pyUrl -OutFile $pyFile
    
    Write-Host "[*] Installiere Python still im Hintergrund..." -ForegroundColor Cyan
    $process = Start-Process -FilePath $pyFile -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1 Include_test=0" -Wait -PassThru
    if ($process.ExitCode -eq 0) {
        Write-Host "[+] Python erfolgreich installiert." -ForegroundColor Green
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        Write-Host "[!] Python Installation fehlgeschlagen. (Code: $($process.ExitCode))" -ForegroundColor Red
    }
}

# 2. Docker Check & Install
Write-Host "`n[*] Pruefe Docker Installation..." -ForegroundColor Cyan
try {
    $dockerVersion = & docker --version 2>&1
    Write-Host "[+] Docker ist bereits installiert: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[!] Docker nicht gefunden. Starte Download (~600MB)..." -ForegroundColor Yellow
    $dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $dockerFile = "$env:TEMP\DockerInstaller.exe"
    
    Invoke-WebRequest -Uri $dockerUrl -OutFile $dockerFile
    
    Write-Host "[*] Installiere Docker Desktop still im Hintergrund (dies dauert einige Minuten)..." -ForegroundColor Cyan
    $process = Start-Process -FilePath $dockerFile -ArgumentList "install --quiet --accept-license" -Wait -PassThru
    if ($process.ExitCode -eq 0) {
        Write-Host "[+] Docker Desktop erfolgreich installiert." -ForegroundColor Green
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        Write-Host "[!] Docker Installation fehlgeschlagen oder erfordert manuellen Neustart. (Code: $($process.ExitCode))" -ForegroundColor Red
    }
}

# 3. Start Docker Daemon
Write-Host "`n[*] Pruefe Docker Engine Status..." -ForegroundColor Cyan
try {
    & docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Not running" }
    Write-Host "[+] Docker Engine laeuft bereits." -ForegroundColor Green
} catch {
    Write-Host "[*] Docker Engine ist offline. Starte Docker Desktop..." -ForegroundColor Yellow
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process -FilePath $dockerPath
    } else {
        Write-Host "[!] Docker Desktop Exe nicht gefunden! Bitte manuell starten." -ForegroundColor Red
    }
    
    Write-Host "[*] Warte auf Docker Engine (bis zu 2 Minuten)..." -ForegroundColor Cyan
    $attempts = 0
    while ($true) {
        Start-Sleep -Seconds 5
        $attempts++
        try {
            & docker info > $null 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n[+] Docker Engine ist nun online!" -ForegroundColor Green
                break
            }
        } catch {}
        Write-Host -NoNewline "."
        if ($attempts -ge 24) {
            Write-Host "`n[!] Timeout beim Warten auf Docker. Bitte Docker Desktop manuell prüfen." -ForegroundColor Red
            break
        }
    }
}

# 4. Argus Setup (Docker Compose)
Write-Host "`n[*] Baue und Starte Argus Container System..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
& docker compose up --build -d

# 5. Companion App
Write-Host "`n[*] Richte Windows Taskleisten-Companion ein..." -ForegroundColor Cyan
& python -m pip install pystray Pillow psutil requests --quiet
Start-Process -FilePath "pythonw" -ArgumentList "argus_tray.py"

# 6. Shortcut
Write-Host "`n[*] Erstelle Desktop Shortcut..." -ForegroundColor Cyan
try {
    $WshShell = New-Object -comObject WScript.Shell
    $ShortcutPath = "$env:USERPROFILE\Desktop\Argus Dashboard.url"
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = "http://localhost:3000"
    $Shortcut.Save()
} catch {
    Write-Host "[!] Konnte Shortcut nicht erstellen." -ForegroundColor Yellow
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "         INSTALLATION ERFOLGREICH ABGESCHLOSSEN" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "[+] Die Argus Companion App laeuft nun in der Taskleiste." -ForegroundColor Gray
Write-Host "[+] Das Dashboard oeffnet sich in Kuerze..." -ForegroundColor Gray

Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Write-Host "`nDruecke eine beliebige Taste zum Beenden..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
