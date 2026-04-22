import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, TrendingUp, TrendingDown, Target, Zap, Waves } from 'lucide-react';
import { OptimizationResult } from '../../types';

interface OptimizationHeatmapProps {
    isDarkMode: boolean;
    data: OptimizationResult[];
    paramXName: string;
    paramYName: string;
    metric: 'equity' | 'drawdown' | 'winrate' | 'profitfactor';
    currencySymbol?: string;
}

export const OptimizationHeatmap: React.FC<OptimizationHeatmapProps> = ({ 
    isDarkMode, data, paramXName, paramYName, metric, currencySymbol = '$' 
}) => {
    const [hoveredCell, setHoveredCell] = useState<OptimizationResult | null>(null);

    // Get unique X and Y values for the axes
    const xValues = useMemo(() => Array.from(new Set(data.map(d => d.paramXValue))).sort((a, b) => a - b), [data]);
    const yValues = useMemo(() => Array.from(new Set(data.map(d => d.paramYValue))).sort((a, b) => a - b), [data]);

    // Metric mapping with display names and units
    const metricConfig = {
        equity: { label: 'Final Equity', unit: currencySymbol, highGood: true },
        drawdown: { label: 'Max Drawdown', unit: '%', highGood: false },
        winrate: { label: 'Win Rate', unit: '%', highGood: true },
        profitfactor: { label: 'Profit Factor', unit: '', highGood: true }
    };

    const currentMetric = metricConfig[metric];

    // Find min and max of current metric for color scaling
    const { minVal, maxVal } = useMemo(() => {
        const values = data.map(d => Number(d[metric]));
        return {
            minVal: Math.min(...values),
            maxVal: Math.max(...values)
        };
    }, [data, metric]);

    // Color scaling function
    const getCellColor = (value: number) => {
        if (maxVal === minVal) return isDarkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.5)';
        
        // Normalize value between 0 and 1
        const normalized = (value - minVal) / (maxVal - minVal);
        const intensity = currentMetric.highGood ? normalized : (1 - normalized);

        // Professional Navy/Teal/Yellow scale similar to image
        if (isDarkMode) {
            return `rgba(59, 130, 246, ${0.1 + intensity * 0.8})`; // Blue scale
        } else {
            return `rgba(37, 99, 235, ${0.1 + intensity * 0.8})`; // Deeper blue for light mode
        }
    };

    return (
        <div className={`w-full h-full flex flex-col p-6 rounded-[32px] border transition-all duration-500 overflow-hidden ${
            isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-xl'
        }`}>
            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className={`p-2 rounded-xl scale-90 ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <Zap size={20} />
                        </div>
                        <h3 className="text-xl font-black tracking-tight uppercase">Strategy Robustness Matrix</h3>
                    </div>
                    <p className={`text-[10px] uppercase font-black tracking-[0.2em] opacity-40 pl-11`}>
                        {paramXName} vs {paramYName} • {currentMetric.label} Optimization
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Best Potential</div>
                        <div className={`text-sm font-mono font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {currentMetric.highGood ? maxVal.toLocaleString() : minVal.toLocaleString()}{currentMetric.unit}
                        </div>
                    </div>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="flex-1 relative flex items-center justify-center p-4">
                <div 
                    className="grid gap-px" 
                    style={{ 
                        gridTemplateColumns: `repeat(${xValues.length}, 1fr)`,
                        width: '100%',
                        maxWidth: '800px',
                        aspectRatio: '16/10'
                    }}
                >
                    {/* Render Cells */}
                    {yValues.slice().reverse().map(y => (
                        xValues.map(x => {
                            const cell = data.find(d => d.paramXValue === x && d.paramYValue === y);
                            const val = cell ? Number(cell[metric]) : 0;
                            return (
                                <motion.div
                                    key={`${x}-${y}`}
                                    className="relative cursor-pointer group"
                                    style={{ backgroundColor: getCellColor(val) }}
                                    whileHover={{ scale: 1.1, zIndex: 10, borderRadius: '4px' }}
                                    onHoverStart={() => setHoveredCell(cell || null)}
                                    onHoverEnd={() => setHoveredCell(null)}
                                >
                                    {/* Tooltip for cell */}
                                    <AnimatePresence>
                                        {hoveredCell === cell && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                animate={{ opacity: 1, y: -10, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-2xl z-[100] min-w-[160px] pointer-events-none shadow-2xl backdrop-blur-xl border ${
                                                    isDarkMode ? 'bg-zinc-900/90 border-white/10' : 'bg-white/90 border-black/5'
                                                }`}
                                            >
                                                <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-2 border-b border-white/5 pb-1">Cell Parameters</div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                                                    <div>
                                                        <div className="text-[7px] uppercase font-bold opacity-50">{paramXName}</div>
                                                        <div className="text-xs font-mono font-bold">{x}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[7px] uppercase font-bold opacity-50">{paramYName}</div>
                                                        <div className="text-xs font-mono font-bold">{y}</div>
                                                    </div>
                                                </div>
                                                <div className="p-2 rounded-xl bg-black/20">
                                                    <div className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">{currentMetric.label}</div>
                                                    <div className="text-lg font-mono font-black">{val.toLocaleString()}{currentMetric.unit}</div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    ))}
                </div>

                {/* Axes Labels */}
                <div className="absolute -left-10 top-1/2 -rotate-90 origin-center text-[10px] font-black uppercase tracking-widest opacity-30 pointer-events-none">
                    {paramYName}
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest opacity-30 pointer-events-none">
                    {paramXName}
                </div>
            </div>

            {/* Gradient Legend Footer */}
            <div className="mt-12 flex items-center justify-between border-t border-zinc-500/5 pt-6">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40">Value Gradient</div>
                        <div className="flex items-center gap-1">
                            <span className="text-[9px] font-mono opacity-60">{minVal.toLocaleString()}</span>
                            <div className={`w-40 h-2 rounded-full overflow-hidden border border-white/5 ${
                                isDarkMode ? 'bg-gradient-to-r from-blue-500/10 to-blue-500' : 'bg-gradient-to-r from-blue-50/20 to-blue-600'
                            }`} />
                            <span className="text-[9px] font-mono opacity-60">{maxVal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-30">
                    <Info size={12} />
                    <span className="text-[10px] font-bold">Optimization density: {(data.length / (xValues.length * yValues.length) * 100).toFixed(0)}%</span>
                </div>
            </div>
        </div>
    );
};
