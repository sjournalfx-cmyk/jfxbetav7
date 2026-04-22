
import MetaTrader5 as mt5
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
from datetime import datetime

class MT5DataHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Allow CORS
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        query = parse_qs(urlparse(self.path).query)
        symbol = query.get('symbol', ['EURUSD'])[0]
        tf_str = query.get('tf', ['H1'])[0]
        count = int(query.get('count', [1000])[0])

        # Map Timeframe
        tf_map = {
            'M1': mt5.TIMEFRAME_M1, 'M5': mt5.TIMEFRAME_M5, 'M15': mt5.TIMEFRAME_M15,
            'M30': mt5.TIMEFRAME_M30, 'H1': mt5.TIMEFRAME_H1, 'H4': mt5.TIMEFRAME_H4, 'D1': mt5.TIMEFRAME_D1
        }
        timeframe = tf_map.get(tf_str, mt5.TIMEFRAME_H1)

        if not mt5.initialize():
            self.wfile.write(json.dumps({"error": "MT5 Init Failed"}).encode())
            return

        print(f"Fetching {count} bars for {symbol} ({tf_str})...")
        rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, count)
        
        if rates is None:
            self.wfile.write(json.dumps({"error": "No data found"}).encode())
        else:
            # Format for Lightweight Charts (timestamp must be in seconds)
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
        
        mt5.shutdown()

def run():
    server_address = ('', 5001) # Port 5001
    httpd = HTTPServer(server_address, MT5DataHandler)
    print("🚀 Backtest Data Provider running on http://localhost:5001")
    print("Keep this window open while backtesting.")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
