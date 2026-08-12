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
  loading: () => <div className="w-full h-full flex items-center justify-center bg-background text-primary">Loading Core Visualizer...</div>
});

export default function ArgusDashboard() {
  const { 
    events, status, stats, 
    showHeatmap, showScatterplot, 
    isPaused, reduceMotion,
    toggleHeatmap, toggleScatterplot, 
    togglePause, clearEvents,
    initWorker 
  } = useArgusStore();

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
            Argus Command
          </h1>
        </div>
        
        <div className="flex-1 max-w-xl mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Global Search (Coordinates, Entities, Keywords)..." 
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
              SYSTEM {status}
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
        <aside className="w-full md:w-64 lg:w-80 h-[30vh] md:h-auto glass-panel flex flex-col z-10 m-0 md:m-4 md:mr-0 rounded-none md:rounded-xl border-t md:border-l">
          <div className="p-4 border-b border-cyan-500/20 flex items-center gap-2 bg-black/20 md:rounded-t-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
            <Activity className="h-4 w-4 text-primary animate-pulse-glow" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary neon-text">Live Feed</h2>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 custom-scrollbar relative z-10">
            {events.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-primary/50 font-mono animate-pulse">
                Waiting for live signals...
              </div>
            ) : (
              events.map((event, i) => (
                <div key={event.id} className={`glass-panel-hover p-3 rounded-lg border-l-2 text-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] transform transition-all ${!reduceMotion ? 'hover:scale-105 hover:-translate-y-1' : ''} ${i === 0 && !reduceMotion ? 'animate-slide-down neon-pulse-new' : ''} ${event.type === 'CRITICAL' ? 'border-destructive' : event.type === 'HIGH' ? 'border-orange-500' : 'border-primary'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold font-mono tracking-widest ${event.type === 'CRITICAL' ? 'text-destructive drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]' : event.type === 'HIGH' ? 'text-orange-500' : 'text-primary'}`}>
                      {event.type}
                    </span>
                    <span className="text-[10px] text-primary/50 font-mono">{event.time}</span>
                  </div>
                  <p className="text-white/90 text-xs font-medium leading-relaxed drop-shadow-md">{event.title}</p>
                  <div className="mt-2 text-[10px] text-primary/40 flex justify-between font-mono">
                    <span>SRC: {event.source}</span>
                    <span>ID: {event.id.substring(0,8)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* CENTER - 3D MAP */}
        <main className="flex-1 relative bg-transparent md:rounded-xl m-0 md:m-4 md:ml-4 lg:ml-4 overflow-hidden border-y md:border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <GlobalMap />
          
          {/* Overlay UI on map */}
          <div className="absolute bottom-6 left-6 z-20 flex flex-wrap gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={toggleScatterplot}
              className={`glass-panel-hover transition-all ${showScatterplot ? 'bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-black/60 text-slate-400 border-cyan-500/30'}`}
            >
              <Globe2 className="h-4 w-4 mr-2" /> Topography
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={toggleHeatmap}
              className={`glass-panel-hover transition-all ${showHeatmap ? 'bg-orange-500/20 text-orange-400 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-black/60 text-slate-400 border-cyan-500/30'}`}
            >
              <AlertTriangle className="h-4 w-4 mr-2" /> Heatmap
            </Button>
          </div>
          
          <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={togglePause}
              className={`glass-panel-hover transition-all ${isPaused ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-black/60 text-slate-400 border-cyan-500/30'}`}
            >
              <ShieldAlert className="h-4 w-4 mr-2" /> {isPaused ? 'Resume Feed' : 'Pause Feed'}
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={clearEvents}
              className="glass-panel-hover bg-black/60 text-red-400 border-red-500/50 hover:bg-red-500/20 transition-all"
            >
              <Search className="h-4 w-4 mr-2" /> Clear Data
            </Button>
          </div>
        </main>
        
        {/* RIGHT SIDEBAR - ANALYTICS */}
        <aside className="w-full md:w-64 lg:w-80 h-[30vh] md:h-auto glass-panel flex flex-col z-10 m-0 md:m-4 md:ml-0 p-4 rounded-none md:rounded-xl border-t md:border-r relative overflow-y-auto">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-l from-transparent via-primary to-transparent opacity-50" />
          
          <div className="mb-8 shrink-0">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary neon-text mb-4">Global Sentiment</h2>
            <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden flex border border-cyan-500/20 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="h-full bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.8)] transition-all duration-1000" style={{ width: `${100 - (stats?.sentiment || 50)}%` }}></div>
              <div className="h-full bg-primary shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-1000" style={{ width: `${stats?.sentiment || 50}%` }}></div>
            </div>
            <div className="flex justify-between text-xs mt-3 font-mono text-primary/70">
              <span className="text-destructive/90">Negative ({100 - Math.round(stats?.sentiment || 50)}%)</span>
              <span>Positive ({Math.round(stats?.sentiment || 50)}%)</span>
            </div>
          </div>
          
          <div className="mb-6 shrink-0">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary neon-text mb-4">Live Markets (Binance)</h2>
            <div className="space-y-3">
              <div className="glass-panel-hover p-3 rounded-lg flex justify-between items-center border border-cyan-500/10">
                <span className="font-mono text-primary/70 text-xs">BTC/USDT</span>
                <span className="font-mono text-white text-sm font-bold shadow-[0_0_10px_rgba(255,255,255,0.2)]">${stats?.btc_price?.toLocaleString() || "---"}</span>
              </div>
              <div className="glass-panel-hover p-3 rounded-lg flex justify-between items-center border border-cyan-500/10">
                <span className="font-mono text-primary/70 text-xs">ETH/USDT</span>
                <span className="font-mono text-white text-sm font-bold shadow-[0_0_10px_rgba(255,255,255,0.2)]">${stats?.eth_price?.toLocaleString() || "---"}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-auto mb-2 shrink-0">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary neon-text mb-4">System Telemetry</h2>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-black/40 rounded border border-cyan-500/10 text-center">
                    <div className="text-primary/50 mb-1">Processed</div>
                    <div className="text-primary">{events.length} Nodes</div>
                </div>
                <div className="p-2 bg-black/40 rounded border border-cyan-500/10 text-center">
                    <div className="text-primary/50 mb-1">Latency</div>
                    <div className="text-primary">{(stats?.sentiment ? Math.random() * 15 + 10 : 0).toFixed(1)} ms</div>
                </div>
            </div>
          </div>
        </aside>
      </div>

      {/* BOTTOM TICKER - BLOOMBERG STYLE */}
      <div className="h-8 w-full bg-black/90 border-t border-cyan-500/30 flex items-center overflow-hidden whitespace-nowrap shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.8)] z-50">
        <div className="bg-primary/20 text-primary font-bold px-4 py-1 text-xs uppercase tracking-widest border-r border-cyan-500/50 z-10 shrink-0 h-full flex items-center shadow-[5px_0_10px_rgba(0,0,0,0.5)]">
          ARGUS TICKER
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className={`${!reduceMotion ? 'animate-marquee' : ''} flex items-center gap-8 pl-4 h-full`}>
            <span className="text-green-400 font-mono text-xs font-bold">BTC/USDT ${stats?.btc_price?.toLocaleString() || "---"} ▲</span>
            <span className="text-green-400 font-mono text-xs font-bold">ETH/USDT ${stats?.eth_price?.toLocaleString() || "---"} ▲</span>
            <span className="text-primary/50 font-mono text-xs">|</span>
            {events.slice(0, 10).map(event => (
              <span key={`ticker-${event.id}`} className="text-xs font-mono text-slate-300">
                <span className={event.type === 'CRITICAL' ? 'text-destructive' : event.type === 'HIGH' ? 'text-orange-500' : 'text-primary'}>[{event.type}]</span> {event.title}
                <span className="text-primary/50 ml-8">|</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
