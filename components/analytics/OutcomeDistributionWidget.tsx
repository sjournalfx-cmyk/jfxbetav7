import React from 'react';
import { Trade } from '../../types';
import { PieChart } from 'lucide-react';

interface OutcomeDistributionWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
}

export const OutcomeDistributionWidget: React.FC<OutcomeDistributionWidgetProps> = ({ trades = [], isDarkMode }) => {
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
};
