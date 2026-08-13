import asyncio
import orjson
import httpx
import feedparser
import time
import redis.asyncio as redis
import os
import uuid

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Simulated High-Performance Worker Process
async def usgs_worker(r: redis.Redis, active_interface: str = ""):
    print("Started USGS Earthquake Worker")
    transport = httpx.AsyncHTTPTransport(local_address=active_interface) if active_interface else httpx.AsyncHTTPTransport()
    seen_ids = set()
    
    async with httpx.AsyncClient(transport=transport) as client:
        while True:
            try:
                resp = await client.get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", timeout=10)
                if resp.status_code == 200:
                    data = orjson.loads(resp.content)
                    
                    # Sort by time so we process oldest first
                    features = sorted(data.get("features", []), key=lambda x: x["properties"]["time"])
                    
                    for feature in features:
                        if feature["id"] in seen_ids:
                            continue
                            
                        mag = feature["properties"]["mag"]
                        if mag is None:
                            continue
                            
                        severity = "CRITICAL" if mag >= 6.0 else "HIGH" if mag >= 4.5 else "MEDIUM" if mag >= 2.5 else "INFO"
                        
                        event = {
                            "type": severity,
                            "title": f"M {mag:.1f} - {feature['properties']['place']}",
                            "coordinates": feature["geometry"]["coordinates"][:2],
                            "timestamp": feature["properties"]["time"],
                            "id": feature["id"],
                            "source": "USGS (United States Geological Survey)"
                        }
                        
                        seen_ids.add(feature["id"])
                        if len(seen_ids) > 10000:
                            seen_ids.pop() # prevent memory leak
                            
                        payload = orjson.dumps({"type": "NEW_EVENT", "data": event})
                        await r.publish("argus_live_events", payload)
                        
            except Exception as e:
                print(f"USGS Worker Error: {e}")
            
            await asyncio.sleep(300) # Fetch every 5 minutes

async def eonet_worker(r: redis.Redis, active_interface: str = ""):
    print("Started NASA EONET Worker")
    transport = httpx.AsyncHTTPTransport(local_address=active_interface) if active_interface else httpx.AsyncHTTPTransport()
    seen_ids = set()
    
    async with httpx.AsyncClient(transport=transport) as client:
        while True:
            try:
                # NASA Earth Observatory Natural Event Tracker
                resp = await client.get("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=7", timeout=15)
                if resp.status_code == 200:
                    data = orjson.loads(resp.content)
                    events = data.get("events", [])
                    
                    for e_data in events:
                        if e_data["id"] in seen_ids:
                            continue
                            
                        geometry = e_data.get("geometry", [])
                        if not geometry:
                            continue
                        
                        # Get latest coordinate
                        coord = geometry[-1]["coordinates"]
                        
                        category = e_data["categories"][0]["id"] if e_data.get("categories") else "unknown"
                        severity = "HIGH" if category in ["wildfires", "volcanoes", "severeStorms"] else "MEDIUM"
                        
                        event = {
                            "type": severity,
                            "title": e_data["title"],
                            "coordinates": [coord[0], coord[1]],
                            "timestamp": int(time.time() * 1000),
                            "id": e_data["id"],
                            "source": "NASA EONET"
                        }
                        
                        seen_ids.add(e_data["id"])
                        payload = orjson.dumps({"type": "NEW_EVENT", "data": event})
                        await r.publish("argus_live_events", payload)
                        
            except Exception as e:
                print(f"NASA Worker Error: {e}")
                
            await asyncio.sleep(600) # Fetch every 10 minutes

async def gdacs_worker(r: redis.Redis, active_interface: str = ""):
    print("Started UN GDACS Worker")
    seen_ids = set()
    
    while True:
        try:
            # Global Disaster Alert and Coordination System (UN / EU)
            feed = await asyncio.to_thread(feedparser.parse, "https://www.gdacs.org/xml/rss.xml")
            
            for entry in feed.entries:
                entry_id = entry.id if hasattr(entry, 'id') else entry.link
                if entry_id in seen_ids:
                    continue
                    
                # Extract coordinates from geo:Point
                if hasattr(entry, 'geo_lat') and hasattr(entry, 'geo_long'):
                    lon = float(entry.geo_long)
                    lat = float(entry.geo_lat)
                else:
                    continue # Skip if no coordinates
                
                title = entry.title
                # GDACS uses colors for severity: Red, Orange, Green
                severity = "CRITICAL" if "Red" in title else "HIGH" if "Orange" in title else "MEDIUM"
                
                # Clean up title (remove the color prefix)
                clean_title = title.split("] ")[-1] if "] " in title else title
                
                event = {
                    "type": severity,
                    "title": clean_title,
                    "coordinates": [lon, lat],
                    "timestamp": int(time.time() * 1000),
                    "id": entry_id,
                    "source": "UN GDACS"
                }
                
                seen_ids.add(entry_id)
                payload = orjson.dumps({"type": "NEW_EVENT", "data": event})
                await r.publish("argus_live_events", payload)
                
        except Exception as e:
            print(f"GDACS Worker Error: {e}")
            
        await asyncio.sleep(600)

async def conflict_worker(r: redis.Redis, active_interface: str = ""):
    print("Started Wikidata Conflict Worker")
    transport = httpx.AsyncHTTPTransport(local_address=active_interface) if active_interface else httpx.AsyncHTTPTransport()
    seen_ids = set()
    
    sparql_query = """
    SELECT ?c ?cLabel ?coord WHERE {
      ?c wdt:P31 wd:Q350604; wdt:P580 ?start.
      MINUS { ?c wdt:P582 ?end. }
      OPTIONAL { ?c wdt:P625 ?coord. }
      OPTIONAL { ?c wdt:P17 ?country. ?country wdt:P625 ?coord. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,de". }
    } LIMIT 150
    """
    
    url = "https://query.wikidata.org/sparql"
    
    async with httpx.AsyncClient(transport=transport, headers={"User-Agent": "Argus/1.0", "Accept": "application/sparql-results+json"}) as client:
        while True:
            try:
                resp = await client.get(url, params={"query": sparql_query}, timeout=30)
                if resp.status_code == 200:
                    data = orjson.loads(resp.content)
                    
                    for item in data.get("results", {}).get("bindings", []):
                        conflict_uri = item.get("c", {}).get("value", "")
                        conflict_id = conflict_uri.split('/')[-1]
                        
                        if conflict_id in seen_ids:
                            continue
                            
                        coord_val = item.get("coord", {}).get("value", "")
                        if not coord_val.startswith("Point("):
                            continue
                        
                        # Point(lon lat)
                        lon_str, lat_str = coord_val.replace("Point(", "").replace(")", "").split(" ")
                        lon, lat = float(lon_str), float(lat_str)
                            
                        event = {
                            "type": "CRITICAL",
                            "title": item.get("cLabel", {}).get("value", "Unknown Conflict"),
                            "coordinates": [lon, lat],
                            "time": datetime.utcnow().strftime("%H:%M:%S UTC"),
                            "id": f"WIKI-{conflict_id}",
                            "source": "UN OCHA ReliefWeb / Wikidata",
                            "is_conflict": True
                        }
                        
                        seen_ids.add(conflict_id)
                        await r.lpush("argus_events", orjson.dumps(event))
                        await r.ltrim("argus_events", 0, 99)
                        
                        event_payload = orjson.dumps({"type": "NEW_EVENT", "data": event})
                        await r.publish("argus_live", event_payload)
                        await asyncio.sleep(0.5)
                        
            except Exception as e:
                print(f"Wikidata Conflict Worker Error: {e}")
            
            await asyncio.sleep(600)

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

async def iss_worker(r: redis.Redis, active_interface: str = ""):
    print("Started ISS Tracker Worker")
    transport = httpx.AsyncHTTPTransport(local_address=active_interface) if active_interface else httpx.AsyncHTTPTransport()
    
    async with httpx.AsyncClient(transport=transport) as client:
        while True:
            try:
                resp = await client.get("http://api.open-notify.org/iss-now.json", timeout=5)
                if resp.status_code == 200:
                    data = orjson.loads(resp.content)
                    
                    if data.get("message") == "success":
                        pos = data["iss_position"]
                        event = {
                            "type": "ISS_TRACKER",
                            "title": "International Space Station",
                            "coordinates": [float(pos["longitude"]), float(pos["latitude"])],
                            "timestamp": int(time.time() * 1000),
                            "id": "iss_current",
                            "source": "NASA/Open-Notify"
                        }
                        
                        payload = orjson.dumps({"type": "NEW_EVENT", "data": event})
                        await r.publish("argus_live_events", payload)
            except Exception as e:
                print(f"ISS Worker Error: {e}")
                
            await asyncio.sleep(5)

async def start_workers():
    r = await redis.from_url(REDIS_URL)
    # Could dynamically read interface from Redis config if needed
    active_interface = "" 
    
    await asyncio.gather(
        usgs_worker(r, active_interface),
        eonet_worker(r, active_interface),
        gdacs_worker(r, active_interface),
        conflict_worker(r, active_interface),
        market_worker(r, active_interface),
        iss_worker(r, active_interface)
    )

if __name__ == "__main__":
    asyncio.run(start_workers())
