
import React, { useMemo, useState } from 'react';
import { Trade } from '../../types';
import { Clock, Calendar, TrendingUp, Info } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { getSASTDateTime } from '../../lib/timeUtils';

interface TimeAnalysisProps {
    trades: Trade[];
    isDarkMode: boolean;
    currencySymbol: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const TimeAnalysis: React.FC<TimeAnalysisProps> = ({ trades, isDarkMode, currencySymbol }) => {
    const [metric, setMetric] = useState<'pnl' | 'winrate' | 'count'>('pnl');
    const [hoveredCell, setHoveredCell] = useState<{ day: number, hour: number, value: number, count: number, winRate: number } | null>(null);

    const data = useMemo(() => {
        const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ pnl: 0, wins: 0, count: 0 })));

        trades.forEach(t => {
            // Parse as local-agnostic date/time from the trade's recorded values
            // We assume these were saved in SAST or the user's intended local time
            // To force SAST day/hour extraction regardless of viewer locale:
            const dateStr = `${t.date}T${t.time || '00:00:00'}`;
            const date = new Date(dateStr);
            
            const sast = getSASTDateTime(date);
            const day = sast.dayIndex;
            const hour = sast.hour;

            // Validate indices
            if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
                grid[day][hour].pnl += t.pnl;
                grid[day][hour].count += 1;
                if (t.result === 'Win') grid[day][hour].wins += 1;
            }
        });

        return grid;
    }, [trades]);

    // Calculate min/max for color scaling
    const stats = useMemo(() => {
        let min = 0, max = 0;
        const flatValues: number[] = [];

        data.forEach(row => row.forEach(cell => {
            if (cell.count === 0) return;
            let val = 0;
            if (metric === 'pnl') val = cell.pnl;
            else if (metric === 'winrate') val = (cell.wins / cell.count) * 100;
            else if (metric === 'count') val = cell.count;
            flatValues.push(val);
        }));

        if (flatValues.length > 0) {
            min = Math.min(...flatValues);
            max = Math.max(...flatValues);
        }
        return { min, max };
    }, [data, metric]);

    const getCellColor = (day: number, hour: number) => {
        const cell = data[day][hour];
        if (cell.count === 0) return isDarkMode ? 'bg-zinc-800/30' : 'bg-slate-50';

        let val = 0;
        if (metric === 'pnl') val = cell.pnl;
        else if (metric === 'winrate') val = (cell.wins / cell.count) * 100;
        else if (metric === 'count') val = cell.count;

        if (metric === 'count') {
            const intensity = stats.max > 0 ? (val / stats.max) : 0;
            return `bg-indigo-500/${Math.max(10, Math.round(intensity * 100))}`;
        }

        if (metric === 'winrate') {
            // 0-40 red, 40-60 yellow/gray, 60-100 green
            if (val >= 60) {
                const intensity = Math.min(100, (val - 50) * 2); 
                return `bg-emerald-500/${Math.round(intensity)}`;
            } else if (val <= 40) {
                const intensity = Math.min(100, (50 - val) * 2);
                return `bg-rose-500/${Math.round(intensity)}`;
            } else {
                return isDarkMode ? 'bg-zinc-600/30' : 'bg-slate-200';
            }
        }

        // PnL
        if (val > 0) {
            const intensity = stats.max > 0 ? (val / stats.max) : 0;
            return `bg-emerald-500/${Math.max(20, Math.round(intensity * 90))}`;
        } else if (val < 0) {
            const intensity = stats.min < 0 ? (val / stats.min) : 0;
            return `bg-rose-500/${Math.max(20, Math.round(intensity * 90))}`;
        }
        return isDarkMode ? 'bg-zinc-800/50' : 'bg-slate-100';
    };

    return (
        <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <Calendar size={20} className="text-indigo-500" />
                        Time & Day Heatmap
                    </h3>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                        Identify your "Golden Hours" by analyzing performance across days and times.
                    </p>
                </div>

                <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                    {(['pnl', 'winrate', 'count'] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setMetric(m)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                metric === m 
                                ? (isDarkMode ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-black shadow-sm') 
                                : 'opacity-50 hover:opacity-100'
                            }`}
                        >
                            {m === 'pnl' ? 'Net P&L' : m === 'winrate' ? 'Win Rate' : 'Volume'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto pb-4 pt-24">
                <div className="min-w-[800px]">
                    {/* Header Row (Hours) */}
                    <div className="flex mb-2">
                        <div className="w-16 shrink-0" /> {/* Y-Axis Label Placeholder */}
                        {HOURS.map(h => (
                            <div key={h} className="flex-1 text-[10px] text-center font-mono opacity-40">
                                {h}
                            </div>
                        ))}
                    </div>

                    {/* Grid Rows */}
                    {DAYS.map((dayName, dayIndex) => (
                        <div 
                            key={dayName} 
                            className={`flex items-center mb-1 h-10 relative ${hoveredCell?.day === dayIndex ? 'z-30' : 'z-0'}`}
                        >
                            {/* Y-Axis Label */}
                            <div className="w-16 shrink-0 text-xs font-bold opacity-60 flex items-center gap-2">
                                {dayName}
                            </div>

                            {/* Cells */}
                            {HOURS.map(hour => {
                                const cell = data[dayIndex][hour];
                                // Handle tooltip horizontal clipping for edges
                                const tooltipPosClass = hour < 4 ? 'left-0 translate-x-0' : 
                                                      hour > 20 ? 'right-0 translate-x-0 left-auto' : 
                                                      'left-1/2 -translate-x-1/2';
                                
                                // Show tooltip below for Sunday (first row) to avoid top clipping
                                const isSunday = dayIndex === 0;
                                const verticalPosClass = isSunday ? 'top-full mt-3' : 'bottom-full mb-3';

                                return (
                                    <div
                                        key={hour}
                                        className={`flex-1 h-full mx-[1px] rounded-sm transition-all duration-200 relative group ${getCellColor(dayIndex, hour)} hover:brightness-125 hover:scale-110 hover:z-50 cursor-pointer`}
                                        onMouseEnter={() => setHoveredCell({ 
                                            day: dayIndex, 
                                            hour, 
                                            value: metric === 'pnl' ? cell.pnl : metric === 'winrate' ? (cell.count > 0 ? (cell.wins/cell.count)*100 : 0) : cell.count,
                                            count: cell.count,
                                            winRate: cell.count > 0 ? (cell.wins / cell.count) * 100 : 0
                                        })}
                                        onMouseLeave={() => setHoveredCell(null)}
                                    >
                                        {hoveredCell?.day === dayIndex && hoveredCell?.hour === hour && (
                                            <div className={`absolute ${verticalPosClass} ${tooltipPosClass} px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl z-[100] min-w-[150px] pointer-events-none animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#09090b]/95 border-zinc-700 shadow-black/50' : 'bg-white/95 border-slate-200 shadow-slate-200'}`}>
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                                                    {DAYS[dayIndex]} • {hour}:00
                                                </div>
                                                <div className={`text-xl font-black mb-1 ${cell.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {cell.pnl >= 0 ? '+' : ''}{currencySymbol}{cell.pnl.toLocaleString()}
                                                </div>
                                                <div className={`flex justify-between items-center text-[10px] font-bold mt-2 border-t pt-2 ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                                                    <span className="opacity-60">{cell.count} Trades</span>
                                                    <span className={cell.wins/cell.count >= 0.5 ? 'text-emerald-500' : 'text-rose-500'}>
                                                        {((cell.wins/cell.count)*100).toFixed(0)}% WR
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex justify-end gap-6 mt-4 opacity-50 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500"></div> Positive
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-rose-500"></div> Negative
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-zinc-500/20"></div> No Data
                </div>
            </div>
        </div>
    );
};
