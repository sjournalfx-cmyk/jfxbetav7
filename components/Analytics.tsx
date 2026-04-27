import React, { useMemo, useState, useEffect } from 'react';
import { Trade, UserProfile, EASession, CashTransaction } from '../types';
import {
    TrendingUp, Info, Activity,
    Target, LineChart, Shield, X, Printer, Clock, Gauge, Zap, TrendingDown, LayoutDashboard, LayoutGrid, Coins
} from 'lucide-react';

import { PerformanceBySession } from './analytics/PerformanceBySession';
import { ReportView } from './analytics/ReportView';
import { PerformanceByPairWidget } from './analytics/PerformanceByPairWidget';
import { CurrencyStrengthMeter } from './analytics/CurrencyStrengthMeter';
import { PairDistributionTreemapWidget } from './analytics/PairDistributionTreemapWidget';
import { EquityCurveWidget } from './analytics/EquityCurveWidget';
import { LargestWinLossWidget } from './analytics/LargestWinLossWidget';
import { MomentumStreakWidget } from './analytics/MomentumStreakWidget';
import { SymbolPerformanceWidget } from './analytics/SymbolPerformanceWidget';
import { DrawdownOverTimeWidget } from './analytics/DrawdownOverTimeWidget';
import { TiltScoreWidget } from './analytics/TiltScoreWidget';
import { PLByMindsetWidget } from './analytics/PLByMindsetWidget';
import { PLByPlanAdherenceWidget } from './analytics/PLByPlanAdherenceWidget';
import { StrategyPerformancePieChart } from './analytics/StrategyPerformancePieChart';
import { TradingMistakesBarChartWidget } from './analytics/TradingMistakesBarChartWidget';
import { OutcomeDistributionWidget } from './analytics/OutcomeDistributionWidget';
import { RobustnessLab } from './analytics/RobustnessLab';
import { PerformanceMatrixWidget } from './analytics/PerformanceMatrixWidget';
import { ComparisonView } from './analytics/ComparisonView';
import { TradeGradeDistributionWidget } from './analytics/TradeGradeDistributionWidget';
import { PsychologicalSlipWidget } from './analytics/PsychologicalSlipWidget';
import { TimeAnalysisMatrixWidget } from './analytics/TimeAnalysisMatrixWidget';
import { DetailedStatistics } from './analytics/DetailedStatistics';
import { CashTransactionsView } from './analytics/CashTransactionsView';
import { LotSizePnLDistributionWidget, PairCorrelationMatrixWidget } from './analytics/CorrelationWidgets';

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
import { SortableWidget } from './ui/SortableWidget';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { APP_CONSTANTS } from '../lib/constants';
import { calculateStats } from '../lib/statsUtils';
import { getCompletedTrades, sortTradesChronologically } from '../lib/analyticsUtils';

const safePnL = (value: unknown): number => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
};

interface AnalyticsProps {
  isDarkMode: boolean;
  trades: Trade[];
  userProfile: UserProfile;
  onViewChange: (view: string) => void;
  eaSession?: EASession | null;
  cashTransactions?: CashTransaction[];
}

const Analytics: React.FC<AnalyticsProps> = ({ isDarkMode, trades: rawTrades = [], userProfile, eaSession, cashTransactions = [] }) => {
    const trades = useMemo(() => {
        return sortTradesChronologically(rawTrades);
    }, [rawTrades]);

    const completedTrades = useMemo(() => getCompletedTrades(trades), [trades]);

    const [activeInfo, setActiveInfo] = useState<{ title: string, content: string } | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    
    const currencySymbol = userProfile?.currencySymbol || '$';

    const [allWidgetsOrder, setAllWidgetsOrder] = useLocalStorage('analytics_bento_order', [
      'winRate', 'profitFactor', 'grossProfit', 'grossLoss',
      'equityCurve', 'drawdown',
      'streakMomentum', 'symbolPerformance', 'largestWinLoss', 'currencyStrength', 'matrix', 'tradeExit',
      'outcomeDist', 'tiltScore', 'riskReward', 'plMindset', 'plAdherence', 'tradeGrade', 'psychSlip', 'timeMatrix'
    ]);

    const reportWidgets = useMemo(() => {
        return Array.from(new Set([
            ...allWidgetsOrder,
            'timeAnalysis',
            'performanceMatrix',
            'perfByPair',
            'strategyPerf',
            'executionTable'
        ]));
    }, [allWidgetsOrder]);

    const stats = useMemo(() => {
        return calculateStats(trades);
    }, [trades]);

    const effectiveInitialBalance = useMemo(() => {
        const isPro = userProfile.plan === APP_CONSTANTS.PLANS.HOBBY;
        const isPremium = userProfile.plan === APP_CONSTANTS.PLANS.STANDARD;
        if ((isPro || isPremium) && eaSession?.data?.account?.balance !== undefined) {
             const totalPnL = completedTrades.reduce((acc, t) => acc + safePnL(t.pnl), 0);
             return eaSession.data.account.balance - totalPnL;
        }
        return userProfile?.initialBalance || 0;
    }, [userProfile, eaSession, completedTrades]);

    const equityData = useMemo(() => {
        const safeTrades = completedTrades;
        let cumulative = effectiveInitialBalance;
        const data = [cumulative];
        safeTrades.forEach(t => {
            cumulative += safePnL(t.pnl);
            data.push(cumulative);
        });
        return data;
    }, [completedTrades, effectiveInitialBalance]);

    const psychologyInsights = useMemo(() => {
        const mindsets = ['Confident', 'Neutral', 'Hesitant', 'Anxious', 'FOMO'];
        const stats: Record<string, number> = {};
        mindsets.forEach(m => stats[m] = 0);
        completedTrades.forEach(t => {
            const m = t.mindset || 'Neutral';
            if (stats[m] !== undefined) stats[m] += safePnL(t.pnl);
        });
        const best = Object.entries(stats).sort((a, b) => b[1] - a[1])[0];
        
        const counts: Record<string, number> = { 'Followed Exactly': 0, 'Minor Deviation': 0, 'Major Deviation': 0, 'No Plan': 0 };
        completedTrades.forEach(t => {
            const a = t.planAdherence || 'No Plan';
            if (counts[a] !== undefined) counts[a]++;
        });
        const total = completedTrades.length || 1;
        const adherenceRate = (counts['Followed Exactly'] / total) * 100;
        
        return {
            bestMindset: best && best[1] > 0 ? best[0] : 'Confident',
            adherenceLevel: adherenceRate >= 70 ? 'High' : adherenceRate >= 40 ? 'Medium' : 'Low'
        };
    }, [completedTrades]);

    const renderWidget = (id: string) => {
        switch (id) {
            case 'winRate': return <div className={`h-full p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}><span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2"><Target size={14} className="text-indigo-500" /> Win Rate</span><div className="text-2xl font-black">{Number(stats.winRate).toFixed(1)}%</div></div>;
            case 'profitFactor': return <div className={`h-full p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}><span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2"><Gauge size={14} className="text-indigo-500" /> Profit Factor</span><div className="text-2xl font-black">{Number(stats.profitFactor).toFixed(1)}</div></div>;
            case 'grossProfit': return <div className={`h-full p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}><span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2"><TrendingUp size={14} className="text-emerald-500" /> Gross Profit</span><div className="text-2xl font-black text-emerald-500">+{currencySymbol}{stats.grossProfit.toLocaleString()}</div></div>;
            case 'grossLoss': return <div className={`h-full p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}><span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2"><TrendingDown size={14} className="text-rose-500" /> Gross Loss</span><div className="text-2xl font-black text-rose-500">-{currencySymbol}{stats.grossLoss.toLocaleString()}</div></div>;
            case 'equityCurve': return <EquityCurveWidget trades={completedTrades} equityData={equityData} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'drawdown': return <DrawdownOverTimeWidget trades={completedTrades} isDarkMode={isDarkMode} userProfile={userProfile} startingBalance={effectiveInitialBalance} />;
            case 'streakMomentum': return <MomentumStreakWidget trades={completedTrades} isDarkMode={isDarkMode} />;
            case 'symbolPerformance': return <SymbolPerformanceWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'largestWinLoss': return <LargestWinLossWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'currencyStrength': return <CurrencyStrengthMeter isDarkMode={isDarkMode} trades={completedTrades} />;
            case 'outcomeDist': return <OutcomeDistributionWidget trades={completedTrades} isDarkMode={isDarkMode} />;
            case 'tiltScore': return <TiltScoreWidget trades={completedTrades} isDarkMode={isDarkMode} />;
            case 'riskReward': return <div className={`h-full p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}><h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Activity size={20} className="text-indigo-500" /> Risk/Reward</h3><div className="space-y-6"><div className="flex justify-between items-end"><span className="text-sm opacity-60">Avg Win</span><span className="text-xl font-black text-emerald-500">{currencySymbol}{Math.round(stats.avgWin).toLocaleString()}</span></div><div className="flex justify-between items-end"><span className="text-sm opacity-60">Avg Loss</span><span className="text-xl font-black text-rose-500">{currencySymbol}{Math.round(stats.avgLoss).toLocaleString()}</span></div></div></div>;
            case 'plMindset': return <PLByMindsetWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'plAdherence': return <PLByPlanAdherenceWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'matrix': return <PerformanceMatrixWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'tradeGrade': return <TradeGradeDistributionWidget trades={completedTrades} isDarkMode={isDarkMode} />;
            case 'psychSlip': return <PsychologicalSlipWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'timeMatrix': return <TimeAnalysisMatrixWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            default: return null;
        }
    };

    const getColSpan = (id: string) => {
        switch (id) {
            case 'equityCurve': return 'col-span-12 lg:col-span-8';
            case 'drawdown': return 'col-span-12 lg:col-span-4';
            case 'winRate': case 'profitFactor': case 'grossProfit': case 'grossLoss': return 'col-span-12 sm:col-span-6 lg:col-span-3';
            case 'riskReward': case 'tradeGrade': return 'col-span-12 md:col-span-6 lg:col-span-4';
            case 'matrix': case 'psychSlip': case 'timeMatrix': return 'col-span-12';
            default: return 'col-span-12 md:col-span-6 lg:col-span-4';
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!active || !over || active.id === over.id) return;
        setAllWidgetsOrder((items) => {
            const oldIndex = items.indexOf(String(active.id));
            const newIndex = items.indexOf(String(over.id));
            return arrayMove(items, oldIndex, newIndex);
        });
    };

    const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'psychology' | 'time' | 'advanced' | 'comparison' | 'cash' | 'reports' | 'session'>('overview');

    const tabDefinitions = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'trades', label: 'Trade Analysis', icon: LineChart },
        { id: 'psychology', label: 'Psychology', icon: Target },
        { id: 'session', label: 'Session', icon: Zap },
        { id: 'time', label: 'Correlation Lab', icon: Clock },
        { id: 'advanced', label: 'Advanced', icon: Gauge },
        { id: 'comparison', label: 'Comparison', icon: Activity },
        { id: 'reports', label: 'Reports', icon: Shield },
        { id: 'cash', label: 'Transactions', icon: Coins }
    ];

    const widgetCategories = {
        overview: ['winRate', 'profitFactor', 'grossProfit', 'grossLoss', 'equityCurve', 'drawdown', 'currencyStrength', 'riskReward', 'tradeGrade'],
        trades: ['symbolPerformance', 'largestWinLoss', 'outcomeDist'],
        psychology: ['psychSlip', 'streakMomentum', 'tiltScore', 'plMindset', 'plAdherence'],
        time: ['matrix'],
        advanced: []
    };

    const renderCategoryWidgets = (category: string) => {
        const widgetIds = widgetCategories[category as keyof typeof widgetCategories] || [];
        return (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20 auto-rows-min">
                        {widgetIds.map(id => (
                            <SortableWidget key={id} id={id} className={getColSpan(id)}>
                                {renderWidget(id)}
                            </SortableWidget>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        );
    };

    return (
        <div className={`w-full h-full overflow-y-auto custom-scrollbar p-6 lg:p-10 font-sans ${isDarkMode ? 'bg-[#050505] text-zinc-200' : 'bg-[#F8FAFC] text-slate-900'}`}>
            <header className="mb-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight mb-2">Performance Analytics</h1>
                        <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Unified Performance Overview</p>
                    </div>
                </div>
                <div className={`flex gap-1 p-1.5 rounded-xl border overflow-x-auto ${isDarkMode ? 'bg-[#111] border-zinc-800' : 'bg-slate-100 border-slate-200'}`}>
                    {tabDefinitions.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id 
                                ? (isDarkMode ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-black shadow-sm') 
                                : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-700')}`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {activeTab === 'overview' && renderCategoryWidgets('overview')}
            
            {activeTab === 'trades' && (
                <div className="space-y-6 pb-20">
                    <div className="grid grid-cols-1 gap-4">
                        <SymbolPerformanceWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <LargestWinLossWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />
                        <OutcomeDistributionWidget trades={completedTrades} isDarkMode={isDarkMode} />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <PairDistributionTreemapWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />
                    </div>
                </div>
            )}

            {activeTab === 'psychology' && (
                <div className="space-y-6 pb-20">
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12">
                            <MomentumStreakWidget trades={completedTrades} isDarkMode={isDarkMode} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="col-span-1">
                            <TiltScoreWidget trades={completedTrades} isDarkMode={isDarkMode} />
                        </div>
                        <div className="col-span-1 md:col-span-1 lg:col-span-2">
                            <PLByMindsetWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PLByPlanAdherenceWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />
                        <div className={`py-4 px-0 sm:p-6 rounded-none sm:rounded-[24px] border h-full ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'} text-amber-500`}>
                                    <Activity size={18} />
                                </div>
                                <h3 className="text-lg font-bold tracking-tight">Psychology Insights</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <span className="text-sm opacity-70">Best Mindset</span>
                                    <span className="font-bold text-emerald-500">{psychologyInsights.bestMindset}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                    <span className="text-sm opacity-70">Plan Adherence</span>
                                    <span className={`font-bold ${psychologyInsights.adherenceLevel === 'High' ? 'text-emerald-500' : psychologyInsights.adherenceLevel === 'Medium' ? 'text-amber-500' : 'text-rose-500'}`}>{psychologyInsights.adherenceLevel}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'time' && (
                <div className="space-y-8 pb-20">
                    <LotSizePnLDistributionWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />

                    <div className="grid grid-cols-1 gap-8">
                        <PairCorrelationMatrixWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />
                    </div>

                    <PerformanceMatrixWidget trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />
                </div>
            )}

            {activeTab === 'advanced' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20 items-stretch">
                    <StrategyPerformancePieChart trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />
                    <TradingMistakesBarChartWidget trades={completedTrades} isDarkMode={isDarkMode} />
                </div>
            )}

            {activeTab === 'comparison' && <ComparisonView trades={completedTrades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />}
            
{activeTab === 'cash' && (
        <CashTransactionsView
          isDarkMode={isDarkMode}
          userProfile={userProfile}
          cashTransactions={cashTransactions}
        />
      )}

            {activeTab === 'reports' && (
                <div className="space-y-8 pb-20">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Detailed Performance Report</h2>
                        <button 
                            disabled
                            aria-disabled="true"
                            onClick={(e) => e.preventDefault()}
                            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all cursor-not-allowed opacity-50 ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-black text-white'}`}
                        >
                            <Printer size={18} />
                            Generate PDF Report
                        </button>
                    </div>
                    
                    <DetailedStatistics 
                        stats={stats} 
                        userProfile={userProfile} 
                        isDarkMode={isDarkMode} 
                    />

                    <div className={isDarkMode ? 'opacity-50' : 'opacity-100'}>
                        <ReportView 
                            trades={completedTrades} 
                            isDarkMode={isDarkMode} 
                            userProfile={userProfile} 
                            monthStr={new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                            selectedWidgets={reportWidgets}
                            equityData={equityData}
                            stats={stats}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'session' && (
                <div className="space-y-12 pb-20">
                    <PerformanceBySession
                        trades={completedTrades}
                        isDarkMode={isDarkMode}
                        currencySymbol={currencySymbol}
                    />

                    <TimeAnalysisMatrixWidget 
                        trades={completedTrades} 
                        isDarkMode={isDarkMode} 
                        currencySymbol={currencySymbol} 
                    />

                    <div className="flex justify-center pt-8 border-t border-zinc-500/10">
                        <p className="text-xs font-bold opacity-30 uppercase tracking-[0.2em] italic">
                            All times are calculated in SAST (Africa/Johannesburg)
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;
