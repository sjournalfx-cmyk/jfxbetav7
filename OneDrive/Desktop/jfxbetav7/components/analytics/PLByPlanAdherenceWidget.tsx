import React, { useMemo, useState } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { ShieldCheck, HelpCircle } from 'lucide-react';

const safePnL = (value: unknown): number => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
};

const getAdherenceBarStyle = (category: string, isPositive: boolean) => {
    switch (category) {
        case 'Followed':
            return isPositive 
                ? { fill: 'linear-gradient(180deg, #65a30d 0%, #4d7c0f 100%)', stroke: '#3f6212', glow: '0 0 6px rgba(101, 163, 13, 0.3)' }
                : { fill: '#991b1b', stroke: '#7f1d1d', glow: 'none' };
        case 'Minor':
            return isPositive 
                ? { fill: 'linear-gradient(180deg, #ca8a04 0%, #a16207 100%)', stroke: '#854d0e', glow: '0 0 4px rgba(202, 138, 4, 0.25)' }
                : { fill: '#991b1b', stroke: '#7f1d1d', glow: 'none' };
        case 'Major':
            return isPositive 
                ? { fill: 'linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%)', stroke: '#681414', glow: '0 0 4px rgba(185, 28, 28, 0.2)' }
                : { fill: '#991b1b', stroke: '#7f1d1d', glow: 'none' };
        case 'None':
            return isPositive 
                ? { fill: 'linear-gradient(180deg, #475569 0%, #334155 100%)', stroke: '#1e293b', glow: 'none' }
                : { fill: '#991b1b', stroke: '#7f1d1d', glow: 'none' };
        default:
            return { fill: '#475569', stroke: '#334155', glow: 'none' };
    }
};

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
            const pnl = safePnL(trade.pnl);
            if (stats[c]) {
                if (pnl > 0) stats[c].profit += pnl;
                else stats[c].loss += Math.abs(pnl);
            } else {
                if (pnl > 0) stats['No Plan'].profit += pnl;
                else stats['No Plan'].loss += Math.abs(pnl);
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
            <div className="flex items-center gap-3 mb-8">
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'} text-emerald-500`}>
                    <ShieldCheck size={20} />
                </div>
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight">P/L by Plan Adherence</h3>
                    <Tooltip content="Shows how your P/L correlates with your level of plan adherence." isDarkMode={isDarkMode}>
                        <HelpCircle 
                            size={14}
                            onClick={onInfoClick}
                            className="opacity-40 cursor-help hover:opacity-100 transition-opacity" 
                        />
                    </Tooltip>
                </div>
            </div>

            <div className="flex-1 flex relative overflow-hidden">
                <div className="w-12 flex flex-col justify-between text-[10px] font-mono opacity-40 pb-8 border-r border-dashed border-white/5 pr-2 z-20">
                    <span>{currencySymbol}{Math.round(maxVal)}</span>
                    <span>{currencySymbol}0</span>
                    <span>{currencySymbol}{Math.round(minVal)}</span>
                </div>

                <div className="flex-1 relative ml-2">
                    <div
                        className="absolute left-0 right-0 border-t border-white/20 z-20 pointer-events-none"
                        style={{ top: `${zeroY}%` }}
                    />

                    <div className="absolute inset-0 flex items-end justify-around pb-8 z-10">
                        {adherenceData.map((d, i) => {
                            const netHeight = (Math.abs(d.net) / range) * 100;
                            const isPositive = d.net >= 0;
                            const isHovered = hoveredAdherence === d.fullLabel;
                            const barStyle = getAdherenceBarStyle(d.category, isPositive);

                            return (
                                <div
                                    key={i}
                                    className="relative flex flex-col items-center flex-1 h-full group cursor-pointer"
                                    onMouseEnter={() => setHoveredAdherence(d.fullLabel)}
                                    onMouseLeave={() => setHoveredAdherence(null)}
                                >
                                    <div className="relative w-full h-full">
                                        <div
                                            className={`absolute left-1/2 -translate-x-1/2 w-6 transition-all duration-500 rounded-sm ${isHovered ? 'brightness-110 scale-x-110 shadow-md' : 'opacity-80'}`}
                                            style={{
                                                height: `${Math.max(2, netHeight)}%`,
                                                bottom: isPositive ? `calc(${100 - zeroY}%)` : 'auto',
                                                top: isPositive ? 'auto' : `calc(${zeroY}%)`,
                                                background: barStyle.fill,
                                                border: `1px solid ${barStyle.stroke}`,
                                                boxShadow: isPositive ? barStyle.glow : 'none',
                                            }}
                                        />
                                    </div>
                                    <span className={`absolute bottom-[-24px] text-[10px] font-bold whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 text-amber-600 scale-110' : 'opacity-40'}`}>
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
