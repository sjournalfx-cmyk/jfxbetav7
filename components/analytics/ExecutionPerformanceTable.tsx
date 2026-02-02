import React, { useMemo } from 'react';
import { Trade } from '../../types';

interface ExecutionPerformanceTableProps {
    trades: Trade[];
    isDarkMode: boolean;
    currencySymbol?: string;
    initialBalance: number;
}

export const ExecutionPerformanceTable: React.FC<ExecutionPerformanceTableProps> = ({ trades = [], isDarkMode, currencySymbol = '$', initialBalance = 0 }) => {
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
        <div className={`rounded-[24px] overflow-hidden border h-full ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
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
