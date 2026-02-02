import React, { useMemo, useState } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { MoreVertical } from 'lucide-react';

interface MonthlyPerformanceWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    currencySymbol: string;
    onInfoClick?: () => void;
}

export const MonthlyPerformanceWidget: React.FC<MonthlyPerformanceWidgetProps> = ({ trades = [], isDarkMode, currencySymbol = '$', onInfoClick }) => {
    const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const data = useMemo(() => {
        const safeTrades = trades || [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();

        return months.map((month, idx) => {
            const monthTrades = safeTrades.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === idx && d.getFullYear() === currentYear;
            }).sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

            const pnl = monthTrades.reduce((acc, t) => acc + t.pnl, 0);

            // Calculate Max Drawdown for the month
            let runningBalance = 0;
            let peakBalance = 0;
            let maxDrawdown = 0;

            monthTrades.forEach(t => {
                runningBalance += t.pnl;
                if (runningBalance > peakBalance) {
                    peakBalance = runningBalance;
                }
                const drawdown = runningBalance - peakBalance;
                if (drawdown < maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            });

            return { month, pnl, dd: maxDrawdown, hasTrades: monthTrades.length > 0 };
        }).filter(d => d.hasTrades || new Date().getMonth() >= months.indexOf(d.month));
    }, [trades]);

    const allPnl = data.map(d => d.pnl);
    const allDd = data.map(d => d.dd);
    const maxVal = Math.max(...allPnl, 100);
    const minVal = Math.min(...allDd, -100);
    const range = maxVal - minVal || 1;
    const zeroY = (maxVal / range) * 100;

    const hoveredData = data.find(d => d.month === hoveredMonth);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    return (
        <div 
            onMouseMove={handleMouseMove}
            className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[400px] relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight">Monthly P&L vs Maximum Drawdown</h3>
                    <Tooltip content="Compares your net profit against the maximum equity drop for each month." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                    </Tooltip>
                </div>
                <MoreVertical size={16} className="opacity-30" />
            </div>

            <div className="flex-1 relative mt-4 px-10 pb-12">
                <div className="absolute inset-0 left-10 right-2 bottom-12 flex flex-col justify-between pointer-events-none">
                    {[0, 0.25, 0.5, 0.75, 1].map(i => (
                        <div key={i} className="w-full border-t border-dashed border-white/5 h-0" />
                    ))}
                </div>

                <div className="relative h-full flex items-end justify-between px-4">
                    <div className="absolute left-0 right-0 border-t border-white/20 z-10" style={{ top: `${zeroY}%` }} />

                    {data.map((d, i) => {
                        const pnlHeight = (Math.abs(d.pnl) / range) * 100;
                        const ddHeight = (Math.abs(d.dd) / range) * 100;
                        const isNegPnl = d.pnl < 0;
                        const isHovered = hoveredMonth === d.month;

                        return (
                            <div
                                key={i}
                                className="relative flex flex-col items-center flex-1 h-full group cursor-pointer"
                                onMouseEnter={() => setHoveredMonth(d.month)}
                                onMouseLeave={() => setHoveredMonth(null)}
                            >
                                {d.hasTrades && (
                                    <>
                                        <div
                                            className={`absolute w-6 rounded-t-lg transition-all duration-300 ${isNegPnl ? 'bg-rose-500' : 'bg-emerald-500'} ${isHovered ? 'w-8 brightness-110 shadow-lg' : ''}`}
                                            style={{
                                                height: `${pnlHeight}%`,
                                                bottom: isNegPnl ? `${100 - zeroY - pnlHeight}%` : `${100 - zeroY}%`,
                                                zIndex: 5
                                            }}
                                        />
                                        <div
                                            className={`absolute w-6 bg-amber-500 rounded-b-lg transition-all duration-300 ${isHovered ? 'w-8 opacity-80' : 'opacity-50'}`}
                                            style={{
                                                height: `${ddHeight}%`,
                                                top: `${zeroY}%`,
                                                zIndex: 4
                                            }}
                                        />
                                    </>
                                )}
                                <span className={`absolute top-full mt-4 text-[10px] font-bold transition-all duration-300 ${isHovered ? 'opacity-100 text-indigo-500 scale-110' : 'opacity-40'}`}>{d.month}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tooltip */}
            {hoveredData && hoveredData.hasTrades && (
                <div 
                    className="absolute pointer-events-none z-50"
                    style={{ 
                        left: mousePos.x + 20, 
                        top: mousePos.y - 40
                    }}
                >
                    <div className={`p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 min-w-[160px] ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                        <div className="font-bold text-sm mb-3 border-b border-white/10 pb-2">{hoveredData.month} Performance</div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="opacity-60">Net P&L</span>
                                <span className={`font-bold ${hoveredData.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {hoveredData.pnl >= 0 ? '+' : ''}{currencySymbol}{hoveredData.pnl.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-60">Max Drawdown</span>
                                <span className="text-amber-500 font-bold">-{currencySymbol}{Math.abs(hoveredData.dd).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-center gap-8 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Net P&L</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-sm opacity-50" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Max Drawdown</span>
                </div>
            </div>
        </div>
    );
};
