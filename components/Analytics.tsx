import React, { useMemo, useState, useEffect } from 'react';
import { Trade, UserProfile } from '../types';
import {
    TrendingUp, PieChart, Info, ArrowUpRight, ArrowDownRight, Activity,
    Target, BarChart3, Award, AlertOctagon,
    ArrowLeftRight, GitCompare, MoreVertical, Star, Coins,
    LayoutDashboard, LineChart, ShieldAlert, X, HelpCircle, GripVertical,
    ArrowRightLeft, Crown, Flame, Snowflake, Lock, Clock, Sparkles
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableWidget } from './ui/SortableWidget';
import { Tooltip } from './ui/Tooltip';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Select } from './Select';
import { APP_CONSTANTS, PLAN_FEATURES } from '../lib/constants';

interface AnalyticsProps {
    isDarkMode: boolean;
    trades: Trade[];
    userProfile: UserProfile;
    onViewChange: (view: string) => void;
    eaSession?: any;
}

const BestTimeWidget = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string, onInfoClick?: () => void }) => {
    const [hoveredHour, setHoveredHour] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const hourlyData = useMemo(() => {
        const safeTrades = trades || [];
        const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, pnl: 0, count: 0 }));

        safeTrades.forEach(t => {
            const date = new Date(`${t.date}T${t.time || '00:00'}`);
            const hour = date.getHours();
            if (hours[hour]) {
                hours[hour].pnl += t.pnl;
                hours[hour].count += 1;
            }
        });

        return hours;
    }, [trades]);

    const maxPnl = Math.max(...hourlyData.map(d => Math.abs(d.pnl)), 10);
    const hoveredData = hoveredHour !== null ? hourlyData[hoveredHour] : null;

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[350px] relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight">Hourly Performance</h3>
                    <Tooltip content="Analyzes your trading performance based on the hour of the day to identify your most profitable sessions." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                    </Tooltip>
                </div>
                <Clock size={16} className="opacity-30" />
            </div>

            <div className="flex-1 flex items-end gap-1 relative">
                {/* Zero Line */}
                <div className="absolute left-0 right-0 h-px bg-zinc-500/20 z-0" style={{ top: '50%' }} />

                {hourlyData.map((d) => {
                    const heightPercent = (Math.abs(d.pnl) / maxPnl) * 45; // Max 45% height (leaving 10% gap)
                    const isPositive = d.pnl >= 0;
                    const isHovered = hoveredHour === d.hour;

                    return (
                        <div
                            key={d.hour}
                            className="flex-1 flex flex-col items-center justify-center h-full relative group cursor-pointer"
                            onMouseEnter={() => setHoveredHour(d.hour)}
                            onMouseLeave={() => setHoveredHour(null)}
                        >
                            {/* Bar */}
                            <div
                                className={`w-full max-w-[12px] rounded-sm transition-all duration-300 relative z-10 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'} ${isHovered ? 'brightness-110 scale-x-125 shadow-lg' : 'opacity-80'}`}
                                style={{
                                    height: `${Math.max(2, heightPercent)}%`,
                                    marginBottom: isPositive ? '50%' : 'auto',
                                    marginTop: isPositive ? 'auto' : '50%',
                                }}
                            />
                            
                            {/* Hour Label (Every 4 hours) */}
                            {d.hour % 4 === 0 && (
                                <span className="absolute bottom-0 text-[9px] font-mono opacity-30">{d.hour}h</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Tooltip Overlay (Floating) */}
            {hoveredData && (
                <div 
                    className="fixed pointer-events-none z-50"
                    style={{ 
                        left: mousePos.x + 20, 
                        top: mousePos.y - 40,
                        position: 'absolute'
                    }}
                >
                    <div className={`px-4 py-2 rounded-xl border backdrop-blur-md shadow-xl flex items-center gap-4 animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                        <div className="text-xs font-black uppercase tracking-wider opacity-60 w-12">{hoveredData.hour}:00</div>
                        <div className={`text-lg font-black ${hoveredData.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {hoveredData.pnl >= 0 ? '+' : ''}{currencySymbol}{hoveredData.pnl.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest border-l border-white/10 pl-4">
                            {hoveredData.count} Trades
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ComparisonView = ({ trades = [], isDarkMode, currencySymbol = '$' }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string }) => {
    const symbols = useMemo(() => {
        const uniqueSymbols = Array.from(new Set(trades.map(t => t.pair.toUpperCase()))).sort();
        return uniqueSymbols.map(s => ({ value: s, label: s }));
    }, [trades]);

    const dateRanges = [
        { value: 'all', label: 'All Time' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
        { value: 'this_year', label: 'This Year' }
    ];

    const [symbolA, setSymbolA] = useState(symbols[0]?.value || '');
    const [symbolB, setSymbolB] = useState(symbols[1]?.value || '');
    const [rangeA, setRangeA] = useState('all');
    const [rangeB, setRangeB] = useState('all');

    const filterByRange = (tradeList: Trade[], range: string) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        return tradeList.filter(t => {
            const tradeDate = new Date(t.date);
            if (range === 'this_month') return tradeDate >= startOfMonth;
            if (range === 'last_month') return tradeDate >= startOfLastMonth && tradeDate <= endOfLastMonth;
            if (range === 'this_year') return tradeDate >= startOfYear;
            return true;
        });
    };

    const getPreviousTrades = (tradeList: Trade[], range: string) => {
        const now = new Date();
        if (range === 'all') return [];

        if (range === 'this_month') {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            return tradeList.filter(t => {
                const d = new Date(t.date);
                return d >= startOfLastMonth && d <= endOfLastMonth;
            });
        }

        if (range === 'last_month') {
            const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 0);
            return tradeList.filter(t => {
                const d = new Date(t.date);
                return d >= startOfPrevMonth && d <= endOfPrevMonth;
            });
        }

        if (range === 'this_year') {
            const startOfPrevYear = new Date(now.getFullYear() - 1, 0, 1);
            const endOfPrevYear = new Date(now.getFullYear() - 1, 11, 31);
            return tradeList.filter(t => {
                const d = new Date(t.date);
                return d >= startOfPrevYear && d <= endOfPrevYear;
            });
        }

        return [];
    };

    const tradesA = useMemo(() => {
        const filtered = trades.filter(t => t.pair.toUpperCase() === symbolA);
        return filterByRange(filtered, rangeA);
    }, [trades, symbolA, rangeA]);

    const tradesB = useMemo(() => {
        const filtered = trades.filter(t => t.pair.toUpperCase() === symbolB);
        return filterByRange(filtered, rangeB);
    }, [trades, symbolB, rangeB]);

    const prevTradesA = useMemo(() => {
        const filtered = trades.filter(t => t.pair.toUpperCase() === symbolA);
        return getPreviousTrades(filtered, rangeA);
    }, [trades, symbolA, rangeA]);

    const prevTradesB = useMemo(() => {
        const filtered = trades.filter(t => t.pair.toUpperCase() === symbolB);
        return getPreviousTrades(filtered, rangeB);
    }, [trades, symbolB, rangeB]);

    const getStats = (tradesList: Trade[]) => {
        const wins = tradesList.filter(t => t.result === 'Win');
        const losses = tradesList.filter(t => t.result === 'Loss');
        const total = tradesList.length || 1;
        const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
        const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
        const netProfit = grossProfit - grossLoss;
        const winRate = (wins.length / total) * 100;
        const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 9.9 : 0);

        return { netProfit, winRate, profitFactor, total: tradesList.length };
    };

    const statsA = getStats(tradesA);
    const statsB = getStats(tradesB);
    const prevStatsA = getStats(prevTradesA);
    const prevStatsB = getStats(prevTradesB);

    const getTrendData = (current: number, previous: number) => {
        if (previous === 0) return { direction: null, percent: null };
        const diff = current - previous;
        const percent = (diff / Math.abs(previous)) * 100;
        return {
            direction: diff >= 0 ? 'up' : 'down',
            percent: Math.abs(percent).toFixed(1)
        };
    };

    const trendA = getTrendData(statsA.netProfit, prevStatsA.netProfit);
    const trendB = getTrendData(statsB.netProfit, prevStatsB.netProfit);

    const getEquityData = (tradesList: Trade[]) => {
        let cumulative = 0;
        const data = [0];
        const sorted = [...tradesList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        sorted.forEach(t => {
            cumulative += t.pnl;
            data.push(cumulative);
        });
        return data;
    };

    const equityA = getEquityData(tradesA);
    const equityB = getEquityData(tradesB);

    const maxVal = Math.max(...equityA, ...equityB, 100);
    const minVal = Math.min(...equityA, ...equityB, -100);
    const range = maxVal - minVal || 1;

    const generatePath = (data: number[], width: number, height: number) => {
        if (!data || data.length < 2) return "";
        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - minVal) / range) * height;
            return `${x},${y}`;
        });
        return `M ${points.join(' L ')}`;
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Symbol A"
                        value={symbolA}
                        onChange={setSymbolA}
                        options={symbols}
                        isDarkMode={isDarkMode}
                        icon={Coins}
                    />
                    <Select
                        label="Period A"
                        value={rangeA}
                        onChange={setRangeA}
                        options={dateRanges}
                        isDarkMode={isDarkMode}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Symbol B"
                        value={symbolB}
                        onChange={setSymbolB}
                        options={symbols}
                        isDarkMode={isDarkMode}
                        icon={Coins}
                    />
                    <Select
                        label="Period B"
                        value={rangeB}
                        onChange={setRangeB}
                        options={dateRanges}
                        isDarkMode={isDarkMode}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    {
                        label: symbolA,
                        stats: statsA,
                        trend: trendA,
                        color: 'text-indigo-500',
                        bg: 'bg-indigo-500/10',
                        range: rangeA,
                        isWinner: {
                            netProfit: statsA.netProfit > statsB.netProfit,
                            winRate: statsA.winRate > statsB.winRate,
                            profitFactor: statsA.profitFactor > statsB.profitFactor,
                            total: statsA.total > statsB.total
                        }
                    },
                    {
                        label: symbolB,
                        stats: statsB,
                        trend: trendB,
                        color: 'text-amber-500',
                        bg: 'bg-amber-500/10',
                        range: rangeB,
                        isWinner: {
                            netProfit: statsB.netProfit > statsA.netProfit,
                            winRate: statsB.winRate > statsA.winRate,
                            profitFactor: statsB.profitFactor > statsA.profitFactor,
                            total: statsB.total > statsA.total
                        }
                    }
                ].map((panel, idx) => (
                    <div key={idx} className={`p-8 rounded-[32px] border relative overflow-hidden ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${panel.bg} ${panel.color}`}><BarChart3 size={20} /></div>
                                <div>
                                    <h3 className="text-xl font-bold">{panel.label || 'Select Symbol'}</h3>
                                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">{dateRanges.find(r => r.value === panel.range)?.label}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1 relative">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1">
                                    Net Profit
                                    {panel.isWinner.netProfit && <Crown size={10} className="text-amber-500" />}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className={`text-2xl font-black ${panel.stats.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {panel.stats.netProfit >= 0 ? '+' : ''}{currencySymbol}{panel.stats.netProfit.toLocaleString()}
                                    </div>
                                    {panel.trend.direction && (
                                        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${panel.trend.direction === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {panel.trend.direction === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                            {panel.trend.percent}%
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1 relative">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1">
                                    Win Rate
                                    {panel.isWinner.winRate && <Crown size={10} className="text-amber-500" />}
                                </span>
                                <div className="text-2xl font-black">{panel.stats.winRate.toFixed(1)}%</div>
                            </div>
                            <div className="space-y-1 relative">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1">
                                    Profit Factor
                                    {panel.isWinner.profitFactor && <Crown size={10} className="text-amber-500" />}
                                </span>
                                <div className="text-2xl font-black">{panel.stats.profitFactor}</div>
                            </div>
                            <div className="space-y-1 relative">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1">
                                    Total Trades
                                    {panel.isWinner.total && <Crown size={10} className="text-amber-500" />}
                                </span>
                                <div className="text-2xl font-black">{panel.stats.total}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold tracking-tight">Comparative Equity Curve</h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{symbolA}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{symbolB}</span>
                        </div>
                    </div>
                </div>
                <div className="h-[300px] w-full relative">
                    <svg viewBox="0 0 800 300" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                            <line key={i} x1="0" y1={p * 300} x2="800" y2={p * 300} stroke="currentColor" strokeOpacity="0.05" />
                        ))}
                        <path d={generatePath(equityA, 800, 300)} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg" />
                        <path d={generatePath(equityB, 800, 300)} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

const ExecutionPerformanceTable = ({ trades = [], isDarkMode, currencySymbol = '$', initialBalance = 0 }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string, initialBalance: number }) => {
    const stripHtml = (html: string) => {
        if (!html) return "All Rules";
        const text = html.replace(/<[^>]*>?/gm, '').trim();
        return text || "All Rules";
    };

    const getCommentColor = (text: string) => {
        if (text.toLowerCase() === 'all rules') return 'text-emerald-500';
        return '';
    };

    const sortedTrades = useMemo(() => {
        const safeTrades = trades || [];
        return [...safeTrades].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
            const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
            return dateB - dateA;
        }).slice(0, 15);
    }, [trades]);

    return (
        <div className={`rounded-[24px] overflow-hidden border ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className={`text-[10px] font-bold uppercase tracking-widest opacity-40 ${isDarkMode ? 'bg-zinc-900/50 text-zinc-500' : 'bg-slate-50 text-slate-400'}`}>
                            <th className="px-6 py-5 font-bold">Tiltmeter</th>
                            <th className="px-6 py-5 font-bold">Entry Comment</th>
                            <th className="px-6 py-5 font-bold">Exit Comment</th>
                            <th className="px-6 py-5 text-right font-bold">Return (%)</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                        {sortedTrades.map((trade) => {
                            const returnPercent = initialBalance > 0 ? (trade.pnl / initialBalance) * 100 : 0;
                            const isWin = trade.pnl > 0;
                            const absReturn = Math.abs(returnPercent);
                            const barWidth = Math.min(40, absReturn * 2);

                            const entryComment = stripHtml(trade.notes || "");
                            const exitComment = stripHtml(trade.exitComment || "");

                            return (
                                <tr key={trade.id} className={`group transition-colors ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="relative flex items-center h-4 w-20 justify-center">
                                                <div className={`absolute w-1.5 h-4 rounded-full z-10 ${isDarkMode ? 'bg-zinc-700' : 'bg-slate-300'}`} />
                                                <div
                                                    className={`absolute h-1.5 rounded-full transition-all duration-700 ${isWin ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'}`}
                                                    style={{
                                                        width: `${barWidth}px`,
                                                        left: isWin ? '50%' : 'auto',
                                                        right: isWin ? 'auto' : '50%',
                                                        transform: isWin ? 'translateX(4px)' : 'translateX(-4px)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-xs font-bold ${getCommentColor(entryComment)}`}>
                                            {entryComment}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-xs font-bold ${getCommentColor(exitComment)}`}>
                                            {exitComment}
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-right text-xs font-mono font-black ${isWin ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {returnPercent.toFixed(2)}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MonthlyPerformanceWidget = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string, onInfoClick?: () => void }) => {
    const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const data = useMemo(() => {
        const safeTrades = trades || [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();

        return months.map((month, idx) => {
            const monthTrades = safeTrades.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === idx && d.getFullYear() === currentYear;
            }).sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

            const pnl = monthTrades.reduce((acc, t) => acc + t.pnl, 0);

            // Calculate Max Drawdown for the month
            let runningBalance = 0;
            let peakBalance = 0;
            let maxDrawdown = 0;

            monthTrades.forEach(t => {
                runningBalance += t.pnl;
                if (runningBalance > peakBalance) {
                    peakBalance = runningBalance;
                }
                const drawdown = runningBalance - peakBalance;
                if (drawdown < maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            });

            return { month, pnl, dd: maxDrawdown, hasTrades: monthTrades.length > 0 };
        }).filter(d => d.hasTrades || new Date().getMonth() >= months.indexOf(d.month));
    }, [trades]);

    const allPnl = data.map(d => d.pnl);
    const allDd = data.map(d => d.dd);
    const maxVal = Math.max(...allPnl, 100);
    const minVal = Math.min(...allDd, -100);
    const range = maxVal - minVal || 1;
    const zeroY = (maxVal / range) * 100;

    const hoveredData = data.find(d => d.month === hoveredMonth);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[400px] relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight">Monthly P&L vs Maximum Drawdown</h3>
                    <Tooltip content="Compares your net profit against the maximum equity drop for each month." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                    </Tooltip>
                </div>
                <MoreVertical size={16} className="opacity-30" />
            </div>

            <div className="flex-1 relative mt-4 px-10 pb-12">
                <div className="absolute inset-0 left-10 right-2 bottom-12 flex flex-col justify-between pointer-events-none">
                    {[0, 0.25, 0.5, 0.75, 1].map(i => (
                        <div key={i} className="w-full border-t border-dashed border-white/5 h-0" />
                    ))}
                </div>

                <div className="relative h-full flex items-end justify-between px-4">
                    <div className="absolute left-0 right-0 border-t border-white/20 z-10" style={{ top: `${zeroY}%` }} />

                    {data.map((d, i) => {
                        const pnlHeight = (Math.abs(d.pnl) / range) * 100;
                        const ddHeight = (Math.abs(d.dd) / range) * 100;
                        const isNegPnl = d.pnl < 0;
                        const isHovered = hoveredMonth === d.month;

                        return (
                            <div
                                key={i}
                                className="relative flex flex-col items-center flex-1 h-full group cursor-pointer"
                                onMouseEnter={() => setHoveredMonth(d.month)}
                                onMouseLeave={() => setHoveredMonth(null)}
                            >
                                {d.hasTrades && (
                                    <>
                                        <div
                                            className={`absolute w-6 rounded-t-lg transition-all duration-300 ${isNegPnl ? 'bg-rose-500' : 'bg-emerald-500'} ${isHovered ? 'w-8 brightness-110 shadow-lg' : ''}`}
                                            style={{
                                                height: `${pnlHeight}%`,
                                                bottom: isNegPnl ? `${100 - zeroY - pnlHeight}%` : `${100 - zeroY}%`,
                                                zIndex: 5
                                            }}
                                        />
                                        <div
                                            className={`absolute w-6 bg-amber-500 rounded-b-lg transition-all duration-300 ${isHovered ? 'w-8 opacity-80' : 'opacity-50'}`}
                                            style={{
                                                height: `${ddHeight}%`,
                                                top: `${zeroY}%`,
                                                zIndex: 4
                                            }}
                                        />
                                    </>
                                )}
                                <span className={`absolute top-full mt-4 text-[10px] font-bold transition-all duration-300 ${isHovered ? 'opacity-100 text-indigo-500 scale-110' : 'opacity-40'}`}>{d.month}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tooltip */}
            {hoveredData && hoveredData.hasTrades && (
                <div 
                    className="absolute pointer-events-none z-50"
                    style={{ 
                        left: mousePos.x + 20, 
                        top: mousePos.y - 40
                    }}
                >
                    <div className={`p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 min-w-[160px] ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                        <div className="font-bold text-sm mb-3 border-b border-white/10 pb-2">{hoveredData.month} Performance</div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="opacity-60">Net P&L</span>
                                <span className={`font-bold ${hoveredData.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {hoveredData.pnl >= 0 ? '+' : ''}{currencySymbol}{hoveredData.pnl.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-60">Max Drawdown</span>
                                <span className="text-amber-500 font-bold">-{currencySymbol}{Math.abs(hoveredData.dd).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-center gap-8 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Net P&L</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-sm opacity-50" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Max Drawdown</span>
                </div>
            </div>
        </div>
    );
};

const CurrencyStrengthMeter = ({ isDarkMode, trades = [], onInfoClick }: { isDarkMode: boolean, trades: Trade[], onInfoClick?: () => void }) => {
    const [hoveredCur, setHoveredCur] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const strengths = useMemo(() => {
        const safeTrades = trades || [];
        const scores: Record<string, number> = {};
        const currencies = new Set<string>();
        const commonQuotes = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD', 'USDT', 'BTC', 'ETH'];

        safeTrades.forEach(trade => {
            let base = '';
            let quote = '';

            let pair = trade.pair ? trade.pair.trim().toUpperCase() : '';
            if (!pair) return;

            // 1. Try separators first (Slash, hyphen, space)
            const separatorMatch = pair.match(/^([A-Z0-9]+)[\/\-\s]([A-Z0-9]+)$/);
            if (separatorMatch) {
                base = separatorMatch[1];
                quote = separatorMatch[2];
            } else {
                // 2. Clean pair for length-based or suffix logic
                const cleanPair = pair.replace(/[^A-Z0-9]/g, '');

                if (cleanPair.length === 6) {
                    // Standard Forex (EURUSD)
                    base = cleanPair.substring(0, 3);
                    quote = cleanPair.substring(3, 6);
                } else {
                    // 3. Try suffix matching for crypto/indices (e.g. BTCUSD, US30USD - rare but possible)
                    for (const q of commonQuotes) {
                        if (cleanPair.endsWith(q) && cleanPair.length > q.length) {
                            quote = q;
                            base = cleanPair.substring(0, cleanPair.length - q.length);
                            break;
                        }
                    }
                }
            }

            // If still no parse, skip
            if (!base || !quote) return;

            currencies.add(base);
            currencies.add(quote);

            if (!scores[base]) scores[base] = 0;
            if (!scores[quote]) scores[quote] = 0;

            const pnl = trade.pnl || 0;
            const direction = trade.direction?.toLowerCase() || '';

            if (direction === 'long' || direction === 'buy') {
                scores[base] += pnl;
                scores[quote] -= pnl;
            } else if (direction === 'short' || direction === 'sell') {
                scores[base] -= pnl;
                scores[quote] += pnl;
            }
        });

        const currencyList = Array.from(currencies);
        if (currencyList.length === 0) return [];

        const vals = Object.values(scores);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const range = max - min;

        return currencyList.map(cur => {
            const val = scores[cur];
            // Normalize to 0-10
            const strength = range === 0 ? 5 : ((val - min) / range) * 10;
            return { cur, val: strength, raw: val };
        }).sort((a, b) => b.val - a.val).slice(0, 8);
    }, [trades]);

    const hoveredData = strengths.find(s => s.cur === hoveredCur);

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[400px] relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold tracking-tight">Currency Strength</h3>
                        <Tooltip content="Measures the relative strength of currencies based on your trading P&L for each base and quote currency." isDarkMode={isDarkMode}>
                            <svg 
                                onClick={onInfoClick}
                                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                        </Tooltip>
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1">Relative Performance</p>
                </div>
                <MoreVertical size={16} className="opacity-30" />
            </div>

            {strengths.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center">
                    <Coins size={32} className="mb-3" />
                    <p className="text-sm">No currency data available</p>
                    <p className="text-xs mt-2 max-w-[200px]">Add trades with standard pairs (e.g. EURUSD) to see data.</p>
                </div>
            ) : (
                <div className="space-y-4 flex-1 justify-center flex flex-col">
                    {strengths.map((item) => (
                        <div
                            key={item.cur}
                            className="flex items-center gap-3 group cursor-pointer"
                            onMouseEnter={() => setHoveredCur(item.cur)}
                            onMouseLeave={() => setHoveredCur(null)}
                        >
                            <div className="w-12 flex flex-col items-center">
                                <span className={`text-xs font-black transition-colors ${hoveredCur === item.cur ? 'text-indigo-500' : ''}`}>{item.cur}</span>
                            </div>
                            <div className={`flex-1 h-2 rounded-full overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'} ${hoveredCur === item.cur ? 'h-3' : ''}`}>
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${item.val > 7 ? 'bg-emerald-500' :
                                        item.val > 4 ? 'bg-blue-500' :
                                            item.val > 2 ? 'bg-amber-500' : 'bg-rose-500'
                                        } ${hoveredCur === item.cur ? 'brightness-110 shadow-lg' : ''}`}
                                    style={{ width: `${Math.max(5, item.val * 10)}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-mono font-bold opacity-50 w-8 text-right">
                                {item.val.toFixed(1)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Tooltip */}
            {hoveredData && (
                <div 
                    className="absolute pointer-events-none z-50"
                    style={{ 
                        left: mousePos.x + 20, 
                        top: mousePos.y - 40
                    }}
                >
                    <div className={`p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 min-w-[140px] ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                        <div className="font-bold text-sm mb-2 border-b border-white/10 pb-1">{hoveredData.cur} Strength</div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="opacity-60">Score</span>
                            <span className="font-bold">{hoveredData.val.toFixed(2)} / 10</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TradeExitAnalysisWidget = ({ trades = [], isDarkMode, onInfoClick }: { trades: Trade[], isDarkMode: boolean, onInfoClick?: () => void }) => {
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
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
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

                {/* Tooltip Overlay (Floating) */}
                {hoveredData && (
                    <div 
                        className="absolute pointer-events-none z-50"
                        style={{ 
                            left: mousePos.x - 40, 
                            top: mousePos.y - 100
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

const EquityCurveWidget = ({ trades = [], equityData = [], isDarkMode, currencySymbol = '$', currentBalanceOverride, onInfoClick }: { trades: Trade[], equityData: number[], isDarkMode: boolean, currencySymbol: string, currentBalanceOverride?: number, onInfoClick?: () => void }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const generatePath = (data: number[], width: number, height: number) => {
        if (!data || data.length < 2) return "";
        const min = Math.min(...data, 0);
        const max = Math.max(...data, 100);
        const range = max - min || 1;
        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
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
            setMousePos({ x: (index / (equityData.length - 1)) * 800, y: 0 }); // 800 is viewBox width
        }
    };

    const min = Math.min(...equityData, 0);
    const max = Math.max(...equityData, 100);
    const range = max - min || 1;
    const hoverY = hoverIndex !== null ? 240 - ((equityData[hoverIndex] - min) / range) * 240 : 0;

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col min-h-[350px] relative overflow-hidden ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><TrendingUp size={20} /></div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg leading-none">Equity Curve</h3>
                            <Tooltip content="Visual representation of your account balance growth over time." isDarkMode={isDarkMode}>
                                <svg 
                                    onClick={onInfoClick}
                                    xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
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
            <div className="flex-1 relative mt-4">
                {equityData && equityData.length > 1 ? (
                    <svg 
                        viewBox="0 0 800 240" 
                        className="w-full h-full overflow-visible drop-shadow-2xl cursor-crosshair"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoverIndex(null)}
                    >
                        <defs><linearGradient id="curveGradientAnalytics" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
                        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (<line key={i} x1="0" y1={p * 240} x2="800" y2={p * 240} stroke="currentColor" strokeOpacity="0.05" />))}
                        <path d={generatePath(equityData, 800, 240)} fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={`${generatePath(equityData, 800, 240)} L 800,240 L 0,240 Z`} fill="url(#curveGradientAnalytics)" />
                        
                        {hoverIndex !== null && (
                            <>
                                <line x1={mousePos.x} y1="0" x2={mousePos.x} y2="240" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                                <circle cx={mousePos.x} cy={hoverY} r="5" fill="#6366f1" stroke={isDarkMode ? "#18181b" : "white"} strokeWidth="2" />
                            </>
                        )}
                    </svg>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center gap-4"><Activity size={48} strokeWidth={1} /><p className="text-sm font-medium">Insufficient trade data to generate curve</p></div>
                )}
            </div>
        </div>
    );
};




const PerformanceByPairWidget = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string, onInfoClick?: () => void }) => {
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
            className={`p-6 rounded-[24px] border flex flex-col min-h-[450px] relative ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight">Performance by Pair</h3>
                    <Tooltip content="Detailed profit and loss breakdown for each individual trading pair." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
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

const LargestWinLossWidget = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string, onInfoClick?: () => void }) => {
    const { largestWin, largestLoss } = useMemo(() => {
        const safeTrades = trades || [];
        const wins = safeTrades.filter(t => t.pnl > 0);
        const losses = safeTrades.filter(t => t.pnl < 0);
        const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0;
        const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0;
        return { largestWin, largestLoss: Math.abs(largestLoss) };
    }, [trades]);

    const maxValue = Math.max(largestWin, largestLoss) || 1;
    const winPercent = (largestWin / maxValue) * 100;
    const lossPercent = (largestLoss / maxValue) * 100;

    return (
        <div className={`p-6 rounded-[24px] border ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">Largest Win vs Largest Loss</h3>
                    <Tooltip content="Compares your single biggest winning trade against your single biggest losing trade." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                    </Tooltip>
                </div>
            </div>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <span className="text-emerald-500 font-bold">Largest Win</span>
                    <span className="text-emerald-500 font-mono font-bold">{currencySymbol}{largestWin.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-rose-500 font-bold">Largest Loss</span>
                    <span className="text-rose-500 font-mono font-bold">{currencySymbol}-{largestLoss.toFixed(2)}</span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden flex ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${winPercent}%` }} />
                    <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${lossPercent}%` }} />
                </div>
            </div>
        </div>
    );
};

const MomentumStreakWidget = ({ trades = [], isDarkMode, onInfoClick }: { trades: Trade[], isDarkMode: boolean, onInfoClick?: () => void }) => {
    const stats = useMemo(() => {
        const sortedTrades = [...trades].sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

        let longestWin = 0;
        let longestLoss = 0;
        let tempWin = 0;
        let tempLoss = 0;

        sortedTrades.forEach(t => {
            if (t.result === 'Win') {
                tempWin++;
                tempLoss = 0;
                if (tempWin > longestWin) longestWin = tempWin;
            } else if (t.result === 'Loss') {
                tempLoss++;
                tempWin = 0;
                if (tempLoss > longestLoss) longestLoss = tempLoss;
            } else {
                tempWin = 0;
                tempLoss = 0;
            }
        });

        // Current streak
        let currentStreakValue = 0;
        let currentStreakType: 'Win' | 'Loss' | 'BE' | 'Pending' | null = null;

        const lastTrades = [...sortedTrades].reverse();
        if (lastTrades.length > 0) {
            currentStreakType = lastTrades[0].result;
            for (const t of lastTrades) {
                if (t.result === currentStreakType) {
                    currentStreakValue++;
                } else {
                    break;
                }
            }
        }

        // Recovery message logic
        const wasLossStreak = lastTrades.length > 1 && lastTrades[1].result === 'Loss';
        const isRecovery = lastTrades.length > 0 && lastTrades[0].result === 'Win' && wasLossStreak;
        const recoveredAmount = isRecovery ? lastTrades[0].pnl : 0;

        // Weekly Progress Logic
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const tradesThisWeek = trades.filter(t => new Date(t.date) >= startOfWeek).length;
        const weeklyGoal = 15;
        const weeklyProgress = Math.min(100, (tradesThisWeek / weeklyGoal) * 100);

        // Increase capacity to 60 for denser grid
        return { longestWin, longestLoss, currentStreakType, currentStreakValue, isRecovery, tradesThisWeek, weeklyGoal, weeklyProgress, recent: sortedTrades.slice(-60) };
    }, [trades]);

    return (
        <div className={`p-6 rounded-[24px] border flex flex-col h-full min-h-[280px] ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold tracking-tight">Trade Momentum</h3>
                        <Tooltip content="Tracks your recent trade outcomes and streaks to visualize psychological momentum." isDarkMode={isDarkMode}>
                            <svg 
                                onClick={onInfoClick}
                                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                        </Tooltip>
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-0.5">Outcome History</p>
                </div>
                <div className="flex gap-4 text-[9px] font-black uppercase tracking-tighter">
                    <div className="flex flex-col items-end">
                        <span className="opacity-40">Max Win Streak</span>
                        <span className="text-emerald-500 text-xs">{stats.longestWin}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="opacity-40">Max Loss Streak</span>
                        <span className="text-rose-500 text-xs">{stats.longestLoss}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                {/* Denser Grid: 15 cols mobile, 20 sm, 30 md */}
                <div className="grid grid-cols-15 sm:grid-cols-20 md:grid-cols-30 gap-1 w-full">
                    {stats.recent.map((t, i) => (
                        <div
                            key={t.id}
                            className={`w-full aspect-square rounded-[2px] transition-all duration-500 group relative ${t.result === 'Win' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.1)]' :
                                t.result === 'Loss' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.1)]' :
                                    t.result === 'BE' ? 'bg-zinc-500 opacity-40' : 'bg-indigo-500 opacity-20'
                                } ${i === stats.recent.length - 1 ? 'ring-1 ring-indigo-500 ring-offset-1 ring-offset-transparent animate-pulse' : 'hover:scale-125 hover:z-10 hover:brightness-110'}`}
                        >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                {t.pair}
                            </div>
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, 60 - stats.recent.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className={`w-full aspect-square rounded-[2px] border border-dashed ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`} />
                    ))}
                </div>

                {stats.isRecovery && (
                    <div className="mt-3 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 animate-bounce">
                        <Award size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
                            Recovered. Cycle Broken.
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Current Streak</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-baseline gap-2">
                                <span className={`text-3xl font-black transition-all duration-500 ${stats.currentStreakType === 'Win' ? 'text-emerald-500' :
                                    stats.currentStreakType === 'Loss' ? 'text-rose-500' : 'text-zinc-500'
                                    }`}>
                                    {stats.currentStreakValue}
                                </span>
                                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                                    {stats.currentStreakType === 'Win' ? 'Wins' : stats.currentStreakType === 'Loss' ? 'Losses' : stats.currentStreakType || 'Trades'}
                                </span>
                            </div>

                            {stats.currentStreakType === 'Win' && stats.currentStreakValue >= 3 && (
                                <div className="animate-bounce text-orange-500">
                                    <Flame size={18} fill="currentColor" />
                                </div>
                            )}
                            {stats.currentStreakType === 'Loss' && stats.currentStreakValue >= 3 && (
                                <div className="animate-pulse text-blue-400">
                                    <Snowflake size={18} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                        <Activity size={18} className={stats.currentStreakType === 'Win' ? 'text-emerald-500' : stats.currentStreakType === 'Loss' ? 'text-rose-500' : 'opacity-20'} />
                    </div>
                </div>

                {/* Weekly Goal Progress */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        <span className="opacity-40">Weekly Volume Goal</span>
                        <span className={stats.tradesThisWeek >= stats.weeklyGoal ? 'text-emerald-500' : 'opacity-60'}>
                            {stats.tradesThisWeek} / {stats.weeklyGoal}
                        </span>
                    </div>
                    <div className={`h-1 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                        <div
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${stats.tradesThisWeek >= stats.weeklyGoal ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-indigo-500'}`}
                            style={{ width: `${stats.weeklyProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const SymbolPerformanceWidget = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string, onInfoClick?: () => void }) => {
    const symbolStats = useMemo(() => {
        const safeTrades = trades || [];
        const stats: Record<string, { totalPnl: number; count: number }> = {};
        safeTrades.forEach(trade => {
            if (!trade.pair) return;
            const symbol = trade.pair.toUpperCase();
            if (!stats[symbol]) stats[symbol] = { totalPnl: 0, count: 0 };
            stats[symbol].totalPnl += trade.pnl || 0;
            stats[symbol].count += 1;
        });
        const symbolList = Object.entries(stats).map(([symbol, data]) => ({
            symbol,
            sum: data.totalPnl,
            avg: data.count > 0 ? data.totalPnl / data.count : 0
        }));
        const sortedBySum = [...symbolList].sort((a, b) => b.sum - a.sum);
        const sortedByAvg = [...symbolList].sort((a, b) => b.avg - a.avg);
        return {
            bestSymbolSum: sortedBySum[0] || null,
            worstSymbolSum: sortedBySum[sortedBySum.length - 1] || null,
            bestSymbolAvg: sortedByAvg[0] || null,
            worstSymbolAvg: sortedByAvg[sortedByAvg.length - 1] || null,
        };
    }, [trades]);

    const cards = [
        { label: 'Best Symbol Sum', data: symbolStats.bestSymbolSum },
        { label: 'Worst Symbol Sum', data: symbolStats.worstSymbolSum },
        { label: 'Best Symbol Avg', data: symbolStats.bestSymbolAvg },
        { label: 'Worst Symbol Avg', data: symbolStats.worstSymbolAvg },
    ];

    return (
        <div className={`p-6 rounded-[24px] border ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-bold tracking-tight">Symbol Performance</h3>
                <Tooltip content="Aggregated performance metrics for your most and least profitable symbols." isDarkMode={isDarkMode}>
                    <svg 
                        onClick={onInfoClick}
                        xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                </Tooltip>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-[#18181b] border-zinc-700/50' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">{card.label}</span>
                        </div>
                        <div className="text-xl font-black mb-1">{card.data?.symbol || '---'}</div>
                        <div className={`text-sm font-mono font-bold ${card.data && (card.label.includes('Sum') ? card.data.sum >= 0 : card.data.avg >= 0) ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {card.data ? (card.label.includes('Sum') ? `${currencySymbol}${card.data.sum.toFixed(2)}` : `${currencySymbol}${card.data.avg.toFixed(2)}`) : '---'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DrawdownOverTimeWidget = ({ trades = [], isDarkMode, userProfile, onInfoClick }: { trades: Trade[], isDarkMode: boolean, userProfile: UserProfile, onInfoClick?: () => void }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const drawdownData = useMemo(() => {
        if (!trades || trades.length === 0) return [];
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let peak = userProfile?.initialBalance || 10000;
        let balance = peak;
        const data: { date: string; drawdown: number; balance: number }[] = [];
        sortedTrades.forEach(trade => {
            balance += trade.pnl;
            if (balance > peak) peak = balance;
            const drawdown = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
            data.push({ date: trade.date, drawdown, balance });
        });
        return data;
    }, [trades, userProfile?.initialBalance]);

    const maxDrawdown = drawdownData.length > 0 ? Math.max(...drawdownData.map(d => d.drawdown)) : 0;
    const maxY = Math.max(maxDrawdown * 1.2, 1);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        
        const index = Math.round((x / width) * (drawdownData.length - 1));
        if (index >= 0 && index < drawdownData.length) {
            setHoverIndex(index);
            setMousePos({ x: (index / (drawdownData.length - 1)) * 700, y: 0 }); // 700 is viewBox width
        }
    };

    const generateAreaPath = (data: typeof drawdownData, width: number, height: number) => {
        if (!data || data.length < 2) return { line: "", area: "" };
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = (d.drawdown / maxY) * height;
            return { x, y };
        });
        const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
        const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
        return { line: linePath, area: areaPath };
    };

    const paths = generateAreaPath(drawdownData, 700, 200);
    const hoverY = hoverIndex !== null ? (drawdownData[hoverIndex].drawdown / maxY) * 200 : 0;

    return (
        <div className={`p-6 rounded-[24px] border flex flex-col min-h-[350px] relative ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">Drawdown Over Time</h3>
                    <Tooltip content="Visualizes the percentage drop from your peak equity over the course of your trading history." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                    </Tooltip>
                </div>

                {hoverIndex !== null && (
                    <div className="text-right animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-xl font-black font-mono text-rose-500 leading-none">
                            -{drawdownData[hoverIndex].drawdown.toFixed(2)}%
                        </div>
                        <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">
                            {userProfile.currencySymbol}{drawdownData[hoverIndex].balance.toLocaleString()}
                        </div>
                    </div>
                )}
            </div>
            {drawdownData.length < 2 ? (
                <div className="flex-1 flex items-center justify-center opacity-30 text-sm">Insufficient data</div>
            ) : (
                <div className="flex-1 relative">
                    <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-[10px] font-mono opacity-40">
                        <span>0%</span>
                        <span>{(maxY / 2).toFixed(2)}%</span>
                        <span>{maxY.toFixed(2)}%</span>
                    </div>
                    <div className="ml-12 h-full pb-8">
                        <svg 
                            viewBox="0 0 700 200" 
                            className="w-full h-full overflow-visible cursor-crosshair" 
                            preserveAspectRatio="none"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoverIndex(null)}
                        >
                            <defs>
                                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>
                            <path d={paths.area} fill="url(#drawdownGradient)" />
                            <path d={paths.line} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            
                            {hoverIndex !== null && (
                                <>
                                    <line x1={mousePos.x} y1="0" x2={mousePos.x} y2="200" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                                    <circle cx={mousePos.x} cy={hoverY} r="5" fill="#f43f5e" stroke={isDarkMode ? "#0d1117" : "white"} strokeWidth="2" />
                                </>
                            )}
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};


const TiltScoreWidget = ({ trades = [], isDarkMode, onInfoClick }: { trades: Trade[], isDarkMode: boolean, onInfoClick?: () => void }) => {
    const scoreData = useMemo(() => {
        const safeTrades = trades || [];
        if (safeTrades.length === 0) return { score: 100, label: 'No Data', message: 'Start logging trades to see your tilt score.' };

        let totalScore = 0;
        let count = 0;

        safeTrades.forEach(t => {
            if (t.planAdherence === 'Followed Exactly') {
                totalScore += 100;
                count++;
            } else if (t.planAdherence === 'Minor Deviation') {
                totalScore += 50;
                count++;
            } else if (t.planAdherence === 'Major Deviation') {
                totalScore += 0;
                count++;
            } else if (t.planAdherence === 'No Plan') {
                totalScore += 20; // Penalize no plan heavily
                count++;
            }
        });

        const score = count > 0 ? Math.round(totalScore / count) : 100;

        let label = 'Poor';
        let message = 'Your discipline needs immediate attention.';
        if (score >= 90) { label = 'Elite'; message = 'Ice in your veins. Keep it up.'; }
        else if (score >= 75) { label = 'Good'; message = 'Solid discipline, watch out for small slips.'; }
        else if (score >= 60) { label = 'Average'; message = 'Inconsistent. Focus on following your plan.'; }

        return { score, label, message };
    }, [trades]);

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col items-center justify-center text-center min-h-[400px] ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center gap-2 mb-12">
                <h3 className="text-xl font-bold tracking-tight">Discipline Score</h3>
                <Tooltip content="Calculates a score based on how strictly you followed your trading plan for each trade." isDarkMode={isDarkMode}>
                    <svg 
                        onClick={onInfoClick}
                        xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                </Tooltip>
            </div>
            <div className="relative w-64 h-64 mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke={isDarkMode ? "#1a1a1f" : "#f1f5f9"} strokeWidth="8" />
                    <circle
                        cx="50" cy="50" r="45"
                        fill="transparent"
                        stroke={scoreData.score > 80 ? "#10b981" : scoreData.score > 50 ? "#f59e0b" : "#f43f5e"}
                        strokeWidth="8"
                        strokeDasharray={`${(scoreData.score / 100) * 283} 283`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="flex items-baseline gap-1">
                        <span className={`text-5xl font-black ${scoreData.score > 80 ? "text-emerald-500" : scoreData.score > 50 ? "text-amber-500" : "text-rose-500"}`}>
                            {scoreData.score}
                        </span>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-40 mt-1">{scoreData.label}</span>
                </div>
            </div>
            <p className="text-sm opacity-60 leading-relaxed max-w-[200px]">{scoreData.message}</p>
        </div>
    );
};

const PerformanceRadarWidget = ({ trades = [], isDarkMode, onInfoClick }: { trades: Trade[], isDarkMode: boolean, onInfoClick?: () => void }) => {
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

        // Find max absolute value to normalize
        const values = mindsets.map(m => stats[m].count > 0 ? stats[m].total : 0);
        const maxAbs = Math.max(...values.map(Math.abs), 10); // Minimum scale of 10

        return mindsets.map((m, i) => {
            const angle = (i / mindsets.length) * 2 * Math.PI - Math.PI / 2;
            const rawValue = stats[m].count > 0 ? stats[m].total : 0;

            // Normalize: 0.5 is center (Break Even)
            let normalizedValue = 0.5;
            if (maxAbs > 0) {
                normalizedValue = 0.5 + (rawValue / (2 * maxAbs));
            }

            // Clamp
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
            className={`p-8 rounded-[32px] border flex flex-col items-center min-h-[400px] relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="text-center mb-8">
                <div className="flex items-center gap-2 justify-center">
                    <h3 className="text-xl font-bold tracking-tight">Performance Radar</h3>
                    <Tooltip content="Maps your P&L performance against your psychological state (mindset) at the time of trading." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                    </Tooltip>
                </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center relative w-full">
                <svg viewBox="0 0 100 100" className="w-full max-w-[280px] aspect-square overflow-visible">
                    {/* Circular Grid Lines (Matching the new look) */}
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

                    {/* Radial Axes */}
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

                    {/* Data Area (Radar) */}
                    <polygon 
                        points={points} 
                        fill="rgba(99, 102, 241, 0.6)" 
                        stroke="#6366f1" 
                        strokeWidth="2" 
                        strokeLinejoin="round" 
                        className="transition-all duration-1000"
                    />

                    {/* Data Points (Dots at vertices) */}
                    {radarData.map((d, i) => (
                        <circle
                            key={i}
                            cx={50 + d.x * d.value * 45}
                            cy={50 + d.y * d.value * 45}
                            r="3"
                            fill="#6366f1"
                            stroke={isDarkMode ? "#18181b" : "white"}
                            strokeWidth="1.5"
                            className="cursor-pointer transition-all duration-300 hover:r-4"
                            onMouseEnter={() => setHoveredNode({ mindset: d.mindset, value: d.rawValue, x: 50 + d.x * d.value * 45, y: 50 + d.y * d.value * 45 })}
                            onMouseLeave={() => setHoveredNode(null)}
                        />
                    ))}

                    {/* Labels */}
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

            {/* Tooltip Overlay (Floating) */}
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

const PLByMindsetWidget = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string, onInfoClick?: () => void }) => {
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
                if (trade.pnl > 0) stats[m].profit += trade.pnl;
                else stats[m].loss += Math.abs(trade.pnl || 0);
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

    // Add padding to range
    const range = (maxVal - minVal) * 1.2 || 1;
    const zeroY = (maxVal / range) * 100;

    const hoveredData = hoveredMindset ? mindsetData.find(d => d.mindset === hoveredMindset) : null;

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`p-6 rounded-[24px] border flex flex-col min-h-[400px] relative ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center gap-2 mb-8">
                <h3 className="text-xl font-bold tracking-tight">P/L by Mindset</h3>
                <Tooltip content="Bar chart showing your net profit or loss categorized by the mindset you recorded." isDarkMode={isDarkMode}>
                    <svg 
                        onClick={onInfoClick}
                        xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                </Tooltip>
            </div>

            <div className="flex-1 flex relative overflow-hidden">
                {/* Y-Axis Labels */}
                <div className="w-12 flex flex-col justify-between text-[10px] font-mono opacity-40 pb-8 border-r border-dashed border-white/5 pr-2 z-20">
                    <span>{currencySymbol}{Math.round(maxVal)}</span>
                    <span>{currencySymbol}0</span>
                    <span>{currencySymbol}{Math.round(minVal)}</span>
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative ml-2">
                    {/* Zero Line */}
                    <div
                        className="absolute left-0 right-0 border-t border-white/20 z-10"
                        style={{ top: `${zeroY}%` }}
                    />

                    {/* Bars Container */}
                    <div className="absolute inset-0 flex items-end justify-around pb-8">
                        {mindsetData.map((d, i) => {
                            const netHeight = (Math.abs(d.net) / range) * 100;
                            const isPositive = d.net >= 0;
                            const isHovered = hoveredMindset === d.mindset;

                            return (
                                <div
                                    key={i}
                                    className="relative flex flex-col items-center flex-1 h-full group cursor-pointer"
                                    onMouseEnter={() => setHoveredMindset(d.mindset)}
                                    onMouseLeave={() => setHoveredMindset(null)}
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
                                        {d.mindset}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tooltip (Floating) */}
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

const PLByPlanAdherenceWidget = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string, onInfoClick?: () => void }) => {
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

    // Add padding to range
    const range = (maxVal - minVal) * 1.2 || 1;
    const zeroY = (maxVal / range) * 100;

    const hoveredData = hoveredAdherence ? adherenceData.find(d => d.fullLabel === hoveredAdherence) : null;

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`p-6 rounded-[24px] border flex flex-col min-h-[400px] relative ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center gap-2 mb-8">
                <h3 className="text-xl font-bold tracking-tight">P/L by Plan Adherence</h3>
                <Tooltip content="Shows how your P/L correlates with your level of plan adherence." isDarkMode={isDarkMode}>
                    <svg 
                        onClick={onInfoClick}
                        xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                </Tooltip>
            </div>

            <div className="flex-1 flex relative overflow-hidden">
                {/* Y-Axis Labels */}
                <div className="w-12 flex flex-col justify-between text-[10px] font-mono opacity-40 pb-8 border-r border-dashed border-white/5 pr-2 z-20">
                    <span>{currencySymbol}{Math.round(maxVal)}</span>
                    <span>{currencySymbol}0</span>
                    <span>{currencySymbol}{Math.round(minVal)}</span>
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative ml-2">
                    {/* Zero Line */}
                    <div
                        className="absolute left-0 right-0 border-t border-white/20 z-10"
                        style={{ top: `${zeroY}%` }}
                    />

                    {/* Bars Container */}
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

            {/* Tooltip (Floating) */}
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

const StrategyPerformanceBubbleChart = ({ trades = [], isDarkMode, currencySymbol = '$' }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string }) => {
    const [hoveredStrategy, setHoveredStrategy] = useState<any | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const strategyData = useMemo(() => {
        const safeTrades = trades || [];
        const stats: Record<string, { pnl: number, count: number, wins: number }> = {};

        safeTrades.forEach(t => {
            const stratStrategies = t.tags || [];
            stratStrategies.forEach(tag => {
                const normalized = tag.trim();
                if (!stats[normalized]) stats[normalized] = { pnl: 0, count: 0, wins: 0 };
                stats[normalized].pnl += t.pnl;
                stats[normalized].count += 1;
                if (t.result === 'Win') stats[normalized].wins += 1;
            });
        });

        return Object.entries(stats).map(([name, data]) => ({
            name,
            pnl: data.pnl,
            count: data.count,
            winRate: (data.wins / data.count) * 100,
            avgPnl: data.pnl / data.count
        })).filter(d => d.count >= 1); // Only show strategies with at least 1 trade
    }, [trades]);

    const maxPnl = Math.max(...strategyData.map(d => Math.abs(d.pnl)), 100);
    const maxCount = Math.max(...strategyData.map(d => d.count), 5);

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[450px] relative overflow-hidden ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold tracking-tight">Performance by Strategy</h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1">Win Rate vs. Net Profitability</p>
                </div>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Sparkles size={20} />
                </div>
            </div>

            <div className="flex-1 relative mt-4 mb-12 ml-12 mr-4">
                {/* Y-Axis (PnL) Labels */}
                <div className="absolute -left-12 inset-y-0 w-10 flex flex-col justify-between text-[9px] font-mono font-bold opacity-30 text-right">
                    <span>+{currencySymbol}{Math.round(maxPnl)}</span>
                    <span>{currencySymbol}0</span>
                    <span>-{currencySymbol}{Math.round(maxPnl)}</span>
                </div>

                {/* X-Axis (Win Rate) Labels */}
                <div className="absolute inset-x-0 -bottom-8 h-6 flex justify-between text-[9px] font-mono font-bold opacity-30">
                    <span>0% WR</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100% WR</span>
                </div>

                {/* Grid Lines */}
                <div className="absolute inset-0 border-l border-b border-white/5">
                    <div className="absolute inset-x-0 h-px bg-white/10" style={{ top: '50%' }} />
                    <div className="absolute inset-y-0 w-px bg-white/10" style={{ left: '50%' }} />
                </div>

                {/* Bubbles */}
                {strategyData.map((d, i) => {
                    const x = d.winRate; // 0 to 100
                    // Normalize Y: 0 is bottom (-maxPnl), 50 is center (0), 100 is top (+maxPnl)
                    const y = 50 + (d.pnl / (maxPnl * 2)) * 100;
                    const size = Math.max(20, (d.count / maxCount) * 60);
                    const isHovered = hoveredStrategy?.name === d.name;

                    return (
                        <div
                            key={i}
                            className="absolute transition-all duration-500 cursor-pointer"
                            onMouseEnter={() => setHoveredStrategy(d)}
                            onMouseLeave={() => setHoveredStrategy(null)}
                            style={{
                                left: `${x}%`,
                                bottom: `${y}%`,
                                transform: 'translate(-50%, 50%)',
                                zIndex: isHovered ? 40 : 10
                            }}
                        >
                            <div 
                                className={`rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                    d.pnl >= 0 
                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' 
                                    : 'bg-rose-500/20 border-rose-500/50 text-rose-500'
                                } ${isHovered ? 'scale-125 brightness-125 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'opacity-80'}`}
                                style={{
                                    width: `${size}px`,
                                    height: `${size}px`,
                                }}
                            >
                                <span className="text-[8px] font-black uppercase tracking-tighter truncate px-1">{d.name}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tooltip Overlay */}
            {hoveredStrategy && (
                <div 
                    className="absolute pointer-events-none z-50"
                    style={{ 
                        left: mousePos.x + 20, 
                        top: mousePos.y - 40
                    }}
                >
                    <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 min-w-[180px] ${isDarkMode ? 'bg-[#09090b]/95 border-zinc-700' : 'bg-white/95 border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                            <div className={`w-2 h-2 rounded-full ${hoveredStrategy.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <div className="font-black text-sm uppercase tracking-wide">{hoveredStrategy.name}</div>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="opacity-60 font-bold uppercase text-[9px]">Total P&L</span>
                                <span className={`font-black ${hoveredStrategy.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {hoveredStrategy.pnl >= 0 ? '+' : ''}{currencySymbol}{hoveredStrategy.pnl.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="opacity-60 font-bold uppercase text-[9px]">Win Rate</span>
                                <span className="font-black">{hoveredStrategy.winRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="opacity-60 font-bold uppercase text-[9px]">Trade Volume</span>
                                <span className="font-black">{hoveredStrategy.count} Trades</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <span className="opacity-60 font-bold uppercase text-[9px]">Avg / Trade</span>
                                <span className="font-black">{currencySymbol}{hoveredStrategy.avgPnl.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest opacity-40">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Profitable Strategy</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Losing Strategy</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-current opacity-50" />
                    <span>Bubble Size = Volume</span>
                </div>
            </div>
        </div>
    );
};

const Analytics: React.FC<AnalyticsProps> = ({ isDarkMode, trades = [], userProfile, eaSession }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'discipline' | 'comparison'>('overview');
    const [activeInfo, setActiveInfo] = useState<{ title: string, content: string } | null>(null);
    
    const currentPlan = userProfile?.plan || APP_CONSTANTS.PLANS.FREE;
    const features = PLAN_FEATURES[currentPlan];

    const InfoPanel = ({ info, onClose }: { info: { title: string, content: string }, onClose: () => void }) => (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-lg p-8 rounded-[32px] border shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200'}`}>
                <button 
                    onClick={onClose}
                    className={`absolute top-6 right-6 p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                >
                    <X size={20} className={isDarkMode ? 'text-zinc-400' : 'text-slate-500'} />
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-2xl bg-[#FF4F01]/10 text-[#FF4F01]">
                        <Info size={24} />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Help: {info.title}</h3>
                </div>
                <div className={`text-sm leading-relaxed space-y-4 font-medium ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                    {info.content.split('\n\n').map((para, i) => (
                        <p key={i}>{para}</p>
                    ))}
                </div>
                <button 
                    onClick={onClose}
                    className="w-full mt-10 py-4 bg-[#FF4F01] hover:bg-[#E64601] text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-[#FF4F01]/20"
                >
                    Got it, thanks!
                </button>
            </div>
        </div>
    );
    
    // Derived feature flags for clarity
    const canAccessGrowth = features.advancedAnalytics;
    const canAccessDiscipline = features.advancedAnalytics;
    const canAccessComparison = features.comparisonAnalytics;
    // For overview lock logic (Free tier usually has some restrictions on overview widgets too)
    const isBasicTier = !features.advancedAnalytics;

    // Widget Order State
    const [overviewOrder, setOverviewOrder] = useLocalStorage('analytics_overview_order', [
        'winRate', 'profitFactor', 'grossProfit', 'grossLoss',
        'streakMomentum', 'equityCurve',
        'drawdown', 'largestWinLoss',
        'symbolPerformance', 'monthlyPerformance',
        'currencyStrength', 'tradeExit', 'bestTime'
    ]);

    const [growthOrder, setGrowthOrder] = useLocalStorage('analytics_growth_order', [
        'outcomeDist', 'perfByPair', 'strategyPerf', 'executionTable'
    ]);

    const [disciplineOrder, setDisciplineOrder] = useLocalStorage('analytics_discipline_order', [
        'tiltScore', 'radar',
        'plMindset', 'plAdherence',
        'riskReward'
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Auto-inject missing widgets (Fixes stale localStorage for existing users)
    useEffect(() => {
        const defaultOverview = [
            'winRate', 'profitFactor', 'grossProfit', 'grossLoss',
            'streakMomentum', 'equityCurve', 'drawdown', 'largestWinLoss',
            'symbolPerformance', 'monthlyPerformance', 'currencyStrength', 'tradeExit', 'bestTime'
        ];
        const defaultGrowth = ['outcomeDist', 'perfByPair', 'strategyPerf', 'executionTable'];
        const defaultDiscipline = ['tiltScore', 'radar', 'plMindset', 'plAdherence', 'riskReward'];

        // Use functional updates to avoid dependency on the values themselves
        setOverviewOrder(prev => {
            const missing = defaultOverview.filter(id => !prev.includes(id));
            return missing.length > 0 ? [...prev, ...missing] : prev;
        });

        setGrowthOrder(prev => {
            const missing = defaultGrowth.filter(id => !prev.includes(id));
            return missing.length > 0 ? [...prev, ...missing] : prev;
        });

        setDisciplineOrder(prev => {
            const missing = defaultDiscipline.filter(id => !prev.includes(id));
            return missing.length > 0 ? [...prev, ...missing] : prev;
        });
    }, []); // Run once on mount

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!active || !over || active.id === over.id) return;

        if (activeTab === 'overview') {
            setOverviewOrder((items) => {
                const oldIndex = items.indexOf(String(active.id));
                const newIndex = items.indexOf(String(over.id));
                return arrayMove(items, oldIndex, newIndex);
            });
        } else if (activeTab === 'growth') {
            setGrowthOrder((items) => {
                const oldIndex = items.indexOf(String(active.id));
                const newIndex = items.indexOf(String(over.id));
                return arrayMove(items, oldIndex, newIndex);
            });
        } else if (activeTab === 'discipline') {
            setDisciplineOrder((items) => {
                const oldIndex = items.indexOf(String(active.id));
                const newIndex = items.indexOf(String(over.id));
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const stats = useMemo(() => {
        const safeTrades = trades || [];
        const wins = safeTrades.filter(t => t.result === 'Win');
        const losses = safeTrades.filter(t => t.result === 'Loss');
        const totalCount = safeTrades.length || 1;
        const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
        const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
        const netProfit = grossProfit - grossLoss;
        const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 9.9 : 0);
        const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
        const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
        const riskRewardRatio = avgLoss > 0 ? (avgWin / avgLoss) : 0;
        const winRate = (wins.length / totalCount) * 100;
        return {
            netProfit, grossProfit, grossLoss,
            winRate: winRate.toFixed(1),
            profitFactor: profitFactor.toFixed(2),
            avgWin, avgLoss,
            rrRatio: riskRewardRatio.toFixed(2),
            totalTrades: safeTrades.length
        };
    }, [trades]);

    const equityData = useMemo(() => {
        const safeTrades = trades || [];
        let cumulative = userProfile?.initialBalance || 0;
        const data = [cumulative];
        const sortedTrades = [...safeTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        sortedTrades.forEach(t => {
            cumulative += t.pnl;
            data.push(cumulative);
        });
        return data;
    }, [trades, userProfile?.initialBalance]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'growth', label: 'Growth', icon: LineChart },
        { id: 'discipline', label: 'Discipline', icon: Target },
        { id: 'comparison', label: 'Comparison', icon: ArrowRightLeft }
    ] as const;

    const renderWidget = (id: string) => {
        const currencySymbol = userProfile?.currencySymbol || '$';
        
        // Essential check for widgets - these are the only ones visible on FREE tier overview
        const isEssential = ['winRate', 'profitFactor', 'grossProfit', 'grossLoss', 'equityCurve'].includes(id);
        
        if (isBasicTier && !isEssential && activeTab === 'overview') {
            return (
                <div className={`h-full p-6 rounded-[24px] border flex flex-col items-center justify-center text-center relative overflow-hidden ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                    <div className="absolute inset-0 bg-black/5 dark:bg-white/[0.02] backdrop-blur-[2px] z-10" />
                    <div className="relative z-20 flex flex-col items-center gap-2">
                        <div className="p-2 rounded-lg bg-[#FF4F01]/10 text-[#FF4F01]">
                            <Lock size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Pro Analytics</span>
                        <p className="text-[9px] font-bold opacity-30 px-4">Upgrade to unlock this insight.</p>
                    </div>
                </div>
            );
        }

        switch (id) {
            // Overview Widgets
            case 'winRate':
                return (
                    <div className={`h-full p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Win Rate</span>
                        <div className="text-2xl font-black">{stats.winRate}%</div>
                    </div>
                );
            case 'profitFactor':
                return (
                    <div className={`h-full p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Profit Factor</span>
                        <div className="text-2xl font-black">{stats.profitFactor}</div>
                    </div>
                );
            case 'grossProfit':
                return (
                    <div className={`h-full p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Gross Profit</span>
                        <div className="text-2xl font-black text-emerald-500">+{currencySymbol}{stats.grossProfit.toLocaleString()}</div>
                    </div>
                );
            case 'grossLoss':
                return (
                    <div className={`h-full p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Gross Loss</span>
                        <div className="text-2xl font-black text-rose-500">-{currencySymbol}{stats.grossLoss.toLocaleString()}</div>
                    </div>
                );
            case 'streakMomentum':
                return (
                    <MomentumStreakWidget 
                        trades={trades} 
                        isDarkMode={isDarkMode} 
                        onInfoClick={() => setActiveInfo({
                            title: "Trade Momentum",
                            content: "Momentum tracks your recent outcome streaks (Wins/Losses). It helps you visualize 'hot' and 'cold' cycles in your trading.\n\nBy monitoring momentum, you can identify when you are in a flow state or, conversely, when you might be revenge trading or entering a slump. It also includes a recovery indicator to celebrate breaking a losing cycle."
                        })}
                    />
                );
            case 'equityCurve': {
                // If EA Session exists, use bridge equity as current balance
                const currentBalance = eaSession?.data?.account?.equity !== undefined
                    ? eaSession.data.account.equity
                    : (equityData?.length > 0 ? equityData[equityData.length - 1] : 0);

                return (
                    <EquityCurveWidget
                        trades={trades}
                        equityData={equityData}
                        isDarkMode={isDarkMode}
                        currencySymbol={currencySymbol}
                        currentBalanceOverride={currentBalance}
                        onInfoClick={() => setActiveInfo({
                            title: "Equity Curve",
                            content: "The Equity Curve is the primary visualization of your account's financial health over time. It plots your total balance after every closed trade.\n\nA smooth, upward-sloping curve indicates consistent profitability and controlled risk. Large vertical drops represent significant losses or drawdown periods that may require strategy adjustment."
                        })}
                    />
                );
            }
            case 'drawdown':
                return (
                    <DrawdownOverTimeWidget 
                        trades={trades} 
                        isDarkMode={isDarkMode} 
                        userProfile={userProfile} 
                        onInfoClick={() => setActiveInfo({
                            title: "Drawdown Over Time",
                            content: "This chart tracks your 'Peak-to-Valley' equity drops. It shows the percentage decline from your highest ever balance point.\n\nManaging drawdown is critical for long-term survival. Seeing your drawdown history helps you understand the 'risk of ruin' and whether your strategy's losing periods are within your tolerated risk parameters."
                        })}
                    />
                );
            case 'largestWinLoss':
                return (
                    <LargestWinLossWidget 
                        trades={trades} 
                        isDarkMode={isDarkMode} 
                        currencySymbol={currencySymbol} 
                        onInfoClick={() => setActiveInfo({
                            title: "Largest Win vs Loss",
                            content: "This metric compares your single most profitable trade against your single largest losing trade. It's a simple but powerful check on your risk management.\n\nIdeally, your largest win should significantly outweigh your largest loss. If your largest loss is much bigger, it suggests a lack of disciplined stop-losses or 'holding onto losers' behavior."
                        })}
                    />
                );
            case 'symbolPerformance':
                return (
                    <SymbolPerformanceWidget 
                        trades={trades} 
                        isDarkMode={isDarkMode} 
                        currencySymbol={currencySymbol} 
                        onInfoClick={() => setActiveInfo({
                            title: "Symbol Performance",
                            content: "This widget highlights your best and worst performing assets. It shows the total sum of P&L and the average P&L per trade for each symbol.\n\nUse this to 'trim the fat' from your portfolio. Many traders find they lose most of their money on a few specific pairs while being highly profitable on others. Focus on what works."
                        })}
                    />
                );
            case 'monthlyPerformance':
                return (
                    <MonthlyPerformanceWidget 
                        trades={trades} 
                        isDarkMode={isDarkMode} 
                        currencySymbol={currencySymbol} 
                        onInfoClick={() => setActiveInfo({
                            title: "Monthly Performance",
                            content: "A high-level view of your P&L and maximum drawdown for every month of the current year.\n\nThis helps you spot seasonal trends in your trading and provides a benchmark for monthly growth targets. It's essential for treating your trading as a business with monthly reporting cycles."
                        })}
                    />
                );
            case 'currencyStrength':
                return (
                    <CurrencyStrengthMeter 
                        isDarkMode={isDarkMode} 
                        trades={trades} 
                        onInfoClick={() => setActiveInfo({
                            title: "Currency Strength",
                            content: "The Currency Strength meter shows the relative performance of individual currencies based on your past trades. If you are consistently winning on 'Long' EURUSD trades, the EUR strength increases while USD strength decreases.\n\nUse this to identify which currencies you have the best intuition for and which ones are currently driving your performance. It helps you focus on pairs where you have a proven historical edge."
                        })}
                    />
                );
            case 'tradeExit':
                return (
                    <TradeExitAnalysisWidget 
                        trades={trades} 
                        isDarkMode={isDarkMode} 
                        onInfoClick={() => setActiveInfo({
                            title: "Trade Exit Analysis",
                            content: "This donut chart breaks down your trade outcomes by exit type: Take Profit (TP), Stop Loss (SL), Breakeven (BE), or Pending.\n\nAnalyzing exits helps you determine if you are exiting too early (high BE rate) or if your stop losses are being hit too frequently compared to your targets. It's a key metric for optimizing your Reward-to-Risk ratio."
                        })}
                    />
                );
            case 'bestTime':
                return (
                    <BestTimeWidget 
                        trades={trades} 
                        isDarkMode={isDarkMode} 
                        currencySymbol={currencySymbol} 
                        onInfoClick={() => setActiveInfo({
                            title: "Hourly Performance",
                            content: "This widget analyzes your trading performance based on the hour of the day. It helps you identify which hours are most profitable for your strategy and when you might be prone to losses.\n\nBy understanding your 'Golden Hours', you can optimize your schedule to trade only when your edge is highest and avoid sessions where you typically underperform or face higher volatility."
                        })}
                    />
                );

            // Growth Widgets
            case 'outcomeDist': {
                const safeTrades = trades || [];
                const total = safeTrades.length || 1;
                const winCount = safeTrades.filter(t => t.result === 'Win').length;
                const lossCount = safeTrades.filter(t => t.result === 'Loss').length;
                const beCount = safeTrades.filter(t => t.result === 'BE').length;

                const winRate = (winCount / total) * 100;
                const lossRate = (lossCount / total) * 100;
                const beRate = (beCount / total) * 100;

                return (
                    <div className={`h-full p-8 rounded-[32px] border flex flex-col items-center justify-between ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex items-center gap-2 self-start mb-4">
                            <PieChart size={20} className="text-teal-500" />
                            <h3 className="font-bold text-lg uppercase tracking-wide opacity-80">Outcome Distribution</h3>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                            <div className="relative w-56 h-56 group transition-transform duration-500 hover:scale-105">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                    {/* Background Circle */}
                                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke={isDarkMode ? "#27272a" : "#f1f5f9"} strokeWidth="3.5" />

                                    {/* Win Segment */}
                                    <circle
                                        cx="18" cy="18" r="15.915"
                                        fill="transparent"
                                        stroke="#10b981"
                                        strokeWidth="3.5"
                                        strokeDasharray={`${winRate} 100`}
                                        strokeDashoffset="0"
                                        className="transition-all duration-1000 ease-out"
                                    />

                                    {/* Loss Segment */}
                                    <circle
                                        cx="18" cy="18" r="15.915"
                                        fill="transparent"
                                        stroke="#f43f5e"
                                        strokeWidth="3.5"
                                        strokeDasharray={`${lossRate} 100`}
                                        strokeDashoffset={`-${winRate}`}
                                        className="transition-all duration-1000 ease-out"
                                    />

                                    {/* BE Segment */}
                                    <circle
                                        cx="18" cy="18" r="15.915"
                                        fill="transparent"
                                        stroke="#71717a"
                                        strokeWidth="3.5"
                                        strokeDasharray={`${beRate} 100`}
                                        strokeDashoffset={`-${winRate + lossRate}`}
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{winRate.toFixed(0)}%</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Win Rate</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mt-8 w-full border-t border-white/5 pt-6">
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Wins</span>
                                </div>
                                <span className="text-sm font-black">{winCount}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Losses</span>
                                </div>
                                <span className="text-sm font-black">{lossCount}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-500 shadow-[0_0_8px_rgba(113,113,122,0.5)]" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">BE</span>
                                </div>
                                <span className="text-sm font-black">{beCount}</span>
                            </div>
                        </div>
                    </div>
                );
            }
            case 'perfByPair':
                return (
                    <PerformanceByPairWidget 
                        trades={trades} 
                        isDarkMode={isDarkMode} 
                        currencySymbol={currencySymbol} 
                        onInfoClick={() => setActiveInfo({
                            title: "Performance by Pair",
                            content: "A detailed comparison of your gross profit vs. gross loss for every symbol you've traded. The green bars represent total profit, while red bars represent total loss.\n\nThis widget allows you to quickly identify which assets are your 'money makers' and which ones are consistently draining your account. It's a key visualization for portfolio optimization."
                        })}
                    />
                );
            case 'strategyPerf':
                return <StrategyPerformanceBubbleChart trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'executionTable':
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold tracking-tight px-4">Trade Execution Analysis</h3>
                        <ExecutionPerformanceTable trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} initialBalance={userProfile?.initialBalance || 0} />
                    </div>
                );

            // Discipline Widgets
            case 'tiltScore':
                return (
                    <TiltScoreWidget 
                        trades={trades} 
                        isDarkMode={isDarkMode} 
                        onInfoClick={() => setActiveInfo({
                            title: "Discipline Score",
                            content: "Your Discipline Score is a mathematical reflection of how well you follow your trading rules. It is weighted by your 'Plan Adherence' logs for every trade.\n\nFollowing a plan exactly increases your score, while major deviations or 'winging it' decrease it. A high score is often a leading indicator of long-term profitability, even during losing streaks."
                        })}
                    />
                );
            case 'radar':
                return (
                    <PerformanceRadarWidget 
                        trades={trades} 
                        isDarkMode={isDarkMode} 
                        onInfoClick={() => setActiveInfo({
                            title: "Performance Radar",
                            content: "The Radar chart maps your financial performance against your psychological mindset. It helps you visualize which emotional states lead to your best and worst results.\n\nFor example, you might find that you make the most money when 'Hesitant' (being careful) and 'lose the most when 'Confident' (being overconfident). It's a powerful tool for discovering your optimal trading psychology."
                        })}
                    />
                );
            case 'plMindset':
                return (
                    <PLByMindsetWidget 
                        trades={trades} 
                        isDarkMode={isDarkMode} 
                        currencySymbol={currencySymbol} 
                        onInfoClick={() => setActiveInfo({
                            title: "P/L by Mindset",
                            content: "This bar chart breaks down your net profit and loss based on the mindset you logged for each trade.\n\nBy categorizing your results this way, you can see the direct financial impact of your emotions. It helps you quantify why maintaining a 'Neutral' or 'Professional' mindset is often superior to trading under high stress or excitement."
                        })}
                    />
                );
            case 'plAdherence':
                return (
                    <PLByPlanAdherenceWidget 
                        trades={trades} 
                        isDarkMode={isDarkMode} 
                        currencySymbol={currencySymbol} 
                        onInfoClick={() => setActiveInfo({
                            title: "P/L by Plan Adherence",
                            content: "Shows the correlation between your discipline and your P&L. It answers the question: 'Does following my plan actually make me more money?'\n\nUsually, trades that 'Followed Exactly' show the best results. If your 'Major Deviation' trades are profitable, it might suggest your plan is too restrictive or your intuition is currently outperforming your rules."
                        })}
                    />
                );
            case 'riskReward':
                return (
                    <div className={`h-full p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <Activity size={20} className="text-indigo-500" />
                            Risk/Reward Efficiency
                        </h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <span className="text-sm opacity-60">Avg Win</span>
                                <span className="text-xl font-black text-emerald-500">{currencySymbol}{Math.round(stats.avgWin).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-sm opacity-60">Avg Loss</span>
                                <span className="text-xl font-black text-rose-500">{currencySymbol}{Math.round(stats.avgLoss).toLocaleString()}</span>
                            </div>
                            <div className="pt-6 border-t border-dashed border-white/10 flex justify-between items-end">
                                <span className="text-sm font-bold">Expectancy (R:R)</span>
                                <span className="text-2xl font-black text-indigo-500">
                                    1 : {stats.avgLoss === 0 ? '∞' : stats.rrRatio}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    const getColSpan = (id: string) => {
        // Based on 12-column grid
        switch (id) {
            case 'winRate': case 'profitFactor': case 'grossProfit': case 'grossLoss': return 'col-span-12 md:col-span-6 lg:col-span-3';
            case 'streakMomentum': return 'col-span-12';
            case 'equityCurve': return 'col-span-12 lg:col-span-6';
            case 'drawdown': return 'col-span-12 lg:col-span-6';
            case 'largestWinLoss': return 'col-span-12 lg:col-span-6';
            case 'symbolPerformance': return 'col-span-12 lg:col-span-6';
            case 'monthlyPerformance': case 'currencyStrength': case 'tradeExit': return 'col-span-12 lg:col-span-4';
            case 'bestTime': return 'col-span-12 lg:col-span-12'; // Full width for hourly detail

            case 'outcomeDist': return 'col-span-12 lg:col-span-4';
            case 'perfByPair': return 'col-span-12 lg:col-span-8';
            case 'strategyPerf': return 'col-span-12';
            case 'executionTable': return 'col-span-12';

            case 'tiltScore': case 'radar': case 'plMindset': case 'plAdherence': return 'col-span-12 lg:col-span-6';
            case 'riskReward': return 'col-span-12';
            default: return 'col-span-12';
        }
    }

    const LockedView = ({ title, description }: { title: string, description: string }) => (
        <div className={`flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500`}>
            <div className={`w-24 h-24 rounded-[32px] mb-8 flex items-center justify-center shadow-2xl relative ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
                <div className="absolute inset-0 bg-[#FF4F01]/10 rounded-[32px] animate-pulse" />
                <Lock size={40} className="text-[#FF4F01] relative z-10" />
            </div>
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">{title}</h2>
            <p className={`text-sm max-w-md mx-auto mb-10 leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                {description}
            </p>
            <div className="flex gap-4">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-8 py-3 rounded-xl font-bold text-sm transition-all border ${isDarkMode ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-400' : 'border-zinc-200 hover:bg-zinc-50 text-zinc-600'}`}
                >
                    Back to Overview
                </button>
                <button 
                    className="px-8 py-3 bg-[#FF4F01] text-white rounded-xl font-black text-sm shadow-xl shadow-[#FF4F01]/20 hover:scale-105 active:scale-95 transition-all"
                >
                    Upgrade to Unlock
                </button>
            </div>
        </div>
    );

    return (
        <div className={`w-full h-full overflow-y-auto custom-scrollbar p-6 lg:p-10 font-sans ${isDarkMode ? 'bg-[#050505] text-zinc-200' : 'bg-[#F8FAFC] text-slate-900'}`}>
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Performance Analytics</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Visual breakdown of your trading performance.</p>
                </div>
                <div className={`flex p-1 gap-1 ${isDarkMode ? 'bg-[#121214] rounded-[20px] border border-[#1e1e22]' : 'bg-slate-100 rounded-[20px] border border-slate-200'}`}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const isLocked = 
                            (tab.id === 'growth' && !canAccessGrowth) ||
                            (tab.id === 'discipline' && !canAccessDiscipline) ||
                            (tab.id === 'comparison' && !canAccessComparison);
                        return (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)} 
                                className={`flex items-center gap-3 px-5 py-2.5 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all duration-300 relative group ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-indigo-500'}`}
                            >
                                <div className="relative">
                                    <tab.icon size={16} strokeWidth={isActive ? 3 : 2} />
                                    {isLocked && (
                                        <div className="absolute -top-1.5 -right-1.5 bg-[#FF4F01] rounded-full p-0.5 shadow-sm">
                                            <Lock size={8} fill="white" className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </header>

            {!canAccessGrowth && activeTab === 'growth' && (
                <LockedView 
                    title="Growth Insights Locked" 
                    description="Visualizing trade outcome distribution, pair-specific profitability, and detailed execution metrics requires a higher tier plan." 
                />
            )}

            {!canAccessDiscipline && activeTab === 'discipline' && (
                <LockedView 
                    title="Psychology Radar Locked" 
                    description="Deep-dive into your Tilt Score, mindset performance radar, and plan adherence correlation metrics are reserved for advanced traders." 
                />
            )}

            {!canAccessComparison && activeTab === 'comparison' && (
                <LockedView 
                    title="Symbol Comparison Locked" 
                    description="Side-by-side comparison of multiple trading instruments and comparative equity growth analysis is a PREMIUM feature." 
                />
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {activeTab === 'overview' && (
                    <SortableContext items={overviewOrder} strategy={rectSortingStrategy}>
                        <div className="animate-in fade-in duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-20">
                            {overviewOrder.map(id => (
                                <SortableWidget key={id} id={id} className={getColSpan(id)}>
                                    {renderWidget(id)}
                                </SortableWidget>
                            ))}
                        </div>
                    </SortableContext>
                )}

                {activeTab === 'growth' && canAccessGrowth && (
                    <SortableContext items={growthOrder} strategy={rectSortingStrategy}>
                        <div className="animate-in fade-in duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-20">
                            {growthOrder.map(id => (
                                <SortableWidget key={id} id={id} className={getColSpan(id)}>
                                    {renderWidget(id)}
                                </SortableWidget>
                            ))}
                        </div>
                    </SortableContext>
                )}

                {activeTab === 'discipline' && canAccessDiscipline && (
                    <SortableContext items={disciplineOrder} strategy={rectSortingStrategy}>
                        <div className="animate-in fade-in duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-20">
                            {disciplineOrder.map(id => (
                                <SortableWidget key={id} id={id} className={getColSpan(id)}>
                                    {renderWidget(id)}
                                </SortableWidget>
                            ))}
                        </div>
                    </SortableContext>
                )}

                {activeTab === 'comparison' && canAccessComparison && (
                    <ComparisonView trades={trades} isDarkMode={isDarkMode} currencySymbol={userProfile?.currencySymbol || '$'} />
                )}
            </DndContext>

            {activeInfo && (
                <InfoPanel 
                    info={activeInfo} 
                    onClose={() => setActiveInfo(null)} 
                />
            )}
        </div>
    );
};

export default Analytics;