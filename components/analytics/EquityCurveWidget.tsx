import React, { useState } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { TrendingUp, Activity } from 'lucide-react';

interface EquityCurveWidgetProps {
    trades: Trade[];
    equityData: number[];
    isDarkMode: boolean;
    currencySymbol: string;
    currentBalanceOverride?: number;
    onInfoClick?: () => void;
}

export const EquityCurveWidget: React.FC<EquityCurveWidgetProps> = ({ trades = [], equityData = [], isDarkMode, currencySymbol = '$', currentBalanceOverride, onInfoClick }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const generatePath = (data: number[], width: number, height: number) => {
        if (!data || data.length < 2) return "";
        const min = Math.min(...data, 0);
        const max = Math.max(...data, 100);
        const range = max - min || 1;
        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            return `${x},${y}`;
        });
        return `M ${points.join(' L ')}`;
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        
        const index = Math.round((x / width) * (equityData.length - 1));
        if (index >= 0 && index < equityData.length) {
            setHoverIndex(index);
            setMousePos({ x: (index / (equityData.length - 1)) * 800, y: 0 });
        }
    };

    const min = Math.min(...equityData, 0);
    const max = Math.max(...equityData, 100);
    const range = max - min || 1;
    const hoverY = hoverIndex !== null ? 240 - ((equityData[hoverIndex] - min) / range) * 240 : 0;

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col min-h-[350px] h-full relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex justify-between items-start mb-6 relative">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><TrendingUp size={20} /></div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg leading-none">Equity Curve</h3>
                            <Tooltip content="Visual representation of your account balance growth over time." isDarkMode={isDarkMode}>
                                <svg 
                                    onClick={onInfoClick}
                                    xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark opacity-40 cursor-help hover:opacity-100 transition-opacity" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                            </Tooltip>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1.5">Account Balance Growth</p>
                    </div>
                </div>

                {hoverIndex !== null && (
                    <div className="text-right animate-in fade-in zoom-in-95 duration-200">
                        <div className={`text-xl font-black font-mono leading-none ${equityData[hoverIndex] >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {equityData[hoverIndex] >= 0 ? '+' : ''}{currencySymbol}{equityData[hoverIndex].toLocaleString()}
                        </div>
                        <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Trade #{hoverIndex}</div>
                    </div>
                )}
            </div>
            <div className="flex-1 relative mt-4">
                {equityData && equityData.length > 1 ? (
                    <svg 
                        viewBox="0 0 800 240" 
                        className="w-full h-full overflow-visible drop-shadow-2xl cursor-crosshair"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoverIndex(null)}
                    >
                        <defs><linearGradient id="curveGradientAnalytics" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
                        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (<line key={i} x1="0" y1={p * 240} x2="800" y2={p * 240} stroke="currentColor" strokeOpacity="0.05" />))}
                        <path d={generatePath(equityData, 800, 240)} fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={`${generatePath(equityData, 800, 240)} L 800,240 L 0,240 Z`} fill="url(#curveGradientAnalytics)" />
                        
                        {hoverIndex !== null && (
                            <>
                                <line x1={mousePos.x} y1="0" x2={mousePos.x} y2="240" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                                <circle cx={mousePos.x} cy={hoverY} r="5" fill="#6366f1" stroke={isDarkMode ? "#18181b" : "white"} strokeWidth="2" />
                            </>
                        )}
                    </svg>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center gap-4"><Activity size={48} strokeWidth={1} /><p className="text-sm font-medium">Insufficient trade data to generate curve</p></div>
                )}
            </div>
        </div>
    );
};
