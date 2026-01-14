import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface OpenPosition {
    ticket: number;
    symbol: string;
    type: string;
    openTime: string;
    openPrice: number;
    currentPrice: number;
    sl: number;
    tp: number;
    lots: number;
    swap: number;
    profit: number;
    comment?: string;
}

interface OpenPositionsProps {
    positions: OpenPosition[];
    isDarkMode: boolean;
    currencySymbol: string;
    lastUpdated?: string;
}

const OpenPositions: React.FC<OpenPositionsProps> = ({ positions, isDarkMode, currencySymbol, lastUpdated }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Trigger a quick flash animation when new data arrives
    useEffect(() => {
        if (lastUpdated) {
            setIsRefreshing(true);
            const timer = setTimeout(() => setIsRefreshing(false), 500); // 500ms refresh flash
            return () => clearTimeout(timer);
        }
    }, [lastUpdated]);

    if (!positions || positions.length === 0) {
        return (
            <div className={`h-full flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed ${isDarkMode ? 'border-zinc-800 bg-zinc-900/20' : 'border-zinc-200 bg-zinc-50/50'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'}`}>
                    <Activity size={24} />
                </div>
                <h3 className={`font-bold mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>No Active Positions</h3>
                <p className={`text-xs ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Real-time trades from MT4/MT5 will appear here.</p>
            </div>
        );
    }

    return (
        <div className="relative h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    {positions.length} Active {positions.length === 1 ? 'Position' : 'Positions'}
                </div>
            </div>

            <div className="space-y-3 overflow-auto custom-scrollbar pr-2 flex-1 max-h-[400px]">
                <style>{`
                    @keyframes data-pulse {
                        0% { opacity: 1; filter: brightness(1); }
                        50% { opacity: 0.7; filter: brightness(1.5); border-color: #3b82f6; }
                        100% { opacity: 1; filter: brightness(1); }
                    }
                    .data-refresh {
                        animation: data-pulse 0.4s ease-out;
                    }
                `}</style>
                {positions.map((pos) => {
                    const isBuy = pos.type?.toLowerCase() === 'buy';
                    return (
                        <div
                            key={pos.ticket}
                            className={`p-4 rounded-2xl border-2 transition-all hover:scale-[1.01] ${isRefreshing ? 'data-refresh' : ''} ${isDarkMode
                                ? 'bg-[#18181b] border-[#27272a] hover:border-zinc-700'
                                : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBuy
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-rose-500/10 text-rose-500'
                                        }`}>
                                        {isBuy ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-sm tracking-tight">{pos.symbol}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${isBuy
                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                : 'bg-rose-500/10 text-rose-500'
                                                }`}>
                                                {pos.type}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-mono opacity-40">#{pos.ticket} • {(pos.lots || 0).toFixed(2)} Lots</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className={`text-lg font-black font-mono leading-none ${pos.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {pos.profit >= 0 ? '+' : ''}{currencySymbol}{(pos.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Floating P/L</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-zinc-800/50">
                                <div>
                                    <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-1">Entry</div>
                                    <div className="text-xs font-mono font-bold">{(pos.openPrice || 0).toFixed(5)}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-1">Current</div>
                                    <div className="text-xs font-mono font-bold">{(pos.currentPrice || 0).toFixed(5)}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-1">SL / TP</div>
                                    <div className="text-xs font-mono font-bold">
                                        {pos.sl > 0 ? pos.sl.toFixed(5) : '---'} / {pos.tp > 0 ? pos.tp.toFixed(5) : '---'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OpenPositions;