import { create } from 'zustand';

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
  worker: Worker | null;
  initWorker: () => void;
}

export const useArgusStore = create<ArgusStore>((set, get) => ({
  events: [],
  binaryPositions: null,
  status: "OFFLINE",
  worker: null,
  
  initWorker: () => {
    if (get().worker) return; // already initialized
    
    // Only run on client
    if (typeof window === 'undefined') return;
    
    const worker = new Worker(new URL('../workers/data.worker.ts', import.meta.url));
    
    worker.onmessage = (e) => {
        const { type, status, events, binaryData } = e.data;
        if (type === 'STATUS') {
            set({ status });
        } else if (type === 'BATCH_EVENTS') {
            set((state) => {
                // Merge old events with new batch
                const merged = [...events, ...state.events].slice(0, 5000); // UI holds up to 5000 in memory
                
                // Also merge binary positions for DeckGL
                let newPositions = binaryData.positions;
                if (state.binaryPositions && newPositions) {
                    const combined = new Float32Array(state.binaryPositions.length + newPositions.length);
                    combined.set(newPositions, 0);
                    combined.set(state.binaryPositions, newPositions.length);
                    // Keep up to 5000 points (10000 floats)
                    newPositions = combined.length > 10000 ? combined.slice(0, 10000) : combined;
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
}));
