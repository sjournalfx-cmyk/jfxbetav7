import React, { useMemo, useState } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { Coins, MoreVertical, HelpCircle } from 'lucide-react';

interface CurrencyStrengthMeterProps {
    isDarkMode: boolean;
    trades: Trade[];
    onInfoClick?: () => void;
}

export const CurrencyStrengthMeter: React.FC<CurrencyStrengthMeterProps> = ({ isDarkMode, trades = [], onInfoClick }) => {
    const [hoveredCur, setHoveredCur] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const strengths = useMemo(() => {
        const safeTrades = trades || [];
        const scores: Record<string, number> = {};
        const currencies = new Set<string>();
        const commonQuotes = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD', 'USDT', 'BTC', 'ETH'];

        safeTrades.forEach(trade => {
            let base = '';
            let quote = '';

            let pair = trade.pair ? trade.pair.trim().toUpperCase() : '';
            if (!pair) return;

            const separatorMatch = pair.match(/^([A-Z0-9]+)[\/\-\s]([A-Z0-9]+)$/);
            if (separatorMatch) {
                base = separatorMatch[1];
                quote = separatorMatch[2];
            } else {
                const cleanPair = pair.replace(/[^A-Z0-9]/g, '');

                if (cleanPair.length === 6) {
                    base = cleanPair.substring(0, 3);
                    quote = cleanPair.substring(3, 6);
                } else {
                    for (const q of commonQuotes) {
                        if (cleanPair.endsWith(q) && cleanPair.length > q.length) {
                            quote = q;
                            base = cleanPair.substring(0, cleanPair.length - q.length);
                            break;
                        }
                    }
                }
            }

            if (!base || !quote) return;

            currencies.add(base);
            currencies.add(quote);

            if (!scores[base]) scores[base] = 0;
            if (!scores[quote]) scores[quote] = 0;

            const pnl = trade.pnl || 0;
            const direction = trade.direction?.toLowerCase() || '';

            if (direction === 'long' || direction === 'buy') {
                scores[base] += pnl;
                scores[quote] -= pnl;
            } else if (direction === 'short' || direction === 'sell') {
                scores[base] -= pnl;
                scores[quote] += pnl;
            }
        });

        const currencyList = Array.from(currencies);
        if (currencyList.length === 0) return [];

        const vals = Object.values(scores);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const range = max - min;

        return currencyList.map(cur => {
            const val = scores[cur];
            const strength = range === 0 ? 5 : ((val - min) / range) * 10;
            return { cur, val: strength, raw: val };
        }).sort((a, b) => b.val - a.val).slice(0, 8);
    }, [trades]);

    const hoveredData = strengths.find(s => s.cur === hoveredCur);

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[400px] relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold tracking-tight">Currency Strength</h3>
                        <Tooltip content="Measures the relative strength of currencies based on your trading P&L for each base and quote currency." isDarkMode={isDarkMode}>
                            <svg 
                                onClick={onInfoClick}
                                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                        </Tooltip>
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1">Relative Performance</p>
                </div>
                <MoreVertical size={16} className="opacity-30" />
            </div>

            {strengths.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center">
                    <Coins size={32} className="mb-3" />
                    <p className="text-sm">No currency data available</p>
                    <p className="text-xs mt-2 max-w-[200px]">Add trades with standard pairs (e.g. EURUSD) to see data.</p>
                </div>
            ) : (
                <div className="space-y-4 flex-1 justify-center flex flex-col">
                    {strengths.map((item) => (
                        <div
                            key={item.cur}
                            className="flex items-center gap-3 group cursor-pointer"
                            onMouseEnter={() => setHoveredCur(item.cur)}
                            onMouseLeave={() => setHoveredCur(null)}
                        >
                            <div className="w-12 flex flex-col items-center">
                                <span className={`text-xs font-black transition-colors ${hoveredCur === item.cur ? 'text-indigo-500' : ''}`}>{item.cur}</span>
                            </div>
                            <div className={`flex-1 h-2 rounded-full overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'} ${hoveredCur === item.cur ? 'h-3' : ''}`}>
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${item.val > 7 ? 'bg-emerald-500' :
                                        item.val > 4 ? 'bg-blue-500' :
                                            item.val > 2 ? 'bg-amber-500' : 'bg-rose-500'
                                        } ${hoveredCur === item.cur ? 'brightness-110 shadow-lg' : ''}`}
                                    style={{ width: `${Math.max(5, item.val * 10)}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-mono font-bold opacity-50 w-8 text-right">
                                {item.val.toFixed(1)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {hoveredData && (
                <div 
                    className="absolute pointer-events-none z-50"
                    style={{ 
                        left: mousePos.x + 20, 
                        top: mousePos.y - 40
                    }}
                >
                    <div className={`p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 min-w-[140px] ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                        <div className="font-bold text-sm mb-2 border-b border-white/10 pb-1">{hoveredData.cur} Strength</div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="opacity-60">Score</span>
                            <span className="font-bold">{hoveredData.val.toFixed(2)} / 10</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
