"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, Activity, Globe2, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useArgusStore } from "@/store/useArgusStore";

const GlobalMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-background text-primary animate-pulse">Lade Karte / Loading Map...</div>
});

export default function ArgusDashboard() {
  const { 
    events, status, stats, 
    showHeatmap, showScatterplot, 
    isPaused, reduceMotion,
    showLeftSidebar, showRightSidebar, showTicker,
    mapStyle,
    selectedCountry, setSelectedCountry, flyTo,
    toggleHeatmap, toggleScatterplot, 
    togglePause, clearEvents,
    toggleMapStyle,
    toggleMapStyle,
    initWorker,
    language
  } = useArgusStore();

  const t = React.useMemo(() => {
    const dict = {
      en: {
        title: "Argus Command",
        search: "Global Search (Coordinates, Entities, Keywords)...",
        system: "SYSTEM",
        data: "Data",
        liveFeed: "Global Live Feed",
        clearFilter: "Clear Filter",
        all: "ALL",
        conflicts: "CONFLICTS",
        disasters: "DISASTERS",
        awaiting: "Awaiting satellite uplinks...",
        noEvents: "No events for this filter.",
        satellite: "Satellite View",
        darkMode: "Dark Mode",
        topography: "Topography",
        heatmap: "Heatmap",
        pauseFeed: "Pause Feed",
        resumeFeed: "Resume Feed",
        clearData: "Clear Data",
        sentiment: "Global Sentiment",
        negative: "Negative",
        positive: "Positive",
        security: "Global Security",
        activeConflicts: "Active Conflicts",
        disastersAlerts: "Disasters / Alerts",
        telemetry: "System Telemetry",
        processed: "Processed",
        nodes: "Nodes",
        latency: "Latency",
        ticker: "ARGUS TICKER",
        src: "SRC:",
        id: "ID:",
        critical: "CRITICAL",
        high: "HIGH",
        loadingMap: "Loading Core Visualizer..."
      },
      de: {
        title: "Argus Kommando",
        search: "Globale Suche (Koordinaten, Instanzen, Keywords)...",
        system: "SYSTEM",
        data: "Daten",
        liveFeed: "Globaler Live Feed",
        clearFilter: "Filter aufheben",
        all: "ALLE",
        conflicts: "KONFLIKTE",
        disasters: "KATASTROPHEN",
        awaiting: "Warte auf Satelliten-Uplink...",
        noEvents: "Keine Ereignisse für diesen Filter.",
        satellite: "Satelliten-Sicht",
        darkMode: "Dunkel-Modus",
        topography: "Topographie",
        heatmap: "Heatmap",
        pauseFeed: "Feed pausieren",
        resumeFeed: "Feed fortsetzen",
        clearData: "Daten löschen",
        sentiment: "Globale Stimmung",
        negative: "Negativ",
        positive: "Positiv",
        security: "Globale Sicherheit",
        activeConflicts: "Aktive Konflikte",
        disastersAlerts: "Katastrophen / Alarme",
        telemetry: "System Telemetrie",
        processed: "Verarbeitet",
        nodes: "Knoten",
        latency: "Latenz",
        ticker: "ARGUS TICKER",
        src: "QUELLE:",
        id: "ID:",
        critical: "KRITISCH",
        high: "HOCH",
        loadingMap: "Lade Kern-Visualisierer..."
      }
    };
    return dict[language];
  }, [language]);

  const [activeTab, setActiveTab] = React.useState('ALL');

  const filteredEvents = React.useMemo(() => {
    return events.filter(e => {
      // Very basic country filtering: check if country name is in title
      if (selectedCountry && !e.title.toLowerCase().includes(selectedCountry.toLowerCase())) return false;
      
      if (activeTab === 'CONFLICTS') return (e as any).is_conflict || e.source.includes('OCHA');
      if (activeTab === 'DISASTERS') return (e.source.includes('GDACS') || e.source.includes('NASA') || e.source.includes('USGS')) && !e.source.includes('Open-Notify');
      return true;
    });
  }, [events, selectedCountry, activeTab]);

  useEffect(() => {
    initWorker();
  }, [initWorker]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-transparent text-foreground dark">
      {/* HEADER / TOP BAR */}
      <header className="h-16 glass-panel flex items-center justify-between px-6 z-10 shrink-0 border-b-0 shadow-md">
        <div className="flex items-center gap-3 group cursor-default">
          <ShieldAlert className="text-primary h-6 w-6 animate-pulse-glow" />
          <h1 className="text-xl font-bold tracking-widest text-primary uppercase neon-text group-hover:scale-105 transition-transform">
            {t.title}
          </h1>
          <Badge className="ml-2 bg-primary/20 text-primary border border-primary/50 px-2 py-0.5 text-[10px] uppercase shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse-glow hidden md:flex">
            V12
          </Badge>
        </div>
        
        <div className="flex-1 max-w-xl mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder={t.search} 
            className="w-full bg-black/40 pl-10 border-cyan-500/30 focus-visible:ring-primary focus-visible:border-primary transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.location.href = '/settings'} title="System Settings" className="hover:bg-primary/20 hover:text-primary transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </Button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'ONLINE' ? 'bg-primary animate-pulse-glow shadow-[0_0_8px_rgba(6,182,212,0.8)]' : status === 'CONNECTING' ? 'bg-yellow-500 animate-pulse' : 'bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.8)]'}`} />
            <Badge variant="outline" className={`border ${status === 'ONLINE' ? 'text-primary border-primary bg-primary/10 neon-border' : status === 'CONNECTING' ? 'text-yellow-500 border-yellow-500 bg-yellow-500/10' : 'text-destructive border-destructive bg-destructive/10'}`}>
              {t.system} {status}
            </Badge>
          </div>
          <div className="text-xs text-primary/70 tabular-nums font-mono">
            {new Date().toISOString().split('T')[1].split('.')[0]} UTC
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* LEFT SIDEBAR - TICKER */}
        {showLeftSidebar && (
        <aside className="w-full md:w-64 lg:w-80 h-[30vh] md:h-auto glass-panel flex flex-col z-10 m-0 md:m-4 md:mr-0 rounded-none md:rounded-xl border-t md:border-l transition-all duration-300 ease-in-out">
          <div className="p-4 border-b border-cyan-500/20 flex flex-col gap-3 bg-black/40 md:rounded-t-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary animate-pulse-glow" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary neon-text">
                {selectedCountry ? `${t.data}: ${selectedCountry}` : t.liveFeed}
              </h2>
              {selectedCountry && (
                <button onClick={() => setSelectedCountry(null)} className="ml-auto text-xs text-destructive hover:text-red-400">{t.clearFilter}</button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('ALL')} className={`text-[10px] px-2 py-1 rounded border font-mono transition-all ${activeTab === 'ALL' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'border-transparent text-primary/50 hover:text-primary/80'}`}>{t.all}</button>
              <button onClick={() => setActiveTab('CONFLICTS')} className={`text-[10px] px-2 py-1 rounded border font-mono transition-all ${activeTab === 'CONFLICTS' ? 'bg-destructive/20 border-destructive text-destructive shadow-[0_0_10px_rgba(255,0,0,0.5)]' : 'border-transparent text-destructive/50 hover:text-destructive/80'}`}>{t.conflicts}</button>
              <button onClick={() => setActiveTab('DISASTERS')} className={`text-[10px] px-2 py-1 rounded border font-mono transition-all ${activeTab === 'DISASTERS' ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(255,165,0,0.5)]' : 'border-transparent text-orange-500/50 hover:text-orange-400/80'}`}>{t.disasters}</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 custom-scrollbar relative z-10">
            {filteredEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-primary/50 font-mono">
                {events.length === 0 ? <span className="animate-pulse">{t.awaiting}</span> : <span>{t.noEvents}</span>}
              </div>
            ) : (
              filteredEvents.map((event, i) => (
                <div 
                  key={event.id} 
                  onClick={() => flyTo(event.coordinates[0], event.coordinates[1], 6)}
                  className={`glass-panel-hover p-3 rounded-lg border-l-2 text-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] transform transition-all cursor-pointer ${!reduceMotion ? 'hover:scale-[1.02] hover:-translate-y-1' : ''} ${i === 0 && !reduceMotion ? 'animate-slide-down neon-pulse-new' : ''} ${event.type === 'CRITICAL' ? 'border-destructive' : event.type === 'HIGH' ? 'border-orange-500' : event.type === 'ISS_TRACKER' ? 'border-white' : 'border-primary'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold font-mono tracking-widest ${event.type === 'CRITICAL' ? 'text-destructive drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]' : event.type === 'HIGH' ? 'text-orange-500' : event.type === 'ISS_TRACKER' ? 'text-white' : 'text-primary'}`}>
                      {event.type === 'CRITICAL' ? t.critical : event.type === 'HIGH' ? t.high : event.type}
                    </span>
                    <span className="text-[10px] text-primary/50 font-mono">{event.time}</span>
                  </div>
                  <p className="text-white/90 text-xs font-medium leading-relaxed drop-shadow-md">{event.title}</p>
                  <div className="mt-2 text-[10px] text-primary/40 flex justify-between font-mono items-center">
                    <span className={`px-1 py-0.5 rounded-sm ${event.source.includes('NASA') ? 'bg-blue-900/40 text-blue-400 border border-blue-500/30' : event.source.includes('UN') ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800/40'}`}>
                      {t.src} {event.source}
                    </span>
                    <span>{t.id} {event.id.substring(0,8)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
        )}

        {/* CENTER - 3D MAP */}
        <main className="flex-1 relative bg-transparent md:rounded-xl m-0 md:m-4 md:ml-4 lg:ml-4 overflow-hidden border-y md:border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <GlobalMap />
          
          {/* Overlay UI on map */}
          <div className="absolute bottom-6 left-6 z-20 flex flex-wrap gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={toggleMapStyle}
              className={`glass-panel-hover transition-all bg-black/60 text-slate-200 border-cyan-500/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]`}
            >
              <Globe2 className="h-4 w-4 mr-2" /> {mapStyle === 'dark' ? t.satellite : t.darkMode}
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={toggleScatterplot}
              className={`glass-panel-hover transition-all ${showScatterplot ? 'bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-black/60 text-slate-400 border-cyan-500/30'}`}
            >
              <Globe2 className="h-4 w-4 mr-2" /> {t.topography}
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={toggleHeatmap}
              className={`glass-panel-hover transition-all ${showHeatmap ? 'bg-orange-500/20 text-orange-400 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-black/60 text-slate-400 border-cyan-500/30'}`}
            >
              <AlertTriangle className="h-4 w-4 mr-2" /> {t.heatmap}
            </Button>
          </div>
          
          <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={togglePause}
              className={`glass-panel-hover transition-all ${isPaused ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-black/60 text-slate-400 border-cyan-500/30'}`}
            >
              <ShieldAlert className="h-4 w-4 mr-2" /> {isPaused ? t.resumeFeed : t.pauseFeed}
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={clearEvents}
              className="glass-panel-hover bg-black/60 text-red-400 border-red-500/50 hover:bg-red-500/20 transition-all"
            >
              <Search className="h-4 w-4 mr-2" /> {t.clearData}
            </Button>
          </div>
        </main>
        
        {/* RIGHT SIDEBAR - ANALYTICS */}
        {showRightSidebar && (
        <aside className="w-full md:w-64 lg:w-80 h-[30vh] md:h-auto glass-panel flex flex-col z-10 m-0 md:m-4 md:ml-0 p-4 rounded-none md:rounded-xl border-t md:border-r relative overflow-y-auto transition-all duration-300 ease-in-out">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-l from-transparent via-primary to-transparent opacity-50" />
          
          <div className="mb-8 shrink-0">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary neon-text mb-4">{t.sentiment}</h2>
            <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden flex border border-cyan-500/20 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="h-full bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.8)] transition-all duration-1000" style={{ width: `${100 - (stats?.sentiment || 50)}%` }}></div>
              <div className="h-full bg-primary shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-1000" style={{ width: `${stats?.sentiment || 50}%` }}></div>
            </div>
            <div className="flex justify-between text-xs mt-3 font-mono text-primary/70">
              <span className="text-destructive/90">{t.negative} ({100 - Math.round(stats?.sentiment || 50)}%)</span>
              <span>{t.positive} ({Math.round(stats?.sentiment || 50)}%)</span>
            </div>
          </div>
          
          <div className="mb-6 shrink-0">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary neon-text mb-4">{t.security}</h2>
            <div className="space-y-3">
              <div className="glass-panel-hover p-3 rounded-lg flex justify-between items-center border border-cyan-500/10">
                <span className="font-mono text-primary/70 text-xs flex items-center"><ShieldAlert className="h-3 w-3 mr-2 text-destructive"/> {t.activeConflicts}</span>
                <span className="font-mono text-destructive text-sm font-bold shadow-[0_0_10px_rgba(255,0,0,0.2)]">{events.filter(e => e.source.includes('OCHA')).length}</span>
              </div>
              <div className="glass-panel-hover p-3 rounded-lg flex justify-between items-center border border-cyan-500/10">
                <span className="font-mono text-primary/70 text-xs flex items-center"><AlertTriangle className="h-3 w-3 mr-2 text-orange-500"/> {t.disastersAlerts}</span>
                <span className="font-mono text-orange-400 text-sm font-bold shadow-[0_0_10px_rgba(255,165,0,0.2)]">{events.filter(e => e.source.includes('GDACS') || e.source.includes('NASA')).length}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-auto mb-2 shrink-0">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary neon-text mb-4">{t.telemetry}</h2>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-black/40 rounded border border-cyan-500/10 text-center">
                    <div className="text-primary/50 mb-1">{t.processed}</div>
                    <div className="text-primary">{events.length} {t.nodes}</div>
                </div>
                <div className="p-2 bg-black/40 rounded border border-cyan-500/10 text-center">
                    <div className="text-primary/50 mb-1">{t.latency}</div>
                    <div className="text-primary">{(stats?.sentiment ? Math.random() * 15 + 10 : 0).toFixed(1)} ms</div>
                </div>
            </div>
          </div>
        </aside>
        )}
      </div>

      {showTicker && (
      <div className="h-8 w-full bg-black/90 border-t border-cyan-500/30 flex items-center overflow-hidden whitespace-nowrap shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.8)] z-50 transition-all duration-300 ease-in-out relative">
        <div className="bg-primary/20 text-primary font-bold px-4 py-1 text-xs uppercase tracking-widest border-r border-cyan-500/50 z-20 shrink-0 h-full flex items-center shadow-[5px_0_10px_rgba(0,0,0,0.5)] absolute left-0 top-0">
          {t.ticker}
        </div>
        <div className={`flex-1 flex overflow-hidden w-full ${!reduceMotion ? 'animate-marquee' : ''}`} style={{ paddingLeft: '150px' }}>
          {/* Ticker Content Duplicated for seamless looping */}
          {[1, 2].map((loopId) => (
            <div key={loopId} className="flex items-center gap-8 pl-8 shrink-0 min-w-full">
              <span className="text-green-400 font-mono text-xs font-bold">BTC/USDT ${stats?.btc_price?.toLocaleString() || "---"} ▲</span>
              <span className="text-green-400 font-mono text-xs font-bold">ETH/USDT ${stats?.eth_price?.toLocaleString() || "---"} ▲</span>
              <span className="text-primary/50 font-mono text-xs">|</span>
              {events.slice(0, 10).map((event, idx) => (
                <span key={`ticker-${loopId}-${event.id}-${idx}`} className="text-xs font-mono text-slate-300 flex-shrink-0">
                  <span className={event.type === 'CRITICAL' ? 'text-destructive' : event.type === 'HIGH' ? 'text-orange-500' : 'text-primary'}>[{event.type === 'CRITICAL' ? t.critical : event.type === 'HIGH' ? t.high : event.type}]</span> {event.title}
                  <span className="text-primary/50 ml-8">|</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
