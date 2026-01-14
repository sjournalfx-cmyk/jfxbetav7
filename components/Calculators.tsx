import React, { useState, useEffect, useMemo } from 'react';
import {
    Calculator, DollarSign, Percent, TrendingUp, TrendingDown,
    Activity, Scale, PieChart, AlertTriangle, ArrowRight,
    ChevronLeft, RefreshCw, BarChart2, Info, Coins, Layers,
    Briefcase, Target, Divide, X
} from 'lucide-react';

interface CalculatorsProps {
    isDarkMode: boolean;
    currencySymbol: string;
}

type CalculatorType =
    | 'rr'
    | 'growth'
    | 'drawdown'
    | 'expectancy'
    | 'cost';

const CALCULATORS = [
    { id: 'rr', title: 'Risk : Reward', desc: 'Analyze trade setups and ratios', icon: Scale, color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { id: 'growth', title: 'Equity Growth', desc: 'Compound interest and account forecasting', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'drawdown', title: 'Drawdown Recovery', desc: 'Calculate gains needed to recover losses', icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'expectancy', title: 'Expectancy', desc: 'Validate strategy profitability', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'cost', title: 'Trading Costs', desc: 'Estimate spread, swap, and commissions', icon: Coins, color: 'text-slate-500', bg: 'bg-slate-500/10' },
];

const RATES: Record<string, number> = {
    'EURUSD': 1.0500,
    'GBPUSD': 1.2500,
    'USDJPY': 150.00,
    'XAUUSD': 2000.00,
    'US30': 34000.00,
    'BTCUSD': 45000.00
};

import { Select } from './Select';

const InputGroup = ({ label, value, onChange, prefix, suffix, type = "number", isDarkMode, step }: any) => (
    <div className="flex-1 min-w-[140px]">
        <label className="text-[10px] font-bold uppercase opacity-50 mb-1.5 block">{label}</label>
        <div className={`flex items-center px-4 py-3 rounded-xl border focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all ${isDarkMode ? 'bg-[#0c0c0e] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
            {prefix && <span className="opacity-50 mr-2 font-medium font-mono">{prefix}</span>}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                step={step}
                className={`bg-transparent outline-none w-full font-mono font-medium text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            />
            {suffix && <span className="opacity-50 ml-2 font-medium text-xs">{suffix}</span>}
        </div>
    </div>
);

const ResultCard = ({ label, value, isDarkMode, subValue, colorClass = "text-indigo-500" }: any) => (
    <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center h-full ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
        <span className="text-[10px] font-bold uppercase opacity-50 mb-1">{label}</span>
        <div className={`text-2xl font-black font-mono tracking-tight ${colorClass}`}>
            {value}
        </div>
        {subValue && <div className="text-xs opacity-60 mt-1 font-medium">{subValue}</div>}
    </div>
);

const ExpectancyCalc = ({ isDarkMode, currencySymbol }: { isDarkMode: boolean, currencySymbol: string }) => {
    const [winRate, setWinRate] = useState(50);
    const [avgWin, setAvgWin] = useState(500);
    const [avgLoss, setAvgLoss] = useState(250);
    const winProb = winRate / 100;
    const lossProb = (100 - winRate) / 100;
    const expectancy = (winProb * avgWin) - (lossProb * avgLoss);
    const rMultiple = avgLoss > 0 ? avgWin / avgLoss : 0;
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputGroup label="Win Rate %" value={winRate} onChange={setWinRate} suffix="%" isDarkMode={isDarkMode} />
                <InputGroup label="Average Win" value={avgWin} onChange={setAvgWin} prefix={currencySymbol} isDarkMode={isDarkMode} />
                <InputGroup label="Average Loss" value={avgLoss} onChange={setAvgLoss} prefix={currencySymbol} isDarkMode={isDarkMode} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <ResultCard label="Expectancy (Per Trade)" value={`${currencySymbol}${expectancy.toFixed(2)}`} isDarkMode={isDarkMode} colorClass={expectancy > 0 ? 'text-emerald-500' : 'text-rose-500'} />
                <ResultCard label="Reward : Risk Ratio" value={`1 : ${rMultiple.toFixed(2)}`} subValue={rMultiple > 1.5 ? "Healthy Ratio" : "Needs Improvement"} isDarkMode={isDarkMode} />
            </div>
        </div>
    );
};

const CostCalc = ({ isDarkMode, currencySymbol }: { isDarkMode: boolean, currencySymbol: string }) => {
    const [lots, setLots] = useState(1.0);
    const [spread, setSpread] = useState(1.5);
    const [comm, setComm] = useState(7.0);
    const [swap, setSwap] = useState(0);
    const pipVal = 10;
    const spreadCost = spread * pipVal * lots;
    const commCost = comm * lots;
    const totalCost = spreadCost + commCost + Number(swap);
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InputGroup label="Lot Size" value={lots} onChange={setLots} isDarkMode={isDarkMode} />
                <InputGroup label="Spread (Pips)" value={spread} onChange={setSpread} isDarkMode={isDarkMode} />
                <InputGroup label="Comm ($/Lot)" value={comm} onChange={setComm} isDarkMode={isDarkMode} />
                <InputGroup label="Swap ($)" value={swap} onChange={setSwap} isDarkMode={isDarkMode} />
            </div>
            <div className="p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden bg-slate-500/5 border-slate-500/20">
                <div className="relative z-10 flex-1 w-full grid grid-cols-3 gap-4 text-center">
                    <div><div className="text-[10px] uppercase font-bold opacity-50">Spread</div><div className="font-mono font-bold">{currencySymbol}{spreadCost.toFixed(2)}</div></div>
                    <div><div className="text-[10px] uppercase font-bold opacity-50">Comm</div><div className="font-mono font-bold">{currencySymbol}{commCost.toFixed(2)}</div></div>
                    <div><div className="text-[10px] uppercase font-bold opacity-50">Swap</div><div className="font-mono font-bold">{currencySymbol}{Number(swap).toFixed(2)}</div></div>
                </div>
                <div className="w-px h-12 bg-current opacity-20 hidden md:block" />
                <div className="relative z-10 text-center md:text-right min-w-[120px]">
                    <div className="text-xs uppercase font-bold opacity-50 mb-1">Total Cost</div>
                    <div className="text-3xl font-black text-slate-500 font-mono">{currencySymbol}{totalCost.toFixed(2)}</div>
                </div>
            </div>
        </div>
    );
};

const GrowthCalc = ({ isDarkMode, currencySymbol }: { isDarkMode: boolean, currencySymbol: string }) => {
    const [startBalance, setStartBalance] = useState(5000);
    const [periodReturn, setPeriodReturn] = useState(5);
    const [duration, setDuration] = useState(12);
    const [timeframe, setTimeframe] = useState('Months');

    const data = useMemo(() => {
        const results = [];
        let current = Number(startBalance);
        const count = Math.min(Number(duration), 100); // Limit bars for performance
        for (let i = 0; i <= count; i++) {
            results.push(current);
            current = current * (1 + (Number(periodReturn) / 100));
        }
        return results;
    }, [startBalance, periodReturn, duration]);

    const final = data[data.length - 1];
    const profit = final - startBalance;

    const periodLabel = timeframe === 'Days' ? 'Daily' : 
                      timeframe === 'Years' ? 'Yearly' :
                      timeframe === 'Months' ? 'Monthly' : 'Weekly';

    const getTimeframeLabel = (idx: number) => {
        const unit = timeframe.slice(0, -1);
        return `${unit} ${idx}`;
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputGroup label="Starting Balance" value={startBalance} onChange={setStartBalance} prefix={currencySymbol} isDarkMode={isDarkMode} />
                <InputGroup label={`${periodLabel} Return`} value={periodReturn} onChange={setPeriodReturn} suffix="%" isDarkMode={isDarkMode} />
                <InputGroup label="Duration" value={duration} onChange={setDuration} isDarkMode={isDarkMode} />
                <Select
                    label="Timeframe"
                    value={timeframe}
                    onChange={setTimeframe}
                    isDarkMode={isDarkMode}
                    options={[
                        { value: 'Years', label: 'Years' },
                        { value: 'Months', label: 'Months' },
                        { value: 'Weeks', label: 'Weeks' },
                        { value: 'Days', label: 'Days' },
                    ]}
                />
            </div>
            <div className="h-32 flex items-end gap-1 pb-4 border-b border-dashed border-gray-500/20">
                {data.map((val, i) => {
                    const height = (val / (final || 1)) * 100;
                    return (
                        <div key={i} className="flex-1 bg-amber-500/20 hover:bg-amber-500 rounded-t-sm transition-all relative group" style={{ height: `${Math.max(2, height)}%` }}>
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">{getTimeframeLabel(i)}: {currencySymbol}{Math.round(val).toLocaleString()}</div>
                        </div>
                    )
                })}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <ResultCard label="Projected Balance" value={`${currencySymbol}${Math.round(final).toLocaleString()}`} isDarkMode={isDarkMode} colorClass="text-amber-500" />
                <ResultCard label="Total Profit" value={`+${currencySymbol}${Math.round(profit).toLocaleString()}`} subValue={`${((profit / (startBalance || 1)) * 100).toFixed(0)}% Gain`} isDarkMode={isDarkMode} />
            </div>
        </div>
    )
}

const DrawdownCalc = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const [drawdown, setDrawdown] = useState(20);
    const recovery = (drawdown / (100 - drawdown)) * 100;
    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 max-w-xl mx-auto text-center">
            <div className="space-y-4">
                <label className="text-xs font-bold uppercase opacity-50">Current Drawdown</label>
                <div className="flex items-center justify-center gap-4"><span className="text-xl font-bold">0%</span><input type="range" min="1" max="95" step="1" value={drawdown} onChange={(e) => setDrawdown(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500" /><span className="text-xl font-bold">95%</span></div>
                <div className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{drawdown}%</div>
            </div>
            <div className={`p-8 rounded-3xl border flex flex-col items-center gap-4 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}><div className="p-4 rounded-full bg-orange-500/10 text-orange-500"><RefreshCw size={32} /></div><div><h3 className="text-lg font-bold">Recovery Required</h3><p className="text-xs opacity-50">Gain needed to get back to breakeven</p></div><div className="text-5xl font-black text-orange-500 tracking-tighter">{recovery.toFixed(1)}%</div></div>
        </div>
    )
}

const RRCalc = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const [entry, setEntry] = useState(1.0500);
    const [sl, setSl] = useState(1.0480);
    const [tp, setTp] = useState(1.0550);
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    const rr = risk > 0 ? reward / risk : 0;
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="grid grid-cols-3 gap-4"><InputGroup label="Entry Price" value={entry} onChange={setEntry} step="0.0001" isDarkMode={isDarkMode} /><InputGroup label="Stop Loss" value={sl} onChange={setSl} step="0.0001" isDarkMode={isDarkMode} /><InputGroup label="Take Profit" value={tp} onChange={setTp} step="0.0001" isDarkMode={isDarkMode} /></div>
            <div className="flex items-center gap-4"><div className={`flex-1 p-6 rounded-2xl border text-center ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}><span className="text-xs font-bold uppercase opacity-50 block mb-2">Risk (Pips)</span><span className="text-2xl font-mono font-bold text-rose-500">{(risk * 10000).toFixed(1)}</span></div><div className="text-2xl font-black text-indigo-500 opacity-20">VS</div><div className={`flex-1 p-6 rounded-2xl border text-center ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}><span className="text-xs font-bold uppercase opacity-50 block mb-2">Reward (Pips)</span><span className="text-2xl font-mono font-bold text-emerald-500">{(reward * 10000).toFixed(1)}</span></div></div>
            <ResultCard label="Risk : Reward Ratio" value={`1 : ${rr.toFixed(2)}`} isDarkMode={isDarkMode} colorClass={rr >= 2 ? 'text-teal-500' : rr >= 1 ? 'text-amber-500' : 'text-rose-500'} />
        </div>
    )
}

const Calculators: React.FC<CalculatorsProps> = ({ isDarkMode, currencySymbol }) => {
    const [activeId, setActiveId] = useState<CalculatorType | null>(null);
    const renderActiveCalculator = () => {
        switch (activeId) {
            case 'growth': return <GrowthCalc isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'drawdown': return <DrawdownCalc isDarkMode={isDarkMode} />;
            case 'expectancy': return <ExpectancyCalc isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'cost': return <CostCalc isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'rr': return <RRCalc isDarkMode={isDarkMode} />;
            default: return null;
        }
    };
    const activeCalcData = CALCULATORS.find(c => c.id === activeId);
    return (
        <div className={`w-full h-full overflow-hidden flex flex-col font-sans ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-[#F8FAFC] text-slate-900'}`}>
            <div className={`shrink-0 px-8 py-8 border-b ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-white border-slate-200'}`}><div className="flex flex-col md:flex-row md:items-end justify-between gap-6"><div><div className="flex items-center gap-2 mb-2">{activeId && (<button onClick={() => setActiveId(null)} className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors mr-1`}><ChevronLeft size={20} /></button>)}<h1 className="text-3xl font-black tracking-tight">{activeId ? activeCalcData?.title : 'Trading Calculators'}</h1></div><p className={`text-sm max-w-2xl leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{activeId ? activeCalcData?.desc : 'Precision tools for risk management, position sizing, and performance forecasting.'}</p></div></div></div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {!activeId ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {CALCULATORS.map(calc => (<button key={calc.id} onClick={() => setActiveId(calc.id as CalculatorType)} className={`group relative p-6 rounded-2xl border text-left transition-all hover:-translate-y-1 hover:shadow-xl ${isDarkMode ? 'bg-[#18181b] border-[#27272a] hover:border-zinc-600' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-md'}`}><div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${calc.bg} ${calc.color}`}><calc.icon size={24} /></div><h3 className="font-bold text-lg mb-1 group-hover:text-indigo-500 transition-colors">{calc.title}</h3><p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{calc.desc}</p><div className={`absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 ${isDarkMode ? 'text-zinc-600' : 'text-slate-300'}`}><ArrowRight size={20} /></div></button>))}
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto"><div className={`rounded-3xl border shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100'}`}><div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-zinc-800' : 'border-slate-100'}`}><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-50"><Info size={14} /> Interactive Mode</div><button onClick={() => setActiveId(null)} className={`p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors`} title="Reset Values"><RefreshCw size={16} /></button></div><div className="p-8 lg:p-12">{renderActiveCalculator()}</div><div className={`px-8 py-6 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white`}><div><h4 className="font-bold text-sm">Ready to execute?</h4><p className="text-xs opacity-80">Use these values in your next trade plan.</p></div><button className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 shadow-lg transition-colors">Copy Results</button></div></div></div>
                )}
            </div>
        </div>
    );
};

export default Calculators;