<div align="center">
  <img src="https://raw.githubusercontent.com/Dinottinjs/Argus/main/public/logo.png" alt="Argus Logo" width="200"/>
  <h1>ARGUS COMMAND CENTER (V12)</h1>
  <p><i>The Ultimate Bloomberg-Style Global Information Terminal</i></p>
</div>

---

## 🌍 Overview

**Argus Command Center** is a highly advanced, ultra-performant global visualization dashboard. Inspired by professional trading terminals and command centers, Argus ingests real-time data from across the globe (Earthquakes, Breaking News, Conflicts, Live Crypto Markets, Space Stations) and renders them instantly on a GPU-accelerated 3D Map and responsive UI.

Built for **100% Reliability** and **Maximum Aesthetics**, Argus automatically recovers from crashes, scales across devices, and delivers zero-latency insights.

## 🚀 Key Features (V12)

- **Discord-Style Launcher:** A borderless python splash screen seamlessly boots up Docker and Edge in the background without exposing the user to ugly terminals.
- **Global Conflicts & ISS Tracker:** Real-time data of the International Space Station and all ongoing global conflicts (UN ReliefWeb).
- **In-App Auto-Updater:** Argus self-updates from GitHub directly through the settings interface.
- **Bloomberg-Style Ticker:** A continuous, highly animated data stream at the bottom of your screen tracking real-time crypto pairs and breaking news.
- **Responsive Glassmorphism UI:** Flawlessly adapts to Smart-TVs, Desktop Monitors, Laptops, and Smartphones without overlapping or breaking layout.
- **Interactive 3D Carto Map:** Reliable CARTO Dark Matter raster tiles combined with `DeckGL` GPU-accelerated layers.
- **Instant Zero-Wait Data:** A high-performance Redis cache in the backend shoots the latest global events to your client in milliseconds upon connection.
- **i18n & Localization:** Full language switching support between English and German.
- **Autonomous Setup:** A bulletproof `install.ps1` script handles all dependencies (Docker, Python), creates desktop icons, and configures the host environment.

## ⚙️ Installation & Usage

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dinottinjs/Argus.git
   cd Argus
   ```

2. **Autonomous Setup (Windows)**
   Simply run the `install.bat` file as Administrator.
   It will automatically download Docker (if missing), fetch Python, start the engine, and launch the Argus Dashboard in a standalone window.

3. **In-App Updates**
   Open the Argus Settings page and click on **System Updates** to fetch the latest version!

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
© 2026 Maximilian Holzer. All rights reserved.
