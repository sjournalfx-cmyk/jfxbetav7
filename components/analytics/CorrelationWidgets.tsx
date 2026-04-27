
import React, { useMemo, useState } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Trade } from '../../types';
import { clsx } from 'clsx';
import { BarChart2, Layers, ZoomIn, ZoomOut, Activity, Repeat, Info } from 'lucide-react';

interface CorrelationWidgetProps {
  trades: Trade[];
  isDarkMode: boolean;
  currencySymbol: string;
}

const formatLots = (value: number) => Number(value).toFixed(1);

/**
 * Bubble Chart: Lot Size vs PnL
 */
export const LotSizePnLDistributionWidget: React.FC<CorrelationWidgetProps> = ({ trades, isDarkMode, currencySymbol }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const data = useMemo(() => {
    return trades
      .filter(t => t.result !== 'Pending')
      .map(t => {
        let duration = 0;
        if (t.openTime && t.closeTime) {
          duration = (new Date(t.closeTime).getTime() - new Date(t.openTime).getTime()) / (1000 * 60);
        }
        return {
          lots: t.lots,
          pnl: t.pnl,
          duration: Math.max(10, Math.min(duration, 300)), 
          realDuration: duration,
          pair: t.pair,
          rating: t.rating,
          result: t.result
        };
      });
  }, [trades]);

  const xDomain: [number, number | 'auto'] = isZoomed ? [0, 0.5] : [0, 'auto'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className={clsx(
          "p-4 rounded-2xl border shadow-2xl backdrop-blur-xl",
          isDarkMode ? "bg-zinc-900/95 border-zinc-800 text-white" : "bg-white border-slate-200 text-slate-900"
        )}>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 border-b border-current pb-2">{d.pair}</div>
          <div className="space-y-1">
            <div className="flex justify-between gap-8">
              <span className="text-[10px] font-bold opacity-60">PnL:</span>
              <span className={clsx("font-black", d.pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {d.pnl >= 0 ? '+' : ''}{currencySymbol}{Math.abs(d.pnl).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold opacity-60">Size:</span>
              <span className="font-black">{formatLots(d.lots)} lots</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold opacity-60">Duration:</span>
              <span className="font-black">{Math.round(d.realDuration)} min</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={clsx(
      "p-6 rounded-[24px] border h-full flex flex-col",
      isDarkMode ? "bg-zinc-950 border-zinc-800 shadow-2xl" : "bg-white border-slate-200 shadow-xl"
    )}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black tracking-tight italic uppercase flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-500" />
            Lot Size vs. PnL
          </h3>
          <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-1">Bubble size = duration â€¢ Intensity = rating</p>
        </div>

        <button 
          onClick={() => setIsZoomed(!isZoomed)}
          className={clsx(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all scale-90",
            isZoomed 
              ? "bg-brand text-white shadow-[0_0_15px_rgba(130,81,238,0.4)]" 
              : (isDarkMode ? "bg-zinc-900 text-zinc-400 border border-zinc-800" : "bg-slate-100 text-slate-500 border border-slate-200")
          )}
        >
          {isZoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
          {isZoomed ? "Reset" : "Focus Small Lots"}
        </button>
      </div>

      <div className="h-[350px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#27272a" : "#e2e8f0"} />
            <XAxis 
              type="number" 
              dataKey="lots" 
              name="Lot Size" 
              domain={xDomain}
              stroke={isDarkMode ? "#71717a" : "#94a3b8"} 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(v) => `${formatLots(Number(v))} Lots`}
            />
            <YAxis 
              type="number" 
              dataKey="pnl" 
              name="PnL" 
              stroke={isDarkMode ? "#71717a" : "#94a3b8"} 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(v) => `${currencySymbol}${v}`}
            />
            <ZAxis type="number" dataKey="duration" range={[50, 600]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={data}>
              {data.map((entry, index) => {
                const color = entry.pnl >= 0 ? '#10B981' : '#EF4444';
                const opacity = Math.min(0.9, 0.3 + (entry.rating / 5) * 0.6);
                return <Cell key={`cell-${index}`} fill={color} fillOpacity={opacity} stroke={color} strokeWidth={1} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * NEW VERSION: Pair Correlation Matrix
 * FIXED SQUARE CELLS (32px x 32px)
 */
export const PairCorrelationMatrixWidget: React.FC<CorrelationWidgetProps> = ({ trades, isDarkMode, currencySymbol }) => {
  const { pairList, matrix, maxFreq } = useMemo(() => {
    const list = Array.from(new Set(trades.map(t => t.pair.toUpperCase()))).sort();
    const mat: Record<string, Record<string, number>> = {};
    const dailyPnL: Record<string, Record<string, number>> = {};

    list.forEach(p1 => {
      mat[p1] = {};
      dailyPnL[p1] = {};
      list.forEach(p2 => {
        mat[p1][p2] = 0;
      });
    });

    trades.forEach(t => {
      if (dailyPnL[t.pair.toUpperCase()]) {
        dailyPnL[t.pair.toUpperCase()][t.date] = (dailyPnL[t.pair.toUpperCase()][t.date] || 0) + t.pnl;
      }
    });

    list.forEach(p1 => {
      list.forEach(p2 => {
        if (p1 !== p2) {
          const commonDates = Object.keys(dailyPnL[p1]).filter(d => dailyPnL[p2][d] !== undefined);
          mat[p1][p2] = commonDates.length;
        }
      });
    });

    const max = Math.max(1, ...Object.values(mat).flatMap(row => Object.values(row)));

    return { pairList: list, matrix: mat, maxFreq: max };
  }, [trades]);

  const getCellColor = (val: number) => {
    const intensity = maxFreq > 0 ? val / maxFreq : 0;
    if (val === 0) return 'transparent';
    
    return isDarkMode 
      ? `rgba(130, 81, 238, ${Math.max(0.1, intensity * 0.9)})`
      : `rgba(15, 23, 42, ${intensity})`; 
  };

  if (!pairList.length || !trades.length) {
    return <div className="text-center p-8 opacity-40 uppercase text-xs font-black italic">No correlation data available</div>;
  }

  return (
    <div className={clsx(
      "p-6 rounded-[24px] border flex flex-col transition-all w-full",
      isDarkMode ? "bg-zinc-950 border-zinc-900 shadow-2xl" : "bg-white border-slate-200 shadow-sm"
    )}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Layers size={24} className="text-brand opacity-80" />
          <div>
            <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Pair Correlation Matrix</h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              Co-trading frequency between currency pairs. Darker = stronger relationship.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-6">
        <div className="w-fit mx-auto">
           {/* Top Pair Labels */}
           <div 
             className="grid gap-1 mb-2"
             style={{ gridTemplateColumns: `108px repeat(${pairList.length}, 60px)` }}
           >
             <div />
             {pairList.map(pair => (
               <div key={pair} className="text-xs font-black text-slate-500 text-center py-2 truncate uppercase">
                 {pair}
               </div>
             ))}
           </div>

           {/* Matrix Rows */}
           <div className="space-y-1">
             {pairList.map(p1 => (
               <div 
                 key={p1} 
                 className="grid gap-1 items-center"
                 style={{ gridTemplateColumns: `108px repeat(${pairList.length}, 60px)` }}
               >
                 <div className="text-xs font-black text-slate-500 flex items-center justify-end pr-3 truncate uppercase h-[60px]">
                    {p1}
                 </div>
                 {pairList.map(p2 => {
                   const val = matrix[p1][p2];
                   const isSame = p1 === p2;
                   return (
                     <div 
                      key={`${p1}-${p2}`}
                      title={`${p1} Ã— ${p2}: ${val} co-occurrences`}
                      className={clsx(
                        "w-[60px] h-[60px] rounded-[4px] transition-all duration-300 group relative flex items-center justify-center border border-white/5",
                        isSame ? (isDarkMode ? "bg-zinc-900/50" : "bg-slate-50") : "cursor-pointer hover:ring-2 hover:ring-white/40 hover:scale-105 z-10"
                      )}
                      style={{ backgroundColor: isSame ? undefined : getCellColor(val) }}
                     >
                       {val > 0 && !isSame && (
                         <div className="flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-base font-black text-white">{val}</span>
                            <span className="text-[8px] font-bold text-white/40 uppercase">Trades</span>
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
             ))}
           </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-zinc-500/10 flex items-center justify-between opacity-30">
         <p className="text-[10px] font-bold uppercase tracking-widest italic">60px Compact Grid • Quantitative Correlation Analysis</p>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-zinc-800 rounded-full" />
               <span className="text-[8px] font-black uppercase">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-brand rounded-full" />
               <span className="text-[8px] font-black uppercase">Heavy Overlap</span>
            </div>
         </div>
      </div>
    </div>
  );
};

