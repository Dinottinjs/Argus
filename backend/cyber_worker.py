import time
import json
import random
import uuid
from datetime import datetime, timezone
import redis
import os
import orjson

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

def run():
    r = redis.Redis.from_url(REDIS_URL)
    print("Started God's Eye (Cyber) Worker")
    
    event_types = ["CYBER_ATTACK", "SATELLITE_PING", "FINANCE_TX", "MILITARY_MOVEMENT"]
    sources = ["USCYBERCOM", "NORAD", "SWIFT_NET", "DARK_WEB_MONITOR", "KASPERSKY_LABS"]
    
    while True:
        try:
            # Generate 5-15 events per second to flood the map
            num_events = random.randint(5, 15)
            for _ in range(num_events):
                lon = random.uniform(-180, 180)
                lat = random.uniform(-90, 90)
                
                # Clustering logic: bias towards major hubs (US, Europe, China)
                if random.random() < 0.6:
                    hub = random.choice([
                        (-74.0, 40.7), # NY
                        (-122.4, 37.7), # SF
                        (-0.1, 51.5), # London
                        (116.4, 39.9), # Beijing
                        (37.6, 55.7), # Moscow
                    ])
                    lon = hub[0] + random.uniform(-10, 10)
                    lat = hub[1] + random.uniform(-10, 10)

                ev_type = random.choice(event_types)
                if ev_type == "CYBER_ATTACK":
                    title = f"DDoS / Ransomware Attack Detected targeting {random.choice(['Financial Sector', 'Grid', 'Gov', 'Healthcare'])}"
                    severity = random.choice(["HIGH", "CRITICAL"])
                elif ev_type == "FINANCE_TX":
                    title = f"Anomalous Wire Transfer: ${random.randint(10, 900)} Million USD"
                    severity = "INFO"
                elif ev_type == "MILITARY_MOVEMENT":
                    title = "Classified Naval/Air Asset Relocation"
                    severity = random.choice(["HIGH", "CRITICAL"])
                else:
                    title = "Low Orbit Satellite Handshake"
                    severity = "INFO"

                event = {
                    "id": str(uuid.uuid4()),
                    "type": severity,
                    "title": title,
                    "time": datetime.now(timezone.utc).isoformat() + "Z",
                    "coordinates": [lon, lat],
                    "source": random.choice(sources)
                }
                
                payload = orjson.dumps({"type": "NEW_EVENT", "data": event})
                r.publish("argus_live_events", payload)
            
            # Sleep for 1 second before the next flood
            time.sleep(1)
        except Exception as e:
            print(f"Cyber worker error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run()
