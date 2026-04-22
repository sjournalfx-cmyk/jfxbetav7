import MetaTrader5 as mt5
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import sys

class BarReplayEngine:
    def __init__(self, symbol="EURUSD", timeframe=mt5.TIMEFRAME_H1, bars_to_fetch=500, initial_balance=10000):
        self.symbol = symbol
        self.timeframe = timeframe
        self.bars_to_fetch = bars_to_fetch
        self.initial_balance = initial_balance
        
        # Performance State
        self.balance = initial_balance
        self.equity = initial_balance
        self.position = None # Current open trade
        self.trade_history = []
        
        # Replay State
        self.data = None
        self.current_idx = 20 # Start with 20 bars visible
        self.max_idx = 0

    def initialize_data(self):
        """Connects to MT5 and downloads the historical data feed"""
        if not mt5.initialize():
            print("❌ MT5 Initialization failed. Make sure MetaTrader 5 is open.")
            return False

        print(f"📡 Fetching {self.bars_to_fetch} bars for {self.symbol}...")
        rates = mt5.copy_rates_from_pos(self.symbol, self.timeframe, 0, self.bars_to_fetch)
        
        if rates is None or len(rates) == 0:
            print(f"❌ Error: Could not fetch data. Check symbol name: {self.symbol}")
            mt5.shutdown()
            return False

        # Convert to Clean DataFrame
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        self.data = df
        self.max_idx = len(df) - 1
        
        print(f"✅ Data Loaded. Replay starting from {self.data.iloc[self.current_idx]['time']}")
        return True

    def calculate_pnl(self, current_price):
        """Calculates PnL based on contract size (Forex standard: 100,000 per lot)"""
        if not self.position: return 0
        
        diff = 0
        if self.position['type'] == 'BUY':
            diff = current_price - self.position['entry_price']
        else:
            diff = self.position['entry_price'] - current_price
            
        return diff * 100000 * self.position['lots']

    def next_bar(self):
        """Move forward one candle"""
        if self.current_idx < self.max_idx:
            self.current_idx += 1
            current_close = self.data.iloc[self.current_idx]['close']
            
            # Update Floating Equity
            if self.position:
                floating_pnl = self.calculate_pnl(current_close)
                self.equity = self.balance + floating_pnl
            else:
                self.equity = self.balance
            return True
        else:
            print("\n🏁 Replay Complete. No more data.")
            return False

    def open_trade(self, side="BUY", lots=0.1):
        if self.position:
            print("⚠️ You already have an open position! Close it first.")
            return
        
        price = self.data.iloc[self.current_idx]['close']
        self.position = {
            'type': side,
            'entry_price': price,
            'lots': lots,
            'entry_time': self.data.iloc[self.current_idx]['time']
        }
        print(f"🚀 {side} opened at {price} ({lots} lots)")

    def close_trade(self):
        if not self.position:
            print("⚠️ No active trade to close.")
            return
        
        price = self.data.iloc[self.current_idx]['close']
        pnl = self.calculate_pnl(price)
        self.balance += pnl
        self.equity = self.balance
        
        self.trade_history.append({
            **self.position,
            'exit_price': price,
            'exit_time': self.data.iloc[self.current_idx]['time'],
            'pnl': pnl
        })
        
        print(f"✅ Trade Closed at {price}. PnL: ${pnl:.2f}. New Balance: ${self.balance:.2f}")
        self.position = None

    def show_stats(self):
        print("\n" + "="*30)
        print("📊 REPLAY PERFORMANCE")
        print("="*30)
        print(f"Initial Balance: ${self.initial_balance}")
        print(f"Final Balance:   ${self.balance:.2f}")
        print(f"Total PnL:       ${self.balance - self.initial_balance:.2f}")
        print(f"Trades Taken:    {len(self.trade_history)}")
        
        if len(self.trade_history) > 0:
            wins = [t for t in self.trade_history if t['pnl'] > 0]
            win_rate = (len(wins) / len(self.trade_history)) * 100
            print(f"Win Rate:        {win_rate:.1f}%")
        print("="*30)

    def run(self):
        if not self.initialize_data(): return

        print("\n🎮 COMMANDS: (n) Next Bar | (b) Buy | (s) Sell | (c) Close | (stats) Show Stats | (q) Quit")
        
        while True:
            bar = self.data.iloc[self.current_idx]
            status = "FLAT" if not self.position else f"{self.position['type']} @ {self.position['entry_price']}"
            
            sys.stdout.write(f"\r[{bar['time']}] Price: {bar['close']:.5f} | Pos: {status} | Equity: ${self.equity:.2f} >> ")
            cmd = input().lower().strip()

            if cmd == 'n' or cmd == '':
                if not self.next_bar(): break
            elif cmd == 'b':
                self.open_trade("BUY")
            elif cmd == 's':
                self.open_trade("SELL")
            elif cmd == 'c':
                self.close_trade()
            elif cmd == 'stats':
                self.show_stats()
            elif cmd == 'q':
                break
            else:
                print("❓ Unknown command.")

        self.show_stats()
        mt5.shutdown()

if __name__ == "__main__":
    # You can change symbol and timeframe here
    # Timeframes: mt5.TIMEFRAME_M1, M5, M15, M30, H1, H4, D1
    engine = BarReplayEngine(symbol="EURUSD", timeframe=mt5.TIMEFRAME_H1, bars_to_fetch=500)
    engine.run()
