"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, ShieldAlert, Trash2, Network, RefreshCw, DownloadCloud, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useArgusStore } from "@/store/useArgusStore";
import versionData from "../../version.json";

export default function SettingsPage() {
  const router = useRouter();
  const { 
    reduceMotion, localOnlyMode, toggleReduceMotion, toggleLocalOnlyMode,
    showLeftSidebar, showRightSidebar, showTicker,
    toggleLeftSidebar, toggleRightSidebar, toggleTicker, resetUI,
    language, setLanguage, theme, setTheme
  } = useArgusStore();
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState("");
  
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatePreview, setUpdatePreview] = useState("");

  const checkForUpdates = () => {
    setCheckingUpdate(true);
    fetch("http://localhost:8001/update_status")
      .then(res => res.json())
      .then(data => {
        setUpdateAvailable(data.update_available);
        if (data.preview) setUpdatePreview(data.preview);
        setCheckingUpdate(false);
      })
      .catch(() => setCheckingUpdate(false));
  };

  const handleUpdate = () => {
    if (confirm(t?.alertUpdate || "Argus will now close, update and restart. This might take a minute. Proceed?")) {
      setIsUpdating(true);
      fetch("http://localhost:8001/update", { method: "POST" })
        .then(() => {
          setTimeout(() => {
            window.close();
          }, 2000);
        })
        .catch(() => {
          alert(t?.alertUpdateFail || "Failed to start update.");
          setIsUpdating(false);
        });
    }
  };

  const dict = {
    en: {
      settings: "Argus Settings",
      network: "Network Binding",
      networkDesc: "Select the dedicated network interface (WLAN/LAN) Argus should use for 24/7 continuous data polling.",
      apply: "Apply Network Configuration",
      systemUpdate: "System Updates",
      updateDesc: "Argus can automatically pull the latest intelligence packages, map engines, and data workers from the master repository.",
      dangerZone: "Danger Zone",
      dangerDesc: "Permanently remove the Argus Command Center, including all Docker containers, desktop shortcuts, and local files from this system.",
      uninstall: "Uninstall System Completely",
      languageLabel: "Language / Sprache",
      secLabel: "Security & Accessibility",
      themeToggle: "Theme Mode",
      themeDesc: "Switch between dark mode and light mode across the entire application.",
      light: "Light",
      dark: "Dark",
      reduceMotion: "Reduce Motion & Animations",
      reduceMotionDesc: "Disables the Bloomberg ticker scrolling and CSS pulse effects to reduce GPU load and prevent motion sickness.",
      enabled: "Enabled",
      disabled: "Disabled",
      airGapped: "Air-Gapped / Local Only Mode",
      airGappedDesc: "Stops all external API calls (USGS, BBC, Binance). Map will only show locally generated internal telemetry data.",
      updateStatus: "Argus Version Status",
      checkUpdate: "Checking for updates...",
      updateAvail: "New major update available!",
      upToDate: "System is up to date.",
      checkAgain: "Check Again",
      installNow: "Install Update Now",
      updating: "Updating...",
      layoutCust: "Layout Customization",
      resetUi: "Load Defaults (Reset UI)",
      liveFeed: "Live Feed (Left Sidebar)",
      liveFeedDesc: "Displays the continuous stream of global signals and logs.",
      analytics: "Analytics & Telemetry (Right Sidebar)",
      analyticsDesc: "Displays global sentiment, crypto prices, and internal system metrics.",
      tickerLabel: "Bloomberg Ticker (Bottom Bar)",
      tickerDesc: "Displays the animated marquee ticker at the bottom of the screen.",
      visible: "Visible",
      hidden: "Hidden",
      alertUpdate: "Argus will now close, update and restart. This might take a minute. Proceed?",
      alertUpdateFail: "Failed to start update.",
      alertUninstall: "CRITICAL WARNING: This will completely destroy the Argus Command Center from your system. Are you sure?",
      alertUninstallInit: "Uninstall sequence initiated. The software will now terminate.",
      alertUninstallSent: "Uninstall signal sent.",
      alertReset: "Layout reset to defaults!"
    },
    de: {
      settings: "Argus Einstellungen",
      network: "Netzwerk-Bindung",
      networkDesc: "Wähle das Netzwerk-Interface (WLAN/LAN), das Argus für das 24/7 Daten-Polling nutzen soll.",
      apply: "Netzwerk-Konfiguration anwenden",
      systemUpdate: "System Updates",
      updateDesc: "Argus kann automatisch die neuesten Intelligence Packages, Karten-Engines und Data-Worker herunterladen.",
      dangerZone: "Gefahrenzone",
      dangerDesc: "Argus Command Center vollständig vom System entfernen (inkl. Docker Container, Verknüpfungen und Daten).",
      uninstall: "System vollständig deinstallieren",
      languageLabel: "Sprache / Language",
      secLabel: "Sicherheit & Barrierefreiheit",
      themeToggle: "Farbdesign (Theme)",
      themeDesc: "Wechsle zwischen dem dunklen und hellen Design in der gesamten App.",
      light: "Hell",
      dark: "Dunkel",
      reduceMotion: "Animationen & Bewegung reduzieren",
      reduceMotionDesc: "Deaktiviert den Bloomberg-Ticker und CSS-Pulseffekte, um die GPU zu entlasten und Motion Sickness zu vermeiden.",
      enabled: "Aktiviert",
      disabled: "Deaktiviert",
      airGapped: "Air-Gapped / Nur-Lokal Modus",
      airGappedDesc: "Stoppt alle externen API-Aufrufe. Die Karte zeigt nur lokal generierte interne Telemetriedaten.",
      updateStatus: "Argus Versions-Status",
      checkUpdate: "Suche nach Updates...",
      updateAvail: "Neues Major-Update verfügbar!",
      upToDate: "System ist auf dem neuesten Stand.",
      checkAgain: "Erneut prüfen",
      installNow: "Update jetzt installieren",
      updating: "Aktualisiert...",
      layoutCust: "Layout Anpassung",
      resetUi: "Standardwerte laden",
      liveFeed: "Live Feed (Linke Seitenleiste)",
      liveFeedDesc: "Zeigt den kontinuierlichen Stream globaler Signale und Logs.",
      analytics: "Analysen & Telemetrie (Rechte Seitenleiste)",
      analyticsDesc: "Zeigt die globale Stimmung, Krypto-Preise und interne Systemmetriken.",
      tickerLabel: "Bloomberg Ticker (Untere Leiste)",
      tickerDesc: "Zeigt den animierten Marquee-Ticker am unteren Bildschirmrand.",
      visible: "Sichtbar",
      hidden: "Versteckt",
      alertUpdate: "Argus wird nun geschlossen, aktualisiert und neu gestartet. Das kann eine Minute dauern. Fortfahren?",
      alertUpdateFail: "Update konnte nicht gestartet werden.",
      alertUninstall: "KRITISCHE WARNUNG: Dies wird das Argus Command Center vollständig von deinem System zerstören. Bist du sicher?",
      alertUninstallInit: "Deinstallation eingeleitet. Die Software wird nun beendet.",
      alertUninstallSent: "Deinstallations-Signal gesendet.",
      alertReset: "Layout auf Standardwerte zurückgesetzt!"
    }
  };
  
  const t = dict[language];

  useEffect(() => {
    // Fetch interfaces from the local companion app
    fetch("http://localhost:8001/interfaces")
      .then(res => res.json())
      .then(data => {
        setInterfaces(data.interfaces || []);
      })
      .catch(err => console.error("Companion app not running", err));
      
    checkForUpdates();
      
    const saved = localStorage.getItem("argus_network_interface");
    if (saved) setSelectedInterface(saved);
  }, []);

  const handleSaveNetwork = () => {
    localStorage.setItem("argus_network_interface", selectedInterface);
    // Send to FastAPI backend
    fetch("http://localhost:8000/api/settings/network", { 
      method: "POST", 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interface: selectedInterface }) 
    }).catch(err => console.error(err));
    setStatusMsg("Network settings saved for 24/7 reliability.");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleUninstall = () => {
    if (confirm(t?.alertUninstall || "CRITICAL WARNING: This will completely destroy the Argus Command Center from your system. Are you sure?")) {
      fetch("http://localhost:8001/uninstall", { method: "POST" })
        .then(() => {
          alert(t?.alertUninstallInit || "Uninstall sequence initiated. The software will now terminate.");
          window.close(); // Attempt to close window
        })
        .catch(() => alert(t?.alertUninstallSent || "Uninstall signal sent."));
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {/* HEADER */}
      <header className="h-16 border-b border-border bg-card flex items-center px-6 z-10 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-primary h-6 w-6" />
          <h1 className="text-xl font-bold tracking-widest text-primary uppercase">
            {t.settings}
          </h1>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Language / Sprache */}
          <section className="p-6 border border-border bg-card/50 rounded-lg flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-primary h-6 w-6" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
              <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground">{t.languageLabel}</h2>
            </div>
            
            <div className="flex gap-4 items-center">
              <select 
                className="flex-1 bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'de')}
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </section>
          
          {/* Network Settings */}
          <section className="p-6 border border-border bg-card/50 rounded-lg flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Network className="text-primary h-6 w-6" />
              <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground">{t.network}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {t.networkDesc}
            </p>
            
            <div className="flex gap-4 items-center">
              <select 
                className="flex-1 bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                value={selectedInterface}
                onChange={(e) => setSelectedInterface(e.target.value)}
              >
                <option value="">-- Default (OS Routing) --</option>
                {interfaces.map((iface, idx) => (
                  <option key={idx} value={iface.ip}>{iface.name} ({iface.ip})</option>
                ))}
              </select>
              <Button onClick={handleSaveNetwork} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {t.apply}
              </Button>
            </div>
            {statusMsg && <p className="text-green-500 mt-4 text-sm font-bold">{statusMsg}</p>}
          </section>

          {/* Security & Accessibility Settings */}
          <section className="p-6 border border-border bg-card/50 rounded-lg flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="text-primary h-6 w-6" />
              <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground">{t.secLabel}</h2>
            </div>
            
            <div className="space-y-6 flex-1">
              <div className="flex items-center justify-between p-4 border border-cyan-500/20 bg-black/40 rounded-lg">
                <div>
                  <h3 className="font-bold text-primary">{t.themeToggle}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t.themeDesc}</p>
                </div>
                <Button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  variant="outline" 
                  className="border-cyan-500/30 text-primary w-24"
                >
                  {theme === 'dark' ? t.dark : t.light}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-cyan-500/20 bg-black/40 rounded-lg">
                <div>
                  <h3 className="font-bold text-primary">{t.reduceMotion}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t.reduceMotionDesc}</p>
                </div>
                <Button 
                  onClick={toggleReduceMotion}
                  variant={reduceMotion ? "default" : "outline"} 
                  className={reduceMotion ? "bg-primary text-black font-bold" : "border-cyan-500/30 text-primary"}
                >
                  {reduceMotion ? t.enabled : t.disabled}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-cyan-500/20 bg-black/40 rounded-lg">
                <div>
                  <h3 className="font-bold text-primary">{t.airGapped}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t.airGappedDesc}</p>
                </div>
                <Button 
                  onClick={toggleLocalOnlyMode}
                  variant={localOnlyMode ? "destructive" : "outline"} 
                  className={localOnlyMode ? "bg-destructive text-white font-bold" : "border-cyan-500/30 text-primary"}
                >
                  {localOnlyMode ? t.enabled : t.disabled}
                </Button>
              </div>
            </div>
          </section>

          {/* System Updates */}
          <section className="p-6 border border-border bg-card/50 rounded-lg flex flex-col md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className={`text-primary h-6 w-6 ${checkingUpdate ? 'animate-spin' : ''}`} />
              <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground">{t.systemUpdate}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {t.updateDesc}
            </p>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 bg-black/40 border border-cyan-500/20 rounded-md">
                <div className="flex items-center gap-3">
                  {updateAvailable ? (
                    <DownloadCloud className="text-orange-500 h-6 w-6 animate-pulse" />
                  ) : (
                    <CheckCircle className="text-green-500 h-6 w-6" />
                  )}
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      {t.updateStatus}
                      <span className="bg-primary/20 text-primary border border-primary/50 px-2 py-0.5 rounded text-[10px] uppercase shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse-glow">v{versionData.version}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {checkingUpdate ? t.checkUpdate : updateAvailable ? t.updateAvail : t.upToDate}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={checkForUpdates} disabled={checkingUpdate || isUpdating}>
                    {t.checkAgain}
                  </Button>
                  {updateAvailable && (
                    <Button 
                      onClick={handleUpdate} 
                      disabled={isUpdating}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse-glow"
                    >
                      {isUpdating ? t.updating : t.installNow}
                    </Button>
                  )}
                </div>
              </div>
              
              {updateAvailable && updatePreview && (
                <div className="p-4 bg-black/60 border border-orange-500/30 rounded-md">
                   <h3 className="text-orange-500 font-mono text-xs mb-2">UPDATE PREVIEW (CHANGELOG)</h3>
                   <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap">{updatePreview}</pre>
                </div>
              )}
            </div>
          </section>
          
          {/* Layout Customization Removed - Now controlled via UI Toggle Buttons on main screen */}

          {/* Danger Zone */}
          <section className="p-6 border border-destructive/50 bg-destructive/10 rounded-lg flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="text-destructive h-6 w-6" />
              <h2 className="text-lg font-bold uppercase tracking-wider text-destructive">{t.dangerZone}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {t.dangerDesc}
            </p>
            <Button onClick={handleUninstall} variant="destructive" className="w-full uppercase font-bold tracking-widest">
              {t.uninstall}
            </Button>
          </section>

          <footer className="mt-8 text-center text-xs text-muted-foreground py-4">
            © 2026 Dinottinjs. All rights reserved.
          </footer>


        </div>
      </main>
    </div>
  );
}
