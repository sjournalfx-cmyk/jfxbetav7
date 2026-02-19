import React, { useState, useCallback } from 'react';
import {
    MousePointer2, Slash, ArrowRight, ArrowUpRight,
    Minus, Columns, Square, Layers, Trash2, GripVertical, Magnet,
    Pin, Lock, Unlock, TrendingUp, TrendingDown, RotateCw, 
    Type, GitBranch, BarChart2, Undo, Redo
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
    orientation: 'horizontal' | 'vertical';
    toggleOrientation: () => void;
    isDarkMode?: boolean;
    style?: React.CSSProperties;
    onPositionChange?: (pos: { x: number, y: number }) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    currentColor?: string;
    setCurrentColor?: (color: string) => void;
}

const TOOL_COLORS = [
    '#2962ff', '#FF4F01', '#10b981', '#ef4444', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#787b86', '#ffffff', '#000000'
];

const TOOLS = [
    { id: 'cursor', icon: MousePointer2, title: 'Cursor', shortcut: 'V' },
    { id: 'trendline', icon: Slash, title: 'Trend Line', shortcut: 'T' },
    { id: 'ray', icon: ArrowUpRight, title: 'Ray', shortcut: 'R' },
    { id: 'arrow', icon: ArrowRight, title: 'Arrow', shortcut: 'A' },
    { id: 'horizontal', icon: Minus, title: 'Horizontal Line', shortcut: 'H' },
    { id: 'vertical', icon: Columns, title: 'Vertical Line', shortcut: 'N' },
    { id: 'rect', icon: Square, title: 'Rectangle', shortcut: 'B' },
    { id: 'long', icon: TrendingUp, title: 'Long Position', shortcut: 'L' },
    { id: 'short', icon: TrendingDown, title: 'Short Position', shortcut: 'S' },
];

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
    orientation,
    toggleOrientation,
    isDarkMode,
    style,
    onPositionChange,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    currentColor = '#2962ff',
    setCurrentColor
}) => {
    const isDragging = React.useRef(false);
    const dragOffset = React.useRef({ x: 0, y: 0 });
    const [showColorPicker, setShowColorPicker] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = true;
        
        const toolbarEl = e.currentTarget.closest('.drawing-toolbar-root') as HTMLElement;
        if (toolbarEl) {
            const rect = toolbarEl.getBoundingClientRect();
            dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!isDragging.current) return;
            moveEvent.preventDefault();
            
            const toolbarDiv = document.querySelector('.drawing-toolbar-root') as HTMLElement;
            const container = toolbarDiv?.offsetParent as HTMLElement;
            
            if (container) {
                const containerRect = container.getBoundingClientRect();
                
                let newX = moveEvent.clientX - containerRect.left - dragOffset.current.x;
                let newY = moveEvent.clientY - containerRect.top - dragOffset.current.y;
                
                newX = Math.max(0, Math.min(newX, containerRect.width - (toolbarDiv?.offsetWidth || 50)));
                newY = Math.max(0, Math.min(newY, containerRect.height - (toolbarDiv?.offsetHeight || 300)));

                if (onPositionChange) {
                    onPositionChange({ x: newX, y: newY });
                }
            }
        };

        const onMouseUp = () => {
            isDragging.current = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const handleToolSelect = useCallback((toolId: ToolType) => {
        if (activeTool === toolId && toolId !== 'cursor') {
            toggleSticky();
        } else {
            setActiveTool(toolId);
        }
    }, [activeTool, setActiveTool, toggleSticky]);

    const handleToolDoubleClick = useCallback((toolId: string) => {
        if (toolId !== 'cursor') {
            setActiveTool(toolId as ToolType);
            if (!isSticky) toggleSticky();
        }
    }, [setActiveTool, isSticky, toggleSticky]);

    const isVertical = orientation === 'vertical';

    return (
        <div className={`absolute z-30 drawing-toolbar-root transition-all duration-200 ease-out`} style={style}>
            <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center gap-1 rounded-2xl shadow-2xl border p-1.5 ${isDarkMode 
                ? 'bg-[#1e222d]/95 border-zinc-700/50 backdrop-blur-sm' 
                : 'bg-white/95 border-slate-200 backdrop-blur-md'}`}>
                
                {/* Drag Handle */}
                <div 
                    className={`flex items-center justify-center p-1.5 cursor-grab active:cursor-grabbing rounded-lg hover:bg-black/5 ${isDarkMode ? 'text-zinc-500 hover:bg-white/5' : 'text-slate-400'}`}
                    onMouseDown={handleMouseDown}
                >
                    <GripVertical size={14} className={isVertical ? 'rotate-90' : ''} />
                </div>

                <div className={`${isVertical ? 'w-5 h-px my-0.5' : 'w-px h-5 mx-0.5'} ${isDarkMode ? 'bg-zinc-700/50' : 'bg-slate-200'}`} />

                {/* Undo/Redo */}
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`p-1.5 rounded-lg transition-colors ${canUndo 
                            ? (isDarkMode ? 'text-zinc-400 hover:bg-[#2a2e39]' : 'text-slate-500 hover:bg-slate-100')
                            : 'opacity-30 cursor-not-allowed'}`}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={14} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`p-1.5 rounded-lg transition-colors ${canRedo 
                            ? (isDarkMode ? 'text-zinc-400 hover:bg-[#2a2e39]' : 'text-slate-500 hover:bg-slate-100')
                            : 'opacity-30 cursor-not-allowed'}`}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo size={14} strokeWidth={1.5} />
                    </button>
                </div>

                <div className={`${isVertical ? 'w-5 h-px my-0.5' : 'w-px h-5 mx-0.5'} ${isDarkMode ? 'bg-zinc-700/50' : 'bg-slate-200'}`} />

                {/* Color Picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-1.5 rounded-lg hover:bg-black/5 relative"
                        title="Stroke Color"
                    >
                        <div 
                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: currentColor }}
                        />
                    </button>
                    {showColorPicker && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                            <div className={`absolute ${isVertical ? 'left-full ml-2 top-0' : 'top-full mt-2 left-0'} z-50 p-2 rounded-xl border shadow-xl ${isDarkMode ? 'bg-[#1e222d] border-zinc-700' : 'bg-white border-slate-200'}`}>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {TOOL_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => {
                                                setCurrentColor?.(color);
                                                setShowColorPicker(false);
                                            }}
                                            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${currentColor === color ? 'border-[#FF4F01] scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className={`${isVertical ? 'w-5 h-px my-0.5' : 'w-px h-5 mx-0.5'} ${isDarkMode ? 'bg-zinc-700/50' : 'bg-slate-200'}`} />

                {/* Drawing Tools */}
                {TOOLS.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool.id as ToolType)}
                        onDoubleClick={() => handleToolDoubleClick(tool.id)}
                        className={`p-2 rounded-lg relative group/tool transition-all ${activeTool === tool.id
                                ? 'text-[#2962ff] bg-[#2962ff]/10 shadow-[0_0_12px_rgba(41,98,255,0.3)]'
                                : (isDarkMode ? 'text-zinc-400 hover:bg-[#2a2e39]' : 'text-slate-500 hover:bg-slate-100')
                            }`}
                        title={`${tool.title}${activeTool === tool.id ? (isSticky ? ' (Sticky ON)' : ' (Locked)') : ''} [${tool.shortcut}]`}
                    >
                        <tool.icon size={18} strokeWidth={1.5} />
                        {activeTool === tool.id && isSticky && (
                            <div className="absolute -top-1 -right-1 bg-[#2962ff] rounded-full p-0.5 shadow-[0_0_10px_rgba(41,98,255,0.5)]">
                                <Pin size={8} className="text-white" fill="white" />
                            </div>
                        )}
                        {/* Keyboard shortcut hint */}
                        <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold opacity-0 group-hover/tool:opacity-100 transition-opacity whitespace-nowrap z-50 ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-800 text-white'}`}>
                            {tool.shortcut}
                        </div>
                    </button>
                ))}

                <div className={`${isVertical ? 'w-5 h-px my-0.5' : 'w-px h-5 mx-0.5'} ${isDarkMode ? 'bg-zinc-700/50' : 'bg-slate-200'}`} />

                {/* Mode Toggles */}
                <button
                    onClick={toggleMagnetMode}
                    className={`p-2 rounded-lg transition-all ${magnetMode 
                        ? 'text-[#2962ff] bg-[#2962ff]/10' 
                        : (isDarkMode ? 'text-zinc-400 hover:bg-[#2a2e39]' : 'text-slate-500 hover:bg-slate-100')}`}
                    title="Magnet Mode (Snap to OHLC) [M]"
                >
                    <Magnet size={18} strokeWidth={1.5} />
                </button>

                <button
                    onClick={toggleLocked}
                    className={`p-2 rounded-lg transition-all ${isLocked 
                        ? 'text-amber-500 bg-amber-500/10' 
                        : (isDarkMode ? 'text-zinc-400 hover:bg-[#2a2e39]' : 'text-slate-500 hover:bg-slate-100')}`}
                    title={isLocked ? "Unlock Drawings [L]" : "Lock Drawings [L]"}
                >
                    {isLocked ? <Lock size={18} strokeWidth={1.5} /> : <Unlock size={18} strokeWidth={1.5} />}
                </button>

                {/* Flip Orientation */}
                <button
                    onClick={toggleOrientation}
                    className={`p-2 rounded-lg ${isDarkMode ? 'text-zinc-400 hover:bg-[#2a2e39]' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Flip Toolbar Orientation"
                >
                    <RotateCw size={16} strokeWidth={1.5} />
                </button>

                <div className={`${isVertical ? 'w-5 h-px my-0.5' : 'w-px h-5 mx-0.5'} ${isDarkMode ? 'bg-zinc-700/50' : 'bg-slate-200'}`} />

                <button
                    onClick={clearDrawings}
                    className={`p-2 rounded-lg hover:text-rose-500 hover:bg-rose-500/10 transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}
                    title="Clear All Drawings"
                >
                    <Trash2 size={18} strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
});
