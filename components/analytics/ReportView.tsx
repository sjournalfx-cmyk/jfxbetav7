
import React from 'react';
import { Trade, UserProfile } from '../../types';
import { TrendingUp, Activity, BarChart2, Calendar } from 'lucide-react';

interface ReportViewProps {
    trades: Trade[];
    userProfile: UserProfile;
    monthStr: string; // "January 2026"
}

export const ReportView: React.FC<ReportViewProps> = ({ trades, userProfile, monthStr }) => {
    // Filter trades for the specific month/year is handled by parent or passed in pre-filtered
    // For this view, we assume 'trades' is the list to report on.

    const stats = React.useMemo(() => {
        const wins = trades.filter(t => t.result === 'Win');
        const losses = trades.filter(t => t.result === 'Loss');
        const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
        const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
        const netPnl = grossProfit - grossLoss;
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 9.9 : 0);
        const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
        
        return { netPnl, profitFactor, winRate, total: trades.length, wins: wins.length, losses: losses.length };
    }, [trades]);

    return (
        <div className="print-container bg-white text-black p-8 max-w-[210mm] mx-auto hidden print:block">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Monthly Statement</h1>
                    <p className="text-sm font-mono uppercase tracking-widest opacity-60">{monthStr}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold">{userProfile.accountName}</h2>
                    <p className="text-sm opacity-60">{userProfile.name}</p>
                    <p className="text-xs font-mono mt-2">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 border border-black rounded-xl">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Net P&L</div>
                    <div className={`text-2xl font-black ${stats.netPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {userProfile.currencySymbol}{stats.netPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="p-4 border border-black rounded-xl">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Profit Factor</div>
                    <div className="text-2xl font-black">{stats.profitFactor.toFixed(2)}</div>
                </div>
                <div className="p-4 border border-black rounded-xl">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Win Rate</div>
                    <div className="text-2xl font-black">{stats.winRate.toFixed(1)}%</div>
                </div>
                <div className="p-4 border border-black rounded-xl">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Total Trades</div>
                    <div className="text-2xl font-black">{stats.total}</div>
                </div>
            </div>

            {/* Trade Log Table */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity size={18} /> Trade History
                </h3>
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="py-2">Date</th>
                            <th className="py-2">Pair</th>
                            <th className="py-2">Type</th>
                            <th className="py-2 text-right">Lots</th>
                            <th className="py-2 text-right">Entry</th>
                            <th className="py-2 text-right">Exit</th>
                            <th className="py-2 text-right">P&L</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {trades.map(t => (
                            <tr key={t.id}>
                                <td className="py-2 font-mono opacity-60">{t.date} {t.time}</td>
                                <td className="py-2 font-bold">{t.pair}</td>
                                <td className={`py-2 font-bold uppercase ${t.direction === 'Long' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.direction}</td>
                                <td className="py-2 text-right font-mono">{t.lots}</td>
                                <td className="py-2 text-right font-mono opacity-60">{t.entryPrice}</td>
                                <td className="py-2 text-right font-mono opacity-60">{t.exitPrice}</td>
                                <td className={`py-2 text-right font-bold font-mono ${t.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {t.pnl.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="border-t border-black pt-6 text-center text-[10px] opacity-40 uppercase tracking-widest">
                Generated by JournalFX
            </div>
        </div>
    );
};
