import React, { useState } from 'react';
import {
    Calculator, Info, ExternalLink, RefreshCw,
    ChevronLeft, LayoutGrid, Maximize2, ShieldCheck
} from 'lucide-react';

interface NewCalculatorsProps {
    isDarkMode: boolean;
}

type NewCalcType = 'margin' | 'pipvalue' | 'profit' | 'lotsize' | 'rrwinrate';

const NEW_CALCULATORS = [
    { id: 'margin', title: 'Margin Calculator', desc: 'Calculate required margin for your positions' },
    { id: 'pipvalue', title: 'Pip Value', desc: 'Determine the value of a pip for any pair' },
    { id: 'profit', title: 'Profit Calculator', desc: 'Estimate potential profit/loss for a trade' },
    { id: 'lotsize', title: 'Lot Size', desc: 'Calculate the ideal position size based on risk' },
    { id: 'rrwinrate', title: 'R:R & Win Rate', desc: 'Analyze the relationship between R:R and Win Rate' },
];

const NewCalculators: React.FC<NewCalculatorsProps> = ({ isDarkMode }) => {
    const [activeId, setActiveId] = useState<NewCalcType | null>(null);
    const [key, setKey] = useState(0); // For refreshing the iframe
    const [isLoading, setIsLoading] = useState(false);

    const getIframeUrl = (type: NewCalcType) => {
        const baseUrl = 'https://calcs.forexcalcs.com/';
        const primaryColor = '#FF4F01'; // Matching JFX branding
        const mode = isDarkMode ? '2' : '1'; 

        const pc = encodeURIComponent(primaryColor);
        return `${baseUrl}${type}/?pc=${pc}&mode=${mode}&lang=en&align=left`;
    };

    const handleRefresh = () => {
        setIsLoading(true);
        setKey(prev => prev + 1);
    };

    const handleSelectCalc = (id: NewCalcType) => {
        setIsLoading(true);
        setActiveId(id);
    };

    return (
        <div className={`w-full h-full flex flex-col ${isDarkMode ? 'bg-[#09090b]' : 'bg-[#F8FAFC]'}`}>
            {/* Header */}
            <div className={`px-8 py-6 border-b ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {activeId && (
                                <button
                                    onClick={() => setActiveId(null)}
                                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors mr-1"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            <h1 className="text-2xl font-black tracking-tight">
                                {activeId ? NEW_CALCULATORS.find(c => c.id === activeId)?.title : 'Advanced Calculators'}
                            </h1>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                            {activeId
                                ? NEW_CALCULATORS.find(c => c.id === activeId)?.desc
                                : 'Professional-grade forex calculation tools.'}
                        </p>
                    </div>

                    {activeId && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                className={`p-2 rounded-xl border transition-all ${isDarkMode
                                        ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }`}
                                title="Refresh Calculator"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {!activeId ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {NEW_CALCULATORS.map(calc => (
                            <button
                                key={calc.id}
                                onClick={() => handleSelectCalc(calc.id as NewCalcType)}
                                className={`group p-6 rounded-2xl border text-left transition-all hover:-translate-y-1 hover:shadow-xl ${isDarkMode
                                        ? 'bg-[#18181b] border-[#27272a] hover:border-[#FF4F01]/50'
                                        : 'bg-white border-slate-200 hover:border-[#FF4F01]/30 shadow-md'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[#FF4F01]/10 text-[#FF4F01]`}>
                                    <Calculator size={24} />
                                </div>
                                <h3 className="font-bold text-lg mb-1 group-hover:text-[#FF4F01] transition-colors">{calc.title}</h3>
                                <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                                    {calc.desc}
                                </p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in-95 duration-300">
                        <div className={`w-full max-w-[520px] rounded-3xl border overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200'
                            }`}>
                            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50/50'
                                }`}>
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-50">
                                    <ShieldCheck size={14} className="text-[#FF4F01]" /> Secure Calculation Engine
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold opacity-50 uppercase">Live</span>
                                </div>
                            </div>

                            <div className="relative bg-white flex justify-center items-center min-h-[500px]">
                                {isLoading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                                        <RefreshCw size={32} className="text-[#FF4F01] animate-spin mb-4" />
                                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Loading Engine...</span>
                                    </div>
                                )}
                                <iframe
                                    key={key}
                                    src={getIframeUrl(activeId)}
                                    width="484"
                                    height="500"
                                    frameBorder="0"
                                    scrolling="no"
                                    onLoad={() => setIsLoading(false)}
                                    className="mx-auto"
                                    style={{
                                        maxWidth: '100%',
                                        filter: isDarkMode ? 'contrast(1.1)' : 'none',
                                        opacity: isLoading ? 0 : 1
                                    }}
                                />
                            </div>

                            <div className={`px-6 py-4 border-t text-[10px] text-center opacity-40 font-medium ${isDarkMode ? 'border-zinc-800' : 'border-slate-100'
                                }`}>
                                Powered by ForexCalcs Engine • Precision Guaranteed
                            </div>
                        </div>

                        <div className="mt-8 flex items-center gap-6 opacity-50">
                            <div className="flex items-center gap-2 text-xs">
                                <Info size={14} />
                                <span>Values update in real-time</span>
                            </div>
                            <div className="w-px h-4 bg-current opacity-20" />
                            <a
                                href="https://forexcalcs.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs hover:text-[#FF4F01] transition-colors"
                            >
                                <ExternalLink size={14} />
                                <span>Official Documentation</span>
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewCalculators;
