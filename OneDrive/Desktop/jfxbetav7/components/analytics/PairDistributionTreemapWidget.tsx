import React, { useMemo } from 'react';
import { Trade } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { LayoutGrid, HelpCircle } from 'lucide-react';

interface BoxData {
    pair: string;
    tradeCount: number;
    pnl: number;
    volume: number;
}

interface BoxRect extends BoxData {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface P { trades: Trade[]; isDarkMode: boolean; currencySymbol: string; onInfoClick?: () => void; }

const calculateTreemap = (items: BoxData[], width: number, height: number): BoxRect[] => {
    if (!items?.length) return [];
    const totalVolume = items.reduce((sum, i) => sum + i.volume, 0);
    if (!totalVolume) return [];
    const sorted = [...items].sort((a, b) => b.volume - a.volume);
    const rects: BoxRect[] = [];
    let x = 0, y = 0, rw = width, rh = height;
    while (sorted.length) {
        const horizontal = rw >= rh;
        const mainDim = horizontal ? rw : rh;
        const crossDim = horizontal ? rh : rw;
        let row: BoxData[] = [], rowVol = 0;
        for (let i = 0; i < sorted.length; i++) {
            const testRow = [...row, sorted[i]];
            const testVol = rowVol + sorted[i].volume;
            const testRatio = testVol / totalVolume;
            const mainSize = mainDim * testRatio;
            let maxWorst = 0;
            for (const it of testRow) {
                const itemRatio = it.volume / testVol;
                const crossSize = crossDim * itemRatio;
                const aspect = mainSize / crossSize;
                maxWorst = Math.max(maxWorst, Math.max(aspect, 1 / aspect));
            }
            let currentWorst = row.length ? (() => {
                const currRatio = rowVol / totalVolume;
                const currMain = mainDim * currRatio;
                let c = 0;
                for (const it of row) {
                    const ir = it.volume / rowVol;
                    const cs = crossDim * ir;
                    c = Math.max(c, Math.max(currMain / cs, cs / currMain));
                }
                return c;
            })() : Infinity;
            if (maxWorst <= currentWorst) {
                row.push(sorted[i]);
                rowVol += sorted[i].volume;
                sorted.splice(i, 1);
                i--;
            } else break;
        }
        const rowRatio = rowVol / totalVolume;
        const mainSize = mainDim * rowRatio;
        let offset = 0;
        for (const it of row) {
            const itemRatio = it.volume / rowVol;
            const crossSize = crossDim * itemRatio;
            if (horizontal) {
                rects.push({ ...it, x, y: y + offset, width: mainSize, height: crossSize });
            } else {
                rects.push({ ...it, x: x + offset, y, width: crossSize, height: mainSize });
            }
            offset += crossSize;
        }
        if (horizontal) {
            x += mainSize;
            rw -= mainSize;
        } else {
            y += mainSize;
            rh -= mainSize;
        }
    }
    return rects;
};

export const PairDistributionTreemapWidget: React.FC<P> = ({ trades = [], isDarkMode, currencySymbol = '$' }) => {
    const boxes = useMemo(() => {
        if (!trades?.length) return [];
        const pairData: Record<string, BoxData> = {};
        trades.forEach(t => {
            if (!t.pair) return;
            const key = t.pair.toUpperCase();
            if (!pairData[key]) {
                pairData[key] = { pair: key, tradeCount: 0, pnl: 0, volume: 0 };
            }
            pairData[key].tradeCount++;
            pairData[key].pnl += t.pnl || 0;
            pairData[key].volume += t.lots || 1;
        });
        const items = Object.values(pairData).filter(i => i.volume > 0);
        return calculateTreemap(items, 1000, 400);
    }, [trades]);

const getColor = (pnl: number) => {
    const maxPnl = Math.max(...boxes.map(b => Math.abs(b.pnl)), 1);
    const intensity = Math.min(0.27 + (Math.abs(pnl) / maxPnl) * 0.63, 0.9);
    return pnl >= 0 ? `rgba(5, 150, 105, ${intensity})` : `rgba(220, 38, 38, ${intensity})`;
  };

    if (!boxes.length) {
        return (
            <div className={`py-4 px-0 sm:p-8 rounded-none sm:rounded-[32px] border flex flex-col items-center min-h-[400px] h-full ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'} text-emerald-500`}><LayoutGrid size={20} /></div>
                    <h3 className="text-xl font-bold tracking-tight">Pair Distribution (Treemap)</h3>
                    <Tooltip content="Portfolio composition by trading volume" isDarkMode={isDarkMode}><HelpCircle size={14} className="opacity-40 cursor-help hover:opacity-100" /></Tooltip>
                </div>
                <div className="flex-1 flex items-center justify-center text-xs opacity-40 w-full h-full">No trade data</div>
            </div>
        );
    }

    return (
        <div className={`py-4 px-0 sm:p-8 rounded-none sm:rounded-[32px] border flex flex-col min-h-[400px] h-full ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'} text-emerald-500`}><LayoutGrid size={20} /></div>
                <h3 className="text-xl font-bold tracking-tight">Pair Distribution (Treemap)</h3>
                <Tooltip content="Portfolio composition by trading volume" isDarkMode={isDarkMode}><HelpCircle size={14} className="opacity-40 cursor-help hover:opacity-100" /></Tooltip>
            </div>
            <div className="flex-1 flex flex-col w-full">
                <div className="flex-1 flex items-center relative w-full h-full">
                    <svg viewBox="0 0 1000 400" className="w-full h-full" preserveAspectRatio="none">
                        {boxes.map((box, i) => (
                            <g key={i}>
                                <rect
                                    x={box.x}
                                    y={box.y}
                                    width={box.width}
                                    height={box.height}
                                    fill={getColor(box.pnl)}
                                    stroke={isDarkMode ? '#27272a' : '#fff'}
                                    strokeWidth="2"
                                    className="transition-opacity hover:opacity-80 cursor-pointer"
                                />
                                {box.width > 60 && box.height > 40 && (
                                    <>
                                        <text
                                            x={box.x + box.width / 2}
                                            y={box.y + box.height / 2 - 8}
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="15"
                                            fontWeight="700"
                                            style={{ pointerEvents: 'none', filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))' }}
                                        >
                                            {box.pair}
                                        </text>
                                        <text
                                            x={box.x + box.width / 2}
                                            y={box.y + box.height / 2 + 8}
                                            textAnchor="middle"
                                            fill="#f4f4f5"
                                            fontSize="12"
                                            style={{ pointerEvents: 'none', filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.5))' }}
                                        >
                                            {box.tradeCount} trades
                                        </text>
                                        <text
                                            x={box.x + box.width / 2}
                                            y={box.y + box.height / 2 + 22}
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="11"
                                            fontWeight="700"
                                            style={{ pointerEvents: 'none', filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.5))' }}
                                        >
                                            {currencySymbol}{box.pnl.toFixed(2)}
                                        </text>
                                    </>
                                )}
                                {box.width > 40 && box.height > 25 && box.width <= 60 && (
                                    <text
                                        x={box.x + box.width / 2}
                                        y={box.y + box.height / 2}
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="12"
                                        fontWeight="700"
                                        style={{ pointerEvents: 'none', filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.5))' }}
                                    >
                                        {box.pair}
                                    </text>
                                )}
                            </g>
                        ))}
                    </svg>
                </div>
                <div className="flex flex-row items-center gap-6 mt-4 pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-4 h-4 rounded-sm" style={{ background: 'rgba(5, 150, 105, 0.8)' }}></div>
                        <span className={isDarkMode ? 'text-zinc-400' : 'text-slate-600'}>Profitable</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-4 h-4 rounded-sm" style={{ background: 'rgba(220, 38, 38, 0.8)' }}></div>
                        <span className={isDarkMode ? 'text-zinc-400' : 'text-slate-600'}>Loss-Making</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className={isDarkMode ? 'text-zinc-500' : 'text-slate-500'}>Box size = Volume</span>
                    </div>
                </div>
            </div>
        </div>
    );
};