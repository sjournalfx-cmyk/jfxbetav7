import React, { useState } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { TrendingUp, Activity } from 'lucide-react';

interface EquityCurveWidgetProps {
    trades: Trade[];
    equityData: number[];
    isDarkMode: boolean;
    currencySymbol: string;
    currentBalanceOverride?: number;
    onInfoClick?: () => void;
    isLoading?: boolean;
}

export const EquityCurveWidget: React.FC<EquityCurveWidgetProps> = ({ trades = [], equityData = [], isDarkMode, currencySymbol = '$', currentBalanceOverride, onInfoClick, isLoading = false }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    if (isLoading) {
        return (
            <div className={`py-4 px-0 sm:p-8 rounded-none sm:rounded-[32px] border flex flex-col min-h-[350px] h-full relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-500/10 animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-24 h-4 bg-zinc-500/10 rounded animate-pulse" />
                            <div className="w-32 h-2 bg-zinc-500/10 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex items-end gap-1 px-4">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="flex-1 bg-zinc-500/5 rounded-t animate-pulse" style={{ height: `${20 + Math.random() * 60}%` }} />
                    ))}
                </div>
            </div>
        );
    }

    const min = Math.min(...equityData);
    const max = Math.max(...equityData);
    const dataRange = max - min;
    
    // Add 10% padding above and below
    const padding = dataRange === 0 ? 100 : dataRange * 0.1;
    const chartMin = min - padding;
    const chartMax = max + padding;
    const chartRange = chartMax - chartMin || 1;

    const generatePath = (data: number[], width: number, height: number) => {
        if (!data || data.length < 2) return "";
        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - chartMin) / chartRange) * height;
            return `${x},${y}`;
        });
        return `M ${points.join(' L ')}`;
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        
        const index = Math.round((x / width) * (equityData.length - 1));
        if (index >= 0 && index < equityData.length) {
            setHoverIndex(index);
            setMousePos({ x: (index / (equityData.length - 1)) * 800, y: 0 });
        }
    };

    const points = equityData.map((val, i) => {
        const x = (i / (equityData.length - 1 || 1)) * 800;
        const y = 240 - ((val - chartMin) / chartRange) * 240;
        return { x, y, val };
    });

    const hoverY = hoverIndex !== null ? 240 - ((equityData[hoverIndex] - chartMin) / chartRange) * 240 : 0;

    const yAxisLabels = [
        chartMax,
        chartMin + (chartMax - chartMin) * 0.75,
        chartMin + (chartMax - chartMin) * 0.5,
        chartMin + (chartMax - chartMin) * 0.25,
        chartMin
    ];

    const xAxisLabels = equityData.length > 10 
        ? [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(p * (equityData.length - 1)))
        : Array.from({ length: equityData.length }, (_, i) => i);

    return (
        <div className={`py-4 px-0 sm:p-8 rounded-none sm:rounded-[32px] border flex flex-col min-h-[400px] h-full relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex justify-between items-start mb-6 relative">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><TrendingUp size={20} /></div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg leading-none">Equity Curve</h3>
                            <Tooltip content="Visual representation of your account balance growth over time." isDarkMode={isDarkMode}>
                                <svg 
                                    onClick={onInfoClick}
                                    xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                            </Tooltip>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1.5">Account Balance Growth</p>
                    </div>
                </div>

                {hoverIndex !== null && (
                    <div className="text-right animate-in fade-in zoom-in-95 duration-200">
                        <div className={`text-xl font-black font-mono leading-none ${equityData[hoverIndex] >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {equityData[hoverIndex] >= 0 ? '+' : ''}{currencySymbol}{equityData[hoverIndex].toLocaleString()}
                        </div>
                        <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Trade #{hoverIndex}</div>
                    </div>
                )}
            </div>
            <div className="flex-1 relative mt-4 ml-12 mb-8 mr-4">
                {equityData && equityData.length > 1 ? (
                    <div className="w-full h-full">
                        {/* Y-Axis Labels */}
                        <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between py-0 text-[10px] font-bold opacity-30 text-right w-10">
                            {yAxisLabels.map((val, i) => (
                                <div key={i}>{Math.round(val)}</div>
                            ))}
                        </div>

                        {/* X-Axis Labels */}
                        <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-0 text-[10px] font-bold opacity-30">
                            {xAxisLabels.map((val, i) => (
                                <div key={i}>{val}</div>
                            ))}
                        </div>

                        <svg 
                            viewBox="0 0 800 240" 
                            className="w-full h-full overflow-visible cursor-crosshair"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoverIndex(null)}
                        >
                            {/* ... existing SVG content ... */}
                            <defs>
                                <linearGradient id="curveGradientAnalytics" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            
                            {/* Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                                <React.Fragment key={i}>
                                    {/* Horizontal */}
                                    <line x1="0" y1={p * 240} x2="800" y2={p * 240} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                                    {/* Vertical */}
                                    <line x1={p * 800} y1="0" x2={p * 800} y2="240" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                                </React.Fragment>
                            ))}
                            
                            {/* Area Fill */}
                            <path 
                                d={`${generatePath(equityData, 800, 240)} L 800,240 L 0,240 Z`} 
                                fill="url(#curveGradientAnalytics)" 
                            />

                            {/* Main Path */}
                            <path 
                                d={generatePath(equityData, 800, 240)} 
                                fill="none" 
                                stroke="#6366f1" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                            />
                            
                            {/* Data Points (Dots) */}
                            {points.map((p, i) => {
                                // Determine if this trade was a win or loss relative to the previous point
                                const isWin = i === 0 ? p.val >= 0 : p.val > points[i-1].val;
                                const dotColor = isWin ? '#10b981' : '#ef4444'; // Emerald-500 or Red-500
                                
                                return (
                                    <circle 
                                        key={i} 
                                        cx={p.x} 
                                        cy={p.y} 
                                        r="4" 
                                        fill={dotColor} 
                                        stroke={isDarkMode ? "#18181b" : "white"} 
                                        strokeWidth="1.5"
                                        className="transition-all duration-200"
                                        style={{ 
                                            opacity: hoverIndex === null || hoverIndex === i ? 1 : 0.4,
                                            filter: (hoverIndex === i) ? `drop-shadow(0 0 4px ${dotColor})` : 'none'
                                        }}
                                    />
                                );
                            })}

                            {/* Hover Indicator */}
                            {hoverIndex !== null && (
                                <>
                                    <line x1={mousePos.x} y1="0" x2={mousePos.x} y2="240" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                                    <circle cx={mousePos.x} cy={hoverY} r="6" fill="#6366f1" stroke={isDarkMode ? "#18181b" : "white"} strokeWidth="2" />
                                </>
                            )}
                        </svg>

                        {/* Floating Tooltip */}
                        {hoverIndex !== null && (
                            <div 
                                className={`absolute z-50 pointer-events-none p-3 rounded-2xl border shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95 ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200'}`}
                                style={{ 
                                    left: `${(hoverIndex / (equityData.length - 1 || 1)) * 100}%`,
                                    top: `${(hoverY / 240) * 100}%`,
                                    transform: 'translate(-50%, calc(-100% - 15px))'
                                }}
                            >
                                <div className="space-y-1.5 min-w-[140px]">
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                                            {hoverIndex > 0 ? (trades[hoverIndex - 1]?.pair || 'Trade') : 'Start'}
                                        </span>
                                        <span className="text-[10px] font-black">#{hoverIndex}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Result</span>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-[10px] font-black ${hoverIndex > 0 ? (equityData[hoverIndex] - equityData[hoverIndex-1] >= 0 ? 'text-emerald-500' : 'text-rose-500') : ''}`}>
                                                {hoverIndex > 0 ? (
                                                    <>
                                                        {equityData[hoverIndex] - equityData[hoverIndex-1] >= 0 ? '+' : ''}
                                                        {currencySymbol}{Math.abs(equityData[hoverIndex] - equityData[hoverIndex-1]).toLocaleString()}
                                                    </>
                                                ) : 'Initial Deposit'}
                                            </span>
                                            {hoverIndex > 0 && equityData[hoverIndex-1] !== 0 && (
                                                <span className={`text-[8px] font-bold ${equityData[hoverIndex] - equityData[hoverIndex-1] >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                                    {equityData[hoverIndex] - equityData[hoverIndex-1] >= 0 ? '+' : ''}
                                                    {((equityData[hoverIndex] - equityData[hoverIndex-1]) / equityData[hoverIndex-1] * 100).toFixed(2)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Arrow */}
                                <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200'}`} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/5 flex items-center justify-center text-indigo-500/20">
                            <Activity size={48} strokeWidth={1} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-black uppercase tracking-widest opacity-40">Insufficient Data</p>
                            <p className="text-[10px] font-medium opacity-30 max-w-[200px] leading-relaxed">
                                Start journaling your trades to visualize your account growth and equity curve here.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
