import React, { useMemo } from 'react';
import { Trade } from '../../types';
import { Table, LayoutGrid, Calendar } from 'lucide-react';

interface PerformanceMatrixWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    currencySymbol: string;
}

export const PerformanceMatrixWidget: React.FC<PerformanceMatrixWidgetProps> = ({ trades, isDarkMode, currencySymbol }) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentYear = new Date().getFullYear();

    const matrixData = useMemo(() => {
        const symbols = Array.from(new Set(trades.map(t => t.pair.toUpperCase()))).sort();
        const data: Record<string, number[]> = {};

        symbols.forEach(symbol => {
            data[symbol] = Array(12).fill(0);
        });

        trades.forEach(trade => {
            const tradeDate = new Date(trade.date);
            if (tradeDate.getFullYear() === currentYear) {
                const monthIdx = tradeDate.getMonth();
                const symbol = trade.pair.toUpperCase();
                if (data[symbol]) {
                    data[symbol][monthIdx] += trade.pnl;
                }
            }
        });

        return { symbols, data };
    }, [trades, currentYear]);

    const getBgColor = (val: number) => {
        if (val === 0) return '';
        if (val > 0) {
            if (val > 5000) return isDarkMode ? 'rgba(16, 185, 129, 0.6)' : '#6ee7b7'; // Emerald 300
            if (val > 1000) return isDarkMode ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0'; // Emerald 200
            return isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5'; // Emerald 100
        } else {
            if (Math.abs(val) > 5000) return isDarkMode ? 'rgba(244, 63, 94, 0.6)' : '#fda4af'; // Rose 300
            if (Math.abs(val) > 1000) return isDarkMode ? 'rgba(244, 63, 94, 0.4)' : '#fecdd3'; // Rose 200
            return isDarkMode ? 'rgba(244, 63, 94, 0.2)' : '#ffe4e6'; // Rose 100
        }
    };

    const getTextColor = (val: number) => {
        if (val === 0) return isDarkMode ? 'text-zinc-600' : 'text-slate-300';
        if (val > 0) return isDarkMode ? 'text-emerald-400' : 'text-emerald-700';
        return isDarkMode ? 'text-rose-400' : 'text-rose-700';
    };

    return (
        <div className={`w-full overflow-hidden rounded-[32px] border transition-all duration-500 ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="p-6 border-b border-zinc-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                        <Table size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight">Symbol Performance Matrix</h3>
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Monthly Breakdown • {currentYear}</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className={`${isDarkMode ? 'bg-zinc-900/80' : 'bg-slate-50'}`}>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-zinc-500/10 sticky left-0 z-30 bg-inherit min-w-[140px]">Instrument</th>
                            {months.map(m => (
                                <th key={m} className="p-4 text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-zinc-500/10 text-center min-w-[110px]">{m}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-slate-100'}`}>
                        {matrixData.symbols.map(symbol => (
                            <tr key={symbol} className="group transition-colors">
                                <td className={`p-4 text-[11px] font-black sticky left-0 z-20 border-r ${isDarkMode ? 'bg-[#0d1117] text-white border-zinc-800' : 'bg-white text-slate-900 border-slate-100'}`}>{symbol}</td>
                                {matrixData.data[symbol].map((val, i) => (
                                    <td 
                                        key={i} 
                                        className="p-4 text-center text-[11px] font-mono font-bold transition-all border-r last:border-r-0 border-zinc-500/5"
                                        style={{ backgroundColor: getBgColor(val) }}
                                    >
                                        <span className={getTextColor(val)}>
                                            {val === 0 ? '$0' : (val > 0 ? '+' : '-') + currencySymbol + Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {matrixData.symbols.length === 0 && (
                            <tr>
                                <td colSpan={13} className="p-12 text-center opacity-30 text-xs font-bold uppercase tracking-widest">No trade data available for {currentYear}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
