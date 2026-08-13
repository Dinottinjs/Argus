import os
import sys
import tkinter as tk
from tkinter import font
import subprocess
import threading
import time
import ctypes

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

if not is_admin():
    ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, __file__, None, 1)
    sys.exit()

def run_update():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        bat_path = os.path.join(current_dir, "install.bat")
        
        # We run the batch file and capture its output
        process = subprocess.Popen(
            bat_path, 
            cwd=current_dir, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT,
            text=True,
            shell=True
        )
        
        for line in iter(process.stdout.readline, ''):
            if not line: break
            # Append to text widget safely from thread
            root.after(0, append_text, line)
            
        process.stdout.close()
        process.wait()
        
        root.after(0, update_complete)
        
    except Exception as e:
        root.after(0, append_text, f"\n[!] Error during update: {e}\n")
        root.after(0, update_complete)

def append_text(text_line):
    text_area.config(state=tk.NORMAL)
    text_area.insert(tk.END, text_line)
    text_area.see(tk.END)
    text_area.config(state=tk.DISABLED)

def update_complete():
    append_text("\n\n==================================\n")
    append_text(" UPDATE COMPLETE. SYSTEM REBOOTING.\n")
    append_text("==================================\n")
    
    # Wait 3 seconds and close window
    root.after(3000, root.destroy)

def main():
    global root, text_area
    root = tk.Tk()
    
    # Hide window borders
    root.overrideredirect(True)
    
    width = 700
    height = 500
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    x = (screen_width / 2) - (width / 2)
    y = (screen_height / 2) - (height / 2)
    root.geometry(f'{width}x{height}+{int(x)}+{int(y)}')
    
    bg_color = "#09090b"
    fg_color = "#06b6d4"
    root.configure(bg=bg_color)
    
    # Styling
    custom_font = font.Font(family="Consolas", size=12, weight="bold")
    log_font = font.Font(family="Consolas", size=9)
    
    header = tk.Frame(root, bg=bg_color)
    header.pack(fill=tk.X, pady=10)
    
    title = tk.Label(header, text="ARGUS SYSTEM UPDATER", font=custom_font, fg=fg_color, bg=bg_color)
    title.pack()
    
    text_area = tk.Text(root, bg="#000000", fg="#32cd32", font=log_font, borderwidth=0, highlightthickness=1, highlightcolor=fg_color)
    text_area.pack(expand=True, fill=tk.BOTH, padx=20, pady=(10, 20))
    text_area.config(state=tk.DISABLED)
    
    append_text("Initializing Argus Over-The-Air Update Protocol...\n")
    
    # Start the update process in a background thread
    threading.Thread(target=run_update, daemon=True).start()
    
    root.mainloop()

if __name__ == "__main__":
    main()
