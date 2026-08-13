import os
import sys
import time
import threading
import urllib.request
import subprocess
import tkinter as tk
from tkinter import font
from PIL import Image, ImageTk

def launch_argus():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # 1. Start Docker Compose in background
        subprocess.run(
            ["docker", "compose", "up", "-d"], 
            cwd=current_dir, 
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        
        # 2. Wait for Frontend to be ready
        ready = False
        attempts = 0
        while not ready and attempts < 60:
            try:
                resp = urllib.request.urlopen("http://localhost:3000", timeout=2)
                if resp.getcode() == 200:
                    ready = True
            except Exception:
                pass
            time.sleep(1)
            attempts += 1
            
        # 3. Launch the App
        edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        if os.path.exists(edge_path):
            subprocess.Popen([edge_path, "--app=http://localhost:3000"])
        else:
            # Fallback to default browser
            import webbrowser
            webbrowser.open("http://localhost:3000")
            
    except Exception as e:
        print(f"Error launching: {e}")
    finally:
        # 4. Close Splash Screen
        root.quit()

def main():
    global root
    root = tk.Tk()
    
    # Hide window borders
    root.overrideredirect(True)
    
    width = 400
    height = 500
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    x = (screen_width / 2) - (width / 2)
    y = (screen_height / 2) - (height / 2)
    root.geometry(f'{width}x{height}+{int(x)}+{int(y)}')
    
    # Argus dark theme background
    bg_color = "#09090b"
    root.configure(bg=bg_color)
    
    # Try to load the logo
    try:
        logo_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "logo.png")
        img = Image.open(logo_path)
        img = img.resize((256, 256), Image.Resampling.LANCZOS)
        photo = ImageTk.PhotoImage(img)
        
        logo_label = tk.Label(root, image=photo, bg=bg_color)
        logo_label.image = photo # keep a reference
        logo_label.pack(pady=(60, 20))
    except Exception as e:
        print(f"Could not load logo: {e}")
        
    # Styling
    custom_font = font.Font(family="Consolas", size=14, weight="bold")
    sub_font = font.Font(family="Consolas", size=10)
    
    title = tk.Label(root, text="ARGUS COMMAND CENTER", font=custom_font, fg="#06b6d4", bg=bg_color)
    title.pack()
    
    status = tk.Label(root, text="BOOTING SYSTEM CORE", font=sub_font, fg="#52525b", bg=bg_color)
    status.pack(pady=(10, 0))
    
    # Simple animation loop
    def animate_status():
        txt = status.cget("text")
        if "..." in txt:
            status.config(text="BOOTING SYSTEM CORE")
        else:
            status.config(text=txt + ".")
        root.after(500, animate_status)
        
    animate_status()
    
    # Start background boot process
    threading.Thread(target=launch_argus, daemon=True).start()
    
    # Ensure window appears on top initially
    root.lift()
    root.attributes('-topmost', True)
    root.after(2000, lambda: root.attributes('-topmost', False))
    
    root.mainloop()

if __name__ == "__main__":
    main()
