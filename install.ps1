$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue' # Disable default slow progress bar
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8 # Fix progress bar weird characters

# Modern Fast Download Function
function Invoke-FastDownload {
    param (
        [string]$Url,
        [string]$OutFile,
        [string]$Title
    )
    Write-Host "[*] $Title" -ForegroundColor Yellow
    
    # Force TLS 1.2
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    
    $request = [System.Net.WebRequest]::Create($Url)
    $response = $request.GetResponse()
    $totalLength = $response.ContentLength
    
    $stream = $response.GetResponseStream()
    $fileStream = [System.IO.File]::Create($OutFile)
    
    $buffer = New-Object byte[] 65536 # 64KB buffer for ultra-fast download
    $read = 0
    $downloaded = 0
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    do {
        $read = $stream.Read($buffer, 0, $buffer.Length)
        if ($read -gt 0) {
            $fileStream.Write($buffer, 0, $read)
            $downloaded += $read
            
            # Update UI every 150ms to prevent console flickering
            if ($stopwatch.ElapsedMilliseconds -gt 150) {
                $stopwatch.Restart()
                $percent = 0
                if ($totalLength -gt 0) {
                    $percent = [math]::Floor(($downloaded / $totalLength) * 100)
                }
                
                $mbReceived = "{0:N2}" -f ($downloaded / 1MB)
                $mbTotal = "{0:N2}" -f ($totalLength / 1MB)
                
                $barLength = 40
                $filled = [math]::Floor(($percent / 100) * $barLength)
                if ($filled -lt 0) { $filled = 0 }
                $empty = $barLength - $filled
                if ($empty -lt 0) { $empty = 0 }
                
                $bar = ("=" * $filled) + ("-" * $empty)
                
                Write-Host "`r    [$bar] $percent% ($mbReceived MB / $mbTotal MB)" -NoNewline -ForegroundColor Cyan
            }
        }
    } while ($read -gt 0)
    
    $fileStream.Close()
    $stream.Close()
    $response.Close()
    
    Write-Host "`r    [========================================] 100% (Download abgeschlossen)                    `n" -ForegroundColor Green
}

function Show-StepProgress {
    param (
        [string]$Title,
        [int]$Seconds
    )
    Write-Host "[*] $Title..." -ForegroundColor Cyan
    $totalSteps = $Seconds * 10
    for ($i = 1; $i -le $totalSteps; $i++) {
        Start-Sleep -Milliseconds 100
        $percent = [math]::Floor(($i / $totalSteps) * 100)
        
        $barLength = 40
        $filled = [math]::Floor(($percent / 100) * $barLength)
        $empty = $barLength - $filled
        
        $bar = ("=" * $filled) + ("-" * $empty)
        Write-Host "`r    [$bar] $percent%" -NoNewline -ForegroundColor Cyan
    }
    Write-Host "`r    [========================================] 100% (Abgeschlossen)                    `n" -ForegroundColor Green
}

$ShortcutPath = "$env:USERPROFILE\Desktop\Argus Command Center.lnk"
$isUpdate = Test-Path $ShortcutPath

Write-Host "=======================================================" -ForegroundColor Cyan
if ($isUpdate) {
    Write-Host "         ARGUS COMMAND CENTER - UPDATE MODE" -ForegroundColor Yellow
} else {
    Write-Host "         ARGUS COMMAND CENTER - AUTONOMOUS SETUP" -ForegroundColor Cyan
}
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Initialisiere..." -ForegroundColor Gray

if ($isUpdate) {
    Write-Host "`n[*] Beende alte Hintergrundprozesse (Companion App)..." -ForegroundColor Yellow
    # WMI check to kill pythonw.exe only if it's running argus_tray.py
    Get-WmiObject Win32_Process | Where-Object { $_.Name -match 'pythonw.exe' -and $_.CommandLine -match 'argus_tray.py' } | ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

# 1. Python Check & Install
Write-Host "`n[*] Pruefe Python Installation..." -ForegroundColor Cyan
try {
    $pythonVersion = & python --version 2>&1
    Write-Host "[+] Python ist bereits installiert: $pythonVersion" -ForegroundColor Green
} catch {
    $pyUrl = "https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe"
    $pyFile = "$env:TEMP\python_installer.exe"
    
    Invoke-FastDownload -Url $pyUrl -OutFile $pyFile -Title "Python nicht gefunden. Lade Python 3.11 herunter..."
    
    Write-Host "[*] Installiere Python still im Hintergrund..." -ForegroundColor Cyan
    $process = Start-Process -FilePath $pyFile -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1 Include_test=0" -Wait -PassThru
    if ($process.ExitCode -eq 0) {
        Write-Host "[+] Python erfolgreich installiert." -ForegroundColor Green
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
    $dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $dockerFile = "$env:TEMP\DockerInstaller.exe"
    
    Invoke-FastDownload -Url $dockerUrl -OutFile $dockerFile -Title "Docker nicht gefunden. Lade Docker Desktop herunter (~600MB)..."
    
    Write-Host "[*] Installiere Docker Desktop still im Hintergrund (dies dauert 1-3 Minuten)..." -ForegroundColor Cyan
    $process = Start-Process -FilePath $dockerFile -ArgumentList "install --quiet --accept-license" -Wait -PassThru
    if ($process.ExitCode -eq 0) {
        Write-Host "[+] Docker Desktop erfolgreich installiert." -ForegroundColor Green
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
            Write-Host "`n[!] Timeout beim Warten auf Docker. Bitte Docker Desktop manuell pruefen." -ForegroundColor Red
            break
        }
    }
}

# 4. Auto-Update & Repair
Set-Location $PSScriptRoot
try {
    Show-StepProgress -Title "Pruefe auf Updates und repariere System (Git Pull)" -Seconds 3
    $oldErrorAction = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    
    # 100% force update, dropping local changes to prevent conflicts
    git fetch origin main 2>&1 | Out-Null
    git reset --hard origin/main 2>&1 | Out-Null
    
    $ErrorActionPreference = $oldErrorAction
    Write-Host "[+] Argus ist auf dem neuesten Stand!" -ForegroundColor Green
} catch {
    Write-Host "[!] Auto-Update uebersprungen (Git evtl. nicht gefunden)." -ForegroundColor Yellow
}

# 5. Argus Setup (Docker Compose)
Show-StepProgress -Title "Baue und Starte Argus Container System" -Seconds 5
& docker compose up --build -d

# 5. Companion App & Icon Generation
Write-Host "`n[*] Richte Windows Taskleisten-Companion ein..." -ForegroundColor Cyan
& python -m pip install pystray Pillow psutil requests --quiet
Write-Host "[*] Generiere natives Windows App Icon (.ico)..." -ForegroundColor Cyan
& python -c "from PIL import Image; import os; img = Image.open('public/logo.png').resize((256, 256)); img.save('public/logo.ico')"
Start-Process -FilePath "pythonw" -ArgumentList "argus_tray.py"

# 6. Shortcut & Native App
Write-Host "`n[*] Erstelle/Aktualisiere Desktop Shortcut..." -ForegroundColor Cyan
try {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = "pythonw.exe"
    $Shortcut.Arguments = """$PSScriptRoot\launcher.py"""
    $Shortcut.IconLocation = "$PSScriptRoot\public\logo.ico, 0"
    $Shortcut.WorkingDirectory = "$PSScriptRoot"
    $Shortcut.Save()
} catch {
    Write-Host "[!] Konnte Shortcut nicht erstellen." -ForegroundColor Yellow
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
if ($isUpdate) {
    Write-Host "         UPDATE ERFOLGREICH ABGESCHLOSSEN" -ForegroundColor Green
} else {
    Write-Host "         INSTALLATION ERFOLGREICH ABGESCHLOSSEN" -ForegroundColor Green
}
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "[+] Die Argus Companion App laeuft nun in der Taskleiste." -ForegroundColor Gray
Write-Host "[+] Argus Command Center startet als native App..." -ForegroundColor Gray

Start-Sleep -Seconds 2
Start-Process -FilePath "pythonw.exe" -ArgumentList """$PSScriptRoot\launcher.py""" -WorkingDirectory "$PSScriptRoot"

Write-Host "`n[*] Auto-Close. Goodbye!" -ForegroundColor Cyan

Stop-Process -Id $PID -Force
