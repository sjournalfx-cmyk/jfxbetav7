import React, { useMemo, useState } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';

interface PerformanceRadarWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    onInfoClick?: () => void;
}

export const PerformanceRadarWidget: React.FC<PerformanceRadarWidgetProps> = ({ trades = [], isDarkMode, onInfoClick }) => {
    const [hoveredNode, setHoveredNode] = useState<{ mindset: string, value: number, x: number, y: number } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const radarData = useMemo(() => {
        const safeTrades = trades || [];
        const mindsets = ['Confident', 'Neutral', 'Hesitant', 'Anxious', 'FOMO'];
        const stats: Record<string, { total: number, count: number }> = {};

        mindsets.forEach(m => stats[m] = { total: 0, count: 0 });

        safeTrades.forEach(trade => {
            const m = trade.mindset || 'Neutral';
            if (stats[m]) {
                stats[m].total += trade.pnl || 0;
                stats[m].count += 1;
            }
        });

        const values = mindsets.map(m => stats[m].count > 0 ? stats[m].total : 0);
        const maxAbs = Math.max(...values.map(Math.abs), 10);

        return mindsets.map((m, i) => {
            const angle = (i / mindsets.length) * 2 * Math.PI - Math.PI / 2;
            const rawValue = stats[m].count > 0 ? stats[m].total : 0;

            let normalizedValue = 0.5;
            if (maxAbs > 0) {
                normalizedValue = 0.5 + (rawValue / (2 * maxAbs));
            }

            normalizedValue = Math.max(0.1, Math.min(0.95, normalizedValue));

            return {
                mindset: m,
                x: Math.cos(angle),
                y: Math.sin(angle),
                value: normalizedValue,
                rawValue
            };
        });
    }, [trades]);

    const points = radarData.map(d => `${50 + d.x * d.value * 45},${50 + d.y * d.value * 45}`).join(' ');

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`py-4 px-0 sm:p-8 rounded-none sm:rounded-[32px] border flex flex-col items-center min-h-[400px] h-full relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="text-center mb-8">
                <div className="flex items-center gap-2 justify-center">
                    <h3 className="text-xl font-bold tracking-tight">Performance Radar</h3>
                    <Tooltip content="Maps your P&L performance against your psychological state (mindset) at the time of trading." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                    </Tooltip>
                </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center relative w-full">
                <svg viewBox="0 0 100 100" className="w-full max-w-[280px] aspect-square overflow-visible">
                    {[0.2, 0.4, 0.6, 0.8, 1].map((r, i) => (
                        <circle 
                            key={i} 
                            cx="50" 
                            cy="50" 
                            r={r * 45} 
                            fill="none" 
                            stroke={isDarkMode ? "white" : "black"} 
                            strokeOpacity="0.08" 
                            strokeWidth="0.5" 
                        />
                    ))}

                    {radarData.map((d, i) => (
                        <line 
                            key={i} 
                            x1="50" 
                            y1="50" 
                            x2={50 + d.x * 45} 
                            y2={50 + d.y * 45} 
                            stroke={isDarkMode ? "white" : "black"} 
                            strokeOpacity="0.08" 
                            strokeWidth="0.5" 
                        />
                    ))}

                    <polygon
                        points={points}
                        fill="rgba(99, 102, 241, 0.6)"
                        stroke="#6366f1"
                        strokeWidth="1"
                        strokeLinejoin="round"
                        className="transition-all duration-1000"
                    />

                    {radarData.map((d, i) => (
                        <circle
                            key={i}
                            cx={50 + d.x * d.value * 45}
                            cy={50 + d.y * d.value * 45}
                            r="2"
                            fill="#6366f1"
                            stroke={isDarkMode ? "#18181b" : "white"}
                            strokeWidth="1.5"
                            className="cursor-pointer transition-all duration-300 hover:r-3"
                            onMouseEnter={() => setHoveredNode({ mindset: d.mindset, value: d.rawValue, x: 50 + d.x * d.value * 45, y: 50 + d.y * d.value * 45 })}
                            onMouseLeave={() => setHoveredNode(null)}
                        />
                    ))}

                    {radarData.map((d, i) => (
                        <text
                            key={i}
                            x={50 + d.x * 55}
                            y={50 + d.y * 55}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[4px] font-bold uppercase tracking-wider opacity-50 fill-current"
                        >
                            {d.mindset}
                        </text>
                    ))}
                </svg>
            </div>

            {hoveredNode && (
                <div
                    className={`absolute z-50 px-4 py-2 rounded-xl text-xs font-bold pointer-events-none shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700 text-white' : 'bg-white/90 border-slate-200 text-slate-900'}`}
                    style={{
                        left: mousePos.x + 15,
                        top: mousePos.y - 45
                    }}
                >
                    <div className="opacity-60 text-[9px] font-black uppercase tracking-widest mb-1">{hoveredNode.mindset}</div>
                    <div className={`text-sm ${hoveredNode.value >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {hoveredNode.value >= 0 ? '+' : ''}{hoveredNode.value.toLocaleString()}
                    </div>
                </div>
            )}

            <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span>Psychology Footprint</span>
                </div>
            </div>
        </div>
    );
};
