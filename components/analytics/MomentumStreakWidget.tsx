import React, { useMemo } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { Activity, Flame, Snowflake, Award, Link } from 'lucide-react';

interface MomentumStreakWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    onInfoClick?: () => void;
}

export const MomentumStreakWidget: React.FC<MomentumStreakWidgetProps> = ({ trades = [], isDarkMode, onInfoClick }) => {
    const stats = useMemo(() => {
        const sortedTrades = [...trades].sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

        const groupedRecent: { id: string, result: string, pair: string, isGrouped: boolean }[] = [];
        let j = 0;
        while (j < sortedTrades.length) {
            const current = sortedTrades[j];
            const setupId = current.setupId;
            const result = current.result;

            if (setupId) {
                let count = 1;
                while (j + count < sortedTrades.length && 
                       sortedTrades[j + count].setupId === setupId && 
                       sortedTrades[j + count].result === result) {
                    count++;
                }
                
                groupedRecent.push({
                    id: `${setupId}-${j}`,
                    result,
                    pair: current.pair,
                    isGrouped: count > 1
                });
                j += count;
            } else {
                groupedRecent.push({
                    id: current.id,
                    result,
                    pair: current.pair,
                    isGrouped: false
                });
                j++;
            }
        }

        let longestWin = 0;
        let longestLoss = 0;
        let tempWin = 0;
        let tempLoss = 0;

        groupedRecent.forEach(item => {
            if (item.result === 'Win') {
                tempWin++;
                tempLoss = 0;
                if (tempWin > longestWin) longestWin = tempWin;
            } else if (item.result === 'Loss') {
                tempLoss++;
                tempWin = 0;
                if (tempLoss > longestLoss) longestLoss = tempLoss;
            } else {
                tempWin = 0;
                tempLoss = 0;
            }
        });

        let currentStreakValue = 0;
        let currentStreakType: string | null = null;

        const lastGroups = [...groupedRecent].reverse();
        if (lastGroups.length > 0) {
            currentStreakType = lastGroups[0].result;
            for (const item of lastGroups) {
                if (item.result === currentStreakType) {
                    currentStreakValue++;
                } else {
                    break;
                }
            }
        }

        const wasLossStreak = lastGroups.length > 1 && lastGroups[1].result === 'Loss';
        const isRecovery = lastGroups.length > 0 && lastGroups[0].result === 'Win' && wasLossStreak;

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const tradesThisWeek = trades.filter(t => new Date(t.date) >= startOfWeek).length;
        const weeklyGoal = 15;
        const weeklyProgress = Math.min(100, (tradesThisWeek / weeklyGoal) * 100);

        return { longestWin, longestLoss, currentStreakType, currentStreakValue, isRecovery, tradesThisWeek, weeklyGoal, weeklyProgress, recent: groupedRecent.slice(-60) };
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
                                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
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
                <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-30 gap-1 w-full">
                    {stats.recent.map((item, i) => (
                        <div
                            key={item.id}
                            className={`w-full aspect-square rounded-[2px] transition-all duration-500 group relative flex items-center justify-center ${item.result === 'Win' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.1)]' :
                                item.result === 'Loss' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.1)]' :
                                    item.result === 'BE' ? 'bg-zinc-500 opacity-40' : 'bg-indigo-500 opacity-20'
                                } ${i === stats.recent.length - 1 ? 'ring-1 ring-indigo-500 ring-offset-1 ring-offset-transparent animate-pulse' : 'hover:scale-125 hover:z-10 hover:brightness-110'}`}
                        >
                            {item.isGrouped && <Link size={12} className="text-black" />}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                {item.pair}
                            </div>
                        </div>
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
