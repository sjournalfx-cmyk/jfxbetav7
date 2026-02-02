import React from 'react';
import {
    MousePointer2, Slash, ArrowRight, ArrowUpRight,
    Minus, Columns, Square, Layers, Trash2, GripVertical, Magnet,
    Pin, Lock, Unlock, TrendingUp, TrendingDown, RotateCw
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
    orientation,
    toggleOrientation,
    isDarkMode,
    style,
    onPositionChange
}) => {
    const isDragging = React.useRef(false);
    const dragOffset = React.useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = true;
        
        // Calculate offset from the top-left of the toolbar
        // We use closest('.drawing-toolbar-root') to find the toolbar element
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
            
            // Find parent container to calculate relative position
            const toolbarDiv = document.querySelector('.drawing-toolbar-root') as HTMLElement;
            const container = toolbarDiv?.offsetParent as HTMLElement;
            
            if (container) {
                const containerRect = container.getBoundingClientRect();
                
                // Calculate new position relative to container
                let newX = moveEvent.clientX - containerRect.left - dragOffset.current.x;
                let newY = moveEvent.clientY - containerRect.top - dragOffset.current.y;
                
                // Boundary checks (optional, but good for UX)
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

    const isVertical = orientation === 'vertical';

    return (
        <div className={`absolute z-30 drawing-toolbar-root transition-all duration-200 ease-out`} style={style}>
            <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center gap-1 rounded-2xl shadow-2xl border p-1.5 ${isDarkMode 
                ? 'bg-[#1e222d]/95 border-zinc-700/50 backdrop-blur-sm' 
                : 'bg-white/95 border-slate-200 backdrop-blur-md'}`}>
                
                {/* Drag Handle */}
                <div 
                    className={`flex items-center justify-center p-1 cursor-grab active:cursor-grabbing rounded-lg hover:bg-black/5 ${isDarkMode ? 'text-zinc-500 hover:bg-white/5' : 'text-slate-400'}`}
                    onMouseDown={handleMouseDown}
                >
                    <GripVertical size={14} className={isVertical ? 'rotate-90' : ''} />
                </div>

                <div className={`${isVertical ? 'w-5 h-px my-0.5' : 'w-px h-5 mx-0.5'} ${isDarkMode ? 'bg-zinc-700/50' : 'bg-slate-200'}`} />

                {/* Flip Button */}
                <button
                    onClick={toggleOrientation}
                    className={`p-2 rounded-lg ${isDarkMode ? 'text-zinc-400 hover:bg-[#2a2e39]' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Flip Toolbar"
                >
                    <RotateCw size={16} strokeWidth={1.5} />
                </button>

                <div className={`${isVertical ? 'w-5 h-px my-0.5' : 'w-px h-5 mx-0.5'} ${isDarkMode ? 'bg-zinc-700/50' : 'bg-slate-200'}`} />

                {[
                    { id: 'cursor', icon: MousePointer2, title: 'Cursor' },
                    { id: 'trendline', icon: Slash, title: 'Trend Line' },
                    { id: 'arrow', icon: ArrowRight, title: 'Arrow' },
                    { id: 'ray', icon: ArrowUpRight, title: 'Ray' },
                    { id: 'horizontal', icon: Minus, title: 'Horizontal Line' },
                    { id: 'vertical', icon: Columns, title: 'Vertical Line' },
                    { id: 'rect', icon: Square, title: 'Rectangle' },
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

                <div className={`${isVertical ? 'w-5 h-px my-0.5' : 'w-px h-5 mx-0.5'} ${isDarkMode ? 'bg-zinc-700/50' : 'bg-slate-200'}`} />

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