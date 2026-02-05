import React, { useMemo } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';

interface SymbolPerformanceWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    currencySymbol: string;
    onInfoClick?: () => void;
}

export const SymbolPerformanceWidget: React.FC<SymbolPerformanceWidgetProps> = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }) => {
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
        <div className={`py-4 px-0 sm:p-6 rounded-none sm:rounded-[24px] border h-full ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-bold tracking-tight">Symbol Performance</h3>
                <Tooltip content="Aggregated performance metrics for your most and least profitable symbols." isDarkMode={isDarkMode}>
                    <svg 
                        onClick={onInfoClick}
                        xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
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
