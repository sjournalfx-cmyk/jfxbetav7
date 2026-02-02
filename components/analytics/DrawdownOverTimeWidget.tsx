import React, { useMemo, useState } from 'react';
import { Trade, UserProfile } from '../../types';
import { Tooltip } from '../ui/Tooltip';

interface DrawdownOverTimeWidgetProps {
    trades: Trade[];
    isDarkMode: boolean;
    userProfile: UserProfile;
    startingBalance?: number;
    onInfoClick?: () => void;
}

export const DrawdownOverTimeWidget: React.FC<DrawdownOverTimeWidgetProps> = ({ trades = [], isDarkMode, userProfile, startingBalance, onInfoClick }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const drawdownData = useMemo(() => {
        if (!trades || trades.length === 0) return [];
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let peak = startingBalance !== undefined ? startingBalance : (userProfile?.initialBalance || 10000);
        let balance = peak;
        const data: { date: string; drawdown: number; balance: number }[] = [];
        sortedTrades.forEach(trade => {
            balance += trade.pnl;
            if (balance > peak) peak = balance;
            const drawdown = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
            data.push({ date: trade.date, drawdown, balance });
        });
        return data;
    }, [trades, userProfile?.initialBalance, startingBalance]);

    const maxDrawdown = drawdownData.length > 0 ? Math.max(...drawdownData.map(d => d.drawdown)) : 0;
    const maxY = Math.max(maxDrawdown * 1.2, 1);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        
        const index = Math.round((x / width) * (drawdownData.length - 1));
        if (index >= 0 && index < drawdownData.length) {
            setHoverIndex(index);
            setMousePos({ x: (index / (drawdownData.length - 1)) * 700, y: 0 });
        }
    };

    const generateAreaPath = (data: typeof drawdownData, width: number, height: number) => {
        if (!data || data.length < 2) return { line: "", area: "" };
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = (d.drawdown / maxY) * height;
            return { x, y };
        });
        const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
        const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
        return { line: linePath, area: areaPath };
    };

    const paths = generateAreaPath(drawdownData, 700, 200);
    const hoverY = hoverIndex !== null ? (drawdownData[hoverIndex].drawdown / maxY) * 200 : 0;

    return (
        <div className={`p-6 rounded-[24px] border flex flex-col min-h-[350px] relative h-full ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">Drawdown Over Time</h3>
                    <Tooltip content="Visualizes the percentage drop from your peak equity over the course of your trading history." isDarkMode={isDarkMode}>
                        <svg 
                            onClick={onInfoClick}
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                    </Tooltip>
                </div>

                <div className={`text-right transition-opacity duration-200 ${hoverIndex !== null ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="text-xl font-black font-mono text-rose-500 leading-none">
                        {hoverIndex !== null ? `-${drawdownData[hoverIndex].drawdown.toFixed(2)}%` : '-0.00%'}
                    </div>
                    <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">
                        {hoverIndex !== null ? `${userProfile.currencySymbol}${drawdownData[hoverIndex].balance.toLocaleString()}` : 'Balance'}
                    </div>
                </div>
            </div>
            {drawdownData.length < 2 ? (
                <div className="flex-1 flex items-center justify-center opacity-30 text-sm">Insufficient data</div>
            ) : (
                <div className="flex-1 relative">
                    <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-[10px] font-mono opacity-40">
                        <span>0%</span>
                        <span>{(maxY / 2).toFixed(2)}%</span>
                        <span>{maxY.toFixed(2)}%</span>
                    </div>
                    <div className="ml-12 h-full pb-8">
                        <svg 
                            viewBox="0 0 700 200" 
                            className="w-full h-full overflow-visible cursor-crosshair" 
                            preserveAspectRatio="none"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoverIndex(null)}
                        >
                            <defs>
                                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>
                            <path d={paths.area} fill="url(#drawdownGradient)" />
                            <path d={paths.line} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            
                            {hoverIndex !== null && (
                                <>
                                    <line x1={mousePos.x} y1="0" x2={mousePos.x} y2="200" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                                    <circle cx={mousePos.x} cy={hoverY} r="5" fill="#f43f5e" stroke={isDarkMode ? "#0d1117" : "white"} strokeWidth="2" />
                                </>
                            )}
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};
