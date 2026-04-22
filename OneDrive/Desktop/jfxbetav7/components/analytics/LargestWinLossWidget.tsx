
import React, { useMemo } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { Medal, HelpCircle, ArrowUpCircle, ArrowDownCircle, Activity } from 'lucide-react';
import { clsx } from 'clsx';

const safePnL = (value: unknown): number => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
};

interface LargestWinLossWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    currencySymbol: string;
    onInfoClick?: () => void;
}

export const LargestWinLossWidget: React.FC<LargestWinLossWidgetProps> = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }) => {
    const { largestWin, largestLoss, longPnl, shortPnl } = useMemo(() => {
        const safeTrades = trades || [];
        const wins = safeTrades.filter(t => safePnL(t.pnl) > 0);
        const losses = safeTrades.filter(t => safePnL(t.pnl) < 0);
        
        const winVal = wins.length > 0 ? Math.max(...wins.map(t => safePnL(t.pnl))) : 0;
        const lossVal = losses.length > 0 ? Math.min(...losses.map(t => safePnL(t.pnl))) : 0;

        const lPnl = safeTrades.filter(t => t.direction === 'Long').reduce((acc, t) => acc + safePnL(t.pnl), 0);
        const sPnl = safeTrades.filter(t => t.direction === 'Short').reduce((acc, t) => acc + safePnL(t.pnl), 0);

        return { 
            largestWin: winVal, 
            largestLoss: Math.abs(lossVal),
            longPnl: lPnl,
            shortPnl: sPnl
        };
    }, [trades]);

    // Ratio for Largest Win vs Loss
    const maxWinLoss = Math.max(largestWin, largestLoss) || 1;
    const winPercent = (largestWin / maxWinLoss) * 100;
    const lossPercent = (largestLoss / maxWinLoss) * 100;

    // Ratio for Long vs Short
    const absLong = Math.abs(longPnl);
    const absShort = Math.abs(shortPnl);
    const maxDir = Math.max(absLong, absShort) || 1;
    const longPercent = (absLong / maxDir) * 100;
    const shortPercent = (absShort / maxDir) * 100;

    return (
        <div className={clsx(
            "p-8 rounded-[32px] border h-full flex flex-col justify-between transition-all",
            isDarkMode ? "bg-zinc-950 border-zinc-900 shadow-2xl" : "bg-white border-slate-200 shadow-xl"
        )}>
            {/* Section 1: Largest Win vs Loss */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={clsx("p-2 rounded-xl", isDarkMode ? "bg-zinc-900" : "bg-slate-100")}>
                            <Medal size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight uppercase">Peak Performance</h3>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                Largest Win vs Loss
                                <Tooltip content="Compares your single biggest winning trade against your single biggest losing trade." isDarkMode={isDarkMode}>
                                    <HelpCircle 
                                        size={12}
                                        onClick={onInfoClick}
                                        className="opacity-40 cursor-help hover:opacity-100 transition-opacity" 
                                    />
                                </Tooltip>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Largest Win</span>
                            <div className="text-lg font-black text-emerald-500">{currencySymbol}{largestWin.toLocaleString()}</div>
                        </div>
                        <div className="space-y-0.5 text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Largest Loss</span>
                            <div className="text-lg font-black text-rose-500">-{currencySymbol}{largestLoss.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className={clsx("h-2 rounded-full overflow-hidden flex", isDarkMode ? "bg-zinc-900" : "bg-slate-100")}>
                        <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${winPercent}%` }} />
                        <div className="h-full bg-rose-500 transition-all duration-1000 ease-out" style={{ width: `${lossPercent}%` }} />
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="my-8 border-t border-zinc-500/10" />

            {/* Section 2: Long vs Short */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={clsx("p-2 rounded-xl", isDarkMode ? "bg-zinc-900" : "bg-slate-100")}>
                            <Activity size={20} className="text-brand" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight uppercase">Directional Bias</h3>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                Long vs Short P&L
                                <Tooltip content="Compares the cumulative profitability of your Buy (Long) positions vs Sell (Short) positions." isDarkMode={isDarkMode}>
                                    <HelpCircle 
                                        size={12}
                                        onClick={onInfoClick}
                                        className="opacity-40 cursor-help hover:opacity-100 transition-opacity" 
                                    />
                                </Tooltip>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="space-y-0.5 text-blue-500">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-blue-400">Total Long</span>
                            <div className="text-lg font-black">{longPnl >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(longPnl).toLocaleString()}</div>
                        </div>
                        <div className="space-y-0.5 text-right text-orange-500">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-orange-400">Total Short</span>
                            <div className="text-lg font-black">{shortPnl >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(shortPnl).toLocaleString()}</div>
                        </div>
                    </div>
                    <div className={clsx("h-2 rounded-full overflow-hidden flex", isDarkMode ? "bg-zinc-900" : "bg-slate-100")}>
                        <div className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]" style={{ width: `${longPercent}%` }} />
                        <div className="h-full bg-orange-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(249,115,22,0.3)]" style={{ width: `${shortPercent}%` }} />
                    </div>
                </div>
            </div>
        </div>
    );
};
