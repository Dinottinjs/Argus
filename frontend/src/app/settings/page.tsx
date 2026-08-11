"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, ShieldAlert, Trash2, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    // Fetch interfaces from the local companion app
    fetch("http://localhost:8001/interfaces")
      .then(res => res.json())
      .then(data => {
        setInterfaces(data.interfaces || []);
      })
      .catch(err => console.error("Companion app not running", err));
      
    const saved = localStorage.getItem("argus_network_interface");
    if (saved) setSelectedInterface(saved);
  }, []);

  const handleSaveNetwork = () => {
    localStorage.setItem("argus_network_interface", selectedInterface);
    // In a full implementation, we'd send this to the FastAPI backend
    // fetch("http://localhost:8000/api/settings/network", { method: "POST", body: JSON.stringify({ interface: selectedInterface }) })
    setStatusMsg("Network settings saved for 24/7 reliability.");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleUninstall = () => {
    if (confirm("CRITICAL WARNING: This will completely destroy the Argus Command Center from your system. Are you sure?")) {
      fetch("http://localhost:8001/uninstall", { method: "POST" })
        .then(() => {
          alert("Uninstall sequence initiated. The software will now terminate.");
          window.close(); // Attempt to close window
        })
        .catch(() => alert("Uninstall signal sent."));
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
            Argus Settings
          </h1>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-10 max-w-4xl mx-auto w-full">
        <div className="space-y-12">
          
          {/* Network Settings */}
          <section className="p-6 border border-border bg-card/50 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Network className="text-primary h-6 w-6" />
              <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground">Network Binding</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Select the dedicated network interface (WLAN/LAN) Argus should use for 24/7 continuous data polling. 
              This ensures stability if you have multiple network adapters.
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
                Apply Network Configuration
              </Button>
            </div>
            {statusMsg && <p className="text-primary mt-3 text-sm">{statusMsg}</p>}
          </section>

          {/* Danger Zone */}
          <section className="p-6 border border-destructive/50 bg-destructive/10 rounded-lg mt-12">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="text-destructive h-6 w-6" />
              <h2 className="text-lg font-bold uppercase tracking-wider text-destructive">Danger Zone</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Permanently remove the Argus Command Center, including all Docker containers, desktop shortcuts, and local files from this system.
            </p>
            <Button onClick={handleUninstall} variant="destructive" className="w-full uppercase font-bold tracking-widest">
              Uninstall System Completely
            </Button>
          </section>

        </div>
      </main>
    </div>
  );
}
