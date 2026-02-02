import React, { useMemo, useState } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';

interface PLByPlanAdherenceWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    currencySymbol: string;
    onInfoClick?: () => void;
}

export const PLByPlanAdherenceWidget: React.FC<PLByPlanAdherenceWidgetProps> = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }) => {
    const [hoveredAdherence, setHoveredAdherence] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const adherenceData = useMemo(() => {
        const safeTrades = trades || [];
        const categories = ['Followed Exactly', 'Minor Deviation', 'Major Deviation', 'No Plan'];
        const stats: Record<string, { profit: number; loss: number }> = {};
        categories.forEach(c => stats[c] = { profit: 0, loss: 0 });

        safeTrades.forEach(trade => {
            const c = trade.planAdherence || 'No Plan';
            if (stats[c]) {
                if (trade.pnl > 0) stats[c].profit += trade.pnl;
                else stats[c].loss += Math.abs(trade.pnl || 0);
            } else {
                if (trade.pnl > 0) stats['No Plan'].profit += trade.pnl;
                else stats['No Plan'].loss += Math.abs(trade.pnl || 0);
            }
        });

        return categories.map(c => ({
            category: c === 'Followed Exactly' ? 'Followed' : c === 'Minor Deviation' ? 'Minor' : c === 'Major Deviation' ? 'Major' : 'None',
            fullLabel: c,
            profit: stats[c].profit,
            loss: stats[c].loss,
            net: stats[c].profit - stats[c].loss
        }));
    }, [trades]);

    const allValues = adherenceData.map(d => d.net);
    const maxVal = allValues.length ? Math.max(...allValues, 100) : 100;
    const minVal = allValues.length ? Math.min(...allValues, -100) : -100;

    const range = (maxVal - minVal) * 1.2 || 1;
    const zeroY = (maxVal / range) * 100;

    const hoveredData = hoveredAdherence ? adherenceData.find(d => d.fullLabel === hoveredAdherence) : null;

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`p-6 rounded-[24px] border flex flex-col min-h-[400px] h-full relative ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center gap-2 mb-8">
                <h3 className="text-xl font-bold tracking-tight">P/L by Plan Adherence</h3>
                <Tooltip content="Shows how your P/L correlates with your level of plan adherence." isDarkMode={isDarkMode}>
                    <svg 
                        onClick={onInfoClick}
                        xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                </Tooltip>
            </div>

            <div className="flex-1 flex relative overflow-hidden">
                <div className="w-12 flex flex-col justify-between text-[10px] font-mono opacity-40 pb-8 border-r border-dashed border-white/5 pr-2 z-20">
                    <span>{currencySymbol}{Math.round(maxVal)}</span>
                    <span>{currencySymbol}0</span>
                    <span>{currencySymbol}{Math.round(minVal)}</span>
                </div>

                <div className="flex-1 relative ml-2">
                    <div
                        className="absolute left-0 right-0 border-t border-white/20 z-10"
                        style={{ top: `${zeroY}%` }}
                    />

                    <div className="absolute inset-0 flex items-end justify-around pb-8">
                        {adherenceData.map((d, i) => {
                            const netHeight = (Math.abs(d.net) / range) * 100;
                            const isPositive = d.net >= 0;
                            const isHovered = hoveredAdherence === d.fullLabel;

                            return (
                                <div
                                    key={i}
                                    className="relative flex flex-col items-center flex-1 h-full group cursor-pointer"
                                    onMouseEnter={() => setHoveredAdherence(d.fullLabel)}
                                    onMouseLeave={() => setHoveredAdherence(null)}
                                >
                                    <div className="relative w-full h-full z-10">
                                        <div
                                            className={`absolute left-1/2 -translate-x-1/2 w-8 transition-all duration-500 rounded-sm ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'} ${isHovered ? 'brightness-125 scale-x-110 shadow-lg' : 'opacity-80'}`}
                                            style={{
                                                height: `${Math.max(2, netHeight)}%`,
                                                bottom: isPositive ? `${100 - zeroY}%` : 'auto',
                                                top: isPositive ? 'auto' : `${zeroY}%`
                                            }}
                                        />
                                    </div>
                                    <span className={`absolute bottom-[-24px] text-[10px] font-bold whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 text-indigo-500 scale-110' : 'opacity-40'}`}>
                                        {d.category}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {hoveredData && (
                <div 
                    className="absolute pointer-events-none z-50"
                    style={{ 
                        left: mousePos.x - 140, 
                        top: mousePos.y - 80
                    }}
                >
                    <div className={`p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 min-w-[140px] ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                        <div className="font-bold text-xs mb-2 border-b border-white/10 pb-1">{hoveredData.fullLabel}</div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] opacity-60 uppercase font-bold">Net P/L</span>
                            <span className={`text-sm font-black ${hoveredData.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {hoveredData.net >= 0 ? '+' : ''}{currencySymbol}{hoveredData.net.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
