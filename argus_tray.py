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
    try:
        base_img = Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "logo.ico")).convert("RGBA")
        base_img = base_img.resize((64, 64))
        dc = ImageDraw.Draw(base_img)
        # Draw a small status circle in bottom right
        dc.ellipse([48, 48, 64, 64], fill=color, outline="black")
        return base_img
    except Exception as e:
        print(f"Icon load error: {e}")
        # Fallback to circle if logo.ico is missing
        image = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
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
        elif self.path == '/update_status':
            self._set_headers()
            update_available = False
            try:
                subprocess.run(["git", "fetch"], cwd=os.path.dirname(os.path.abspath(__file__)), capture_output=True, timeout=10)
                status_out = subprocess.run(["git", "status", "-uno"], cwd=os.path.dirname(os.path.abspath(__file__)), capture_output=True, text=True, timeout=5).stdout
                if "Your branch is behind" in status_out:
                    update_available = True
            except Exception as e:
                print(f"Update check error: {e}")
            self.wfile.write(json.dumps({"update_available": update_available}).encode('utf-8'))
        else:
            self._set_headers(404)

    def do_POST(self):
        if self.path == '/uninstall':
            self._set_headers()
            self.wfile.write(json.dumps({"status": "uninstalling"}).encode('utf-8'))
            print("Uninstall requested...")
            # Trigger uninstall in a new thread so we can reply to the HTTP request
            threading.Thread(target=perform_uninstall).start()
        elif self.path == '/update':
            self._set_headers()
            self.wfile.write(json.dumps({"status": "updating"}).encode('utf-8'))
            print("Update requested...")
            threading.Thread(target=perform_update).start()
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
        subprocess.run(["docker", "compose", "down"], cwd=os.path.dirname(os.path.abspath(__file__)), shell=True)
    except Exception as e:
        print(f"Error stopping docker: {e}")
    
    # Remove Desktop Shortcut
    shortcut_path = os.path.join(os.environ["USERPROFILE"], "Desktop", "Argus Dashboard.url")
    if os.path.exists(shortcut_path):
        os.remove(shortcut_path)

    # Delete the Argus-Dev directory using a detached CMD so the Python script doesn't block its own deletion
    current_dir = os.path.dirname(os.path.abspath(__file__))
    delete_cmd = f'timeout /t 2 /nobreak >nul & rmdir /s /q "{current_dir}"'
    subprocess.Popen(f'cmd.exe /c "{delete_cmd}"', shell=True)

    global tray_icon
    if tray_icon:
        tray_icon.stop()
    
    os._exit(0)

def perform_update():
    print("Starting update sequence...")
    try:
        # Launch install.bat in a new console
        current_dir = os.path.dirname(os.path.abspath(__file__))
        bat_path = os.path.join(current_dir, "install.bat")
        subprocess.Popen(f'cmd.exe /c start "" "{bat_path}"', shell=True, cwd=current_dir)
    except Exception as e:
        print(f"Error starting update: {e}")
        
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
