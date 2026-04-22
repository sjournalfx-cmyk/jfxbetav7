import React, { useMemo } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { Target, HelpCircle } from 'lucide-react';

interface TiltScoreWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    onInfoClick?: () => void;
}

export const TiltScoreWidget: React.FC<TiltScoreWidgetProps> = ({ trades = [], isDarkMode, onInfoClick }) => {
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
                totalScore += 20;
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
        <div className={`py-4 px-0 sm:p-6 rounded-none sm:rounded-[24px] border h-full ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'} text-[#FF4F01]`}>
                    <Target size={18} />
                </div>
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">Discipline Score</h3>
                    <Tooltip content="Calculates a score based on how strictly you followed your trading plan for each trade." isDarkMode={isDarkMode}>
                        <HelpCircle 
                            size={14}
                            onClick={onInfoClick}
                            className="opacity-40 cursor-help hover:opacity-100 transition-opacity" 
                        />
                    </Tooltip>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex-shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? "#1a1a1f" : "#f1f5f9"} strokeWidth="8" />
                        <circle
                            cx="50" cy="50" r="40"
                            fill="transparent"
                            stroke={scoreData.score > 80 ? "#10b981" : scoreData.score > 50 ? "#f59e0b" : "#f43f5e"}
                            strokeWidth="8"
                            strokeDasharray={`${(scoreData.score / 100) * 251} 251`}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-black ${scoreData.score > 80 ? "text-emerald-500" : scoreData.score > 50 ? "text-amber-500" : "text-rose-500"}`}>
                            {scoreData.score}
                        </span>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">{scoreData.label}</div>
                    <p className="text-sm opacity-60 leading-relaxed">{scoreData.message}</p>
                </div>
            </div>
        </div>
    );
};
