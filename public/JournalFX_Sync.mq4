
//+------------------------------------------------------------------+
//|                                               JournalFX_Sync.mq4 |
//|                                       Copyright 2024, JournalFX. |
//|                                             https://journalfx.io |
//+------------------------------------------------------------------+
#property copyright "JournalFX"
#property link      "https://journalfx.io"
#property version   "1.01"
#property strict

//--- input parameters
input string   InpSyncKey     = "";          // Sync Key (Copy from JournalFX)
input string   InpApiKey      = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bGlraGpnd2F6eXJhaHVjYXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MTM5OTgsImV4cCI6MjA4Mjk4OTk5OH0.E-Gb2DIkSOrNNK4gfQRkAcDRRaMOcMM0fh0XFRRUx3Q"; // Supabase Anon Key
input string   InpApiUrl      = "https://lwlikhjgwazyrahucatl.supabase.co/functions/v1/sync-trades"; // API Endpoint
bool           ExtFirstSync   = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   if(InpSyncKey == "")
     {
      Print("Error: Sync Key is required. Please copy it from your JournalFX dashboard.");
      return(INIT_FAILED);
     }
   
   EventSetTimer(1); // Trigger first sync in 1 second
   
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
  }

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
  {
   SendSyncData();
   
   if(!ExtFirstSync)
     {
      ExtFirstSync = true;
      EventKillTimer();
      EventSetTimer(60); // Switch to 60s interval
     }
  }

//+------------------------------------------------------------------+
//| Send Data to Server                                              |
//+------------------------------------------------------------------+
void SendSyncData()
  {
   uchar data[];
   char postData[];
   char result[];
   string resultHeaders;
   string headers = "Content-Type: application/json\r\nSync-Key: " + InpSyncKey + "\r\napikey: " + InpApiKey + "\r\n";
   
   // Construct JSON payload
   string json = StringConcatenate("{\"sync_key\":\"", InpSyncKey, 
                                   "\", \"balance\":", DoubleToString(AccountBalance(), 2), 
                                   ", \"equity\":", DoubleToString(AccountEquity(), 2), 
                                   ", \"platform\":\"MT4\"",
                                   ", \"account_number\":", IntegerToString(AccountNumber()), "}");
   
   // 1. Convert string to uchar array
   int len = StringToCharArray(json, data);
   
   // 2. Resize the target char array
   if (len > 0) len--; // Remove null terminator
   ArrayResize(postData, len);
   
   // 3. Explicitly cast and copy uchar to char
   for(int i=0; i<len; i++)
     {
      postData[i] = (char)data[i];
     }
   
   // Reset error state
   ResetLastError();
   
   // Send POST request
   int res = WebRequest("POST", InpApiUrl, headers, 5000, postData, result, resultHeaders);
   
   if(res == -1)
     {
      int err = GetLastError();
      Print("Error sending data: ", err);
      if(err == 4060)
        {
         Print("Permissions Error: Please add '", InpApiUrl, "' to Tools > Options > Expert Advisors > Allow WebRequest");
        }
     }
   else
     {
      Print("Sync successful. Response code: ", res);
     }
  }
//+------------------------------------------------------------------+