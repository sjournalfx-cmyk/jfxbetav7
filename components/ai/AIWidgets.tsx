import React, { useState, useRef, useEffect } from 'react';
import mermaid from 'mermaid';
import { motion, AnimatePresence } from 'motion/react';
import { 
    List, CheckCircle2, StickyNote, Wand2, 
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
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isRendering, setIsRendering] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const renderDiagram = async () => {
            if (!containerRef.current || !isMounted) return;
            setIsRendering(true);
            try {
                // Clear previous content
                if (containerRef.current) containerRef.current.innerHTML = '';
                
                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDarkMode ? 'dark' : 'default',
                    securityLevel: 'loose',
                    fontFamily: 'Inter',
                    fontSize: 16,
                });

                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, code.replace(/\\n/g, '\n').trim());
                
                if (containerRef.current && isMounted) {
                    containerRef.current.innerHTML = svg;
                    const svgElement = containerRef.current.querySelector('svg');
                    if (svgElement) {
                        svgElement.removeAttribute('height');
                        svgElement.style.width = '100%';
                        svgElement.style.height = 'auto';
                        svgElement.style.minWidth = '300px';
                        svgElement.style.display = 'block';

                        // Auto-scale logic
                        if (wrapperRef.current) {
                            const containerWidth = wrapperRef.current.clientWidth;
                            const containerHeight = wrapperRef.current.clientHeight;
                            const bBox = svgElement.getBBox();
                            
                            const scaleX = (containerWidth * 0.8) / bBox.width;
                            const scaleY = (containerHeight * 0.8) / bBox.height;
                            const initialScale = Math.min(Math.min(scaleX, scaleY), 1.2); // Cap at 1.2x zoom
                            
                            setScale(Math.max(initialScale, 0.4)); // Don't go below 0.4x
                        }
                    }
                    setError(null);
                }
            } catch (e: any) {
                console.error("Mermaid Render Error", e);
                if (isMounted) setError("Syntax Error: Could not render diagram");
            } finally {
                if (isMounted) setIsRendering(false);
            }
        };

        const timeoutId = setTimeout(renderDiagram, 150);
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [code, isDarkMode, isFullScreen]);

    const handleDownload = () => {
        const svg = containerRef.current?.querySelector('svg');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `jfx-strategy-${type.toLowerCase()}-${Date.now()}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const WidgetContent = (
        <div className={`flex flex-col h-full ${isFullScreen ? 'p-6' : ''}`}>
            <div className="w-full flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isFullScreen ? 'text-white' : 'opacity-40'}`}>{type} Diagram</span>
                    {isFullScreen && (
                         <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-zinc-500">
                            <Move size={10} />
                            <span>Drag to Pan</span>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <div className={`flex items-center gap-1 rounded-lg p-1 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                        <button 
                            onClick={() => setScale(s => Math.max(0.4, s - 0.2))} 
                            className={`p-1.5 rounded-md transition-all ${isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-white text-slate-500'}`}
                            title="Zoom Out"
                        >
                            <ZoomOut size={14} />
                        </button>
                        <span className="text-[9px] font-mono font-bold w-10 text-center opacity-60">
                            {Math.round(scale * 100)}%
                        </span>
                        <button 
                            onClick={() => setScale(s => Math.min(3, s + 0.2))} 
                            className={`p-1.5 rounded-md transition-all ${isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-white text-slate-500'}`}
                            title="Zoom In"
                        >
                            <ZoomIn size={14} />
                        </button>
                        <button 
                            onClick={() => setScale(1)} 
                            className={`p-1.5 rounded-md transition-all ${isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-white text-slate-500'}`}
                            title="Reset Zoom"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>

                    <div className={`w-px h-6 mx-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

                    <button
                        onClick={handleDownload}
                        className={`p-1.5 rounded-md transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-zinc-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        title="Download SVG"
                    >
                        <Download size={14} />
                    </button>

                    <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className={`p-1.5 rounded-md transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-zinc-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    >
                        {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>

                    {onSave && !isFullScreen && (
                        <button
                            onClick={onSave}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                                }`}
                        >
                            <StickyNote size={12} />
                            Save
                        </button>
                    )}
                </div>
            </div>

            <div className={`relative flex-1 flex items-center justify-center overflow-hidden rounded-xl border ${
                isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'
            } ${isFullScreen ? 'h-full' : 'min-h-[400px] max-h-[600px]'}`}>
                
                {isRendering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px] z-10">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Drag Constraints Container */}
                <div ref={wrapperRef} className="w-full h-full overflow-hidden relative flex items-center justify-center">
                    <motion.div
                        drag
                        dragMomentum={false}
                        className="flex items-center justify-center p-20 cursor-grab active:cursor-grabbing"
                        style={{ scale }}
                        initial={{ x: 0, y: 0, opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div ref={containerRef} className="mermaid-render-container flex items-center justify-center" />
                    </motion.div>
                </div>

                {!isFullScreen && (
                    <div className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 pointer-events-none opacity-40">
                        <Move size={12} className="text-white" />
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-xs text-rose-500 font-bold uppercase tracking-widest">{error}</span>
                            {onFix && (
                                <button
                                    onClick={onFix}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    <Wand2 size={14} />
                                    Fix with AI
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {isFullScreen && (
                <div className="mt-4 flex justify-center">
                    <button 
                        onClick={() => setIsFullScreen(false)}
                        className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                    >
                        Close Preview
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <>
            <div className={`w-full p-4 flex flex-col bg-[radial-gradient(#88888822_1px,transparent_1px)] [background-size:20px_20px] rounded-xl border ${isDarkMode ? 'border-zinc-800' : 'border-slate-200 shadow-sm bg-white'}`}>
                {WidgetContent}
            </div>

            <AnimatePresence>
                {isFullScreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-10"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full h-full max-w-7xl relative"
                        >
                            <button 
                                onClick={() => setIsFullScreen(false)}
                                className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-all"
                            >
                                <X size={24} />
                            </button>
                            {WidgetContent}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

