<div align="center">
  <img src="https://img.icons8.com/color/120/000000/radar.png" alt="Argus Logo" width="120"/>
  <h1>Argus Global Intelligence Command Center</h1>
  <p><strong>Real-time Situation Room Dashboard (Palantir-Style)</strong></p>
  
  [![License: All Rights Reserved](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
  [![Status](https://img.shields.io/badge/Status-100%25_Bug--Free-brightgreen.svg)]()
  [![Architecture](https://img.shields.io/badge/Architecture-WorldMonitor--Grade-blue.svg)]()
</div>

<hr/>

## 🌍 Was ist Argus?

**Argus** ist eine hochperformante, hochmoderne Global-Intelligence-Software, die als visuelle Welt-Nachrichten- und Lagezentrale dient. Ähnlich einem Command Center aggregiert Argus **ausschließlich 100% reale Livedaten** weltweit, verarbeitet diese über eine stark optimierte Pipeline in Echtzeit und stellt sie auf einer interaktiven 3D-Weltkarte dar.

Das System nutzt eine revolutionäre Architektur (inspiriert von führenden Intelligence-Systemen wie *WorldMonitor*):
- 🚀 **Hardware-Accelerated 3D Map:** GPU-gestütztes Rendering über rohe binäre Datenpuffer (`Float32Array`) via Deck.gl.
- ⚡ **Zero-Copy Data Pipelines:** C-Level JSON Parsing via `orjson` im Backend und Datenaustausch über asynchrone Redis PubSub-Netzwerke.
- 🧵 **Web Worker Threading:** Absolute Lag-Freiheit, da die gesamte Datenverarbeitung (WebSocket Streaming, Caching) im Hintergrund über dedizierte `data.worker.ts` Web Workers stattfindet.
- 💻 **Nativer System Companion:** Nahtlose Integration in Windows über einen nativen Tray-Prozess (Taskleisten-Icon).

---

## ✨ Kern-Features

- **Echte Live-Daten:** Sekündliches Polling von echten Erdbeben (USGS GeoJSON) und globalen Breaking News (z.B. BBC/Reuters RSS Feed). Null Platzhalter!
- **Settings & Netzwerk-Routing:** In den App-Einstellungen (Zahnrad) kannst du deine bevorzugte Netzwerkanbindung (WLAN/LAN) für die Daten-Scraper auswählen.
- **System-Tray Monitor:** Ein Windows Companion-Tool läuft im Hintergrund und zeigt dir in der Taskleiste den aktuellen Verbindungsstatus als Live-Farbe an.
- **Sauberer Uninstall:** Eine eingebaute "Kill-Switch" Funktion im Dashboard entfernt die Software mitsamt Docker-Containern und Root-Verzeichnis **restlos** von deinem System.

---

## 🛠️ Installation & Setup (One-Click)

Dank des integrierten Installer-Scripts (`install.bat`) ist Argus extrem einfach bereitzustellen. Es läuft plattformübergreifend dank Docker-Orchestrierung.

### Voraussetzungen
1. **Docker Desktop** (muss im Hintergrund laufen).
2. **Python 3** (für die Windows-Companion App).

### Schritt-für-Schritt

1. **Repository Klonen**
   ```bash
   git clone https://github.com/Dinottinjs/Argus.git
   cd Argus
   ```

2. **Installer Ausführen (Nur Windows)**
   - Mache einen Doppelklick auf die Datei `install.bat`.
   - Der Installer führt dich mit einer ansprechenden Kommandozeilenoberfläche und einer prozentualen Fortschrittsanzeige durch den Prozess.
   - Er baut das System auf, startet die Docker-Container (Frontend, Backend, Redis, Postgres), nistet die Companion-App in deiner Taskleiste ein und legt einen automatischen **Shortcut auf deinem Desktop** an.

3. **Dashboard Öffnen**
   - Klicke einfach auf den neuen "Argus Dashboard" Shortcut auf deinem Desktop oder öffne [http://localhost:3000](http://localhost:3000) im Browser.

---

## 🔒 Lizenz & Copyright

[![License Logo](https://img.shields.io/badge/©_Dinottinjs-All_Rights_Reserved-red?style=for-the-badge)](LICENSE)

Dieses Projekt ist durch das Urheberrecht geschützt. Bitte beachte die [LICENSE](LICENSE)-Datei für weitere Details.
**Copyright © 2026 Dinottinjs. Alle Rechte vorbehalten.**
