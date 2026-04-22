import React, { useState, useRef, useEffect } from 'react';
import mermaid from 'mermaid';
import { motion, AnimatePresence } from 'motion/react';
import { 
    List, CheckCircle2, Check, StickyNote, Wand2, 
    ZoomIn, ZoomOut, Maximize2, Minimize2, 
    RotateCcw, Move, X, Download
} from 'lucide-react';

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
        const newItems = localItems.map((item, i) => 
            i === index ? { ...item, checked: !item.checked } : item
        );
        setLocalItems(newItems);
    };

    const progress = localItems.length > 0 
        ? (localItems.filter(i => i.checked).length / localItems.length) * 100 
        : 0;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full overflow-hidden rounded-2xl border ${
                isDarkMode 
                    ? 'bg-zinc-900/40 border-zinc-800 shadow-lg' 
                    : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}
        >
            {/* Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between ${
                isDarkMode ? 'border-zinc-800 bg-zinc-900/60' : 'border-slate-200 bg-white'
            }`}>
                <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        <List size={14} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {title || 'Checklist'}
                    </span>
                </div>
                <div className={`text-[9px] font-bold tabular-nums ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                    {Math.round(progress)}% COMPLETE
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-0.5 w-full bg-zinc-200 dark:bg-zinc-800">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-emerald-500"
                />
            </div>

            {/* Items */}
            <div className="p-2 space-y-1">
                {localItems.map((item, i) => (
                    <button
                        key={i}
                        onClick={() => toggleItem(i)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                            item.checked
                                ? (isDarkMode ? 'bg-emerald-500/5 text-zinc-500' : 'bg-emerald-50/50 text-slate-400')
                                : (isDarkMode ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-white text-slate-700 shadow-sm border-transparent hover:border-slate-200 border')
                        }`}
                    >
                        <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            item.checked
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : (isDarkMode ? 'border-zinc-700 bg-zinc-800' : 'border-slate-200 bg-white group-hover:border-emerald-500/50')
                        }`}>
                            {item.checked && <Check size={12} strokeWidth={4} />}
                        </div>
                        <span className={`text-xs font-medium text-left flex-1 ${item.checked ? 'line-through opacity-50' : ''}`}>
                            {item.text}
                        </span>
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

// Preset templates for common trading diagrams
export const DIAGRAM_PRESETS = {
    decision: {
        FLOWCHART: `graph TD
    A[Market Open] --> B{Price > EMA?}
    B -->|Yes| C[Check Trend]
    B -->|No| D[Wait for Signal]
    C --> E{Momentum Alignment?}
    E -->|Yes| F[Enter Trade]
    E -->|No| G[Skip Trade]
    F --> H{Trade Winning?}
    H -->|Yes| I[Trail Stop]
    H -->|No| J[Check Time]
    J --> K{Time > Session End?}
    K -->|Yes| L[Close Trade]
    K -->|No| M[Hold]`,
        SEQUENCE: `sequenceDiagram
    participant Price as Price Action
    participant Signal as Signal Gen
    participant Execute as Execution
    participant Risk as Risk Manager
    
    Price->>Signal: Price Updates
    Signal->>Execute: Signal Triggered
    Execute->>Risk: Check Limits
    Risk->>Execute: Approved
    Execute->>Price: Order Filled
    Price-->>Risk: P&L Update`
    },
    psychology: {
        FLOWCHART: `graph TD
    A[Start Session] --> B{Emotional State?}
    B -->|Tilted| C[Pause Trading]
    C --> D[Deep Breaths]
    D --> E[Review Rules]
    E --> F{Ready to Reset?}
    F -->|Yes| G[Resume Trading]
    F -->|No| H[End Session]
    B -->|Calm| G
    G --> I{Trade Result?}
    I -->|Win| J[Note Success]
    I -->|Loss| K[Analyze Mistake]
    J --> A
    K --> L{Repeat Mistake?}
    L -->|Yes| M[Tighten Rules]
    L -->|No| A
    M --> A`
    },
    scaling: {
        GANTT: `gantt
    title 90-Day Scaling Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1
    Base Risk (1R)       :a1, 2024-01-01, 30d
    Test Stability        :a2, after a1, 20d
    section Phase 2
    1.25R Implementation :b1, after a2, 30d
    Review Performance   :b2, after b1, 10d
    section Phase 3
    1.5R Scaling         :c1, after b2, 30d
    Final Assessment     :c2, after c1, 10d`
    }
};

export const CHECKLIST_PRESETS = {
    entry: [
        "Market aligns with daily bias",
        "Price at key structure level",
        "Confirm momentum direction",
        "Check news/events calendar",
        "Risk/Reward minimum 1:2",
        "Position size calculated",
        "Stop loss placed at logical level",
        "Take profit target identified"
    ],
    exit: [
        "Hit profit target - Exit full",
        "Hit stop loss - Accept loss",
        "Time exit - Session end",
        "Trailing stop activated",
        "News event approaching",
        "Technical reversal signal"
    ],
    psychology: [
        "Are you trading the plan?",
        "Is your mind clear?",
        "Did you check your P&L?",
        "Are you emotionally stable?",
        "Is this a revenge trade?",
        "Have you taken breaks?",
        "Is your focus sharp?",
        "Are you following rules?"
    ],
    risk: [
        "Max risk per trade: 1-2%",
        "Max daily loss: 6%",
        "Max open positions: 3",
        "Correlation check done",
        "Lot size verified",
        "Account balance confirmed"
    ]
};

// Mermaid Widget Component
export const MermaidWidget = ({ code, type, isDarkMode, onSave, onFix }: { code: string, type: string, isDarkMode: boolean, onSave?: () => void, onFix?: (type: string, code: string) => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const sanitizeCode = (rawCode: string) => {
        let sanitized = rawCode
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\')
            .trim();
        if (!sanitized.includes('graph ') && !sanitized.includes('sequenceDiagram') && !sanitized.includes('gantt')) {
            sanitized = 'graph TD\n    A[Empty Diagram] --> B[No Data]';
        }
        return sanitized;
    };

    useEffect(() => {
        let isMounted = true;
        const renderDiagram = async () => {
            if (!containerRef.current || !isMounted) return;
            setIsRendering(true);
            try {
                if (containerRef.current) containerRef.current.innerHTML = '';
                
                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDarkMode ? 'dark' : 'default',
                    securityLevel: 'loose',
                    fontFamily: 'Inter',
                    fontSize: 16,
                    themeVariables: {
                        primaryColor: '#4f46e5',
                        primaryTextColor: isDarkMode ? '#e2e8f0' : '#1e293b',
                        primaryBorderColor: '#4f46e5',
                        lineColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
                        secondaryColor: '#10b981',
                        tertiaryColor: '#f59e0b'
                    }
                });

                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const sanitizedCode = sanitizeCode(code);
                const { svg } = await mermaid.render(id, sanitizedCode);
                
                if (containerRef.current && isMounted) {
                    containerRef.current.innerHTML = svg;
                    const svgElement = containerRef.current.querySelector('svg');
                    if (svgElement) {
                        svgElement.removeAttribute('height');
                        svgElement.style.width = '100%';
                        svgElement.style.height = 'auto';
                        svgElement.style.minWidth = '300px';
                        svgElement.style.display = 'block';

                        if (wrapperRef.current) {
                            const containerWidth = wrapperRef.current.clientWidth;
                            const containerHeight = wrapperRef.current.clientHeight;
                            const bBox = svgElement.getBBox();
                            
                            const scaleX = containerWidth / Math.max(bBox.width, 300);
                            const scaleY = containerHeight / Math.max(bBox.height, 200);
                            const initialScale = Math.min(Math.min(scaleX, scaleY), 1.2);
                            
                            setScale(Math.max(initialScale, 0.3));
                        }
                    }
                    setError(null);
                    setRetryCount(0);
                }
            } catch (e: any) {
                console.error("Mermaid Render Error", e);
                if (isMounted) {
                    if (retryCount < 2) {
                        setRetryCount(r => r + 1);
                        setTimeout(() => renderDiagram(), 500);
                    } else {
                        setError("Diagram syntax error. Please check the format.");
                    }
                }
            } finally {
                if (isMounted) setIsRendering(false);
            }
        };

        const timeoutId = setTimeout(renderDiagram, 200);
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [code, isDarkMode, isFullScreen, retryCount]);

    const handleDownload = () => {
        const svg = containerRef.current?.querySelector('svg');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `jfx-architect-${type.toLowerCase()}-${Date.now()}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || isFullScreen) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setScale(s => Math.min(4, Math.max(0.2, s + delta)));
        }
    };

    const WidgetContent = (
        <div className={`flex flex-col h-full ${isFullScreen ? 'p-8' : ''}`}>
            <div className="w-full flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                        <Wand2 size={18} />
                    </div>
                    <div>
                        <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isFullScreen ? 'text-white' : 'opacity-80'}`}>{type} Roadmap</h4>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${isFullScreen ? 'text-white/40' : 'text-zinc-500'}`}>Visual Decision Tree</p>
                    </div>
                    {isFullScreen && (
                         <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                            <Move size={10} />
                            <span>Pan & Zoom Enabled</span>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 rounded-xl p-1 ${isDarkMode ? 'bg-black/40 border border-white/5 shadow-inner' : 'bg-slate-100'}`}>
                        <button 
                            onClick={() => setScale(s => Math.max(0.2, s - 0.2))} 
                            className={`p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-white text-slate-500 shadow-sm'}`}
                        >
                            <ZoomOut size={14} />
                        </button>
                        <span className="text-[10px] font-black font-mono w-12 text-center opacity-60">
                            {Math.round(scale * 100)}%
                        </span>
                        <button 
                            onClick={() => setScale(s => Math.min(4, s + 0.2))} 
                            className={`p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-white text-slate-500 shadow-sm'}`}
                        >
                            <ZoomIn size={14} />
                        </button>
                        <button 
                            onClick={() => setScale(1)} 
                            className={`p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-white text-slate-500 shadow-sm'}`}
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>

                    <div className={`w-px h-8 mx-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

                    <button
                        onClick={handleDownload}
                        className={`p-2.5 rounded-xl transition-all shadow-lg ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                        title="Export Blueprint"
                    >
                        <Download size={16} />
                    </button>

                    <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className={`p-2.5 rounded-xl transition-all shadow-lg ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'}`}
                    >
                        {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>

                    {onSave && !isFullScreen && (
                        <button
                            onClick={onSave}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-indigo-400' : 'bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-600'}`}
                        >
                            <StickyNote size={14} />
                            Save
                        </button>
                    )}
                </div>
            </div>

            <div className={`relative flex-1 flex items-center justify-center overflow-hidden rounded-3xl border transition-all duration-500 ${
                isDarkMode ? 'bg-[#08080c] border-white/5 shadow-inner' : 'bg-slate-50/50 border-slate-200 shadow-inner'
            } ${isFullScreen ? 'h-full ring-1 ring-white/10' : 'min-h-[450px] max-h-[700px]'}`}>
                
                {isRendering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#08080c]/40 backdrop-blur-md z-10">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-500/20" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Mapping Logic...</span>
                        </div>
                    </div>
                )}

                <div 
                    ref={wrapperRef} 
                    className="w-full h-full overflow-hidden relative flex items-center justify-center bg-[radial-gradient(#4f46e511_1px,transparent_1px)] [background-size:40px_40px]"
                    onWheel={handleWheel}
                >
                    <motion.div
                        drag
                        dragMomentum={false}
                        className="flex items-center justify-center p-40 cursor-grab active:cursor-grabbing"
                        style={{ scale }}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale }}
                    >
                        <div ref={containerRef} className="mermaid-render-container flex items-center justify-center drop-shadow-2xl" />
                    </motion.div>
                </div>

                {!isFullScreen && (
                    <div className="absolute bottom-5 right-5 p-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 pointer-events-none opacity-60 shadow-2xl flex items-center gap-3">
                        <Move size={14} className="text-white" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Neural Workspace</span>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl z-20 p-8 text-center">
                        <div className="flex flex-col items-center gap-5 max-w-sm">
                            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-2xl shadow-rose-500/20">
                                <X size={32} />
                            </div>
                            <div>
                                <h5 className="text-sm font-black uppercase tracking-tight text-white mb-2">Neural Mapping Error</h5>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">{error}</p>
                            </div>
                            {onFix && (
                                <button
                                    onClick={() => onFix(type, code)}
                                    className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/40 transform hover:-translate-y-1 active:scale-95"
                                >
                                    <RotateCcw size={16} />
                                    Re-Initialize Neural Core
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {isFullScreen && (
                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={() => setIsFullScreen(false)}
                        className="px-10 py-4 rounded-[24px] bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:tracking-[0.4em] active:scale-95 shadow-2xl"
                    >
                        Deactivate Workspace
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full p-6 sm:p-8 flex flex-col bg-[radial-gradient(#88888811_1px,transparent_1px)] [background-size:24px_24px] rounded-[32px] border ${
                isDarkMode 
                    ? 'bg-[#0a0a0f] border-white/5 shadow-2xl' 
                    : 'bg-white border-slate-200 shadow-xl shadow-slate-200/40'
            }`}
        >
            {WidgetContent}
        </motion.div>
    );
};
