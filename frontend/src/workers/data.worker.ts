// data.worker.ts
// Web Worker for processing high-volume Argus events without blocking the main UI thread

let wsUrl = '';
let isManualReconnect = false;

self.onmessage = (e) => {
  const { type, payload } = e.data;
  
  if (type === 'CONNECT') {
    wsUrl = payload.url;
    connectWebSocket(wsUrl);
  } else if (type === 'RECONNECT') {
    eventCache = [];
    pendingEvents = [];
    if (ws) {
        isManualReconnect = true;
        ws.close();
    } else {
        self.postMessage({ type: 'STATUS', status: 'CONNECTING...' });
        if (wsUrl) {
            setTimeout(() => connectWebSocket(wsUrl), 500);
        }
    }
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
    if (isManualReconnect) {
        isManualReconnect = false;
        self.postMessage({ type: 'STATUS', status: 'CONNECTING...' });
        reconnectTimer = setTimeout(() => connectWebSocket(url), 500);
    } else {
        self.postMessage({ type: 'STATUS', status: 'OFFLINE' });
        reconnectTimer = setTimeout(() => connectWebSocket(url), 3000);
    }
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
          target_coordinates: data.target_coordinates,
          source: data.source,
          is_conflict: data.is_conflict,
          country: data.country,
          timestamp: data.timestamp
        };
        
        // Deduplicate
        if (!eventCache.find(e => e.id === newEvent.id)) {
            eventCache.unshift(newEvent);
            if (eventCache.length > MAX_EVENTS) {
                eventCache.pop();
            }
            
            // Push updated state back to main thread
            batchUpdate(newEvent);
        }
      } else if (payload.type === "STATS") {
          self.postMessage({ type: 'UPDATE_STATS', stats: payload.data });
      } else if (payload.type === "NEWS_STATS") {
          self.postMessage({ type: 'UPDATE_NEWS_STATS', newsStats: payload.data });
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
