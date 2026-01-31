import React from 'react';
import {
    MousePointer2, Slash, ArrowRight, ArrowUpRight,
    Minus, Columns, Square, Layers, Trash2, GripVertical, Magnet,
    Pin, Lock, Unlock, TrendingUp, TrendingDown
} from 'lucide-react';
import { ToolType } from './types';

interface DrawingToolbarProps {
    activeTool: ToolType;
    setActiveTool: (tool: ToolType) => void;
    clearDrawings: () => void;
    magnetMode: boolean;
    toggleMagnetMode: () => void;
    isSticky: boolean;
    toggleSticky: () => void;
    isLocked: boolean;
    toggleLocked: () => void;
    isDarkMode?: boolean;
}

export const DrawingToolbar = React.memo<DrawingToolbarProps>(({
    activeTool,
    setActiveTool,
    clearDrawings,
    magnetMode,
    toggleMagnetMode,
    isSticky,
    toggleSticky,
    isLocked,
    toggleLocked,
    isDarkMode
}) => {
    return (
        <div className="absolute left-1/2 -translate-x-1/2 top-4 z-30">
            <div className={`flex items-center gap-1 rounded-full shadow-2xl border px-2 py-1.5 ${isDarkMode 
                ? 'bg-[#1e222d]/95 border-zinc-700/50 backdrop-blur-sm' 
                : 'bg-white/95 border-slate-200 backdrop-blur-md'}`}>
                <div className={`px-1 cursor-grab active:cursor-grabbing ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                    <GripVertical size={14} />
                </div>

                <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-zinc-700/50' : 'bg-slate-200'}`} />

                {[
                    { id: 'cursor', icon: MousePointer2, title: 'Cursor' },
                    { id: 'trendline', icon: Slash, title: 'Trend Line' },
                    { id: 'arrow', icon: ArrowRight, title: 'Arrow' },
                    { id: 'ray', icon: ArrowUpRight, title: 'Ray' },
                    { id: 'horizontal', icon: Minus, title: 'Horizontal Line' },
                    { id: 'vertical', icon: Columns, title: 'Vertical Line' },
                    { id: 'rect', icon: Square, title: 'Rectangle' },
                    { id: 'fib', icon: Layers, title: 'Fib Retracement' },
                    { id: 'long', icon: TrendingUp, title: 'Long Position' },
                    { id: 'short', icon: TrendingDown, title: 'Short Position' },
                ].map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => {
                            if (activeTool === tool.id && tool.id !== 'cursor') {
                                toggleSticky(); // Toggle sticky if clicking active tool
                            } else {
                                setActiveTool(tool.id as ToolType);
                            }
                        }}
                        onDoubleClick={() => {
                            if (tool.id !== 'cursor') {
                                setActiveTool(tool.id as ToolType);
                                if (!isSticky) toggleSticky();
                            }
                        }}
                        className={`p-2 rounded-lg relative group/tool ${activeTool === tool.id
                                ? 'text-[#2962ff] bg-[#2962ff]/10'
                                : (isDarkMode ? 'text-zinc-400 hover:bg-[#2a2e39]' : 'text-slate-500 hover:bg-slate-100')
                            }`}
                        title={`${tool.title}${activeTool === tool.id ? (isSticky ? ' (Sticky ON)' : ' (Click again to Lock)') : ''}`}
                    >
                        <tool.icon size={18} strokeWidth={1.5} />
                        {activeTool === tool.id && isSticky && (
                            <div className="absolute -top-1 -right-1 bg-[#2962ff] rounded-full p-0.5 shadow-[0_0_10px_rgba(41,98,255,0.5)]">
                                <Pin size={8} className="text-white" fill="white" />
                            </div>
                        )}
                    </button>
                ))}

                <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-zinc-700/50' : 'bg-slate-200'}`} />

                <button
                    onClick={toggleMagnetMode}
                    className={`p-2 rounded-lg ${magnetMode 
                        ? 'text-[#2962ff] bg-[#2962ff]/10' 
                        : (isDarkMode ? 'text-zinc-400 hover:bg-[#2a2e39]' : 'text-slate-500 hover:bg-slate-100')}`}
                    title="Magnet Mode (Snap to OHLC)"
                >
                    <Magnet size={18} strokeWidth={1.5} />
                </button>

                <button
                    onClick={toggleLocked}
                    className={`p-2 rounded-lg ${isLocked 
                        ? 'text-amber-500 bg-amber-500/10' 
                        : (isDarkMode ? 'text-zinc-400 hover:bg-[#2a2e39]' : 'text-slate-500 hover:bg-slate-100')}`}
                    title={isLocked ? "Unlock Drawings" : "Lock Drawings"}
                >
                    {isLocked ? <Lock size={18} strokeWidth={1.5} /> : <Unlock size={18} strokeWidth={1.5} />}
                </button>

                <button
                    onClick={clearDrawings}
                    className={`p-2 rounded-lg hover:text-rose-500 ${isDarkMode ? 'text-zinc-400 hover:bg-[#2a2e39]' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Remove All Drawings"
                >
                    <Trash2 size={18} strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
});
