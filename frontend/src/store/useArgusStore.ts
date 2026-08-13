import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ArgusEvent {
  id: string;
  type: string;
  title: string;
  time: string;
  coordinates: [number, number];
  target_coordinates?: [number, number];
  source: string;
  is_conflict?: boolean;
  timestamp?: number;
}

export interface NewsStats {
  headlines: { title: string; link: string; time: string }[];
  volume: number;
  source: string;
}

interface ArgusStore {
  events: ArgusEvent[];
  binaryPositions: Float32Array | null;
  status: string;
  stats: { btc_price: number; eth_price: number; sentiment: number } | null;
  newsStats: NewsStats | null;
  isConnected: boolean;
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
  theme: 'dark' | 'light' | 'discord';
  showFPS: boolean;
  selectedCountry: any | null;
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
    transitionDuration?: number;
    transitionInterpolator?: any;
    minZoom?: number;
    maxZoom?: number;
  };
  setViewState: (viewState: any) => void;
  flyTo: (longitude: number, latitude: number, zoom?: number) => void;
  setSelectedCountry: (country: any | null) => void;
  setLanguage: (lang: 'en' | 'de') => void;
  setTheme: (theme: 'dark' | 'light' | 'discord') => void;
  toggleFPS: () => void;
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
  reconnect: () => void;
}

export const useArgusStore = create<ArgusStore>()(
  persist(
    (set, get) => ({
  events: [],
  binaryPositions: null,
  status: "OFFLINE",
  stats: null,
  newsStats: null,
  isConnected: false,
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
  theme: 'dark',
  showFPS: false,
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
    set((state) => ({
      viewState: {
        ...state.viewState,
        longitude,
        latitude,
        zoom,
        transitionDuration: 2000,
      }
    }));
  },
  setSelectedCountry: (country) => set({ selectedCountry: country }),
  setLanguage: (lang) => set({ language: lang }),
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('discord');
      } else if (theme === 'discord') {
        document.documentElement.classList.add('discord');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.remove('dark', 'discord');
      }
    }
  },
  
  toggleFPS: () => set((state) => ({ showFPS: !state.showFPS })),
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
  
  reconnect: () => {
    set({ events: [], status: 'CONNECTING...' });
    if (get().worker) {
        get().worker?.postMessage({ type: 'RECONNECT' });
    }
  },
  
  resetUI: () => set({ 
    showHeatmap: true, 
    showScatterplot: true, 
    reduceMotion: false, 
    localOnlyMode: false,
    showLeftSidebar: true,
    showRightSidebar: true,
    showTicker: true,
    mapStyle: 'dark',
    language: 'en',
    theme: 'dark',
    showFPS: false,
    isPaused: false
  }),
  
  initWorker: () => {
    const state = get();
    if (typeof document !== 'undefined') {
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('discord');
      } else if (state.theme === 'discord') {
        document.documentElement.classList.add('discord');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.remove('dark', 'discord');
      }
    }
    if (state.worker) return;
    
    if (typeof window === 'undefined') return;
    
    const worker = new Worker(new URL('../workers/data.worker.ts', import.meta.url));
    
    worker.onmessage = (e) => {
        const { type, status, events, binaryData, stats, newsStats } = e.data;
        if (type === 'STATUS') {
            set({ status });
        } else if (type === 'UPDATE_STATS') {
          set({ stats });
        } else if (type === 'UPDATE_NEWS_STATS') {
          set({ newsStats });
        } else if (type === 'BATCH_EVENTS') {
            set((state) => {
                if (state.isPaused) return state;
                
                let incomingEvents = events;
                if (state.localOnlyMode) {
                   incomingEvents = incomingEvents.filter((e: any) => e.source !== 'USGS' && e.source !== 'BBC News' && e.source !== 'Binance');
                }
                
                const merged = [...incomingEvents, ...state.events].slice(0, 1000);
                
                let newPositions = binaryData.positions;
                if (state.binaryPositions && newPositions) {
                    const combined = new Float32Array(state.binaryPositions.length + newPositions.length);
                    combined.set(newPositions, 0);
                    combined.set(state.binaryPositions, newPositions.length);
                    newPositions = combined.length > 3000 ? combined.slice(0, 3000) : combined;
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
    
    set({ worker, status: 'CONNECTING...' });
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
    language: state.language,
    theme: state.theme,
    showFPS: state.showFPS
  }),
}
)
);
