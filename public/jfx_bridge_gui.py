import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import MetaTrader5 as mt5
import requests
import threading
import time
import json
import os
import sys
from datetime import datetime, timezone

# --- Configuration & Styling ---
COLORS = {
    "bg": "#0A0A0A",
    "card": "#141414",
    "primary": "#FF4F01",
    "text": "#FFFFFF",
    "text_dim": "#888888",
    "success": "#10B981",
    "error": "#EF4444",
    "border": "#262626"
}

CONFIG_FILE = "bridge_config.json"

# Default API endpoint and key (pre-filled for convenience)
DEFAULT_API_URL = "https://lwlikhjgwazyrahucatl.supabase.co/functions/v1/sync-trades"
DEFAULT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bGlraGpnd2F6eXJhaHVjYXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MTM5OTgsImV4cCI6MjA4Mjk4OTk5OH0.E-Gb2DIkSOrNNK4gfQRkAcDRRaMOcMM0fh0XFRRUx3Q"

class JournalFXBridgeGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("JournalFX Desktop Bridge v1.0")
        self.root.geometry("600x700")
        self.root.configure(bg=COLORS["bg"])
        
        self.is_running = False
        self.sync_thread = None
        
        self.setup_ui()
        self.load_config()
        
    def setup_ui(self):
        # Main Container
        main_frame = tk.Frame(self.root, bg=COLORS["bg"], padx=30, pady=30)
        main_frame.pack(fill="both", expand=True)
        
        # Header
        header_label = tk.Label(
            main_frame, text="JOURNALFX", 
            fg=COLORS["primary"], bg=COLORS["bg"],
            font=("Arial", 24, "bold italic")
        )
        header_label.pack(anchor="w")
        
        sub_label = tk.Label(
            main_frame, text="Desktop Bridge • Real-time MT5 Sync", 
            fg=COLORS["text_dim"], bg=COLORS["bg"],
            font=("Arial", 10)
        )
        sub_label.pack(anchor="w", pady=(0, 30))
        
        # --- Input Section ---
        input_card = tk.Frame(main_frame, bg=COLORS["card"], padx=20, pady=20, highlightbackground=COLORS["border"], highlightthickness=1)
        input_card.pack(fill="x", pady=(0, 20))
        
        tk.Label(input_card, text="SYNC KEY", fg=COLORS["text_dim"], bg=COLORS["card"], font=("Arial", 8, "bold")).pack(anchor="w")
        self.key_entry = tk.Entry(
            input_card, bg="#1A1A1A", fg=COLORS["primary"], 
            insertbackground="white", borderwidth=0, 
            font=("Consolas", 12, "bold")
        )
        self.key_entry.pack(fill="x", pady=(5, 15), ipady=8)
        
        tk.Label(input_card, text="API URL", fg=COLORS["text_dim"], bg=COLORS["card"], font=("Arial", 8, "bold")).pack(anchor="w")
        self.url_entry = tk.Entry(
            input_card, bg="#1A1A1A", fg=COLORS["text"], 
            insertbackground="white", borderwidth=0, 
            font=("Consolas", 10)
        )
        self.url_entry.pack(fill="x", pady=(5, 15), ipady=8)
        
        tk.Label(input_card, text="API KEY (ANON)", fg=COLORS["text_dim"], bg=COLORS["card"], font=("Arial", 8, "bold")).pack(anchor="w")
        self.api_entry = tk.Entry(
            input_card, bg="#1A1A1A", fg=COLORS["text"], 
            insertbackground="white", borderwidth=0, 
            font=("Consolas", 10), show="*"
        )
        self.api_entry.pack(fill="x", pady=(5, 10), ipady=8)
        
        # --- Status Section ---
        status_frame = tk.Frame(main_frame, bg=COLORS["bg"])
        status_frame.pack(fill="x", pady=10)
        
        self.mt5_status = tk.Label(status_frame, text="MT5: Disconnected", fg=COLORS["error"], bg=COLORS["bg"], font=("Arial", 9, "bold"))
        self.mt5_status.pack(side="left")
        
        self.server_status = tk.Label(status_frame, text="Server: Offline", fg=COLORS["error"], bg=COLORS["bg"], font=("Arial", 9, "bold"), padx=20)
        self.server_status.pack(side="left")
        
        # --- Action Button ---
        self.btn_connect = tk.Button(
            main_frame, text="START BRIDGE", 
            bg=COLORS["primary"], fg="white", 
            font=("Arial", 12, "bold"), 
            borderwidth=0, cursor="hand2",
            command=self.toggle_bridge
        )
        self.btn_connect.pack(fill="x", pady=20, ipady=12)
        
        # --- Log Section ---
        tk.Label(main_frame, text="ACTIVITY LOG", fg=COLORS["text_dim"], bg=COLORS["bg"], font=("Arial", 8, "bold")).pack(anchor="w")
        self.log_area = scrolledtext.ScrolledText(
            main_frame, bg="#050505", fg="#CCCCCC", 
            font=("Consolas", 9), borderwidth=0,
            highlightbackground=COLORS["border"], highlightthickness=1
        )
        self.log_area.pack(fill="both", expand=True, pady=(5, 0))
        
    def log(self, message, type="info"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_area.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_area.see(tk.END)
        
    def load_config(self):
        config_loaded = False
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    config = json.load(f)
                    self.key_entry.insert(0, config.get("key", ""))
                    self.url_entry.insert(0, config.get("url", DEFAULT_API_URL))
                    self.api_entry.insert(0, config.get("api_key", DEFAULT_API_KEY))
                    config_loaded = True
            except:
                pass
        
        # Pre-fill defaults if no config was loaded
        if not config_loaded:
            self.url_entry.insert(0, DEFAULT_API_URL)
            self.api_entry.insert(0, DEFAULT_API_KEY)

    def save_config(self):
        config = {
            "key": self.key_entry.get(),
            "url": self.url_entry.get(),
            "api_key": self.api_entry.get()
        }
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f)

    def toggle_bridge(self):
        if not self.is_running:
            self.start_bridge()
        else:
            self.stop_bridge()

    def start_bridge(self):
        key = self.key_entry.get()
        url = self.url_entry.get()
        api_key = self.api_entry.get()
        
        if not key or not url or not api_key:
            messagebox.showerror("Error", "Please fill in all connection details.")
            return
            
        self.save_config()
        self.is_running = True
        self.btn_connect.config(text="STOP BRIDGE", bg=COLORS["error"])
        self.log("Initializing bridge...", "info")
        
        self.sync_thread = threading.Thread(target=self.bridge_loop, args=(key, url, api_key), daemon=True)
        self.sync_thread.start()

    def stop_bridge(self):
        self.is_running = False
        self.btn_connect.config(text="START BRIDGE", bg=COLORS["primary"])
        self.mt5_status.config(text="MT5: Disconnected", fg=COLORS["error"])
        self.server_status.config(text="Server: Offline", fg=COLORS["error"])
        self.log("Bridge stopped.", "info")
        mt5.shutdown()

    def bridge_loop(self, key, url, api_key):
        if not mt5.initialize():
            self.log(f"MT5 Init Failed: {mt5.last_error()}", "error")
            self.root.after(0, lambda: self.stop_bridge())
            return

        self.root.after(0, lambda: self.mt5_status.config(text="MT5: Connected", fg=COLORS["success"]))
        self.log("Connected to MetaTrader 5")
        
        headers = {
            "Content-Type": "application/json",
            "Sync-Key": key,
            "Authorization": f"Bearer {api_key}"
        }

        while self.is_running:
            try:
                # Get Data
                account = self.get_account_info()
                positions = self.get_positions()
                trades = self.get_history()
                
                payload = {
                    "account": account,
                    "openPositions": positions,
                    "trades": trades,
                    "isHeartbeat": True,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

                response = requests.post(url, json=payload, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    self.root.after(0, lambda: self.server_status.config(text="Server: Online", fg=COLORS["success"]))
                    if account:
                        self.log(f"Sync OK | Equity: {account['equity']:.2f}")
                else:
                    self.log(f"Server Error: {response.status_code}", "error")
                    self.root.after(0, lambda: self.server_status.config(text="Server: Error", fg=COLORS["error"]))

            except Exception as e:
                self.log(f"Loop Error: {str(e)}", "error")
                self.root.after(0, lambda: self.server_status.config(text="Server: Offline", fg=COLORS["error"]))
            
            time.sleep(2)

    def get_account_info(self):
        acc = mt5.account_info()
        if not acc: return None
        return {"login": acc.login, "balance": acc.balance, "equity": acc.equity, "profit": acc.profit, "margin": acc.margin, "margin_level": acc.margin_level, "server": acc.server, "company": acc.company, "is_demo": acc.trade_mode != mt5.ACCOUNT_TRADE_MODE_REAL}

    def get_positions(self):
        pos = mt5.positions_get()
        if not pos: return []
        return [{"ticket": p.ticket, "symbol": p.symbol, "type": "BUY" if p.type == 0 else "SELL", "volume": p.volume, "profit": p.profit} for p in pos]

    def get_history(self):
        from_date = datetime.now().timestamp() - (30 * 24 * 60 * 60)
        to_date = datetime.now().timestamp() + 86400
        deals = mt5.history_deals_get(from_date, to_date)
        if not deals: return []
        
        # Simplified for GUI log
        res = []
        for d in deals:
            if d.entry in [1, 2]:
                res.append({"ticket": d.ticket, "symbol": d.symbol, "profit": d.profit, "time": d.time, "type": "BUY" if d.type == 0 else "SELL", "volume": d.volume, "entry": d.entry, "price": d.price})
        return res[:50]

if __name__ == "__main__":
    root = tk.Tk()
    app = JournalFXBridgeGUI(root)
    root.mainloop()
