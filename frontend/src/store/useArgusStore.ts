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
  language: 'en' | 'de';
  selectedCountry: string | null;
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
    transitionDuration?: number;
    transitionInterpolator?: any;
  };
  setViewState: (viewState: any) => void;
  flyTo: (longitude: number, latitude: number, zoom?: number) => void;
  setSelectedCountry: (country: string | null) => void;
  setLanguage: (lang: 'en' | 'de') => void;
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
  language: 'en',
  selectedCountry: null,
  viewState: {
    longitude: 10,
    latitude: 30,
    zoom: 2.0,
    pitch: 45,
    bearing: 0,
    minZoom: 1.8,
    maxZoom: 20
  },
  
  setViewState: (viewState) => set({ viewState }),
  flyTo: (longitude, latitude, zoom = 4) => {
    // Requires importing FlyToInterpolator where it's used, but we can pass a dummy string to be parsed or use MapGL's native flyTo if we use react-map-gl
    set((state) => ({
      viewState: {
        ...state.viewState,
        longitude,
        latitude,
        zoom,
        transitionDuration: 2000,
        // We will handle the interpolator in Map.tsx
      }
    }));
  },
  setSelectedCountry: (country) => set({ selectedCountry: country }),
  setLanguage: (lang) => set({ language: lang }),
  
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
    mapStyle: state.mapStyle,
    language: state.language
  }),
}
)
);
