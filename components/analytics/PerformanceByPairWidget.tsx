import React, { useMemo, useState } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';

interface PerformanceByPairWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    currencySymbol: string;
    onInfoClick?: () => void;
}

export const PerformanceByPairWidget: React.FC<PerformanceByPairWidgetProps> = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }) => {
    const [hoveredPair, setHoveredPair] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const pairData = useMemo(() => {
        const safeTrades = trades || [];
        const pairStats: Record<string, { profit: number; loss: number }> = {};

        safeTrades.forEach(trade => {
            if (!trade.pair) return;
            // Normalize pair name: remove special chars, uppercase
            const pair = trade.pair.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

            if (!pairStats[pair]) {
                pairStats[pair] = { profit: 0, loss: 0 };
            }
            if (trade.pnl > 0) {
                pairStats[pair].profit += trade.pnl;
            } else {
                pairStats[pair].loss += Math.abs(trade.pnl || 0);
            }
        });

        return Object.entries(pairStats)
            .map(([pair, stats]) => ({
                pair,
                profit: stats.profit,
                loss: stats.loss,
                net: stats.profit - stats.loss
            }))
            .sort((a, b) => b.net - a.net);
    }, [trades]);

    const allValues = pairData.flatMap(d => [d.profit, -d.loss]);
    const maxVal = allValues.length ? Math.max(...allValues, 100) : 100;
    const minVal = allValues.length ? Math.min(...allValues, -100) : -100;

    // Add 10% padding to range for visuals
    const range = (maxVal - minVal) * 1.1 || 1;

    // Calculate zero line position (percentage from top)
    const zeroY = ((maxVal) / range) * 100;

    const hoveredData = hoveredPair ? pairData.find(d => d.pair === hoveredPair) : null;

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`p-6 rounded-[24px] border flex flex-col min-h-[450px] relative h-full ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight">Performance by Pair</h3>
                    <Tooltip content="Detailed profit and loss breakdown for each individual trading pair." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                    </Tooltip>
                </div>
            </div>

            {pairData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center opacity-30 text-sm">No trade data available</div>
            ) : (
                <div className="flex-1 flex relative overflow-hidden">
                    {/* Fixed Y-Axis Labels */}
                    <div className={`w-14 flex flex-col justify-between text-[10px] font-mono opacity-40 py-4 h-full z-20 absolute left-0 top-0 bottom-4 border-r border-dashed ${isDarkMode ? 'bg-[#0d1117] border-white/5' : 'bg-white border-slate-200'}`}>
                        <span>{currencySymbol}{Math.round(maxVal)}</span>
                        <span>{currencySymbol}0</span>
                        <span>{currencySymbol}{Math.round(minVal)}</span>
                    </div>

                    {/* Scrollable Chart Area */}
                    <div className="flex-1 ml-14 overflow-x-auto custom-scrollbar relative">
                        <div
                            className="h-full relative pb-8 px-4"
                            style={{ width: `${Math.max(100, pairData.length * 80)}px`, minWidth: '100%' }} // Dynamic width
                        >
                            {/* Zero Line */}
                            <div
                                className="absolute left-0 right-0 border-t border-white/20 z-10"
                                style={{ top: `${zeroY}%` }}
                            />

                            {/* Bars Container */}
                            <div className="absolute inset-0 top-0 bottom-8 flex items-end justify-around px-2">
                                {pairData.map((d, i) => {
                                    const profitHeight = (d.profit / range) * 100;
                                    const lossHeight = (d.loss / range) * 100;
                                    const isHovered = hoveredPair === d.pair;

                                    return (
                                        <div
                                            key={i}
                                            className="relative h-full flex flex-col items-center justify-start w-16 group cursor-pointer"
                                            onMouseEnter={() => setHoveredPair(d.pair)}
                                            onMouseLeave={() => setHoveredPair(null)}
                                        >
                                            {/* Hover Background */}
                                            {isHovered && (
                                                <div className="absolute inset-y-0 -inset-x-1 bg-indigo-500/5 rounded-lg z-0 pointer-events-none" />
                                            )}

                                            <div className="relative w-full h-full z-10">
                                                {/* Profit Bar */}
                                                {d.profit > 0 && (
                                                    <div
                                                        className={`absolute left-1/2 -translate-x-1/2 w-4 bg-emerald-500 rounded-t-sm transition-all duration-300 ${isHovered ? 'w-6 brightness-110 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'opacity-90'}`}
                                                        style={{
                                                            height: `${profitHeight}%`,
                                                            bottom: `${100 - zeroY}%`,
                                                        }}
                                                    />
                                                )}

                                                {/* Loss Bar */}
                                                {d.loss > 0 && (
                                                    <div
                                                        className={`absolute left-1/2 -translate-x-1/2 w-4 bg-rose-500 rounded-b-sm transition-all duration-300 ${isHovered ? 'w-6 brightness-110 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'opacity-90'}`}
                                                        style={{
                                                            height: `${lossHeight}%`,
                                                            top: `${zeroY}%`,
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            {/* X-Axis Label */}
                                            <span className={`absolute bottom-[-24px] text-[9px] font-bold transition-all duration-300 whitespace-nowrap ${isHovered ? 'opacity-100 scale-110 text-indigo-500' : 'opacity-40'}`}>
                                                {d.pair}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Tooltip Overlay (Floating) */}
                    {hoveredData && (
                        <div 
                            className="absolute pointer-events-none z-50"
                            style={{ 
                                left: mousePos.x - 120, 
                                top: mousePos.y - 80
                            }}
                        >
                            <div className={`p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 min-w-[160px] ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                                <div className="font-bold text-sm mb-3 border-b border-white/10 pb-2">{hoveredData.pair}</div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="opacity-60">Profit</span>
                                        <span className="text-emerald-500 font-bold">+{currencySymbol}{hoveredData.profit.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="opacity-60">Loss</span>
                                        <span className="text-rose-500 font-bold">-{currencySymbol}{hoveredData.loss.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-white/10 mt-2">
                                        <span className="font-bold opacity-80">Net</span>
                                        <span className={`font-bold ${hoveredData.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {hoveredData.net >= 0 ? '+' : ''}{currencySymbol}{hoveredData.net.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
