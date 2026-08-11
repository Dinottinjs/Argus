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
  addEvent: (event: ArgusEvent) => void;
  status: string;
  setStatus: (status: string) => void;
}

export const useArgusStore = create<ArgusStore>((set) => ({
  events: [],
  addEvent: (event) => set((state) => {
    // Keep max 50 events in memory to prevent lag
    const newEvents = [event, ...state.events].filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i).slice(0, 50);
    return { events: newEvents };
  }),
  status: "OFFLINE",
  setStatus: (status) => set({ status })
}));
