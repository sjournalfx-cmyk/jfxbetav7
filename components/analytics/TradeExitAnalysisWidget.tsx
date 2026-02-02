import React, { useMemo, useState } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { MoreVertical } from 'lucide-react';

interface TradeExitAnalysisWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    onInfoClick?: () => void;
}

export const TradeExitAnalysisWidget: React.FC<TradeExitAnalysisWidgetProps> = ({ trades = [], isDarkMode, onInfoClick }) => {
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const exitData = useMemo(() => {
        const safeTrades = trades || [];
        const total = safeTrades.length || 1;
        const tp = safeTrades.filter(t => t.result === 'Win').length;
        const sl = safeTrades.filter(t => t.result === 'Loss').length;
        const be = safeTrades.filter(t => t.result === 'BE').length;
        const pending = safeTrades.filter(t => t.result === 'Pending').length;

        const data = [
            { label: 'Take Profit', key: 'TP', value: tp, color: '#10b981' },
            { label: 'Stop Loss', key: 'SL', value: sl, color: '#f43f5e' },
            { label: 'Breakeven', key: 'BE', value: be, color: '#71717a' },
            { label: 'Pending', key: 'P', value: pending, color: '#3b82f6' },
        ];

        let cumulativePercent = 0;
        return data.map(d => {
            const percent = (d.value / total) * 100;
            const startPercent = cumulativePercent;
            cumulativePercent += percent;
            return { ...d, percent, startPercent };
        });
    }, [trades]);

    const hoveredData = exitData.find(d => d.key === hoveredKey);

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[400px] relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight">Trade Exit Analysis</h3>
                    <Tooltip content="Breakdown of how your trades were closed (TP, SL, BE) to analyze exit efficiency." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                    </Tooltip>
                </div>
                <MoreVertical size={16} className="opacity-30" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-64 h-64 transform -rotate-90 overflow-visible">
                    {exitData.map((d, i) => {
                        if (d.percent === 0) return null;
                        const [startX, startY] = getCoordinatesForPercent(d.startPercent / 100);
                        const [endX, endY] = getCoordinatesForPercent((d.startPercent + d.percent) / 100);
                        const largeArcFlag = d.percent > 50 ? 1 : 0;
                        const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
                        const isHovered = hoveredKey === d.key;

                        return (
                            <path
                                key={i}
                                d={pathData}
                                fill={d.color}
                                className={`transition-all duration-300 cursor-pointer ${isHovered ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                                style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)', transformOrigin: 'center' }}
                                onMouseEnter={() => setHoveredKey(d.key)}
                                onMouseLeave={() => setHoveredKey(null)}
                            />
                        );
                    })}
                </svg>

                {hoveredData && (
                    <div
                        className="absolute pointer-events-none z-50"
                        style={{
                            left: mousePos.x + 15,
                            top: mousePos.y - 80
                        }}
                    >
                        <div className={`p-3 rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                            <div className="text-center">
                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">{hoveredData.label}</div>
                                <div className="text-xl font-black" style={{ color: hoveredData.color }}>{hoveredData.percent.toFixed(1)}%</div>
                                <div className="text-[10px] font-bold opacity-40">{hoveredData.value} Trades</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mt-8 w-full px-4">
                    {exitData.map((d, i) => (
                        <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${hoveredKey === d.key ? 'scale-105' : 'opacity-80'}`}>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-sm font-bold whitespace-nowrap">{d.label}: {d.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
