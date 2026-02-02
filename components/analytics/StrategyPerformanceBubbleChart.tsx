import React, { useMemo } from 'react';
import { Trade } from '../../types';
import { Target, Award } from 'lucide-react';

interface StrategyPerformanceBubbleChartProps {
    trades: Trade[];
    isDarkMode: boolean;
    currencySymbol: string;
}

export const StrategyPerformanceBubbleChart: React.FC<StrategyPerformanceBubbleChartProps> = ({ trades = [], isDarkMode, currencySymbol = '$' }) => {
    const strategyData = useMemo(() => {
        const safeTrades = trades || [];
        const stats: Record<string, { pnl: number, count: number, wins: number }> = {};

        safeTrades.forEach(t => {
            const stratStrategies = t.tags || [];
            stratStrategies.forEach(tag => {
                const normalized = tag.trim();
                if (!stats[normalized]) stats[normalized] = { pnl: 0, count: 0, wins: 0 };
                stats[normalized].pnl += t.pnl;
                stats[normalized].count += 1;
                if (t.result === 'Win') stats[normalized].wins += 1;
            });
        });

        return Object.entries(stats).map(([name, data]) => ({
            name,
            pnl: data.pnl,
            count: data.count,
            winRate: (data.wins / data.count) * 100,
            avgPnl: data.pnl / data.count
        })).filter(d => d.count >= 1);
    }, [trades]);

    return (
        <div 
            className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[450px] relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}
        >
             <div className="flex items-center justify-between mb-8">
                 <div>
                     <h3 className="text-xl font-bold tracking-tight">Strategy Efficiency</h3>
                     <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1">Comparative performance and consistency analysis</p>
                 </div>
                 <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                    <Target size={20} />
                 </div>
             </div>

            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                {strategyData.length === 0 ? (
                    <div className="h-full flex items-center justify-center opacity-20 text-sm font-bold uppercase tracking-widest">Insufficient Strategy Data</div>
                ) : (
                    strategyData.sort((a, b) => b.pnl - a.pnl).map((d, i) => {
                        const efficiency = (d.winRate * (d.pnl > 0 ? 1 : 0.5)).toFixed(0);
                        
                        return (
                            <div key={i} className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                                            d.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                        }`}>
                                            {d.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm uppercase tracking-wide">{d.name}</h4>
                                            <p className="text-[10px] font-bold opacity-40 uppercase">{d.count} Trades Logged</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase opacity-30 tracking-tighter">Win Rate</p>
                                            <p className="text-sm font-black font-mono">{d.winRate.toFixed(1)}%</p>
                                        </div>
                                        <div className="w-px h-8 bg-current opacity-10" />
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase opacity-30 tracking-tighter">Net Profit</p>
                                            <p className={`text-sm font-black font-mono ${d.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {d.pnl >= 0 ? '+' : ''}{currencySymbol}{d.pnl.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="relative h-2 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className={`absolute inset-y-0 left-0 transition-all duration-1000 ${d.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                            style={{ width: `${d.winRate}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                        <span className="opacity-40">Consistency Meter</span>
                                        <span className={d.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                            Efficiency Score: {efficiency}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="mt-6 flex items-center justify-between p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10">
                <div className="flex items-center gap-3">
                    <Award size={16} className="text-violet-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">Top Performer</span>
                </div>
                {strategyData.length > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {strategyData.sort((a, b) => b.pnl - a.pnl)[0].name}
                    </span>
                )}
            </div>
        </div>
    );
};
