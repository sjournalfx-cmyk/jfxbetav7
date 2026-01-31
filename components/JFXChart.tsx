import React, { useEffect, useState, memo, useMemo } from 'react';
import { useMT5Bridge } from '../hooks/useMT5Bridge';
import CustomChart from './CustomChart';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface JFXChartProps {
  symbol: string;
  interval: string;
  isDarkMode: boolean;
  chartId: string;
  showLegend: boolean;
  showGrid: boolean;
  showToolbar: boolean;
}

function JFXChart({
  symbol: initialSymbol,
  interval: initialInterval,
  isDarkMode,
  chartId,
  showLegend,
  showGrid,
  showToolbar,
}: JFXChartProps) {
  const {
    symbol, setSymbol, timeframe, setTimeframe, isFetching, allData, fetchData
  } = useMT5Bridge(initialSymbol, initialInterval);

  const [error, setError] = useState<string | null>(null);

  // Update internal symbol/timeframe when props change
  useEffect(() => {
    if (initialSymbol && initialSymbol !== symbol) {
      setSymbol(initialSymbol);
    }
  }, [initialSymbol, setSymbol, symbol]);

  useEffect(() => {
    if (initialInterval && initialInterval !== timeframe) {
      setTimeframe(initialInterval);
    }
  }, [initialInterval, setTimeframe, timeframe]);

  const loadData = async () => {
    try {
      setError(null);
      await fetchData(symbol, timeframe);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    }
  };

  // Effect for initial fetch and updates
  useEffect(() => {
    if (!symbol || !timeframe) return;
    loadData();
    
    // Auto-refresh every 30 seconds for live monitoring
    const intervalId = setInterval(loadData, 30000);
    return () => clearInterval(intervalId);
  }, [symbol, timeframe]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {allData.length > 0 ? (
        <CustomChart 
          data={allData}
          trades={[]} // ChartGrid doesn't show backtest trades
          drawings={[]} // Dashboard drawings could be added later
          isDarkMode={isDarkMode}
        />
      ) : (
        <div className={`w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center ${isDarkMode ? 'bg-[#09090b]' : 'bg-white'}`}>
          {isFetching ? (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={24} className="animate-spin text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Syncing {symbol}...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF4F01]">Bridge Required</h4>
                <p className="text-[9px] font-bold opacity-60 leading-relaxed max-w-[180px]">
                  {error.includes('disconnected') ? 'Python bridge is not running' : error}
                </p>
              </div>
              <button 
                onClick={loadData}
                className="mt-2 px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold transition-all"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Waiting for Data...</span>
          )}
        </div>
      )}

      {/* Overlay info */}
      <div className="absolute top-2 left-2 pointer-events-none z-10 flex gap-2">
        <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/5 flex items-center gap-2">
          <span className="text-[10px] font-black text-white">{symbol}</span>
          <span className="text-[9px] font-bold text-indigo-400">{timeframe}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(JFXChart);