import MetaTrader5 as mt5
import requests
import time
import argparse
import json
import sys
from datetime import datetime, timezone

def parse_args():
    parser = argparse.ArgumentParser(description='JournalFX Python Bridge')
    parser.add_argument('--key', required=True, help='Your JournalFX Sync Key')
    parser.add_argument('--url', required=True, help='The Supabase Edge Function URL')
    parser.add_argument('--apikey', required=True, help='The Supabase Anon Key')
    return parser.parse_args()

def connect_mt5():
    if not mt5.initialize():
        print(f"MetaTrader5 initialize() failed, error code = {mt5.last_error()}")
        return False
    print(f"Connected to MetaTrader5 version {mt5.version()}")
    return True

def get_account_info():
    account = mt5.account_info()
    if account is None:
        return None
    return {
        "login": account.login,
        "balance": account.balance,
        "equity": account.equity,
        "profit": account.profit,
        "margin": account.margin,
        "margin_free": account.margin_free,
        "currency": account.currency,
        "server": account.server,
        "company": account.company,
        "name": account.name
    }

def get_positions():
    positions = mt5.positions_get()
    if positions is None:
        return []
    
    result = []
    for pos in positions:
        result.append({
            "ticket": pos.ticket,
            "symbol": pos.symbol,
            "type": "BUY" if pos.type == 0 else "SELL",
            "volume": pos.volume,
            "time": pos.time,
            "open_price": pos.price_open,
            "current_price": pos.price_current,
            "sl": pos.sl,
            "tp": pos.tp,
            "profit": pos.profit,
            "swap": pos.swap,
            "comment": pos.comment
        })
    return result

def get_history():
    # Get history for the last 30 days
    # Add 24h buffer to to_date to handle broker server timezones that are ahead of local time
    from_date = datetime.now().timestamp() - (30 * 24 * 60 * 60)
    to_date = datetime.now().timestamp() + (24 * 60 * 60)
    deals = mt5.history_deals_get(from_date, to_date)
    
    if deals is None:
        return []

    result = []
    
    # Pre-fetch all entry deals to map opening prices
    entry_deals = {}
    for deal in deals:
        if deal.entry == 0: # Entry In
            entry_deals[deal.position_id] = deal.price

    for deal in deals:
        # We process 'Out' deals (Exit) as the completion of a trade
        if deal.entry == 1 or deal.entry == 2: # Entry Out or In/Out
            entry_price = entry_deals.get(deal.position_id, deal.price) # Fallback to deal price if entry not found
            
            result.append({
                "ticket": deal.ticket,
                "order": deal.order,
                "position_id": deal.position_id,
                "time": deal.time,
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

def main():
    args = parse_args()
    
    if not connect_mt5():
        sys.exit(1)

    print(f"Starting Bridge for Sync Key: {args.key}")
    print(f"Target URL: {args.url}")
    print("Press Ctrl+C to stop.")

    headers = {
        "Content-Type": "application/json",
        "Sync-Key": args.key,
        "Authorization": f"Bearer {args.apikey}"
    }

    try:
        while True:
            account = get_account_info()
            positions = get_positions()
            trades = get_history()
            
            payload = {
                "account": account,
                "openPositions": positions,
                "trades": trades,
                "isHeartbeat": True,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

            try:
                response = requests.post(args.url, json=payload, headers=headers, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Sync OK | Equity: {account['equity'] if account else 'N/A'}")
                else:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Sync Error: {response.status_code} - {response.text}")
            except requests.exceptions.RequestException as e:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Network Check: Connection unstable... Retrying in 5s")
                time.sleep(3)
            except Exception as e:
                print(f"Request failed: {e}")

            time.sleep(1)

    except KeyboardInterrupt:
        print("\nStopping Bridge...")
        mt5.shutdown()
        sys.exit(0)

if __name__ == "__main__":
    main()