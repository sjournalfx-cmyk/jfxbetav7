import React, { useMemo, useState, useEffect } from 'react';
import { Trade, UserProfile, EASession } from '../types';
import { getSASTDateTime } from '../lib/timeUtils';
import {
    TrendingUp, PieChart, Info, ArrowUpRight, ArrowDownRight, Activity,
    Target, BarChart3, Award, AlertOctagon,
    ArrowLeftRight, GitCompare, MoreVertical, Star, Coins,
    LayoutDashboard, LineChart, ShieldAlert, X, HelpCircle, GripVertical, Link,
    ArrowRightLeft, Crown, Flame, Snowflake, Lock, Sparkles, Printer, Clock
} from 'lucide-react';

import { PerformanceBySession } from './analytics/PerformanceBySession';
import { ReportView } from './analytics/ReportView';
import { PerformanceByPairWidget } from './analytics/PerformanceByPairWidget';
import { ExecutionPerformanceTable } from './analytics/ExecutionPerformanceTable';
import { MonthlyPerformanceWidget } from './analytics/MonthlyPerformanceWidget';
import { CurrencyStrengthMeter } from './analytics/CurrencyStrengthMeter';
import { TradeExitAnalysisWidget } from './analytics/TradeExitAnalysisWidget';
import { EquityCurveWidget } from './analytics/EquityCurveWidget';
import { LargestWinLossWidget } from './analytics/LargestWinLossWidget';
import { MomentumStreakWidget } from './analytics/MomentumStreakWidget';
import { SymbolPerformanceWidget } from './analytics/SymbolPerformanceWidget';
import { DrawdownOverTimeWidget } from './analytics/DrawdownOverTimeWidget';
import { TiltScoreWidget } from './analytics/TiltScoreWidget';
import { PerformanceRadarWidget } from './analytics/PerformanceRadarWidget';
import { PLByMindsetWidget } from './analytics/PLByMindsetWidget';
import { PLByPlanAdherenceWidget } from './analytics/PLByPlanAdherenceWidget';
import { StrategyPerformanceBubbleChart } from './analytics/StrategyPerformanceBubbleChart';
import { OutcomeDistributionWidget } from './analytics/OutcomeDistributionWidget';

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
import { calculateStats } from '../lib/statsUtils';

interface AnalyticsProps {
    isDarkMode: boolean;
    trades: Trade[];
    userProfile: UserProfile;
    onViewChange: (view: string) => void;
    eaSession?: EASession | null;
}




const ComparisonView = ({ trades = [], isDarkMode, currencySymbol = '$' }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string }) => {
    const [compareMode, setCompareMode] = useState<'symbol' | 'strategy' | 'session'>('symbol');

    const getTradeSession = (t: Trade) => {
        const s = t.session && t.session !== 'Session' ? t.session : '';
        if (s.includes('Asia') || s.includes('Tokyo') || s.includes('Sydney')) return 'Asian';
        if (s.includes('London') && !s.includes('York')) return 'London';
        if (s.includes('Overlap') || (s.includes('London') && s.includes('York'))) return 'Overlap';
        if (s.includes('York')) return 'New York';
        
        // Fallback to time
        if (!t.time) return 'Unknown';
        const hour = parseInt(t.time.split(':')[0], 10);
        if (hour >= 0 && hour < 9) return 'Asian';
        if (hour >= 9 && hour < 14) return 'London';
        if (hour >= 14 && hour < 18) return 'Overlap';
        if (hour >= 18) return 'New York';
        return 'Unknown';
    };

    const symbols = useMemo(() => {
        const uniqueSymbols = Array.from(new Set(trades.map(t => t.pair.toUpperCase()))).sort();
        return uniqueSymbols.map(s => ({ value: s, label: s }));
    }, [trades]);

    const strategies = useMemo(() => {
        const allTags = trades.flatMap(t => t.tags || []);
        const uniqueTags = Array.from(new Set(allTags)).sort();
        return uniqueTags.map(s => ({ value: s, label: s }));
    }, [trades]);

    const sessions = [
        { value: 'Asian', label: 'Asian Session' },
        { value: 'London', label: 'London Session' },
        { value: 'Overlap', label: 'London/NY Overlap' },
        { value: 'New York', label: 'New York Session' }
    ];

    const currentOptions = useMemo(() => {
        if (compareMode === 'symbol') return symbols;
        if (compareMode === 'strategy') return strategies;
        return sessions;
    }, [compareMode, symbols, strategies]);

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

    // Update selections when mode changes
    useEffect(() => {
        if (compareMode === 'session') {
            setSymbolA('London');
            setSymbolB('London');
            setRangeA('this_month');
            setRangeB('last_month');
        } else {
            setSymbolA(currentOptions[0]?.value || '');
            setSymbolB(currentOptions[1]?.value || '');
        }
    }, [compareMode]);

    const filterByRange = (tradeList: Trade[], range: string) => {
        const sastNow = getSASTDateTime();
        const [year, month] = sastNow.date.split('-').map(Number);
        
        const startOfMonth = new Date(year, month - 1, 1);
        const startOfLastMonth = new Date(year, month - 2, 1);
        const endOfLastMonth = new Date(year, month - 1, 0);
        const startOfYear = new Date(year, 0, 1);

        return tradeList.filter(t => {
            const tradeDate = new Date(t.date);
            if (range === 'this_month') return tradeDate >= startOfMonth;
            if (range === 'last_month') return tradeDate >= startOfLastMonth && tradeDate <= endOfLastMonth;
            if (range === 'this_year') return tradeDate >= startOfYear;
            return true;
        });
    };

    const getPreviousTrades = (tradeList: Trade[], range: string) => {
        const sastNow = getSASTDateTime();
        const [year, month] = sastNow.date.split('-').map(Number);
        
        if (range === 'all') return [];

        if (range === 'this_month') {
            const startOfLastMonth = new Date(year, month - 2, 1);
            const endOfLastMonth = new Date(year, month - 1, 0);
            return tradeList.filter(t => {
                const d = new Date(t.date);
                return d >= startOfLastMonth && d <= endOfLastMonth;
            });
        }

        if (range === 'last_month') {
            const startOfPrevMonth = new Date(year, month - 3, 1);
            const endOfPrevMonth = new Date(year, month - 2, 0);
            return tradeList.filter(t => {
                const d = new Date(t.date);
                return d >= startOfPrevMonth && d <= endOfPrevMonth;
            });
        }

        if (range === 'this_year') {
            const startOfPrevYear = new Date(year - 1, 0, 1);
            const endOfPrevYear = new Date(year - 1, 11, 31);
            return tradeList.filter(t => {
                const d = new Date(t.date);
                return d >= startOfPrevYear && d <= endOfPrevYear;
            });
        }

        return [];
    };

    const tradesA = useMemo(() => {
        const filtered = trades.filter(t => {
            if (compareMode === 'symbol') return t.pair.toUpperCase() === symbolA;
            if (compareMode === 'strategy') return (t.tags || []).includes(symbolA);
            if (compareMode === 'session') return getTradeSession(t) === symbolA;
            return false;
        });
        return filterByRange(filtered, rangeA);
    }, [trades, symbolA, rangeA, compareMode]);

    const tradesB = useMemo(() => {
        const filtered = trades.filter(t => {
            if (compareMode === 'symbol') return t.pair.toUpperCase() === symbolB;
            if (compareMode === 'strategy') return (t.tags || []).includes(symbolB);
            if (compareMode === 'session') return getTradeSession(t) === symbolB;
            return false;
        });
        return filterByRange(filtered, rangeB);
    }, [trades, symbolB, rangeB, compareMode]);

    const prevTradesA = useMemo(() => {
        const filtered = trades.filter(t => {
            if (compareMode === 'symbol') return t.pair.toUpperCase() === symbolA;
            if (compareMode === 'strategy') return (t.tags || []).includes(symbolA);
            if (compareMode === 'session') return getTradeSession(t) === symbolA;
            return false;
        });
        return getPreviousTrades(filtered, rangeA);
    }, [trades, symbolA, rangeA, compareMode]);

    const prevTradesB = useMemo(() => {
        const filtered = trades.filter(t => {
            if (compareMode === 'symbol') return t.pair.toUpperCase() === symbolB;
            if (compareMode === 'strategy') return (t.tags || []).includes(symbolB);
            if (compareMode === 'session') return getTradeSession(t) === symbolB;
            return false;
        });
        return getPreviousTrades(filtered, rangeB);
    }, [trades, symbolB, rangeB, compareMode]);


    const getStats = (tradesList: Trade[]) => {
        const wins = tradesList.filter(t => t.result === 'Win');
        const losses = tradesList.filter(t => t.result === 'Loss');
        const total = tradesList.length || 1;
        const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
        const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
        const netProfit = grossProfit - grossLoss;
        const winRate = (wins.length / total) * 100;
        const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 9.9 : 0);

        return { netProfit, winRate, profitFactor: profitFactor.toFixed(1), total: tradesList.length };
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

    const getDelta = (valA: number, valB: number, isPercentage = false) => {
        if (valB === 0) return null;
        const diff = valA - valB;
        const percent = (diff / Math.abs(valB)) * 100;
        return {
            value: diff,
            percent: percent.toFixed(1),
            isPositive: diff >= 0
        };
    };

    const deltas = {
        netProfit: getDelta(statsA.netProfit, statsB.netProfit),
        winRate: getDelta(statsA.winRate, statsB.winRate),
        profitFactor: getDelta(parseFloat(statsA.profitFactor), parseFloat(statsB.profitFactor)),
        total: getDelta(statsA.total, statsB.total)
    };

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
            {/* Comparison Mode Switcher */}
            <div className={`p-1.5 rounded-2xl border flex items-center w-fit gap-1 mx-auto ${isDarkMode ? 'bg-[#111] border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                <button
                    onClick={() => setCompareMode('symbol')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${compareMode === 'symbol' 
                        ? (isDarkMode ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-black shadow-sm') 
                        : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                    Symbol
                </button>
                <button
                    onClick={() => setCompareMode('strategy')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${compareMode === 'strategy' 
                        ? (isDarkMode ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-black shadow-sm') 
                        : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                    Strategy
                </button>
                <button
                    onClick={() => setCompareMode('session')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${compareMode === 'session' 
                        ? (isDarkMode ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-black shadow-sm') 
                        : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                    Session
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label={compareMode === 'symbol' ? "Symbol A" : compareMode === 'strategy' ? "Strategy A" : "Session A"}
                        value={symbolA}
                        onChange={setSymbolA}
                        options={currentOptions}
                        isDarkMode={isDarkMode}
                        icon={compareMode === 'symbol' ? Coins : compareMode === 'strategy' ? Target : Clock}
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
                        label={compareMode === 'symbol' ? "Symbol B" : compareMode === 'strategy' ? "Strategy B" : "Session B"}
                        value={symbolB}
                        onChange={setSymbolB}
                        options={currentOptions}
                        isDarkMode={isDarkMode}
                        icon={compareMode === 'symbol' ? Coins : compareMode === 'strategy' ? Target : Clock}
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

            <div className="relative">
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
                        <div key={idx} className={`p-8 rounded-[32px] border relative ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${panel.bg} ${panel.color}`}>
                                        {compareMode === 'symbol' ? <BarChart3 size={20} /> : compareMode === 'strategy' ? <Target size={20} /> : <Clock size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{panel.label || (compareMode === 'symbol' ? 'Select Symbol' : compareMode === 'strategy' ? 'Select Strategy' : 'Select Session')}</h3>
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

                {/* Delta Indicators overlay for MD+ screens */}
                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex-col gap-6 z-10 items-center pointer-events-none">
                    {deltas.netProfit && (
                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-black border backdrop-blur-md shadow-xl ${deltas.netProfit.isPositive ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/20 border-rose-500/30 text-rose-500'}`}>
                            {deltas.netProfit.isPositive ? '+' : ''}{deltas.netProfit.percent}%
                        </div>
                    )}
                    {deltas.winRate && (
                         <div className={`px-3 py-1.5 rounded-full text-[10px] font-black border backdrop-blur-md shadow-xl ${deltas.winRate.isPositive ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/20 border-rose-500/30 text-rose-500'}`}>
                            {deltas.winRate.isPositive ? '+' : ''}{deltas.winRate.percent}%
                        </div>
                    )}
                </div>
            </div>


            <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold tracking-tight">Comparative Equity Curve</h3>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-sm shadow-indigo-500/5">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{symbolA || '---'}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm shadow-amber-500/5">
                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">{symbolB || '---'}</span>
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

const Analytics: React.FC<AnalyticsProps> = ({ isDarkMode, trades: rawTrades = [], userProfile, eaSession }) => {
    const trades = useMemo(() => {
        return [...rawTrades].sort((a, b) => {
            const dateTimeA = new Date(`${a.date}T${a.time}`);
            const dateTimeB = new Date(`${b.date}T${b.time}`);
            return dateTimeA.getTime() - dateTimeB.getTime();
        });
    }, [rawTrades]);
    const [activeTab, setActiveTab] = useState<'overview' | 'time' | 'growth' | 'discipline' | 'comparison'>('overview');
    const [activeInfo, setActiveInfo] = useState<{ title: string, content: string } | null>(null);
    
    const currentPlan = userProfile?.plan || APP_CONSTANTS.PLANS.FREE;
    const features = PLAN_FEATURES[currentPlan];

    const handlePrintReport = () => {
        window.print();
    };

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
        'currencyStrength', 'tradeExit'
    ]);

    const [growthOrder, setGrowthOrder] = useLocalStorage('analytics_growth_order', [
        'outcomeDist', 'perfByPair', 'strategyPerf', 'executionTable'
    ]);

    const [disciplineOrder, setDisciplineOrder] = useLocalStorage('analytics_discipline_order_v2', [
        'tiltScore', 'riskReward', 'plAdherence', 'radar', 'plMindset'
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
            'symbolPerformance', 'monthlyPerformance', 'currencyStrength', 'tradeExit'
        ];
        const defaultGrowth = ['outcomeDist', 'perfByPair', 'strategyPerf', 'executionTable'];
        const defaultDiscipline = ['tiltScore', 'riskReward', 'plAdherence', 'radar', 'plMindset'];

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
        const results = calculateStats(trades);
        return {
            netProfit: results.netProfit,
            grossProfit: results.grossProfit,
            grossLoss: results.grossLoss,
            winRate: results.winRate.toFixed(1),
            profitFactor: results.profitFactor.toFixed(1),
            avgWin: results.avgWin,
            avgLoss: results.avgLoss,
            rrRatio: results.rrRatio.toFixed(2),
            totalTrades: results.totalTrades
        };
    }, [trades]);

    // Calculate effective initial balance based on Plan and Bridge Data
    const effectiveInitialBalance = useMemo(() => {
        const isPro = userProfile.plan === APP_CONSTANTS.PLANS.HOBBY; // PRO TIER
        const isPremium = userProfile.plan === APP_CONSTANTS.PLANS.STANDARD; // PREMIUM
        
        // Use bridge balance if available and user is on paid plan
        if ((isPro || isPremium) && eaSession?.data?.account?.balance !== undefined) {
             // To match the bridge balance at the end, we calculate back from current bridge balance
             // Start = CurrentBridgeBalance - SumOfAllTradePnLs
             const totalPnL = (trades || []).reduce((acc, t) => acc + t.pnl, 0);
             return eaSession.data.account.balance - totalPnL;
        }
        
        return userProfile?.initialBalance || 0;
    }, [userProfile, eaSession, trades]);

    const equityData = useMemo(() => {
        const safeTrades = trades || [];
        let cumulative = effectiveInitialBalance;
        const data = [cumulative];
        const sortedTrades = [...safeTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        sortedTrades.forEach(t => {
            cumulative += t.pnl;
            data.push(cumulative);
        });
        return data;
    }, [trades, effectiveInitialBalance]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'time', label: 'Time Analysis', icon: Clock },
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
                        startingBalance={effectiveInitialBalance}
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


            // Growth Widgets
            case 'outcomeDist':
                return <OutcomeDistributionWidget trades={trades} isDarkMode={isDarkMode} />;
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


            case 'outcomeDist': return 'col-span-12 lg:col-span-4';
            case 'perfByPair': return 'col-span-12 lg:col-span-8';
            case 'strategyPerf': return 'col-span-12';
            case 'executionTable': return 'col-span-12';

            case 'tiltScore': return 'col-span-12 md:col-span-6 lg:col-span-3';
            case 'riskReward': return 'col-span-12 md:col-span-6 lg:col-span-3';
            case 'plAdherence': return 'col-span-12 lg:col-span-6';
            case 'radar': case 'plMindset': return 'col-span-12 lg:col-span-6';
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
            {/* Print View (Hidden on Screen) */}
            <div className="hidden print:block fixed inset-0 z-[9999] bg-white">
                <ReportView 
                    trades={trades} 
                    userProfile={userProfile} 
                    monthStr={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} 
                />
            </div>

            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Performance Analytics</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Visual breakdown of your trading performance.</p>
                </div>
                <div className="flex items-center gap-3">
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
                
                <button
                    onClick={handlePrintReport}
                    className={`p-3 rounded-[20px] border transition-all ${isDarkMode ? 'bg-[#121214] border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900'}`}
                    title="Print Report"
                >
                    <Printer size={20} />
                </button>
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


                {activeTab === 'time' && (
                    <div className="animate-in fade-in duration-500 pb-20">
                        <PerformanceBySession trades={trades} isDarkMode={isDarkMode} currencySymbol={userProfile?.currencySymbol || '$'} />
                    </div>
                )}

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
                        <div className="animate-in fade-in duration-500 grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
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
