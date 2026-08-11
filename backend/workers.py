import asyncio
import orjson
import httpx
import feedparser
import time
import redis.asyncio as redis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Simulated High-Performance Worker Process
async def usgs_worker(r: redis.Redis, active_interface: str = ""):
    print("Started USGS Earthquake Worker")
    transport = httpx.AsyncHTTPTransport(local_address=active_interface) if active_interface else httpx.AsyncHTTPTransport()
    
    async with httpx.AsyncClient(transport=transport) as client:
        while True:
            try:
                resp = await client.get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson", timeout=10)
                if resp.status_code == 200:
                    # Parse using ultra-fast orjson
                    data = orjson.loads(resp.content)
                    events = []
                    for feature in data.get("features", []):
                        mag = feature["properties"]["mag"]
                        severity = "CRITICAL" if mag >= 6.0 else "HIGH" if mag >= 4.5 else "MEDIUM"
                        events.append({
                            "type": severity,
                            "title": f"USGS Eq {mag} - {feature['properties']['place']}",
                            "coordinates": feature["geometry"]["coordinates"][:2],
                            "timestamp": feature["properties"]["time"],
                            "id": feature["id"],
                            "source": "USGS"
                        })
                    
                    # Push events to Redis PubSub
                    for event in events:
                        # Use orjson for blazing fast serialization
                        payload = orjson.dumps({"type": "NEW_EVENT", "data": event})
                        await r.publish("argus_live_events", payload)
                        
            except Exception as e:
                print(f"USGS Worker Error: {e}")
            
            await asyncio.sleep(60)

async def news_worker(r: redis.Redis, active_interface: str = ""):
    print("Started Global News Worker")
    while True:
        try:
            # Use run_in_executor/to_thread because feedparser is strictly sync and CPU-bound
            feed = await asyncio.to_thread(feedparser.parse, "http://feeds.bbci.co.uk/news/world/rss.xml")
            for entry in feed.entries[:3]:
                event = {
                    "type": "MEDIUM",
                    "title": entry.title,
                    "coordinates": [0, 0], 
                    "timestamp": int(time.time() * 1000),
                    "id": entry.id if hasattr(entry, 'id') else entry.link,
                    "source": "BBC News"
                }
                payload = orjson.dumps({"type": "NEW_EVENT", "data": event})
                await r.publish("argus_live_events", payload)
        except Exception as e:
            print(f"News Worker Error: {e}")
            
        await asyncio.sleep(120)

async def market_worker(r: redis.Redis, active_interface: str = ""):
    print("Started Global Market Worker")
    transport = httpx.AsyncHTTPTransport(local_address=active_interface) if active_interface else httpx.AsyncHTTPTransport()
    
    async with httpx.AsyncClient(transport=transport) as client:
        while True:
            try:
                # Fetch BTC and ETH prices
                resp = await client.get("https://api.binance.com/api/v3/ticker/price?symbols=[\"BTCUSDT\",\"ETHUSDT\"]", timeout=5)
                if resp.status_code == 200:
                    data = orjson.loads(resp.content)
                    
                    stats = {
                        "btc_price": float(data[0]["price"]),
                        "eth_price": float(data[1]["price"]),
                        "sentiment": 65 + (float(data[0]["price"]) % 10), # Simulated sentiment based on price fluctuation
                    }
                    
                    payload = orjson.dumps({"type": "STATS", "data": stats})
                    await r.publish("argus_live_events", payload)
            except Exception as e:
                print(f"Market Worker Error: {e}")
                
            await asyncio.sleep(5) # Real-time every 5 seconds

async def start_workers():
    r = await redis.from_url(REDIS_URL)
    # Could dynamically read interface from Redis config if needed
    active_interface = "" 
    
    await asyncio.gather(
        usgs_worker(r, active_interface),
        news_worker(r, active_interface),
        market_worker(r, active_interface)
    )

if __name__ == "__main__":
    asyncio.run(start_workers())
