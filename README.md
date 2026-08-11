<div align="center">
  <img src="https://raw.githubusercontent.com/Dinottinjs/Argus/main/public/logo.png" alt="Argus Logo" width="200"/>
  <h1>ARGUS COMMAND CENTER (V3)</h1>
  <p><i>The Ultimate Bloomberg-Style Global Information Terminal</i></p>
</div>

---

## ?? Overview

**Argus Command Center** is a highly advanced, ultra-performant global visualization dashboard. Inspired by professional trading terminals and command centers, Argus ingests real-time data from across the globe (Earthquakes, Breaking News, Live Crypto Markets) and renders them instantly on a GPU-accelerated 3D Map and responsive UI.

Built for **100% Reliability** and **Maximum Aesthetics**, Argus automatically recovers from crashes, scales across devices, and delivers zero-latency insights.

## ? Key Features (V3)

- **Bloomberg-Style Ticker:** A continuous, highly animated data stream at the bottom of your screen tracking real-time crypto pairs (BTC/USDT, ETH/USDT) and breaking news.
- **Responsive Glassmorphism UI:** Flawlessly adapts to Smart-TVs, Desktop Monitors, Laptops, and Smartphones without overlapping or breaking layout.
- **Interactive 3D Carto Map:** Reliable, fallback-proof CARTO Dark Matter raster tiles combined with \DeckGL\ GPU-accelerated layers. Buttons allow you to instantly toggle Topography and Heatmaps.
- **Instant Zero-Wait Data:** A high-performance Redis cache in the backend shoots the latest 100 global events to your client in milliseconds upon connection.
- **Autonomous Setup:** A bulletproof \install.bat\ and \install.ps1\ script handles all dependencies (Docker, Python), gracefully managing encodings across all Windows languages.

## ?? Installation & Usage

1. **Clone the repository**
   \\\ash
   git clone https://github.com/Dinottinjs/Argus.git
   cd Argus
   \\\

2. **Autonomous Setup (Windows)**
   Simply run the \install.bat\ file as Administrator.
   It will automatically download Docker (if missing), fetch Python, start the engine, and launch the Argus Dashboard in your browser.

3. **Manual Setup**
   \\\ash
   docker compose up --build -d
   \\\
   Then open \http://localhost:3000\ in your browser.

## ??? License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
