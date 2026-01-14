
import React, { useMemo, useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, DollarSign, BarChart2, Zap, Coins, GripVertical, UserCircle, Wallet, Layout, Cpu, ArrowRight, Lock, Info, X } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';

import { Trade, DailyBias, UserProfile } from '../types';
import SessionClock from './SessionClock';
import { SortableWidget } from './ui/SortableWidget';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import OpenPositions from './OpenPositions';
import { Skeleton } from './ui/Skeleton';
import { Tooltip } from './ui/Tooltip';


interface DashboardProps {
    isDarkMode: boolean;
    trades: Trade[];
    dailyBias: DailyBias[];
    onUpdateBias: (bias: DailyBias) => void;
    userProfile: UserProfile;
    onViewChange: (view: string) => void;
    eaSession?: any;
    isLoading?: boolean;
}

// --- WIDGET COMPONENTS ---

const DashboardSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-32 p-6 rounded-2xl border ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-md'}`}>
                    <Skeleton className="w-8 h-8 rounded-lg mb-4" />
                    <Skeleton className="w-24 h-6 mb-2" />
                    <Skeleton className="w-16 h-3" />
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`col-span-1 lg:col-span-2 h-[250px] p-6 rounded-2xl border ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-md'}`}>
                <Skeleton className="w-32 h-6 mb-6" />
                <Skeleton className="w-full h-32" />
            </div>
            <div className={`col-span-1 h-[250px] p-6 rounded-2xl border ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-md'}`}>
                <Skeleton className="w-32 h-6 mb-6" />
                <div className="space-y-3">
                    <Skeleton className="w-full h-10" />
                    <Skeleton className="w-full h-10" />
                    <Skeleton className="w-full h-10" />
                </div>
            </div>
        </div>
    </div>
);

const EASetupPrompt = ({ isDarkMode, onSetupClick }: { isDarkMode: boolean, onSetupClick: () => void }) => (
    <div className={`mb-8 p-8 rounded-[32px] border-2 border-dashed flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Cpu size={32} />
            </div>
            <div>
                <h3 className="text-xl font-black mb-1">Finish your EA Setup</h3>
                <p className={`text-sm max-w-md ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                    You've selected EA Sync, but we haven't received any data yet. Complete the setup to see your real-time trades and equity.
                </p>
            </div>
        </div>
        <button
            onClick={onSetupClick}
            className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20 flex items-center gap-2 shrink-0"
        >
            Setup Guide <ArrowRight size={18} />
        </button>
    </div>
);

const StatCard = ({ label, value, subtext, trend, isDarkMode, icon: Icon, colorClass, tooltip, onInfoClick }: any) => (
    <div className={`h-full p-6 rounded-2xl border transition-all hover:shadow-lg ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-md'}`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-[#27272a]' : 'bg-slate-50'}`}>
                <Icon size={20} className={colorClass} />
            </div>
            {trend && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${trend > 0 ? 'bg-teal-500/10 text-teal-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <h3 className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
        <div className="flex items-center gap-2">
            <p className={`text-xs font-medium uppercase tracking-wider opacity-50 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{label}</p>
            {tooltip && (
                <Tooltip content={tooltip} isDarkMode={isDarkMode}>
                    <svg 
                        onClick={onInfoClick}
                        xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                </Tooltip>
            )}
        </div>
        {subtext && <p className="text-xs text-zinc-500 mt-2">{subtext}</p>}
    </div>
);

const EquityCurveWidget = ({ trades, equityData, isDarkMode, currencySymbol }: { trades: Trade[], equityData: number[], isDarkMode: boolean, currencySymbol: string }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const generatePath = (data: number[], width: number, height: number) => {
        if (data.length < 2) return "";
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
            setMousePos({ x: (index / (equityData.length - 1)) * 300, y: 0 }); // 300 is viewBox width
        }
    };

    const min = Math.min(...equityData, 0);
    const max = Math.max(...equityData, 100);
    const range = max - min || 1;
    const hoverY = hoverIndex !== null ? 100 - ((equityData[hoverIndex] - min) / range) * 100 : 0;

    return (
        <div className={`p-6 rounded-2xl border flex flex-col min-h-[250px] relative overflow-hidden ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-md'}`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold">Equity Curve</h3>
                {hoverIndex !== null && (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <span className={`text-sm font-black font-mono ${equityData[hoverIndex] >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {equityData[hoverIndex] >= 0 ? '+' : ''}{currencySymbol}{equityData[hoverIndex].toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold opacity-40 uppercase ml-2">Trade #{hoverIndex}</span>
                    </div>
                )}
            </div>
            <div className="flex-1 relative">
                {equityData.length > 1 ? (
                    <svg 
                        viewBox="0 0 300 100" 
                        className="w-full h-full overflow-visible cursor-crosshair"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoverIndex(null)}
                    >
                        <defs><linearGradient id="curveGradientDash" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
                        <path d={generatePath(equityData, 300, 100)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={`${generatePath(equityData, 300, 100)} L 300,100 L 0,100 Z`} fill="url(#curveGradientDash)" />
                        
                        {hoverIndex !== null && (
                            <>
                                <line x1={mousePos.x} y1="0" x2={mousePos.x} y2="100" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
                                <circle cx={mousePos.x} cy={hoverY} r="3" fill="#3b82f6" stroke={isDarkMode ? "#18181b" : "white"} strokeWidth="1" />
                            </>
                        )}
                    </svg>
                ) : (
                    <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-bold uppercase">Insufficient Data</div>
                )}
            </div>
        </div>
    );
};

const RecentTrades = ({ isDarkMode, trades, symbol }: { isDarkMode: boolean, trades: Trade[], symbol: string }) => (
    <div className={`h-full p-6 rounded-2xl border flex flex-col ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-md'}`}>
        <h3 className="font-bold mb-4">Recent Activity</h3>
        <div className="space-y-3 flex-1 overflow-auto custom-scrollbar pr-2">
            {trades.slice(0, 5).map(trade => (
                <div key={trade.id} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-8 rounded-full ${trade.result === 'Win' ? 'bg-teal-500' : trade.result === 'Loss' ? 'bg-rose-500' : 'bg-gray-400'}`} />
                        <div>
                            <p className="font-bold text-xs">{trade.pair}</p>
                            <p className="text-[10px] opacity-60 uppercase">{trade.direction}</p>
                        </div>
                    </div>
                    <span className={`font-mono text-xs font-bold ${trade.pnl > 0 ? 'text-teal-500' : trade.pnl < 0 ? 'text-rose-500' : 'text-gray-500'}`}>
                        {trade.pnl > 0 ? '+' : ''}{symbol}{trade.pnl}
                    </span>
                </div>
            ))}
            {trades.length === 0 && (
                <div className="flex items-center justify-center h-full opacity-30 text-xs">No recent trades</div>
            )}
        </div>
    </div>
);

const DailyBiasWidget = ({ isDarkMode, dailyBias, onUpdateBias, onInfoClick }: { isDarkMode: boolean, dailyBias: DailyBias[], onUpdateBias: (b: DailyBias) => void, onInfoClick?: () => void }) => {
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-CA');
    });

    const getBiasForDate = (date: string) => dailyBias.find(b => b.date === date)?.bias || 'Neutral';

    const handleCycleBias = (date: string) => {
        const current = getBiasForDate(date);
        let next: 'Bullish' | 'Bearish' | 'Neutral' = 'Bullish';
        if (current === 'Bullish') next = 'Bearish';
        else if (current === 'Bearish') next = 'Neutral';
        else next = 'Bullish';
        onUpdateBias({ date, bias: next });
    };

    return (
        <div className={`h-full p-6 rounded-2xl border flex flex-col ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-100 shadow-md'}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold flex items-center gap-2"><Zap size={18} className="text-yellow-500" /> Daily Bias</h3>
                    <Tooltip content="Track your daily market outlook to stay aligned with higher time-frame direction." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                    </Tooltip>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-2 flex-1 items-center">
                {days.map(date => {
                    const bias = getBiasForDate(date);
                    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                    const isToday = date === new Date().toLocaleDateString('en-CA');
                    return (
                        <button
                            key={date}
                            onClick={() => handleCycleBias(date)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all h-full ${bias === 'Bullish' ? 'bg-teal-500/10 text-teal-500 border border-teal-500/20' :
                                bias === 'Bearish' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                    isDarkMode ? 'bg-zinc-800 text-zinc-500 border border-zinc-700' : 'bg-slate-100 text-slate-400 border border-slate-200'
                                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                        >
                            <span className="text-[10px] font-bold mb-1">{dayName}</span>
                            {bias === 'Bullish' && <ArrowUpRight size={16} />}
                            {bias === 'Bearish' && <ArrowDownRight size={16} />}
                            {bias === 'Neutral' && <div className="w-4 h-4 rounded-full border-2 border-current border-dashed" />}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ isDarkMode, trades, dailyBias, onUpdateBias, userProfile, onViewChange, eaSession, isLoading }) => {
    // Robust free tier check
    const isFreeTier = !userProfile || userProfile.plan === 'FREE TIER (JOURNALER)';
    const [activeInfo, setActiveInfo] = useState<{ title: string, content: string } | null>(null);

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

    if (isLoading) {
        return (
            <div className={`w-full h-full overflow-y-auto p-8 font-sans ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-slate-50 text-slate-900'}`}>
                <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <Skeleton className="w-64 h-10" />
                        <Skeleton className="w-48 h-4" />
                    </div>
                    <Skeleton className="w-80 h-20 rounded-3xl" />
                </header>
                <DashboardSkeleton isDarkMode={isDarkMode} />
            </div>
        );
    }

    // Widgets State for Reordering
    const [widgetOrder, setWidgetOrder] = useLocalStorage('dashboard_widget_order', [
        'dailyBias',
        'recentTrades',
        'equityCurve',
        'openPositions'
    ]);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            setWidgetOrder((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Calculate Stats
    const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
    const isPro = userProfile.plan === 'PRO TIER (ANALYSTS)';
    
    // If EA Session exists, use bridge balance as the source of truth for current balance
    // For PRO users, if not connected, show 0.00
    const currentBalance = eaSession?.data?.account?.balance !== undefined
        ? eaSession.data.account.balance
        : (isPro ? 0 : (userProfile.initialBalance + totalPnL));

    const wins = trades.filter(t => t.result === 'Win');
    const losses = trades.filter(t => t.result === 'Loss');
    const winRate = trades.length > 0 ? ((wins.length / trades.length) * 100).toFixed(1) : 0;

    const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? "9.9" : "0.00");

    const equityData = useMemo(() => {
        let cumulative = 0;
        const data = [0];
        [...trades]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .forEach(t => {
                cumulative += t.pnl;
                data.push(cumulative);
            });
        return data;
    }, [trades]);

    const totalFloatingPnL = useMemo(() => {
        return (eaSession?.data?.openPositions || []).reduce((sum: number, pos: any) => sum + pos.profit, 0);
    }, [eaSession]);

    const planBadge = useMemo(() => {
        const plan = userProfile?.plan;
        if (plan === 'FREE TIER (JOURNALER)') {
            return { label: 'FREE', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' };
        }
        if (plan === 'PRO TIER (ANALYSTS)') {
            return { label: 'PRO', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
        }
        if (plan === 'PREMIUM (MASTERS)') {
            return { label: 'PREMIUM', color: 'bg-[#FF4F01]/10 text-[#FF4F01] border-[#FF4F01]/20' };
        }
        return null;
    }, [userProfile?.plan]);

    const LockedView = ({ title, subtitle }: { title: string, subtitle: string }) => (
        <div className={`h-full w-full p-6 rounded-2xl border flex flex-col items-center justify-center text-center relative overflow-hidden ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-md'}`}>
            <div className="absolute inset-0 bg-black/5 dark:bg-white/[0.02] backdrop-blur-[2px] z-10" />
            <div className="relative z-20 flex flex-col items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#FF4F01]/10 text-[#FF4F01] shadow-xl shadow-[#FF4F01]/10">
                    <Lock size={24} />
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase tracking-widest mb-1">{title}</h4>
                    <p className="text-[10px] font-bold opacity-40 px-6 leading-relaxed">{subtitle}</p>
                </div>
                <button 
                    onClick={() => onViewChange('settings')}
                    className="mt-2 px-6 py-2 bg-[#FF4F01] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#FF4F01]/20 hover:scale-105 transition-all"
                >
                    Upgrade to Unlock
                </button>
            </div>
        </div>
    );

    const renderWidget = (id: string) => {
        if (isFreeTier && (id === 'dailyBias' || id === 'openPositions')) {
            return (
                <LockedView 
                    title={id === 'dailyBias' ? "Daily Bias" : "Open Positions"} 
                    subtitle={id === 'dailyBias' ? "Stay aligned with market direction. Upgrade to PRO to use the Daily Bias tracker." : "Monitor your live trades in real-time. Upgrade to PRO to unlock the Live Bridge."} 
                />
            );
        }

        switch (id) {
            case 'dailyBias':
                return <DailyBiasWidget 
                    isDarkMode={isDarkMode} 
                    dailyBias={dailyBias} 
                    onUpdateBias={onUpdateBias} 
                    onInfoClick={() => setActiveInfo({
                        title: "Daily Bias",
                        content: "Daily Bias tracks your overarching market sentiment for the day. By recording whether you are Bullish, Bearish, or Neutral before you trade, you can later analyze if your trades were aligned with your higher-time-frame outlook.\n\nSuccessful traders often find that their best performance comes when they trade in the direction of their pre-defined bias."
                    })}
                />;
            case 'recentTrades':
                return <RecentTrades isDarkMode={isDarkMode} trades={trades} symbol={userProfile.currencySymbol} />;
            case 'equityCurve':
                return <EquityCurveWidget trades={trades} equityData={equityData} isDarkMode={isDarkMode} currencySymbol={userProfile.currencySymbol} />;
            case 'openPositions':
                return (
                    <div className={`h-full p-6 rounded-2xl border flex flex-col ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-100 shadow-md'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold flex items-center gap-2"><Activity size={18} className="text-emerald-500" /> Open Positions</h3>
                            {/* Display Total Floating P/L here */}
                            <div className="text-right">
                                <div className={`text-lg font-black font-mono leading-none ${totalFloatingPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {totalFloatingPnL >= 0 ? '+' : ''}{userProfile.currencySymbol}{totalFloatingPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Total Floating P/L</div>
                            </div>
                        </div>
                        <OpenPositions
                            positions={(eaSession?.data?.openPositions || []).map((p: any) => ({
                                ...p,
                                lots: p.volume,
                                openTime: p.time ? new Date(p.time * 1000).toISOString() : '',
                                openPrice: p.open_price,
                                currentPrice: p.current_price,
                                profit: p.profit
                            }))}
                            isDarkMode={isDarkMode}
                            currencySymbol={userProfile.currencySymbol}
                            lastUpdated={eaSession?.last_updated}
                        />
                    </div>
                );
            default: return null;
        }
    };

    // Helper to determine col-span based on ID
    const getColSpan = (id: string) => {
        if (id === 'dailyBias' || id === 'openPositions') return 'col-span-1 lg:col-span-2 min-h-[250px]';
        return 'col-span-1 min-h-[250px]';
    };

    return (
        <div className={`w-full h-full overflow-y-auto p-8 font-sans ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-slate-50 text-slate-900'}`}>
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold tracking-tight">{userProfile.accountName || 'Trading Dashboard'}</h1>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                            {userProfile.experienceLevel}
                        </span>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Welcome back, {userProfile.name}. Analyzing markets from {userProfile.country}.</p>
                </div>

                <div className={`flex items-center gap-6 p-4 rounded-3xl border ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-md'}`}>
                    <div className="flex items-center gap-3 border-r pr-6 border-zinc-800/50">
                        <div className="w-10 h-10 rounded-2xl bg-[#FF4F01]/10 flex items-center justify-center text-[#FF4F01] shadow-lg">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest leading-none mb-1">Account Balance</div>
                                {eaSession?.data?.account?.is_demo !== undefined && (
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${eaSession.data.account.is_demo ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                        {eaSession.data.account.is_demo ? 'Demo' : 'Real'}
                                    </span>
                                )}
                            </div>
                            <div className="text-xl font-black font-mono tracking-tighter leading-none">{userProfile.currencySymbol}{currentBalance.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <div className="text-xs font-black uppercase tracking-wider">{userProfile.name}</div>
                            <div className="text-[10px] opacity-40 font-bold uppercase">{userProfile.tradingStyle}</div>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl overflow-hidden">
                                {userProfile.avatarUrl ? (
                                    <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle size={28} />
                                )}
                            </div>
                            {planBadge && (
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${planBadge.color}`}>
                                    {planBadge.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* EA Setup Prompt (For new EA users) */}
            {trades.length === 0 && userProfile.syncMethod === 'EA_CONNECT' && !eaSession && (
                <EASetupPrompt isDarkMode={isDarkMode} onSetupClick={() => onViewChange('ea-setup')} />
            )}

            {/* Session Clock Widget (Fixed at Top) */}
            <SessionClock isDarkMode={isDarkMode} />

            {/* Stats Row (Fixed) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    label="Net PnL" 
                    value={`${userProfile.currencySymbol}${totalPnL.toLocaleString()}`} 
                    isDarkMode={isDarkMode} 
                    icon={DollarSign} 
                    colorClass="text-blue-500" 
                    tooltip="The total realized profit or loss from all closed trades."
                    onInfoClick={() => setActiveInfo({
                        title: "Net P&L",
                        content: "Net P&L (Profit and Loss) is the total amount of money you have made or lost from all closed trades, after accounting for commissions and swaps.\n\nIt is the 'Bottom Line' of your trading journal and represents your actual realized growth or decay of capital."
                    })}
                />
                <StatCard 
                    label="Win Rate" 
                    value={`${winRate}%`} 
                    subtext={`${wins.length}W - ${losses.length}L`} 
                    isDarkMode={isDarkMode} 
                    icon={Activity} 
                    colorClass="text-purple-500" 
                    tooltip="The percentage of closed trades that resulted in a profit."
                    onInfoClick={() => setActiveInfo({
                        title: "Win Rate",
                        content: "Win Rate is the percentage of your total trades that ended in a profit. It is calculated as (Winning Trades / Total Trades) * 100.\n\nWhile a high win rate is encouraging, it must be balanced with your Reward-to-Risk ratio. A trader with a 30% win rate can still be highly profitable if their average win is much larger than their average loss."
                    })}
                />
                <StatCard 
                    label="Profit Factor" 
                    value={profitFactor} 
                    isDarkMode={isDarkMode} 
                    icon={TrendingUp} 
                    colorClass="text-teal-500" 
                    tooltip="Gross Profit divided by Gross Loss. A value above 1.0 means profitability."
                    onInfoClick={() => setActiveInfo({
                        title: "Profit Factor",
                        content: "Profit Factor is a measure of how much profit you make for every dollar you lose. It is calculated as Gross Profit / Gross Loss.\n\nA profit factor above 1.0 indicates a profitable strategy. Professional traders typically aim for a profit factor between 1.5 and 2.5."
                    })}
                />
                <StatCard 
                    label="Total Trades" 
                    value={trades.length} 
                    isDarkMode={isDarkMode} 
                    icon={BarChart2} 
                    colorClass="text-orange-500" 
                    tooltip="The total number of trades logged in your history."
                    onInfoClick={() => setActiveInfo({
                        title: "Total Trades",
                        content: "Total Trades represents the volume of activity in your journal. It includes all Wins, Losses, and Breakeven trades.\n\nTracking total trades is essential for statistical significance. The more trades you log, the more reliable your other analytics (like Win Rate and Profit Factor) become."
                    })}
                />
            </div>

            {/* Draggable Widget Grid */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
                        {widgetOrder.map(id => (
                            <SortableWidget key={id} id={id} className={getColSpan(id)}>
                                {renderWidget(id)}
                            </SortableWidget>
                        ))}
                    </div>
                </SortableContext>
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

export default Dashboard;
