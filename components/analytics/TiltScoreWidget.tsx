import React, { useMemo } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';

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
        <div className={`p-8 rounded-[32px] border flex flex-col items-center justify-center text-center min-h-[400px] h-full ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center gap-2 mb-12">
                <h3 className="text-xl font-bold tracking-tight">Discipline Score</h3>
                <Tooltip content="Calculates a score based on how strictly you followed your trading plan for each trade." isDarkMode={isDarkMode}>
                    <svg 
                        onClick={onInfoClick}
                        xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
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
