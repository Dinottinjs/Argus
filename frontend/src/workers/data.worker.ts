// data.worker.ts
// Web Worker for processing high-volume Argus events without blocking the main UI thread

self.onmessage = (e) => {
  const { type, payload } = e.data;
  
  if (type === 'CONNECT') {
    connectWebSocket(payload.url);
  }
};

let ws: WebSocket;
let reconnectTimer: any;
let eventCache: any[] = [];
const MAX_EVENTS = 5000;

function connectWebSocket(url: string) {
  if (ws) ws.close();
  
  ws = new WebSocket(url);
  
  ws.onopen = () => {
    self.postMessage({ type: 'STATUS', status: 'ONLINE' });
  };
  
  ws.onclose = () => {
    self.postMessage({ type: 'STATUS', status: 'OFFLINE' });
    reconnectTimer = setTimeout(() => connectWebSocket(url), 3000);
  };
  
  // Set binaryType to 'arraybuffer' to receive zero-copy bytes from FastAPI!
  ws.binaryType = "arraybuffer";
  
  ws.onmessage = async (msg) => {
    try {
      let dataStr = "";
      // Fast text decoding of binary buffer
      if (msg.data instanceof ArrayBuffer) {
        dataStr = new TextDecoder("utf-8").decode(msg.data);
      } else {
        dataStr = msg.data;
      }
      
      const payload = JSON.parse(dataStr);
      
      if (payload.type === "NEW_EVENT") {
        const data = payload.data;
        const eventTime = data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
        
        const newEvent = {
          id: data.id,
          type: data.type,
          title: data.title,
          time: eventTime,
          coordinates: data.coordinates,
          source: data.source
        };
        
        // Deduplicate
        if (!eventCache.find(e => e.id === newEvent.id)) {
            eventCache.unshift(newEvent);
            if (eventCache.length > MAX_EVENTS) {
                eventCache.pop();
            }
            
            // Push updated state back to main thread
            // Instead of sending JSON, we *could* serialize to ArrayBuffer using a Wasm module here.
            // For now, we batch updates every 100ms to prevent React re-render thrashing.
            batchUpdate(newEvent);
        }
      }
    } catch (e) {
      console.error("Worker Parse Error", e);
    }
  };
}

let pendingEvents: any[] = [];
let batchTimeout: any = null;

function batchUpdate(event: any) {
    pendingEvents.push(event);
    if (!batchTimeout) {
        batchTimeout = setTimeout(() => {
            // Process into Float32Arrays for Deck.GL hardware-acceleration!
            const count = pendingEvents.length;
            const positions = new Float32Array(count * 2);
            
            pendingEvents.forEach((ev, i) => {
                positions[i*2] = ev.coordinates[0];
                positions[i*2+1] = ev.coordinates[1];
            });
            
            self.postMessage({ 
                type: 'BATCH_EVENTS', 
                events: pendingEvents,
                binaryData: { positions } 
            }, { transfer: [positions.buffer] } as any); // Zero-copy transfer!
            
            pendingEvents = [];
            batchTimeout = null;
        }, 100);
    }
}
