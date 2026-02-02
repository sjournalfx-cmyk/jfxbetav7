import React, { useMemo, useState, useRef } from 'react';
import { Trade } from '../../types';
import { Clock, Calendar, BarChart2, TrendingUp, Sun, Moon, Sunrise, Sunset, Info, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

interface PerformanceBySessionProps {
    trades: Trade[];
    isDarkMode: boolean;
    currencySymbol: string;
}

type ViewMode = 'market' | 'hourly' | 'daily';

export const PerformanceBySession: React.FC<PerformanceBySessionProps> = ({ trades, isDarkMode, currencySymbol }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('market');
    const [hoveredBar, setHoveredBar] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Helpers ---
    const getSessionFromTime = (timeStr: string) => {
        if (!timeStr) return 'Unknown';
        const hour = parseInt(timeStr.split(':')[0], 10);
        
        if (hour >= 0 && hour < 9) return 'Asian';
        if (hour >= 9 && hour < 14) return 'London';
        if (hour >= 14 && hour < 18) return 'Overlap'; 
        if (hour >= 18) return 'New York';
        return 'Unknown';
    };

    const getSessionIcon = (session: string) => {
        switch (session) {
            case 'Asian': return <Sunrise size={18} className="text-amber-500" />;
            case 'London': return <Sun size={18} className="text-blue-500" />;
            case 'Overlap': return <Activity size={18} className="text-purple-500" />; 
            case 'New York': return <Sunset size={18} className="text-orange-500" />;
            default: return <Clock size={18} className="text-gray-500" />;
        }
    };

    // --- Data Processing ---

    // 1. Market Session Data
    const marketSessionData = useMemo(() => {
        const stats: Record<string, { pnl: number, wins: number, count: number }> = {
            'Asian': { pnl: 0, wins: 0, count: 0 },
            'London': { pnl: 0, wins: 0, count: 0 },
            'Overlap': { pnl: 0, wins: 0, count: 0 },
            'New York': { pnl: 0, wins: 0, count: 0 },
        };

        trades.forEach(trade => {
            const session = trade.session && trade.session !== 'Session' ? trade.session : getSessionFromTime(trade.time);
            let key = 'Unknown';
            if (session.includes('Asia') || session.includes('Tokyo') || session.includes('Sydney')) key = 'Asian';
            else if (session.includes('London') && !session.includes('York')) key = 'London';
            else if (session.includes('Overlap') || (session.includes('London') && session.includes('York'))) key = 'Overlap';
            else if (session.includes('York')) key = 'New York';
            else key = getSessionFromTime(trade.time);

            if (!stats[key]) stats[key] = { pnl: 0, wins: 0, count: 0 };
            
            stats[key].pnl += trade.pnl;
            stats[key].count += 1;
            if (trade.result === 'Win') stats[key].wins += 1;
        });

        const sorted = Object.entries(stats)
            .filter(([_, data]) => data.count > 0)
            .map(([name, data]) => ({
                name,
                pnl: data.pnl,
                winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
                count: data.count
            }));

        let cumulative = 0;
        return sorted.map(d => {
            cumulative += d.pnl;
            return { ...d, cumulativePnl: cumulative };
        });
    }, [trades]);

    // 2. Hourly Data
    const hourlyData = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const stats: Record<number, { pnl: number, count: number, wins: number }> = {};
        
        hours.forEach(h => stats[h] = { pnl: 0, count: 0, wins: 0 });

        trades.forEach(trade => {
            if (!trade.time) return;
            const hour = parseInt(trade.time.split(':')[0], 10);
            if (!isNaN(hour) && stats[hour]) {
                stats[hour].pnl += trade.pnl;
                stats[hour].count += 1;
                if (trade.result === 'Win') stats[hour].wins += 1;
            }
        });

        let cumulative = 0;
        return hours.map(h => {
            cumulative += stats[h].pnl;
            return {
                hour: h,
                label: `${h}:00`,
                pnl: stats[h].pnl,
                count: stats[h].count,
                winRate: stats[h].count > 0 ? (stats[h].wins / stats[h].count) * 100 : 0,
                cumulativePnl: cumulative
            };
        });
    }, [trades]);

    // 3. Daily Log Data (Original)
    const dailyData = useMemo(() => {
        const sessionsMap = new Map<string, { pnl: number, wins: number, count: number }>();

        trades.forEach(trade => {
            const sessionKey = trade.date;
            if (!sessionsMap.has(sessionKey)) {
                sessionsMap.set(sessionKey, { pnl: 0, wins: 0, count: 0 });
            }
            const session = sessionsMap.get(sessionKey)!;
            session.pnl += trade.pnl;
            session.count += 1;
            if (trade.result === 'Win') {
                session.wins += 1;
            }
        });

        return Array.from(sessionsMap.entries())
            .map(([date, session]) => ({
                date,
                totalPnl: session.pnl,
                winRate: session.count > 0 ? (session.wins / session.count) * 100 : 0,
                totalTrades: session.count,
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [trades]);

    // --- Chart Helpers ---
    const renderBarChart = (data: { label?: string, name?: string, pnl: number, cumulativePnl: number }[], isHourly = false) => {
        if (data.length === 0) return <div className="h-full flex items-center justify-center opacity-40 text-sm">No Data</div>;

        const maxPnl = Math.max(...data.map(d => Math.abs(d.pnl)), 100);
        const maxCumulative = Math.max(...data.map(d => Math.abs(d.cumulativePnl)), 100);
        
        const handleMouseMove = (e: React.MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        };

        const generateLinePath = () => {
            if (data.length < 2) return "";
            const width = 100 / data.length;
            const points = data.map((d, i) => {
                const x = (i * width) + (width / 2);
                const y = 50 - (d.cumulativePnl / maxCumulative) * 40; // Scale to fit comfortably
                return `${x}% ${y}%`;
            });
            return `polygon(${points.join(', ')})`;
        };

        // For SVG Path
        const svgPoints = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 50 - (d.cumulativePnl / maxCumulative) * 40;
            return `${x},${y}`;
        }).join(' L ');

        return (
            <div 
                ref={containerRef}
                onMouseMove={handleMouseMove}
                className="flex items-end justify-between h-full gap-2 pt-8 pb-10 relative min-w-full group/chart" 
                style={{ width: isHourly ? `${Math.max(100, data.length * 40)}px` : '100%' }}
            >
                {/* Zero Line */}
                <div className="absolute left-0 right-0 h-px bg-current opacity-10 top-1/2 -translate-y-4" />
                
                {data.map((d, i) => {
                    const val = d.pnl;
                    const percent = Math.min((Math.abs(val) / maxPnl) * 50, 50);
                    const isPositive = val >= 0;
                    const label = d.name || d.label;
                    const isHovered = hoveredBar === label;

                    return (
                        <div 
                            key={i} 
                            className="flex-1 flex flex-col items-center h-full relative group cursor-pointer z-20"
                            onMouseEnter={() => setHoveredBar(label || null)}
                            onMouseLeave={() => setHoveredBar(null)}
                        >
                            {/* Bar Wrapper */}
                            <div className="absolute inset-0 bottom-8 flex flex-col justify-center">
                                <div className="h-full relative w-full flex justify-center">
                                    <div 
                                        className={`absolute w-full max-w-[16px] md:max-w-[24px] rounded-sm transition-all duration-300 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'} ${isHovered ? 'brightness-110 shadow-lg scale-x-110 ring-2 ring-white/20' : 'opacity-80'}`}
                                        style={{
                                            height: `${Math.max(2, (Math.abs(val) / maxPnl) * 45)}%`, 
                                            top: isPositive ? 'auto' : '50%',
                                            bottom: isPositive ? '50%' : 'auto',
                                        }}
                                    />
                                </div>
                            </div>
                            
                            {/* Label */}
                            <span className={`absolute bottom-0 text-[8px] md:text-[9px] font-bold uppercase tracking-tighter transition-all whitespace-nowrap ${isHovered ? 'text-indigo-500 scale-110 opacity-100' : 'opacity-40'} ${isHourly ? '-rotate-45 translate-y-1' : ''}`}>
                                {label}
                            </span>
                        </div>
                    );
                })}

                {/* Mouse-Tracking Tooltip */}
                {hoveredBar && (
                    <div 
                        className={`fixed pointer-events-none z-[100] p-3 rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-slate-200'}`}
                        style={{ 
                            left: mousePos.x + (containerRef.current?.getBoundingClientRect().left || 0) + 20, 
                            top: mousePos.y + (containerRef.current?.getBoundingClientRect().top || 0) - 60 
                        }}
                    >
                        {(() => {
                            const d = data.find(x => (x.name || x.label) === hoveredBar);
                            if (!d) return null;
                            return (
                                <div className="space-y-1.5 min-w-[120px]">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 pb-1 border-b border-white/5">{hoveredBar} Performance</div>
                                    <div className="flex justify-between items-center gap-4 pt-1">
                                        <span className="text-[9px] font-bold opacity-60 uppercase">Session P/L</span>
                                        <span className={`text-xs font-black ${d.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {d.pnl >= 0 ? '+' : ''}{currencySymbol}{d.pnl.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-[9px] font-bold opacity-60 uppercase">Cumulative</span>
                                        <span className={`text-xs font-black ${d.cumulativePnl >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                                            {d.cumulativePnl >= 0 ? '+' : ''}{currencySymbol}{d.cumulativePnl.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`p-6 md:p-8 rounded-[32px] border transition-colors duration-500 ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            {/* Header & Controls */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                <div>
                    <h3 className="text-lg md:text-xl font-bold tracking-tight flex items-center gap-2">
                        <Clock size={20} className="text-indigo-500 shrink-0" />
                        Time Analysis
                    </h3>
                    <p className={`text-xs md:text-sm mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                        Analyze performance by session, hour, and daily logs.
                    </p>
                </div>
                
                <div className={`flex p-1 rounded-xl border w-fit overflow-x-auto no-scrollbar ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'}`}>
                    <button
                        onClick={() => setViewMode('market')}
                        className={`px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${viewMode === 'market' ? (isDarkMode ? 'bg-zinc-800 text-white shadow' : 'bg-white text-black shadow') : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Sessions
                    </button>
                    <button
                        onClick={() => setViewMode('hourly')}
                        className={`px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${viewMode === 'hourly' ? (isDarkMode ? 'bg-zinc-800 text-white shadow' : 'bg-white text-black shadow') : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Hourly
                    </button>
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${viewMode === 'daily' ? (isDarkMode ? 'bg-zinc-800 text-white shadow' : 'bg-white text-black shadow') : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Daily Log
                    </button>
                </div>
            </div>

            {/* Views */}
            {viewMode === 'market' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Chart */}
                        <div className={`h-[250px] md:h-[300px] w-full p-4 rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                            {renderBarChart(marketSessionData)}
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-3">
                            {marketSessionData.sort((a, b) => b.pnl - a.pnl).map((session) => (
                                <div key={session.name} className={`p-4 rounded-2xl border flex items-center justify-between group hover:translate-x-1 transition-transform ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                        <div className={`p-2.5 md:p-3 rounded-xl shrink-0 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                                            {getSessionIcon(session.name)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="font-bold text-sm truncate">{session.name}</h4>
                                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-wider opacity-50 mt-1 whitespace-nowrap">
                                                <span>{session.count} Trades</span>
                                                <span className="opacity-30">•</span>
                                                <span>{session.winRate.toFixed(0)}% WR</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right pl-4 shrink-0">
                                        <div className={`text-base md:text-lg font-black ${session.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {session.pnl >= 0 ? '+' : ''}{currencySymbol}{session.pnl.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {marketSessionData.length === 0 && (
                                <div className="text-center opacity-40 py-10 text-sm">No session data available.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'hourly' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className={`h-[300px] w-full p-4 rounded-2xl border overflow-x-auto custom-scrollbar ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                        {renderBarChart(hourlyData.filter(h => h.count > 0 || Math.abs(h.pnl) > 0), true)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         {hourlyData.filter(h => h.count > 0).sort((a,b) => b.pnl - a.pnl).slice(0, 4).map((h, i) => (
                             <div key={i} className={`p-4 rounded-xl border transition-all duration-300 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'} ${i === 0 ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : i === 3 ? 'border-rose-500/20 bg-rose-500/[0.02]' : ''}`}>
                                 <div className="text-[9px] uppercase font-bold opacity-50 mb-1 truncate flex items-center gap-1">
                                     {i === 0 ? <TrendingUp size={10} className="text-emerald-500" /> : <Clock size={10} />}
                                     {i === 0 ? 'Best Hour' : i === 3 ? 'Worst Hour' : 'Top Performer'}
                                 </div>
                                 <div className="text-lg md:text-xl font-black">{h.label}</div>
                                 <div className={`text-xs md:text-sm font-bold ${h.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                     {h.pnl >= 0 ? '+' : ''}{currencySymbol}{h.pnl.toLocaleString()}
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>
            )}

            {viewMode === 'daily' && (
                <div className="overflow-x-auto no-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className={`text-[10px] font-bold uppercase tracking-widest opacity-40 ${isDarkMode ? 'bg-zinc-900/50 text-zinc-500' : 'bg-slate-50 text-slate-400'}`}>
                                <th className="px-4 py-4">Date</th>
                                <th className="px-4 py-4 text-right">P&L</th>
                                <th className="px-4 py-4 text-right">Win Rate</th>
                                <th className="px-4 py-4 text-right">Trades</th>
                                <th className="px-4 py-4 text-right">Activity</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                            {dailyData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-sm opacity-50 font-medium">No daily log data.</td>
                                </tr>
                            ) : (
                                dailyData.map((session, index) => (
                                    <tr key={index} className={`${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'} transition-colors group`}>
                                        <td className="px-4 py-4 text-sm font-medium font-mono opacity-80">{session.date}</td>
                                        <td className={`px-4 py-4 text-right text-sm font-black ${session.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {session.totalPnl >= 0 ? '+' : ''}{currencySymbol}{session.totalPnl.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${session.winRate >= 50 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    {session.winRate.toFixed(0)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-bold opacity-70">
                                            {session.totalTrades}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-1 h-5 items-end">
                                                {Array.from({ length: Math.min(6, session.totalTrades) }).map((_, i) => (
                                                    <div key={i} className={`w-1 rounded-full transition-all duration-500 ${isDarkMode ? 'bg-zinc-700 group-hover:bg-indigo-500' : 'bg-slate-300 group-hover:bg-indigo-400'}`} style={{ height: `${30 + Math.random() * 70}%` }} />
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
