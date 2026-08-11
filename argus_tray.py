import os
import sys
import time
import threading
import json
import subprocess
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
import socket
import psutil

try:
    import pystray
    from pystray import MenuItem as item
    from PIL import Image, ImageDraw
except ImportError:
    print("Dependencies missing. Run: pip install pystray pillow psutil")
    sys.exit(1)

# Status colors
STATUS_COLORS = {
    "offline": "red",
    "connecting": "yellow",
    "online": "green"
}
current_status = "offline"
tray_icon = None

def create_image(color):
    # Create a 64x64 image with a colored circle
    width = 64
    height = 64
    image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    dc = ImageDraw.Draw(image)
    dc.ellipse([8, 8, 56, 56], fill=color)
    return image

def set_status(status):
    global current_status, tray_icon
    if status in STATUS_COLORS and tray_icon:
        current_status = status
        tray_icon.icon = create_image(STATUS_COLORS[status])
        tray_icon.title = f"Argus Command Center - {status.capitalize()}"

def open_dashboard(icon, item):
    os.startfile("http://localhost:3000")

def quit_app(icon, item):
    icon.stop()

class LocalAPIHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_GET(self):
        if self.path == '/interfaces':
            interfaces = []
            addrs = psutil.net_if_addrs()
            for name, addresses in addrs.items():
                for addr in addresses:
                    if addr.family == socket.AF_INET:
                        interfaces.append({"name": name, "ip": addr.address})
            self._set_headers()
            self.wfile.write(json.dumps({"interfaces": interfaces}).encode('utf-8'))
        elif self.path == '/status':
            self._set_headers()
            self.wfile.write(json.dumps({"status": current_status}).encode('utf-8'))
        else:
            self._set_headers(404)

    def do_POST(self):
        if self.path == '/uninstall':
            self._set_headers()
            self.wfile.write(json.dumps({"status": "uninstalling"}).encode('utf-8'))
            print("Uninstall requested...")
            # Trigger uninstall in a new thread so we can reply to the HTTP request
            threading.Thread(target=perform_uninstall).start()
        else:
            self._set_headers(404)

def run_server():
    server = HTTPServer(('127.0.0.1', 8001), LocalAPIHandler)
    print("Local API running on port 8001")
    server.serve_forever()

def perform_uninstall():
    print("Starting uninstall sequence...")
    # Stop Docker Compose
    try:
        subprocess.run(["docker-compose", "down"], cwd=os.path.dirname(os.path.abspath(__file__)), shell=True)
    except Exception as e:
        print(f"Error stopping docker: {e}")
    
    # Remove Desktop Shortcut
    shortcut_path = os.path.join(os.environ["USERPROFILE"], "Desktop", "Argus Dashboard.url")
    if os.path.exists(shortcut_path):
        os.remove(shortcut_path)

    # In a real scenario, this script would kill itself and delete its parent directory.
    # To prevent actual accidental deletion of the dev workspace during review, we simulate it or execute cautiously.
    # We will just stop the tray icon.
    global tray_icon
    if tray_icon:
        tray_icon.stop()
    
    os._exit(0)

def monitor_docker():
    while True:
        try:
            req = urllib.request.urlopen("http://localhost:8000/", timeout=2)
            if req.getcode() == 200:
                set_status("online")
            else:
                set_status("connecting")
        except Exception:
            set_status("offline")
        time.sleep(5)

if __name__ == "__main__":
    # Start API server
    threading.Thread(target=run_server, daemon=True).start()
    # Start Docker Monitor
    threading.Thread(target=monitor_docker, daemon=True).start()

    # Setup Tray Icon
    image = create_image(STATUS_COLORS[current_status])
    menu = (
        item('Open Dashboard', open_dashboard, default=True),
        item('Quit Tray', quit_app)
    )
    tray_icon = pystray.Icon("Argus", image, "Argus Command Center - Offline", menu)
    tray_icon.run()
