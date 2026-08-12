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
                
                $bar = ("█" * $filled) + ("░" * $empty)
                
                Write-Host "`r    [$bar] $percent% ($mbReceived MB / $mbTotal MB)" -NoNewline -ForegroundColor Cyan
            }
        }
    } while ($read -gt 0)
    
    $fileStream.Close()
    $stream.Close()
    $response.Close()
    
    Write-Host "`r    [████████████████████████████████████████] 100% (Download abgeschlossen)                    `n" -ForegroundColor Green
}

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
Write-Host "`n[*] Pruefe auf Updates und repariere System (Git Pull)..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
try {
    & git fetch origin main 2>&1 | Out-Null
    & git pull origin main 2>&1 | Out-Null
    Write-Host "[+] Argus ist auf dem neuesten Stand!" -ForegroundColor Green
} catch {
    Write-Host "[!] Auto-Update uebersprungen (Git evtl. nicht gefunden)." -ForegroundColor Yellow
}

# 5. Argus Setup (Docker Compose)
Write-Host "`n[*] Baue und Starte Argus Container System..." -ForegroundColor Cyan
& docker compose up --build -d

# 5. Companion App
Write-Host "`n[*] Richte Windows Taskleisten-Companion ein..." -ForegroundColor Cyan
& python -m pip install pystray Pillow psutil requests --quiet
Start-Process -FilePath "pythonw" -ArgumentList "argus_tray.py"

# 6. Shortcut & Native App
Write-Host "`n[*] Erstelle Desktop Shortcut..." -ForegroundColor Cyan
try {
    $WshShell = New-Object -comObject WScript.Shell
    $ShortcutPath = "$env:USERPROFILE\Desktop\Argus Command Center.lnk"
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    $Shortcut.Arguments = "--app=http://localhost:3000"
    $Shortcut.IconLocation = "$PSScriptRoot\public\logo.png"
    $Shortcut.Save()
} catch {
    Write-Host "[!] Konnte Shortcut nicht erstellen." -ForegroundColor Yellow
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "         INSTALLATION ERFOLGREICH ABGESCHLOSSEN" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "[+] Die Argus Companion App laeuft nun in der Taskleiste." -ForegroundColor Gray
Write-Host "[+] Argus Command Center startet als native App..." -ForegroundColor Gray

Start-Sleep -Seconds 3
Start-Process "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" -ArgumentList "--app=http://localhost:3000"

Write-Host "`nDruecke eine beliebige Taste zum Beenden..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
