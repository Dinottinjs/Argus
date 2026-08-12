import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ArgusEvent {
  id: string;
  type: string;
  title: string;
  time: string;
  coordinates: number[];
  source: string;
}

interface ArgusStore {
  events: ArgusEvent[];
  binaryPositions: Float32Array | null;
  status: string;
  stats: any;
  worker: Worker | null;
  showHeatmap: boolean;
  showScatterplot: boolean;
  isPaused: boolean;
  reduceMotion: boolean;
  localOnlyMode: boolean;
  showLeftSidebar: boolean;
  showRightSidebar: boolean;
  showTicker: boolean;
  mapStyle: 'dark' | 'satellite';
  initWorker: () => void;
  toggleHeatmap: () => void;
  toggleScatterplot: () => void;
  togglePause: () => void;
  toggleReduceMotion: () => void;
  toggleLocalOnlyMode: () => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleTicker: () => void;
  toggleMapStyle: () => void;
  clearEvents: () => void;
  resetUI: () => void;
}

export const useArgusStore = create<ArgusStore>()(
  persist(
    (set, get) => ({
  events: [],
  binaryPositions: null,
  status: "OFFLINE",
  stats: null,
  worker: null,
  showHeatmap: true,
  showScatterplot: true,
  isPaused: false,
  reduceMotion: false,
  localOnlyMode: false,
  showLeftSidebar: true,
  showRightSidebar: true,
  showTicker: true,
  mapStyle: 'dark',
  
  toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
  toggleScatterplot: () => set((state) => ({ showScatterplot: !state.showScatterplot })),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  toggleReduceMotion: () => set((state) => ({ reduceMotion: !state.reduceMotion })),
  toggleLocalOnlyMode: () => set((state) => ({ localOnlyMode: !state.localOnlyMode })),
  toggleLeftSidebar: () => set((state) => ({ showLeftSidebar: !state.showLeftSidebar })),
  toggleRightSidebar: () => set((state) => ({ showRightSidebar: !state.showRightSidebar })),
  toggleTicker: () => set((state) => ({ showTicker: !state.showTicker })),
  toggleMapStyle: () => set((state) => ({ mapStyle: state.mapStyle === 'dark' ? 'satellite' : 'dark' })),
  clearEvents: () => set({ events: [], binaryPositions: null }),
  
  resetUI: () => set({ 
    showHeatmap: true, 
    showScatterplot: true, 
    reduceMotion: false, 
    localOnlyMode: false,
    showLeftSidebar: true,
    showRightSidebar: true,
    showTicker: true,
    mapStyle: 'dark',
    isPaused: false
  }),
  
  initWorker: () => {
    if (get().worker) return; // already initialized
    
    // Only run on client
    if (typeof window === 'undefined') return;
    
    const worker = new Worker(new URL('../workers/data.worker.ts', import.meta.url));
    
    worker.onmessage = (e) => {
        const { type, status, events, binaryData, stats } = e.data;
        if (type === 'STATUS') {
            set({ status });
        } else if (type === 'UPDATE_STATS') {
            set({ stats });
        } else if (type === 'BATCH_EVENTS') {
            set((state) => {
                if (state.isPaused) return state; // Do not accept new events if paused
                
                let incomingEvents = events;
                if (state.localOnlyMode) {
                   incomingEvents = incomingEvents.filter((e: any) => e.source !== 'USGS' && e.source !== 'BBC News' && e.source !== 'Binance');
                }
                
                // Merge old events with new batch
                const merged = [...incomingEvents, ...state.events].slice(0, 100); // UI holds up to 100 in memory (Memory Leak Fix)
                
                // Also merge binary positions for DeckGL
                let newPositions = binaryData.positions;
                if (state.binaryPositions && newPositions) {
                    const combined = new Float32Array(state.binaryPositions.length + newPositions.length);
                    combined.set(newPositions, 0);
                    combined.set(state.binaryPositions, newPositions.length);
                    // Keep up to 500 points (1000 floats) to prevent WebGL crashes
                    newPositions = combined.length > 1000 ? combined.slice(0, 1000) : combined;
                } else if (state.binaryPositions && !newPositions) {
                    newPositions = state.binaryPositions;
                }
                
                return { events: merged, binaryPositions: newPositions };
            });
        }
    };
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsUrl = apiUrl.replace("http", "ws") + "/ws/live";
    
    worker.postMessage({ type: 'CONNECT', payload: { url: wsUrl } });
    
    set({ worker });
  }
}),
{
  name: 'argus-storage',
  partialize: (state) => ({ 
    showHeatmap: state.showHeatmap, 
    showScatterplot: state.showScatterplot, 
    reduceMotion: state.reduceMotion, 
    localOnlyMode: state.localOnlyMode,
    showLeftSidebar: state.showLeftSidebar,
    showRightSidebar: state.showRightSidebar,
    showTicker: state.showTicker,
    mapStyle: state.mapStyle
  }),
}
)
);
