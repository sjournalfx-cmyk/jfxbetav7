
export const generateHeadlessMQL5Code = (syncKey: string, backendUrl: string, anonKey: string) => `//+------------------------------------------------------------------+
//|                                  JFX HEADLESS BRIDGE v1.1.mq5     |
//|                                  Copyright 2026,JFX JOURNAL App   |
//|                                  HEADLESS + SOCKET BRIDGE         |
//+------------------------------------------------------------------+
#property copyright "JFX"
#property link      "https://www.jfxjournal.site"
#property version   "1.10"
#property strict

#include <Trade\\Trade.mqh>

// --- INPUT PARAMETERS ---
input string SyncKey = "${syncKey}";
input string BackendUrl = "${backendUrl}";
input string AnonKey = "${anonKey}";
input int    SocketPort = 8888; // Port for the local data bridge

// --- GLOBALS ---
datetime lastSuccessfulSync = 0;
datetime lastHeartbeatTime = 0;
int lastSyncedTradeCount = 0;
int lastSyncedPositionCount = 0;
int serverSocket = INVALID_HANDLE;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   if(SyncKey == "") return(INIT_FAILED);
   
   // Initialize Socket Server
   serverSocket = SocketCreate();
   if(serverSocket != INVALID_HANDLE)
     {
      if(!SocketListen(serverSocket, "0.0.0.0", SocketPort))
        {
         Print("❌ SocketListen failed on port ", SocketPort);
         SocketClose(serverSocket);
         serverSocket = INVALID_HANDLE;
        }
      else Print("📡 Socket Server active on port ", SocketPort);
     }
   
   Print("🚀 JFX Headless Bridge Initialized (Sync Key: " + SyncKey + ")");
   SyncHistory();
   EventSetTimer(1); 
   return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason) 
  { 
   EventKillTimer(); 
   if(serverSocket != INVALID_HANDLE) SocketClose(serverSocket);
  }

void OnTimer()
  {
   HandleSocketClients();
   SyncHistory();
   if(TimeCurrent() - lastSuccessfulSync > 10 && TimeCurrent() - lastHeartbeatTime > 10)
      SendHeartbeat();
  }

// --- SOCKET HANDLER FOR CHART DATA ---
void HandleSocketClients()
  {
   if(serverSocket == INVALID_HANDLE) return;
   
   int client = SocketAccept(serverSocket);
   if(client != INVALID_HANDLE)
     {
      char buffer[];
      if(SocketRead(client, buffer, 500, 100) > 0)
        {
         string request = CharArrayToString(buffer);
         // Format: GET_BARS|EURUSD|H1|1000
         string parts[];
         if(StringSplit(request, '|', parts) >= 4)
           {
            if(parts[0] == "GET_BARS")
              {
               string symbol = parts[1];
               ENUM_TIMEFRAMES tf = StringToTF(parts[2]);
               int count = (int)StringToInteger(parts[3]);
               SendBarData(client, symbol, tf, count);
              }
           }
        }
      SocketClose(client);
     }
  }

ENUM_TIMEFRAMES StringToTF(string tf)
  {
   if(tf == "M1") return PERIOD_M1;
   if(tf == "M5") return PERIOD_M5;
   if(tf == "M15") return PERIOD_M15;
   if(tf == "M30") return PERIOD_M30;
   if(tf == "H1") return PERIOD_H1;
   if(tf == "H4") return PERIOD_H4;
   if(tf == "D1") return PERIOD_D1;
   return PERIOD_H1;
  }

void SendBarData(int client, string symbol, ENUM_TIMEFRAMES tf, int count)
  {
   MqlRates rates[];
   int total = CopyRates(symbol, tf, 0, count, rates);
   if(total <= 0) return;
   
   string json = "[";
   for(int i=0; i<total; i++)
     {
      string bar = StringFormat("{\\\"time\\\":%d,\\\"open\\\":%.5f,\\\"high\\\":%.5f,\\\"low\\\":%.5f,\\\"close\\\":%.5f}",
         (long)rates[i].time, rates[i].open, rates[i].high, rates[i].low, rates[i].close);
      json += bar;
      if(i < total-1) json += ",";
     }
   json += "]";
   
   char data[];
   StringToCharArray(json, data, 0, StringLen(json));
   SocketSend(client, data, ArraySize(data));
  }

void SendHeartbeat()
  {
   string jsonPayload = StringFormat("{\\\"sync_key\\\":\\\"%s\\\",\\\"isHeartbeat\\\":true,\\\"isHeadless\\\":true}", SyncKey);
   char data[], result[];
   string resultHeaders, headers = "Content-Type: application/json\\r\\nSync-Key: " + SyncKey + "\\r\\napikey: " + AnonKey + "\\r\\n";
   StringToCharArray(jsonPayload, data, 0, StringLen(jsonPayload));
   WebRequest("POST", BackendUrl, headers, 2000, data, result, resultHeaders);
   lastHeartbeatTime = TimeCurrent();
  }

void SyncHistory()
  {
   datetime fromDate = TimeCurrent() - (90 * 24 * 60 * 60); 
   if(!HistorySelect(fromDate, TimeCurrent())) return;
     
   int totalDeals = HistoryDealsTotal();
   int totalPositions = PositionsTotal();
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   
   static double lastBalance = 0;
   if(totalDeals == lastSyncedTradeCount && totalPositions == lastSyncedPositionCount && MathAbs(balance - lastBalance) < 0.01)
      return;

   lastBalance = balance;
   string accountJson = StringFormat("{\\\"login\\\":%d,\\\"balance\\\":%.2f,\\\"equity\\\":%.2f,\\\"isHeadless\\\":true}", AccountInfoInteger(ACCOUNT_LOGIN), balance, equity);
   string tradesJson = "[";
   int count = 0;
   for(int i = totalDeals-1; i >= 0 && count < 50; i--)
     {
      ulong ticket = HistoryDealGetTicket(i);
      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_OUT_BY) continue;
      double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
      long time = HistoryDealGetInteger(ticket, DEAL_TIME);
      string tradeObj = StringFormat("{\\\"ticket\\\":%d,\\\"symbol\\\":\\\"%s\\\",\\\"profit\\\":%.2f,\\\"time\\\":%d}", ticket, symbol, profit, time);
      if(count > 0) tradesJson += ",";
      tradesJson += tradeObj;
      count++;
     }
   tradesJson += "]";

   string jsonPayload = StringFormat("{\\\"sync_key\\\":\\\"%s\\\",\\\"account\\\":%s,\\\"trades\\\":%s}", SyncKey, accountJson, tradesJson);
   char data[], result[];
   string resultHeaders, headers = "Content-Type: application/json\\r\\nSync-Key: " + SyncKey + "\\r\\napikey: " + AnonKey + "\\r\\n";
   StringToCharArray(jsonPayload, data, 0, StringLen(jsonPayload));
   if(WebRequest("POST", BackendUrl, headers, 2000, data, result, resultHeaders) == 200)
     {
      lastSuccessfulSync = TimeCurrent();
      lastSyncedTradeCount = totalDeals;
      lastSyncedPositionCount = totalPositions;
     }
  }
`;
