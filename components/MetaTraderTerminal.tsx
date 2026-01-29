
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, RefreshCw, Maximize2, Layout, Square, Columns } from 'lucide-react';

interface MetaTraderTerminalProps {
  isDarkMode: boolean;
  version?: '4';
  startupMode?: 'create_demo' | 'login' | 'open_demo';
  colorScheme?: 'black_on_white' | 'yellow_on_black' | 'green_on_black';
  lang?: string;
}

declare global {
  interface Window {
    MetaTraderWebTerminal: any;
  }
}

const MetaTraderTerminal: React.FC<MetaTraderTerminalProps> = ({
  isDarkMode,
  version = '4',
  startupMode = 'login',
  colorScheme,
  lang = 'en'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const singleContainerRef = useRef<HTMLDivElement>(null);

  // Determine color scheme based on dark mode if not explicitly provided
  const activeColorScheme = colorScheme || (isDarkMode ? 'green_on_black' : 'black_on_white');

  // Load the official MetaTrader widget script
  useEffect(() => {
    const scriptId = 'metatrader-widget-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://trade.mql5.com/trade/widget.js';
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  const initTerminal = (containerId: string) => {
    if (window.MetaTraderWebTerminal) {
      new window.MetaTraderWebTerminal(containerId, {
        version: 4,
        servers: [], // Empty array allows searching and manual server entry
        startupMode: startupMode,
        lang: lang,
        colorScheme: activeColorScheme,
        demoAllServers: true
      });
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!scriptLoaded) return;

    const timer = setTimeout(() => {
      setIsLoading(true);
      if (singleContainerRef.current) singleContainerRef.current.innerHTML = '';
      const ok = initTerminal('mt-container-single');
      if (ok) setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [scriptLoaded, isDarkMode, activeColorScheme]);

  const handleRetry = () => {
    setScriptLoaded(false);
    setTimeout(() => setScriptLoaded(true), 10);
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
      {/* Header / Toolbar */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-200 bg-white'
        }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF4F01]/10 text-[#FF4F01]">
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Web Terminal</h2>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-0.5">
              MetaTrader 4 Official Widget
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRetry}
              className={`p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              title="Reload Terminal"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 relative min-h-0 bg-[#1c1c1c]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#1c1c1c]">
            <Loader2 className="w-8 h-8 text-[#FF4F01] animate-spin mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Initializing MT4...
            </p>
          </div>
        )}

        <div className="w-full h-full p-1">
          <div id="mt-container-single" ref={singleContainerRef} className="w-full h-full rounded-xl overflow-hidden bg-black" />
        </div>
      </div>
    </div>
  );
};

export default MetaTraderTerminal;
