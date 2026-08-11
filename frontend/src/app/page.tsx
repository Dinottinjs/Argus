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
  const { events, status, initWorker } = useArgusStore();

  useEffect(() => {
    initWorker();
  }, [initWorker]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {/* HEADER / TOP BAR */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-primary h-6 w-6" />
          <h1 className="text-xl font-bold tracking-widest text-primary uppercase">
            Argus Command
          </h1>
        </div>
        
        <div className="flex-1 max-w-xl mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Global Search (Coordinates, Entities, Keywords)..." 
            className="w-full bg-input/50 pl-10 border-border focus-visible:ring-primary"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.location.href = '/settings'} title="System Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground hover:text-primary transition-colors"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </Button>
          <Badge variant="outline" className={`border ${status === 'ONLINE' ? 'text-primary border-primary bg-primary/10' : status === 'CONNECTING' ? 'text-yellow-500 border-yellow-500 bg-yellow-500/10' : 'text-destructive border-destructive bg-destructive/10'}`}>
            SYSTEM {status}
          </Badge>
          <div className="text-xs text-muted-foreground tabular-nums">
            {new Date().toISOString().split('T')[1].split('.')[0]} UTC
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR - TICKER */}
        <aside className="w-80 border-r border-border bg-card/80 flex flex-col z-10">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Feed</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {events.length === 0 && <div className="text-xs text-muted-foreground text-center mt-10">Waiting for live signals...</div>}
            {events.map(event => (
              <div key={event.id} className="p-3 border border-border/50 rounded-md bg-background/50 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={event.type === 'CRITICAL' ? 'destructive' : event.type === 'HIGH' ? 'secondary' : 'default'} className="text-[10px]">
                    {event.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
                <p className="text-sm font-medium">{event.title}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER - 3D MAP */}
        <main className="flex-1 relative bg-black">
          <GlobalMap />
          
          {/* Overlay UI on map */}
          <div className="absolute bottom-6 left-6 z-20 flex gap-2">
            <Button variant="secondary" size="sm" className="bg-card/80 backdrop-blur border border-border">
              <Globe2 className="h-4 w-4 mr-2" /> Topography
            </Button>
            <Button variant="secondary" size="sm" className="bg-card/80 backdrop-blur border border-border text-primary">
              <AlertTriangle className="h-4 w-4 mr-2" /> Heatmap
            </Button>
          </div>
        </main>
        
        {/* RIGHT SIDEBAR - ANALYTICS */}
        <aside className="w-80 border-l border-border bg-card/80 flex flex-col z-10 p-4">
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Global Sentiment</h2>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
              <div className="h-full bg-destructive w-1/3"></div>
              <div className="h-full bg-primary w-2/3"></div>
            </div>
            <div className="flex justify-between text-xs mt-2 text-muted-foreground">
              <span>Negative (33%)</span>
              <span>Positive (67%)</span>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Market Correlation</h2>
            <div className="h-32 border border-border rounded flex items-center justify-center bg-background/50 text-xs text-muted-foreground">
              Chart Placeholder (Recharts)
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
