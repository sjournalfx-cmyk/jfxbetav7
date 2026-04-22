//+------------------------------------------------------------------+
//|                                           jfx_socket_bridge.mq5 |
//|                                  Copyright 2024, JournalFX Team |
//|                                       https://www.journalfx.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, JournalFX Team"
#property link      "https://www.journalfx.com"
#property version   "1.00"
#property script_show_inputs

input int      InpPort = 8888;      // Port to listen on
input string   InpToken = "";       // Auth Token (Leave empty to disable)

int master_socket = INVALID_HANDLE;

//+------------------------------------------------------------------+
//| Script program start function                                    |
//+------------------------------------------------------------------+
void OnStart()
{
   Print("🚀 JFX Headless HTTP Bridge: Starting on port ", InpPort);
   
   master_socket = SocketCreate();
   if(master_socket == INVALID_HANDLE) {
      Print("❌ Failed to create socket. Error: ", GetLastError());
      return;
   }

   if(!SocketListen(master_socket, InpPort)) {
      Print("❌ Failed to listen on port ", InpPort, ". Error: ", GetLastError());
      SocketClose(master_socket);
      return;
   }

   Print("✅ JFX Headless HTTP Bridge: Listening for connections on port ", InpPort);

   while(!IsStopped()) {
      int client_socket = SocketAccept(master_socket);
      
      if(client_socket != INVALID_HANDLE) {
         HandleClient(client_socket);
         SocketClose(client_socket);
      }
      
      Sleep(10); // Prevent CPU spiking
   }

   SocketClose(master_socket);
   Print("🛑 JFX Headless HTTP Bridge: Stopped.");
}

//+------------------------------------------------------------------+
//| Handle client requests                                            |
//+------------------------------------------------------------------+
void HandleClient(int socket)
{
   uchar data[];
   string request = "";
   
   // Read request header
   uint timeout = GetTickCount() + 1000;
   while(!IsStopped() && SocketIsConnected(socket)) {
      uint len = SocketIsReadable(socket);
      if(len > 0) {
         int read = SocketReceive(socket, data, 1024);
         if(read > 0) {
            request += CharArrayToString(data, 0, read);
            if(StringFind(request, "\r\n\r\n") >= 0) break; // End of HTTP header
         }
      }
      if(GetTickCount() > timeout) break;
      Sleep(5);
   }

   if(request == "") return;

   // Parse HTTP Method and URI
   string req_lines[];
   StringSplit(request, '\n', req_lines);
   if(ArraySize(req_lines) == 0) return;
   
   string req_parts[];
   StringSplit(req_lines[0], ' ', req_parts);
   if(ArraySize(req_parts) < 2) return;
   
   string method = req_parts[0];
   string uri = req_parts[1];
   
   // 1. Verify Authentication Token (if configured)
   if(StringLen(InpToken) > 0) {
      bool authorized = false;
      string auth_header = "Authorization: Bearer " + InpToken;
      for(int i=0; i<ArraySize(req_lines); i++) {
         string line = req_lines[i];
         // Remove carriage return if present
         StringReplace(line, "\r", "");
         if(StringFind(line, auth_header) == 0) {
            authorized = true;
            break;
         }
      }
      
      if(!authorized && method != "OPTIONS") {
         SendHttpResponse(socket, "401 Unauthorized", "{\"error\":\"Unauthorized\"}", "*");
         return;
      }
   }
   
   // 2. Handle Preflight OPTIONS request for CORS
   if (method == "OPTIONS") {
      string origin = "http://localhost:5173";
      // Basic response for CORS preflight
      SendHttpResponse(socket, "204 No Content", "", origin);
      return;
   }
   
   string json_response = "{\"error\":\"Unknown Endpoint\"}";
   
   if(uri == "/api/account") {
      json_response = StringFormat(
         "{\"isHeartbeat\":true,\"account\":{\"login\":%d,\"company\":\"%s\",\"server\":\"%s\",\"is_demo\":%s,\"balance\":%.2f,\"equity\":%.2f,\"margin\":%.2f,\"margin_level\":%.2f,\"profit\":%.2f,\"leverage\":%d}}",
         AccountInfoInteger(ACCOUNT_LOGIN),
         AccountInfoString(ACCOUNT_COMPANY),
         AccountInfoString(ACCOUNT_SERVER),
         AccountInfoInteger(ACCOUNT_TRADE_MODE) == ACCOUNT_TRADE_MODE_DEMO ? "true" : "false",
         AccountInfoDouble(ACCOUNT_BALANCE),
         AccountInfoDouble(ACCOUNT_EQUITY),
         AccountInfoDouble(ACCOUNT_MARGIN),
         AccountInfoDouble(ACCOUNT_MARGIN_LEVEL),
         AccountInfoDouble(ACCOUNT_PROFIT),
         AccountInfoInteger(ACCOUNT_LEVERAGE)
      );
   }
   else if(uri == "/api/positions") {
      json_response = "{\"isHeartbeat\":false,\"openPositions\":[";
      int totals = PositionsTotal();
      for(int i=0; i<totals; i++) {
         ulong ticket = PositionGetTicket(i);
         if(ticket > 0) {
            string pos_json = StringFormat(
               "{\"ticket\":%d,\"symbol\":\"%s\",\"type\":\"%s\",\"volume\":%.2f,\"open_price\":%.5f,\"current_price\":%.5f,\"sl\":%.5f,\"tp\":%.5f,\"profit\":%.2f,\"time\":%d}",
               ticket,
               PositionGetString(POSITION_SYMBOL),
               PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "BUY" : "SELL",
               PositionGetDouble(POSITION_VOLUME),
               PositionGetDouble(POSITION_PRICE_OPEN),
               PositionGetDouble(POSITION_PRICE_CURRENT),
               PositionGetDouble(POSITION_SL),
               PositionGetDouble(POSITION_TP),
               PositionGetDouble(POSITION_PROFIT),
               PositionGetInteger(POSITION_TIME)
            );
            json_response += pos_json;
            if(i < totals - 1) json_response += ",";
         }
      }
      json_response += "]}";
   }
   else if(uri == "/api/history") {
      // Last 24h for bridge sync
      datetime end_time = TimeCurrent();
      datetime start_time = end_time - 86400; 
      json_response = "{\"isHeartbeat\":false,\"trades\":[";
      
      if(HistorySelect(start_time, end_time)) {
         int deals = HistoryDealsTotal();
         int count = 0;
         for(int i=deals-1; i>=0 && count < 50; i--) { // Fetch recent 50
            ulong ticket = HistoryDealGetTicket(i);
            long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
            
            // Only out deals or in/out constitute closed trades to journal
            if(ticket > 0 && (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT)) {
               if(count > 0) json_response += ",";
               string deal_json = StringFormat(
                  "{\"ticket\":%d,\"order\":%d,\"symbol\":\"%s\",\"type\":\"%s\",\"volume\":%.2f,\"price\":%.5f,\"entry_price\":0,\"profit\":%.2f,\"commission\":%.2f,\"swap\":%.2f,\"time\":%d,\"entry\":%d}",
                  ticket,
                  HistoryDealGetInteger(ticket, DEAL_ORDER),
                  HistoryDealGetString(ticket, DEAL_SYMBOL),
                  HistoryDealGetInteger(ticket, DEAL_TYPE) == DEAL_TYPE_BUY ? "BUY" : "SELL",
                  HistoryDealGetDouble(ticket, DEAL_VOLUME),
                  HistoryDealGetDouble(ticket, DEAL_PRICE),
                  HistoryDealGetDouble(ticket, DEAL_PROFIT),
                  HistoryDealGetDouble(ticket, DEAL_COMMISSION),
                  HistoryDealGetDouble(ticket, DEAL_SWAP),
                  HistoryDealGetInteger(ticket, DEAL_TIME),
                  entry
               );
               json_response += deal_json;
               count++;
            }
         }
      }
      json_response += "]}";
   }

   SendHttpResponse(socket, "200 OK", json_response, "http://localhost:5173");
}

void SendHttpResponse(int socket, string status, string body, string origin)
{
   string headers = "HTTP/1.1 " + status + "\r\n";
   if(body != "") {
      headers += "Content-Type: application/json\r\n";
   }
   headers += "Access-Control-Allow-Origin: " + origin + "\r\n";
   headers += "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
   headers += "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
   headers += "Connection: close\r\n";
   headers += "Content-Length: " + IntegerToString(StringLen(body)) + "\r\n\r\n";
   
   string full_resp = headers + body;
   
   uchar resp_data[];
   StringToCharArray(full_resp, resp_data);
   SocketSend(socket, resp_data, ArraySize(resp_data)-1); 
}
//+------------------------------------------------------------------+
