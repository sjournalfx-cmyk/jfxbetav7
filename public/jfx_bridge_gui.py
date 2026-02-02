import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import MetaTrader5 as mt5
import requests
import threading
import time
import json
import os
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

# --- Constants ---
APP_NAME = "JournalFX Bridge"
VERSION = "2.1.0"
CONFIG_FILE = "bridge_session.json"
BACKTEST_PORT = 5001

# HARDCODED CONFIGURATION (Hidden from User)
SUPABASE_URL = "https://lwlikhjgwazyrahucatl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bGlraGpnd2F6eXJhaHVjYXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MTM5OTgsImV4cCI6MjA4Mjk4OTk5OH0.E-Gb2DIkSOrNNK4gfQRkAcDRRaMOcMM0fh0XFRRUx3Q"
SYNC_ENDPOINT = f"{SUPABASE_URL}/functions/v1/sync-trades"

# --- Backtest Data Provider Handler ---
class MT5DataHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress terminal logging for HTTP requests to keep it clean
        pass

    def do_GET(self):
        # Allow CORS
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        parsed_path = urlparse(self.path)
        if parsed_path.path == '/ping':
            self.wfile.write(json.dumps({"status": "online"}).encode())
            return

        query = parse_qs(parsed_path.query)
        symbol = query.get('symbol', ['EURUSD'])[0]
        tf_str = query.get('tf', ['H1'])[0]
        count = int(query.get('count', [1000])[0])

        # Map Timeframe
        tf_map = {
            'M1': mt5.TIMEFRAME_M1, 'M5': mt5.TIMEFRAME_M5, 'M15': mt5.TIMEFRAME_M15,
            'M30': mt5.TIMEFRAME_M30, 'H1': mt5.TIMEFRAME_H1, 'H4': mt5.TIMEFRAME_H4, 'D1': mt5.TIMEFRAME_D1
        }
        timeframe = tf_map.get(tf_str, mt5.TIMEFRAME_H1)

        # Ensure MT5 is initialized for the request
        if not mt5.initialize():
            self.wfile.write(json.dumps({"error": "MT5 Init Failed"}).encode())
            return

        rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, count)
        
        if rates is None:
            self.wfile.write(json.dumps({"error": "No data found"}).encode())
        else:
            data = []
            for r in rates:
                data.append({
                    "time": int(r[0]),
                    "open": float(r[1]),
                    "high": float(r[2]),
                    "low": float(r[3]),
                    "close": float(r[4])
                })
            self.wfile.write(json.dumps(data).encode())

# --- Theme & Styling ---
THEME = {
    "bg_dark": "#0f172a",      # Main Background (Slate-900)
    "bg_card": "#1e293b",      # Card Background (Slate-800)
    "primary": "#FF4F01",      # Brand Orange
    "primary_hover": "#e64600",
    "text_main": "#f8fafc",    # Slate-50
    "text_dim": "#94a3b8",     # Slate-400
    "success": "#10b981",      # Emerald-500
    "error": "#ef4444",        # Red-500
    "border": "#334155",       # Slate-700
    "input_bg": "#020617"      # Slate-950
}

class SupabaseClient:
    def __init__(self):
        self.session = None
        self.user_profile = None

    def login(self, email, password):
        url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        headers = {"apikey": SUPABASE_KEY, "Content-Type": "application/json"}
        payload = {"email": email, "password": password}
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                self.session = response.json()
                return True, None
            else:
                return False, response.json().get("error_description", "Login failed")
        except Exception as e:
            return False, str(e)

    def get_user_profile(self):
        if not self.session: return None
        
        user_id = self.session["user"]["id"]
        token = self.session["access_token"]
        
        url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=*"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200 and len(response.json()) > 0:
                self.user_profile = response.json()[0]
                return self.user_profile
            return None
        except:
            return None

# --- UI Components ---

class ModernButton(tk.Button):
    def __init__(self, master, **kwargs):
        bg = kwargs.pop('bg', THEME["primary"])
        fg = kwargs.pop('fg', "white")
        font = kwargs.pop('font', ("Segoe UI", 10, "bold"))
        super().__init__(master, bg=bg, fg=fg, font=font, activebackground=THEME["primary_hover"], activeforeground="white", borderwidth=0, cursor="hand2", **kwargs)

class ModernEntry(tk.Entry):
    def __init__(self, master, **kwargs):
        super().__init__(master, bg=THEME["input_bg"], fg=THEME["text_main"], insertbackground="white", borderwidth=0, relief="flat", font=("Segoe UI", 11), **kwargs)
        self.configure(highlightthickness=1, highlightbackground=THEME["border"], highlightcolor=THEME["primary"])

class JournalFXApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(f"{APP_NAME} v{VERSION}")
        self.geometry("450x650")
        self.configure(bg=THEME["bg_dark"])
        self.resizable(False, False)
        
        # Initialize Logic
        self.client = SupabaseClient()
        self.bridge_running = False
        self.sync_thread = None
        self.server_thread = None
        self.httpd = None
        
        # Container for screens
        self.container = tk.Frame(self, bg=THEME["bg_dark"])
        self.container.pack(fill="both", expand=True)
        
        self.show_login_screen()
        self.check_saved_session()

    def clear_screen(self):
        for widget in self.container.winfo_children():
            widget.destroy()

    def check_saved_session(self):
        # Auto-login logic could go here if we saved tokens securely
        pass

    # --- LOGIN SCREEN ---
    def show_login_screen(self):
        self.clear_screen()
        self.geometry("400x550")
        
        frame = tk.Frame(self.container, bg=THEME["bg_dark"], padx=40, pady=40)
        frame.pack(fill="both", expand=True)
        
        # Logo / Title
        tk.Label(frame, text="JOURNALFX", font=("Segoe UI", 28, "bold italic"), fg=THEME["primary"], bg=THEME["bg_dark"]).pack(pady=(20, 5))
        tk.Label(frame, text="Desktop Bridge", font=("Segoe UI", 12), fg=THEME["text_dim"], bg=THEME["bg_dark"]).pack(pady=(0, 40))
        
        # Form
        tk.Label(frame, text="Email Address", font=("Segoe UI", 9, "bold"), fg=THEME["text_dim"], bg=THEME["bg_dark"]).pack(anchor="w", pady=(0, 5))
        self.email_entry = ModernEntry(frame)
        self.email_entry.pack(fill="x", ipady=8, pady=(0, 20))
        
        tk.Label(frame, text="Password", font=("Segoe UI", 9, "bold"), fg=THEME["text_dim"], bg=THEME["bg_dark"]).pack(anchor="w", pady=(0, 5))
        self.pass_entry = ModernEntry(frame, show="•")
        self.pass_entry.pack(fill="x", ipady=8, pady=(0, 30))
        
        # Login Button
        self.btn_login = ModernButton(frame, text="SIGN IN", command=self.handle_login)
        self.btn_login.pack(fill="x", ipady=10)
        
        # Footer
        tk.Label(frame, text="v" + VERSION, font=("Segoe UI", 8), fg=THEME["border"], bg=THEME["bg_dark"]).pack(side="bottom", pady=20)

    def handle_login(self):
        email = self.email_entry.get()
        password = self.pass_entry.get()
        
        if not email or not password:
            messagebox.showwarning("Input Required", "Please enter both email and password.")
            return
            
        self.btn_login.config(text="AUTHENTICATING...", state="disabled")
        self.update()
        
        success, error = self.client.login(email, password)
        
        if success:
            # Fetch Profile for Sync Key
            profile = self.client.get_user_profile()
            if profile and profile.get("sync_key"):
                self.show_dashboard(profile)
            else:
                messagebox.showerror("Profile Error", "Could not retrieve Sync Key. Please check your web dashboard.")
                self.btn_login.config(text="SIGN IN", state="normal")
        else:
            messagebox.showerror("Login Failed", f"Error: {error}")
            self.btn_login.config(text="SIGN IN", state="normal")

    # --- DASHBOARD SCREEN ---
    def show_dashboard(self, profile):
        self.clear_screen()
        self.geometry("500x700")
        
        self.current_profile = profile
        self.sync_key = profile.get("sync_key")
        
        # Header
        header = tk.Frame(self.container, bg=THEME["bg_card"], height=80, padx=20, pady=15)
        header.pack(fill="x")
        
        tk.Label(header, text="CONNECTED AS", font=("Segoe UI", 8, "bold"), fg=THEME["text_dim"], bg=THEME["bg_card"]).pack(anchor="w")
        tk.Label(header, text=profile.get("email", "User"), font=("Segoe UI", 12, "bold"), fg=THEME["text_main"], bg=THEME["bg_card"]).pack(anchor="w")
        
        logout_btn = tk.Button(header, text="Logout", font=("Segoe UI", 9), bg=THEME["bg_card"], fg=THEME["error"], bd=0, cursor="hand2", command=self.logout)
        logout_btn.place(relx=1.0, rely=0.5, anchor="e", x=-10)

        # Main Content
        content = tk.Frame(self.container, bg=THEME["bg_dark"], padx=20, pady=20)
        content.pack(fill="both", expand=True)

        # Status Cards
        status_grid = tk.Frame(content, bg=THEME["bg_dark"])
        status_grid.pack(fill="x", pady=(0, 20))
        
        self.card_mt5 = self.create_status_card(status_grid, "MT5 STATUS", "Disconnected", THEME["error"], 0)
        self.card_server = self.create_status_card(status_grid, "SERVER LINK", "Standby", THEME["text_dim"], 1)
        self.card_backtest = self.create_status_card(status_grid, "BACKTEST LAB", "Offline", THEME["text_dim"], 2)

        # Sync Key Display (Read Only)
        tk.Label(content, text="ACTIVE SYNC KEY", font=("Segoe UI", 9, "bold"), fg=THEME["text_dim"], bg=THEME["bg_dark"]).pack(anchor="w", pady=(10, 5))
        key_frame = tk.Frame(content, bg=THEME["bg_card"], padx=15, pady=10)
        key_frame.pack(fill="x", pady=(0, 20))
        tk.Label(key_frame, text=self.sync_key, font=("Consolas", 14, "bold"), fg=THEME["primary"], bg=THEME["bg_card"]).pack(anchor="w")

        # Control Button
        self.btn_toggle = ModernButton(content, text="START BRIDGE", font=("Segoe UI", 14, "bold"), command=self.toggle_bridge)
        self.btn_toggle.pack(fill="x", ipady=15, pady=(0, 20))

        # Log Area
        tk.Label(content, text="LIVE ACTIVITY LOG", font=("Segoe UI", 9, "bold"), fg=THEME["text_dim"], bg=THEME["bg_dark"]).pack(anchor="w", pady=(0, 5))
        self.log_area = scrolledtext.ScrolledText(content, bg=THEME["input_bg"], fg=THEME["text_dim"], font=("Consolas", 9), height=10, borderwidth=0, highlightthickness=1, highlightbackground=THEME["border"])
        self.log_area.pack(fill="both", expand=True)

    def create_status_card(self, parent, title, value, color, col):
        card = tk.Frame(parent, bg=THEME["bg_card"], padx=15, pady=15)
        card.grid(row=0, column=col, sticky="ew", padx=5 if col == 1 else (0, 5))
        parent.grid_columnconfigure(col, weight=1)
        
        tk.Label(card, text=title, font=("Segoe UI", 8, "bold"), fg=THEME["text_dim"], bg=THEME["bg_card"]).pack(anchor="w")
        val_label = tk.Label(card, text=value, font=("Segoe UI", 11, "bold"), fg=color, bg=THEME["bg_card"])
        val_label.pack(anchor="w", pady=(5, 0))
        return val_label

    def update_status(self, widget, text, color_key):
        widget.config(text=text, fg=THEME[color_key])

    def logout(self):
        if self.bridge_running:
            self.stop_bridge()
        self.client.session = None
        self.show_login_screen()

    def log(self, message, type="info"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_area.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_area.see(tk.END)

    # --- BRIDGE LOGIC ---
    def toggle_bridge(self):
        if not self.bridge_running:
            self.start_bridge()
        else:
            self.stop_bridge()

    def start_bridge(self):
        self.bridge_running = True
        self.btn_toggle.config(text="STOP BRIDGE", bg=THEME["error"])
        self.log("Initializing bridge...", "info")
        
        # Start Sync Thread
        self.sync_thread = threading.Thread(target=self.bridge_loop, daemon=True)
        self.sync_thread.start()

        # Start Backtest Server Thread
        self.server_thread = threading.Thread(target=self.start_data_server, daemon=True)
        self.server_thread.start()

    def stop_bridge(self):
        self.bridge_running = False
        self.btn_toggle.config(text="START BRIDGE", bg=THEME["primary"])
        self.update_status(self.card_mt5, "Disconnected", "error")
        self.update_status(self.card_server, "Standby", "text_dim")
        self.update_status(self.card_backtest, "Offline", "text_dim")
        
        # Shutdown HTTP Server
        if self.httpd:
            self.httpd.shutdown()
            self.httpd.server_close()
            self.httpd = None

        self.log("Bridge & Backtest server stopped.", "info")
        mt5.shutdown()

    def start_data_server(self):
        try:
            server_address = ('', BACKTEST_PORT)
            self.httpd = HTTPServer(server_address, MT5DataHandler)
            self.after(0, lambda: self.update_status(self.card_backtest, "Ready (P5001)", "success"))
            self.log(f"Backtest Server active on port {BACKTEST_PORT}")
            self.httpd.serve_forever()
        except Exception as e:
            self.log(f"Server Failed: {str(e)}", "error")
            self.after(0, lambda: self.update_status(self.card_backtest, "Failed", "error"))

    def bridge_loop(self):
        if not mt5.initialize():
            self.log(f"MT5 Init Failed: {mt5.last_error()}", "error")
            self.after(0, self.stop_bridge)
            return

        self.after(0, lambda: self.update_status(self.card_mt5, "Connected", "success"))
        self.log("Connected to MetaTrader 5")
        
        headers = {
            "Content-Type": "application/json",
            "Sync-Key": self.sync_key,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }

        while self.bridge_running:
            try:
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

                response = requests.post(SYNC_ENDPOINT, json=payload, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    self.after(0, lambda: self.update_status(self.card_server, "Online", "success"))
                    if account:
                        self.log(f"Sync OK | Equity: {account['equity']:.2f}")
                else:
                    self.log(f"Server Error: {response.status_code}", "error")
                    self.after(0, lambda: self.update_status(self.card_server, "Error", "error"))

            except Exception as e:
                self.log(f"Loop Error: {str(e)}", "error")
                self.after(0, lambda: self.update_status(self.card_server, "Offline", "error"))
            
            time.sleep(2)

    # --- MT5 HELPERS ---
    def get_account_info(self):
        acc = mt5.account_info()
        if not acc: return None
        return {"login": acc.login, "balance": acc.balance, "equity": acc.equity, "profit": acc.profit, "margin": acc.margin, "server": acc.server, "is_demo": acc.trade_mode != mt5.ACCOUNT_TRADE_MODE_REAL}

    def get_positions(self):
        pos = mt5.positions_get()
        if not pos: return []
        return [{"ticket": p.ticket, "symbol": p.symbol, "type": "BUY" if p.type == 0 else "SELL", "volume": p.volume, "profit": p.profit, "price": p.price_open} for p in pos]

    def get_history(self):
        # Add 24h buffer to to_date to handle broker server timezones that are ahead of local time
        from_date = datetime.now().timestamp() - (30 * 24 * 60 * 60)
        to_date = datetime.now().timestamp() + (24 * 60 * 60)
        deals = mt5.history_deals_get(from_date, to_date)
        
        if deals is None: return []

        result = []
        
        # Pre-fetch all entry deals to map opening prices and times by position ID
        entry_deals = {}
        for deal in deals:
            if deal.entry == 0: # Entry In
                entry_deals[deal.position_id] = {
                    "price": deal.price,
                    "time": deal.time
                }

        for deal in deals:
            # We process 'Out' deals (Exit) as the completion of a trade
            if deal.entry == 1 or deal.entry == 2: # Entry Out or In/Out
                entry_data = entry_deals.get(deal.position_id, {"price": deal.price, "time": deal.time})
                entry_price = entry_data["price"]
                entry_time = entry_data["time"] # Exact opening time
                
                result.append({
                    "ticket": deal.ticket,
                    "order": deal.order,
                    "position_id": deal.position_id,
                    "time": deal.time, # Exit time
                    "entry_time": entry_time, # Opening time
                    "type": "BUY" if deal.type == 0 else "SELL", 
                    "entry": deal.entry,
                    "symbol": deal.symbol,
                    "volume": deal.volume,
                    "price": deal.price, # Exit Price
                    "entry_price": entry_price, # True Entry Price
                    "profit": deal.profit,
                    "swap": deal.swap,
                    "commission": deal.commission,
                    "comment": deal.comment
                })
                
        # Sort by time desc and limit to last 50
        result.sort(key=lambda x: x['time'], reverse=True)
        return result[:50]

if __name__ == "__main__":
    app = JournalFXApp()
    app.mainloop()
