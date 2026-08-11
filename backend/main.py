import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import httpx
import feedparser
import time
from typing import List

app = FastAPI(title="Argus Global Intelligence API")
active_network_interface = ""

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.get("/")
def read_root():
    return {"status": "Argus Backend is running."}

@app.post("/api/settings/network")
async def update_network(req: dict):
    global active_network_interface
    active_network_interface = req.get("interface", "")
    print(f"Network bound to: {active_network_interface}")
    return {"status": "success"}

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Data Collectors
async def fetch_usgs_earthquakes():
    # If network interface is specified, use httpx Transport
    transport = httpx.AsyncHTTPTransport(local_address=active_network_interface) if active_network_interface else httpx.AsyncHTTPTransport()
    
    async with httpx.AsyncClient(transport=transport) as client:
        try:
            # All Earthquakes in the past hour
            resp = await client.get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                for feature in data.get("features", []):
                    mag = feature["properties"]["mag"]
                    severity = "CRITICAL" if mag >= 6.0 else "HIGH" if mag >= 4.5 else "MEDIUM"
                    event = {
                        "type": severity,
                        "title": f"USGS Eq {mag} - {feature['properties']['place']}",
                        "coordinates": feature["geometry"]["coordinates"][:2], # [lon, lat]
                        "timestamp": feature["properties"]["time"],
                        "id": feature["id"],
                        "source": "USGS"
                    }
                    await manager.broadcast(json.dumps({"type": "NEW_EVENT", "data": event}))
        except Exception as e:
            print(f"USGS Error: {e}")

async def fetch_global_news():
    try:
        # BBC World News RSS
        feed = feedparser.parse("http://feeds.bbci.co.uk/news/world/rss.xml")
        for entry in feed.entries[:3]: # Push top 3 latest
            event = {
                "type": "MEDIUM",
                "title": entry.title,
                # Random coordinates for demonstration as RSS lacks geo-tags
                "coordinates": [0, 0], 
                "timestamp": int(time.time() * 1000),
                "id": entry.id if hasattr(entry, 'id') else entry.link,
                "source": "BBC News"
            }
            await manager.broadcast(json.dumps({"type": "NEW_EVENT", "data": event}))
    except Exception as e:
        print(f"News Error: {e}")

async def data_pipeline_loop():
    while True:
        await fetch_usgs_earthquakes()
        await fetch_global_news()
        await asyncio.sleep(60) # Poll every 60 seconds

@app.on_event("startup")
async def startup_event():
    # Start the data collectors in the background
    asyncio.create_task(data_pipeline_loop())
