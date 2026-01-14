
export const generateMQL5Code = (syncKey: string, backendUrl: string, anonKey: string) => `//+------------------------------------------------------------------+
//|                                     JFX JOURNAL BRIDGE v2.2.mq5   |
//|                                  Copyright 2025,JFX JOURNAL App   |
//|                                       https://www.jfxjournal.site |
//+------------------------------------------------------------------+
#property copyright "JFX"
#property link      "https://www.jfxjournal.site"
#property version   "2.20"
#property strict

#include <Trade\\Trade.mqh>

// --- INPUT PARAMETERS ---
input string SyncKey = "${syncKey}"; // Auto-filled Sync Key
input string BackendUrl = "${backendUrl}"; // Your Backend URL
input string AnonKey = "${anonKey}"; // Supabase Anon Key
input bool   ShowOnChartPanel = true; // Show connection status on chart

// --- GLOBALS ---
datetime lastSyncTime = 0;
datetime lastSuccessfulSync = 0;
datetime lastHeartbeatTime = 0;
int syncAttempts = 0;
int failedAttempts = 0;
double lastPingMs = 0;

// 3. Smart Delta Sync - Track last synced trade count
int lastSyncedTradeCount = 0;
int lastSyncedPositionCount = 0;

// 4. Retry Queue System - Failed payload storage
string queuedPayload = "";
bool hasQueuedData = false;
datetime lastRetryAttempt = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   if(SyncKey == "")
     {
      Alert("Error: Sync Key is missing.");
      return(INIT_FAILED);
     }
     
   // Check WebRequest Permission
   if(!TerminalInfoInteger(TERMINAL_COMMUNITY_ACCOUNT))
     {
      Print("Note: Ensure 'Allow WebRequest' is enabled for ", BackendUrl);
     }
     
   // Load queued data from file if exists (4. Retry Queue)
   LoadQueueFromFile();
     
   // Perform initial sync immediately
   SyncHistory();
   
   // Set timer to sync every 1 second
   EventSetTimer(1); 
   
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
   
   // 4. Save any pending queue to disk before shutdown
   if(hasQueuedData)
     {
      SaveQueueToFile();
     }
  }

//+------------------------------------------------------------------+
//| Timer Event                                                       |
//+------------------------------------------------------------------+
void OnTimer()
  {
   SyncHistory();
   
   // Send heartbeat every 10 seconds if no sync happened recently
   if(TimeCurrent() - lastSuccessfulSync > 10 && TimeCurrent() - lastHeartbeatTime > 10)
     {
      SendHeartbeat();
     }
  }

//+------------------------------------------------------------------+
//| Send Heartbeat                                                   |
//+------------------------------------------------------------------+
void SendHeartbeat()
  {
   string jsonPayload = StringFormat("{\\\"sync_key\\\":\\\"%s\\\",\\\"isHeartbeat\\\":true}", SyncKey);
   
   char data[];
   StringToCharArray(jsonPayload, data, 0, StringLen(jsonPayload));
   
   char result[];
   string resultHeaders;
   string headers = "Content-Type: application/json\\r\\nSync-Key: " + SyncKey + "\\r\\napikey: " + AnonKey + "\\r\\n";
   
   int res = WebRequest("POST", BackendUrl, headers, 2000, data, result, resultHeaders);
   
   if(res == 200)
     {
      lastHeartbeatTime = TimeCurrent();
     }
  }

//+------------------------------------------------------------------+
//| 2. On-Chart Status Panel                                         |
//+------------------------------------------------------------------+
void DrawStatusPanel()
  {
   if(!ShowOnChartPanel) return;
   
   color statusColor = clrLimeGreen;
   string statusText = "Connected";
   
   if(failedAttempts > 0)
     {
      statusColor = clrOrange;
      statusText = "Retrying...";
     }
   if(failedAttempts > 5)
     {
      statusColor = clrRed;
      statusText = "Offline";
     }
     
   int secondsSinceSync = (int)(TimeCurrent() - lastSuccessfulSync);
   string timeAgo = IntegerToString(secondsSinceSync) + "s ago";
   string pingText = (lastPingMs > 0) ? DoubleToString(lastPingMs, 0) + "ms" : "--ms";
   
   // Panel background
   string bgName = "EA_StatusPanel_BG";
   if(ObjectFind(0, bgName) < 0)
     {
      ObjectCreate(0, bgName, OBJ_RECTANGLE_LABEL, 0, 0, 0);
      ObjectSetInteger(0, bgName, OBJPROP_XDISTANCE, 10);
      ObjectSetInteger(0, bgName, OBJPROP_YDISTANCE, 25);
      ObjectSetInteger(0, bgName, OBJPROP_XSIZE, 200);
      ObjectSetInteger(0, bgName, OBJPROP_YSIZE, 75);
      ObjectSetInteger(0, bgName, OBJPROP_BGCOLOR, clrBlack);
      ObjectSetInteger(0, bgName, OBJPROP_BORDER_TYPE, BORDER_FLAT);
      ObjectSetInteger(0, bgName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, bgName, OBJPROP_COLOR, clrDarkSlateGray);
      ObjectSetInteger(0, bgName, OBJPROP_WIDTH, 1);
      ObjectSetInteger(0, bgName, OBJPROP_BACK, false);
      ObjectSetInteger(0, bgName, OBJPROP_SELECTABLE, false);
     }
   
   // Status Text
   string statusName = "EA_Status_Text";
   if(ObjectFind(0, statusName) < 0)
     {
      ObjectCreate(0, statusName, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, statusName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, statusName, OBJPROP_XDISTANCE, 20);
      ObjectSetInteger(0, statusName, OBJPROP_YDISTANCE, 35);
      ObjectSetInteger(0, statusName, OBJPROP_FONTSIZE, 8);
      ObjectSetString(0, statusName, OBJPROP_FONT, "Arial Bold");
     }
   ObjectSetString(0, statusName, OBJPROP_TEXT, "Status: " + statusText);
   ObjectSetInteger(0, statusName, OBJPROP_COLOR, statusColor);
   
   // Last Sync
   string syncName = "EA_LastSync_Text";
   if(ObjectFind(0, syncName) < 0)
     {
      ObjectCreate(0, syncName, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, statusName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, syncName, OBJPROP_XDISTANCE, 20);
      ObjectSetInteger(0, syncName, OBJPROP_YDISTANCE, 52);
      ObjectSetInteger(0, syncName, OBJPROP_FONTSIZE, 7);
      ObjectSetString(0, syncName, OBJPROP_FONT, "Arial");
      ObjectSetInteger(0, syncName, OBJPROP_COLOR, clrSilver);
     }
   ObjectSetString(0, syncName, OBJPROP_TEXT, "Last Sync: " + timeAgo);
   
   // Ping
   string pingName = "EA_Ping_Text";
   if(ObjectFind(0, pingName) < 0)
     {
      ObjectCreate(0, pingName, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, pingName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, pingName, OBJPROP_XDISTANCE, 20);
      ObjectSetInteger(0, pingName, OBJPROP_YDISTANCE, 68);
      ObjectSetInteger(0, pingName, OBJPROP_FONTSIZE, 7);
      ObjectSetString(0, pingName, OBJPROP_FONT, "Arial");
      ObjectSetInteger(0, pingName, OBJPROP_COLOR, clrSilver);
     }
   ObjectSetString(0, pingName, OBJPROP_TEXT, "Ping: " + pingText);
   
   ChartRedraw(0);
  }

//+------------------------------------------------------------------+
//| 4. Retry Queue - Save to file                                    |
//+------------------------------------------------------------------+
void SaveQueueToFile()
  {
   int handle = FileOpen("EA_Queue_" + SyncKey + ".txt", FILE_WRITE|FILE_TXT);
   if(handle != INVALID_HANDLE)
     {
      FileWriteString(handle, queuedPayload);
      FileClose(handle);
      Print("💾 Queue saved to disk");
     }
  }

//+------------------------------------------------------------------+
//| 4. Retry Queue - Load from file                                  |
//+------------------------------------------------------------------+
void LoadQueueFromFile()
  {
   if(FileIsExist("EA_Queue_" + SyncKey + ".txt"))
     {
      int handle = FileOpen("EA_Queue_" + SyncKey + ".txt", FILE_READ|FILE_TXT);
      if(handle != INVALID_HANDLE)
        {
         queuedPayload = FileReadString(handle);
         FileClose(handle);
         if(StringLen(queuedPayload) > 0)
           {
            hasQueuedData = true;
            Print("📂 Loaded queued data from disk");
           }
        }
     }
  }

//+------------------------------------------------------------------+
//| 4. Retry Queue - Send queued data                                |
//+------------------------------------------------------------------+
bool SendQueuedData()
  {
   if(!hasQueuedData || StringLen(queuedPayload) == 0) return false;
   
   if(TimeCurrent() - lastRetryAttempt < 5) return false;
   
   lastRetryAttempt = TimeCurrent();
   
   char data[];
   StringToCharArray(queuedPayload, data, 0, StringLen(queuedPayload));
   
   char result[];
   string resultHeaders;
   string headers = "Content-Type: application/json\\r\\nSync-Key: " + SyncKey + "\\r\\napikey: " + AnonKey + "\\r\\n";
   
   uint startTime = GetTickCount();
   int res = WebRequest("POST", BackendUrl, headers, 2000, data, result, resultHeaders);
   uint endTime = GetTickCount();
   
   if(res == 200)
     {
      lastPingMs = endTime - startTime;
      hasQueuedData = false;
      queuedPayload = "";
      
      if(FileIsExist("EA_Queue_" + SyncKey + ".txt"))
        {
         FileDelete("EA_Queue_" + SyncKey + ".txt");
        }
      
      Print("✅ Queued data sent successfully!");
      return true;
     }
   
   return false;
  }

//+------------------------------------------------------------------+
//| Main Sync Logic with Delta Sync                                 |
//+------------------------------------------------------------------+
void SyncHistory()
  {
   syncAttempts++;
   
   // 4. Try to send queued data first
   if(hasQueuedData)
     {
      if(SendQueuedData())
        {
         failedAttempts = 0;
        }
     }
   
   datetime fromDate = TimeCurrent() - (90 * 24 * 60 * 60); 
   datetime toDate = TimeCurrent();
   
   if(!HistorySelect(fromDate, toDate))
     {
      Print("Failed to select history.");
      DrawStatusPanel();
      return;
     }
     
   // Gather Account Info
   long login = AccountInfoInteger(ACCOUNT_LOGIN);
   string name = AccountInfoString(ACCOUNT_NAME);
   string server = AccountInfoString(ACCOUNT_SERVER);
   string currency = AccountInfoString(ACCOUNT_CURRENCY);
   long leverage = AccountInfoInteger(ACCOUNT_LEVERAGE);
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   bool isReal = (AccountInfoInteger(ACCOUNT_TRADE_MODE) == ACCOUNT_TRADE_MODE_REAL);
   
   string accountJson = StringFormat(
      "{\\\"login\\\":%d,\\\"name\\\":\\\"%s\\\",\\\"server\\\":\\\"%s\\\",\\\"currency\\\":\\\"%s\\\",\\\"leverage\\\":%d,\\\"balance\\\":%.2f,\\\"equity\\\":%.2f,\\\"isReal\\\":%s}",
      login, name, server, currency, leverage, balance, equity, isReal ? "true" : "false"
   );
     
   int totalDeals = HistoryDealsTotal();
   int totalPositions = PositionsTotal();
   
   // 3. Smart Delta Sync - Check if anything changed
   bool hasChanges = false;
   
   if(totalDeals != lastSyncedTradeCount || totalPositions != lastSyncedPositionCount)
     {
      hasChanges = true;
     }
   
   static double lastBalance = 0;
   static double lastEquity = 0;
   if(MathAbs(balance - lastBalance) > 0.01 || MathAbs(equity - lastEquity) > 0.01)
     {
      hasChanges = true;
      lastBalance = balance;
      lastEquity = equity;
     }
   
   if(!hasChanges && !hasQueuedData && lastSyncedTradeCount > 0)
     {
      DrawStatusPanel();
      return;
     }
   
   string tradesJson = "[";
   int count = 0;
   
   for(int i = 0; i < totalDeals; i++)
     {
      ulong ticket = HistoryDealGetTicket(i);
      long type = HistoryDealGetInteger(ticket, DEAL_TYPE);
      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_OUT_BY) continue;
      if(type != DEAL_TYPE_BUY && type != DEAL_TYPE_SELL) continue;
      
      double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
      double comm = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
      double closePrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
      long time = HistoryDealGetInteger(ticket, DEAL_TIME);
      long posID = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      
      // Find Open Price
      double openPrice = 0.0;
      if(HistorySelectByPosition(posID))
        {
         int dealCount = HistoryDealsTotal();
         for(int k=0; k<dealCount; k++)
           {
            ulong dTicket = HistoryDealGetTicket(k);
            if(HistoryDealGetInteger(dTicket, DEAL_ENTRY) == DEAL_ENTRY_IN)
              {
               openPrice = HistoryDealGetDouble(dTicket, DEAL_PRICE);
               break;
              }
           }
         // Restore history selection
         HistorySelect(fromDate, toDate);
        }
      
      string timeStr = TimeToString(time, TIME_DATE|TIME_MINUTES);
      
      string tradeObj = StringFormat(
         "{\\\"ticket\\\":%d,\\\"symbol\\\":\\\"%s\\\",\\\"type\\\":\\\"%s\\\",\\\"openTime\\\":\\\"%s\\\",\\\"closeTime\\\":\\\"%s\\\",\\\"profit\\\":%.2f,\\\"commission\\\":%.2f,\\\"swap\\\":%.2f,\\\"lots\\\":%.2f,\\\"openPrice\\\":%.5f,\\\"closePrice\\\":%.5f}",
         ticket,
         symbol,
         type == DEAL_TYPE_BUY ? "Buy" : "Sell",
         timeStr,
         timeStr, 
         profit,
         comm,
         swap,
         volume,
         openPrice,
         closePrice
      );
      
      if(count > 0) tradesJson += ",";
      tradesJson += tradeObj;
      count++;
     }
   tradesJson += "]";

   // Gather Open Positions
   string positionsJson = "[";
   int posCount = 0;
   
   for(int i = 0; i < totalPositions; i++)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
        {
         long type = PositionGetInteger(POSITION_TYPE);
         double volume = PositionGetDouble(POSITION_VOLUME);
         double priceOpen = PositionGetDouble(POSITION_PRICE_OPEN);
         double priceCurrent = PositionGetDouble(POSITION_PRICE_CURRENT);
         double sl = PositionGetDouble(POSITION_SL);
         double tp = PositionGetDouble(POSITION_TP);
         double swap = PositionGetDouble(POSITION_SWAP);
         double profit = PositionGetDouble(POSITION_PROFIT);
         string symbol = PositionGetString(POSITION_SYMBOL);
         string comment = PositionGetString(POSITION_COMMENT);
         long time = PositionGetInteger(POSITION_TIME);
         
         string timeStr = TimeToString(time, TIME_DATE|TIME_MINUTES);
         
         string posObj = StringFormat(
            "{\\\"ticket\\\":%d,\\\"symbol\\\":\\\"%s\\\",\\\"type\\\":\\\"%s\\\",\\\"openTime\\\":\\\"%s\\\",\\\"openPrice\\\":%.5f,\\\"currentPrice\\\":%.5f,\\\"sl\\\":%.5f,\\\"tp\\\":%.5f,\\\"lots\\\":%.2f,\\\"swap\\\":%.2f,\\\"profit\\\":%.2f,\\\"comment\\\":\\\"%s\\\"}",
            ticket,
            symbol,
            type == POSITION_TYPE_BUY ? "Buy" : "Sell",
            timeStr,
            priceOpen,
            priceCurrent,
            sl,
            tp,
            volume,
            swap,
            profit,
            comment
         );
         
         if(posCount > 0) positionsJson += ",";
        positionsJson += posObj;
         posCount++;
        }
     }
   positionsJson += "]";
   
   string jsonPayload = StringFormat("{\\\"sync_key\\\":\\\"%s\\\",\\\"account\\\":%s,\\\"trades\\\":%s,\\\"openPositions\\\":%s}", SyncKey, accountJson, tradesJson, positionsJson);
   
   char data[];
   StringToCharArray(jsonPayload, data, 0, StringLen(jsonPayload));
   
   char result[];
   string resultHeaders;
   string headers = "Content-Type: application/json\\r\\nSync-Key: " + SyncKey + "\\r\\napikey: " + AnonKey + "\\r\\n";
   
   uint startTime = GetTickCount();
   int res = WebRequest("POST", BackendUrl, headers, 2000, data, result, resultHeaders);
   uint endTime = GetTickCount();
   
   lastPingMs = endTime - startTime;
   
   if(res == 200)
     {
      lastSuccessfulSync = TimeCurrent();
      failedAttempts = 0;
      
      lastSyncedTradeCount = totalDeals;
      lastSyncedPositionCount = totalPositions;
      
      if(hasQueuedData)
        {
         hasQueuedData = false;
         queuedPayload = "";
         if(FileIsExist("EA_Queue_" + SyncKey + ".txt"))
           {
            FileDelete("EA_Queue_" + SyncKey + ".txt");
           }
        }
     }
   else
     {
      failedAttempts++;
      Print("❌ Sync Failed. Error: ", res);
      
      if(!hasQueuedData)
        {
         queuedPayload = jsonPayload;
         hasQueuedData = true;
         SaveQueueToFile();
         Print("📦 Data queued for retry");
        }
     }
   
   DrawStatusPanel();
  }
`;

