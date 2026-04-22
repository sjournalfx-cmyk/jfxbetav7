import React, { useMemo, useState } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { Brain, HelpCircle } from 'lucide-react';

const safePnL = (value: unknown): number => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
};


const getBarStyle = (mindset: string, isPositive: boolean) => {
    switch (mindset) {
        case 'Confident':
            return {
                fill: isPositive ? '#15803d' : '#b91c1c',
                stroke: isPositive ? '#166534' : '#991b1b',
                strokeWidth: 1,
                pattern: null,
            };
        case 'Neutral':
            return {
                fill: isPositive ? '#0369a1' : '#b91c1c',
                stroke: isPositive ? '#075985' : '#991b1b',
                strokeWidth: 1,
                pattern: null,
            };
        case 'Hesitant':
            return {
                fill: isPositive ? '#b45309' : '#b91c1c',
                stroke: isPositive ? '#92400e' : '#991b1b',
                strokeWidth: 1,
                pattern: null,
            };
        case 'Anxious':
            return {
                fill: isPositive ? '#7e22ce' : '#b91c1c',
                stroke: isPositive ? '#6b21a8' : '#991b1b',
                strokeWidth: 1,
                pattern: null,
            };
        case 'FOMO':
            return {
                fill: isPositive ? '#1d4ed8' : '#b91c1c',
                stroke: isPositive ? '#1e40af' : '#991b1b',
                strokeWidth: 1,
                pattern: null,
            };
        default:
            return {};
    }
};

interface PLByMindsetWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    currencySymbol: string;
    onInfoClick?: () => void;
}

export const PLByMindsetWidget: React.FC<PLByMindsetWidgetProps> = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }) => {
    const [hoveredMindset, setHoveredMindset] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const mindsetData = useMemo(() => {
        const safeTrades = trades || [];
        const mindsets = ['Confident', 'Neutral', 'Hesitant', 'Anxious', 'FOMO'];
        const stats: Record<string, { profit: number; loss: number }> = {};
        mindsets.forEach(m => stats[m] = { profit: 0, loss: 0 });

        safeTrades.forEach(trade => {
            const m = trade.mindset || 'Neutral';
            if (stats[m]) {
                const pnl = safePnL(trade.pnl);
                if (pnl > 0) stats[m].profit += pnl;
                else stats[m].loss += Math.abs(pnl);
            }
        });

        return mindsets.map(m => ({
            mindset: m,
            profit: stats[m].profit,
            loss: stats[m].loss,
            net: stats[m].profit - stats[m].loss
        }));
    }, [trades]);

    const allValues = mindsetData.map(d => d.net);
    const maxVal = allValues.length ? Math.max(...allValues, 100) : 100;
    const minVal = allValues.length ? Math.min(...allValues, -100) : -100;

    const range = (maxVal - minVal) * 1.2 || 1;
    const zeroY = (maxVal / range) * 100;

    const hoveredData = hoveredMindset ? mindsetData.find(d => d.mindset === hoveredMindset) : null;

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`p-6 rounded-[24px] border flex flex-col min-h-[400px] h-full relative ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center gap-3 mb-8">
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'} text-purple-500`}>
                    <Brain size={20} />
                </div>
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight">P/L by Mindset</h3>
                    <Tooltip content="Bar chart showing your net profit or loss categorized by the mindset you recorded." isDarkMode={isDarkMode}>
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
                        {mindsetData.map((d, i) => {
                            const netHeight = (Math.abs(d.net) / range) * 100;
                            const isPositive = d.net >= 0;
                            const isHovered = hoveredMindset === d.mindset;
                            const barStyle = getBarStyle(d.mindset, isPositive);

                            return (
                                <div
                                    key={i}
                                    className="relative flex flex-col items-center flex-1 h-full group cursor-pointer"
                                    onMouseEnter={() => setHoveredMindset(d.mindset)}
                                    onMouseLeave={() => setHoveredMindset(null)}
                                >
                                    <div className="relative w-full h-full">
                                        <div
                                            className={`absolute left-1/2 -translate-x-1/2 w-6 transition-all duration-500 rounded-sm ${isHovered ? 'brightness-110 scale-x-110 shadow-md' : 'opacity-70'}`}
                                            style={{
                                                height: `${Math.max(2, netHeight)}%`,
                                                bottom: isPositive ? `calc(${100 - zeroY}%)` : 'auto',
                                                top: isPositive ? 'auto' : `calc(${zeroY}%)`,
                                                backgroundColor: barStyle.fill,
                                                border: `${barStyle.strokeWidth}px solid ${barStyle.stroke}`,
                                            }}
                                        />
                                    </div>
                                    <span className={`absolute bottom-[-24px] text-[10px] font-bold whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 text-indigo-600 scale-110' : 'opacity-40'}`}>
                                        {d.mindset}
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
                        <div className="font-bold text-xs mb-2 border-b border-white/10 pb-1">{hoveredData.mindset}</div>
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
