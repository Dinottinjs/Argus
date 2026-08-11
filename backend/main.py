import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis
import os
import orjson
import subprocess

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

app = FastAPI(title="Argus Global Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections = set()
        self.redis_client = None
        self.pubsub = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: bytes):
        for connection in list(self.active_connections):
            try:
                # Send directly as bytes for zero-copy transmission where supported
                await connection.send_bytes(message)
            except Exception:
                self.disconnect(connection)

    async def redis_listener(self):
        self.redis_client = await redis.from_url(REDIS_URL)
        self.pubsub = self.redis_client.pubsub()
        await self.pubsub.subscribe("argus_live_events")
        print("Subscribed to Redis PubSub: argus_live_events")
        
        async for message in self.pubsub.listen():
            if message["type"] == "message":
                # Data is already JSON encoded bytes from worker, broadcast immediately
                await self.broadcast(message["data"])

manager = ConnectionManager()

@app.get("/")
def read_root():
    return {"status": "Argus High-Performance Backend is running."}

@app.post("/api/settings/network")
async def update_network(req: dict):
    # In a real distributed system, we push this config to Redis for workers to pick up
    interface = req.get("interface", "")
    r = await redis.from_url(REDIS_URL)
    await r.set("argus_active_interface", interface)
    print(f"Network bound to: {interface} (saved to Redis)")
    return {"status": "success"}

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect messages from client, but we must listen to keep connection alive
            await websocket.receive_bytes()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(websocket)
    finally:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    # Start Redis PubSub Listener
    asyncio.create_task(manager.redis_listener())
    
    # Start the worker process (in a real production scenario, this runs in a separate Docker container)
    # We spawn it as a subprocess here for convenience in this single-container setup
    subprocess.Popen(["python", "workers.py"])
