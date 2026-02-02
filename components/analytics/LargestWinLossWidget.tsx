import React, { useMemo } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';

interface LargestWinLossWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    currencySymbol: string;
    onInfoClick?: () => void;
}

export const LargestWinLossWidget: React.FC<LargestWinLossWidgetProps> = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }) => {
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
        <div className={`p-6 rounded-[24px] border h-full ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">Largest Win vs Largest Loss</h3>
                    <Tooltip content="Compares your single biggest winning trade against your single biggest losing trade." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
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
