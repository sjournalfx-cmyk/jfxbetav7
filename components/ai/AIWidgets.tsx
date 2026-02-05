import React, { useState, useRef, useEffect } from 'react';
import mermaid from 'mermaid';
import { List, CheckCircle2, StickyNote, Wand2 } from 'lucide-react';

// Checklist Widget Component
export const ChecklistWidget = ({
    title,
    items,
    isDarkMode
}: {
    title: string,
    items: { text: string, checked: boolean }[],
    isDarkMode: boolean
}) => {
    const [localItems, setLocalItems] = useState(items);

    const toggleItem = (index: number) => {
        const newItems = [...localItems];
        newItems[index].checked = !newItems[index].checked;
        setLocalItems(newItems);
    };

    return (
        <div className={`w-full p-5 rounded-xl border flex flex-col gap-4 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <List size={16} />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-widest">{title || 'Strategy Checklist'}</h4>
            </div>
            <div className="space-y-2">
                {localItems.map((item, i) => (
                    <button
                        key={i}
                        onClick={() => toggleItem(i)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left group ${item.checked
                                ? (isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600')
                                : (isDarkMode ? 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200')
                            }`}
                    >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${item.checked
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : (isDarkMode ? 'border-zinc-700' : 'border-slate-300 group-hover:border-indigo-500')
                            }`}>
                            {item.checked && <CheckCircle2 size={12} />}
                        </div>
                        <span className={`text-xs font-medium transition-all ${item.checked ? 'line-through opacity-60' : ''}`}>
                            {item.text}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// Mermaid Widget Component
export const MermaidWidget = ({ code, type, isDarkMode, onSave, onFix }: { code: string, type: string, isDarkMode: boolean, onSave?: () => void, onFix?: () => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const renderDiagram = async () => {
            if (!containerRef.current) return;
            try {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDarkMode ? 'dark' : 'default',
                    securityLevel: 'loose',
                    fontFamily: 'Inter',
                });
                const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, code.replace(/\\n/g, '\n'));
                containerRef.current.innerHTML = svg;
                setError(null);
            } catch (e: any) {
                console.error("Mermaid Render Error", e);
                setError("Invalid diagram code");
            }
        };

        renderDiagram();
    }, [code, isDarkMode]);

    return (
        <div className={`w-full p-4 flex flex-col items-center justify-center bg-[radial-gradient(#88888822_1px,transparent_1px)] [background-size:20px_20px] rounded-xl border ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
            <div className="w-full flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{type} Diagram</span>
                <div className="flex items-center gap-2">
                    {onSave && (
                        <button
                            onClick={onSave}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-zinc-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                        >
                            <StickyNote size={12} />
                            Save to Notebook
                        </button>
                    )}
                    {error && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-rose-500 font-bold uppercase">{error}</span>
                            {onFix && (
                                <button
                                    onClick={onFix}
                                    className={`p-1 rounded-md transition-all animate-pulse ${isDarkMode ? 'hover:bg-indigo-500/20 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'
                                        }`}
                                    title="Auto-fix with AI"
                                >
                                    <Wand2 size={14} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div ref={containerRef} className="max-w-full overflow-auto" />
        </div>
    );
};
