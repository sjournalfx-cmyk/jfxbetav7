import React, { useMemo, useCallback } from 'react';
import { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { Drawing, Point } from './types';
import { getRayCoordinates, calculateFibLevels } from './utils';

interface DrawingLayerProps {
    drawings: Drawing[];
    currentDrawing: Drawing | null;
    selectedDrawingId: string | null;
    mousePos: { x: number, y: number } | null;
    chart: IChartApi | null;
    series: ISeriesApi<"Candlestick"> | null;
    containerWidth: number;
    containerHeight: number;
    activeTool: string;
    hoveredDrawingId: string | null;
    isSelectBarMode: boolean;
    onMouseDownHandle: (e: React.MouseEvent, drawingId: string, handle: 'p1' | 'p2' | 'move' | 'target' | 'stop') => void;
    onSelectDrawing: (id: string) => void;
    onHoverDrawing: (id: string | null) => void;
    onDoubleClickDrawing?: (drawing: Drawing) => void;
    onContextMenuDrawing?: (e: React.MouseEvent, drawing: Drawing) => void;
    tick: number;
    isLocked: boolean;
    isDarkMode: boolean;
}

// Memoized coordinate converter - stable across renders
const useCoordinateConverter = (
    chart: IChartApi | null,
    series: ISeriesApi<"Candlestick"> | null
) => {
    return useCallback((point: Point): { x: number; y: number } | null => {
        if (!chart || !series) return null;
        const timeScale = chart.timeScale();

        let x: number | null = null;

        // Try logical coordinate first for highest stability during pan/zoom
        if (point.logical !== undefined && point.logical !== null && typeof point.logical === 'number') {
            x = timeScale.logicalToCoordinate(point.logical as any);
        }

        // Fallback to time-based coordinate if logical conversion fails or isn't present
        if (x === null) {
            x = timeScale.timeToCoordinate(point.time as Time);
        }

        const y = series.priceToCoordinate(point.price);

        // We allow x/y to be outside the container range, but not null (undefined behavior)
        if (x === null || y === null) return null;
        return { x, y };
    }, [chart, series]);
};

// Individual drawing renderer component - memoized
const DrawingItem = React.memo<{
    drawing: Drawing;
    isPreview: boolean;
    mousePos: { x: number; y: number } | null;
    selectedDrawingId: string | null;
    hoveredDrawingId: string | null;
    containerWidth: number;
    containerHeight: number;
    isDarkMode?: boolean;
    isLocked?: boolean;
    convertCoordinate: (point: Point) => { x: number; y: number } | null;
    series: ISeriesApi<"Candlestick"> | null;
    onSelectDrawing: (id: string) => void;
    onHoverDrawing: (id: string | null) => void;
    onMouseDownHandle: (e: React.MouseEvent, drawingId: string, handle: 'p1' | 'p2' | 'move' | 'target' | 'stop') => void;
    onDoubleClickDrawing?: (drawing: Drawing) => void;
    onContextMenuDrawing?: (e: React.MouseEvent, drawing: Drawing) => void;
    tick?: number;
}>(({
    drawing: d,
    isPreview,
    mousePos,
    selectedDrawingId,
    hoveredDrawingId,
    containerWidth,
    containerHeight,
    isDarkMode,
    isLocked,
    convertCoordinate,
    series,
    onSelectDrawing,
    onHoverDrawing,
    onMouseDownHandle,
    onDoubleClickDrawing,
    onContextMenuDrawing,
    tick
}) => {
    // Calculate coordinates
    const p1Coords = useMemo(() => convertCoordinate(d.p1), [d.p1, convertCoordinate, tick]);

    const p2Coords = useMemo(() => {
        // Try to convert d.p2 first if it exists (even in preview for a smoother snapped experience)
        if (d.p2) {
            const converted = convertCoordinate(d.p2);
            if (converted) return converted;
        }
        
        // Fallback to raw mouse position for preview if conversion fails or d.p2 is missing
        if (isPreview && mousePos) {
            return mousePos;
        }
        
        return null;
    }, [d.p2, isPreview, mousePos, convertCoordinate, tick]);

    // Early return if coordinates are invalid
    if (!p1Coords) return null;
    if (!p2Coords && d.type !== 'vertical' && d.type !== 'horizontal') return null;

    const x1 = p1Coords.x;
    const y1 = p1Coords.y;
    const x2 = p2Coords?.x ?? 0;
    const y2 = p2Coords?.y ?? 0;

    const isSelected = d.id === selectedDrawingId;
    const isHovered = d.id === hoveredDrawingId;

    const color = isSelected
        ? "#FF4F01"
        : (d.color || (isHovered
            ? "#2962ff"
            : (isDarkMode ? "#2962ff" : "#475569")
        ));

    const baseStrokeWidth = d.strokeWidth || 2;
    const strokeDasharray = d.strokeStyle === 'dashed' ? '6,6' : d.strokeStyle === 'dotted' ? '2,4' : undefined;

    const commonProps = {
        stroke: color,
        strokeWidth: isSelected ? baseStrokeWidth + 1 : (isHovered ? baseStrokeWidth + 1 : baseStrokeWidth),
        strokeOpacity: isHovered || isSelected ? 1 : (isDarkMode ? 0.8 : 0.9),
        strokeDasharray,
        cursor: 'pointer' as const,
        onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isPreview) onSelectDrawing(d.id);
        },
        onDoubleClick: (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isPreview && onDoubleClickDrawing) onDoubleClickDrawing(d);
        },
        onContextMenu: (e: React.MouseEvent) => {
            if (!isPreview && onContextMenuDrawing) {
                e.preventDefault();
                e.stopPropagation();
                onContextMenuDrawing(e, d);
            }
        },
        onMouseDown: (e: React.MouseEvent) => {
            if (!isPreview && !d.isLocked) {
                e.preventDefault();
                e.stopPropagation();
                if (!isSelected) onSelectDrawing(d.id);
                onMouseDownHandle(e, d.id, 'move');
            }
        },
        onMouseEnter: () => !isPreview && onHoverDrawing(d.id),
        onMouseLeave: () => !isPreview && onHoverDrawing(null),
    };

    const hitAreaProps = {
        stroke: 'transparent',
        strokeWidth: 15,
        cursor: 'pointer' as const,
        onClick: commonProps.onClick,
        onDoubleClick: commonProps.onDoubleClick,
        onContextMenu: commonProps.onContextMenu,
        onMouseDown: commonProps.onMouseDown,
        onMouseEnter: commonProps.onMouseEnter,
        onMouseLeave: commonProps.onMouseLeave,
    };

    const renderHandles = () => {
        if (!isSelected || isPreview || isLocked || d.isLocked) return null;
        const handleStyle = {
            filter: 'drop-shadow(0 0 4px rgba(41, 98, 255, 0.6))'
        };
        return (
            <>
                <circle
                    cx={x1} cy={y1} r={6}
                    fill="#2962ff" stroke="white" strokeWidth={2}
                    cursor="grab" style={handleStyle}
                    onMouseDown={(e) => { e.stopPropagation(); onMouseDownHandle(e, d.id, 'p1'); }}
                />
                {d.type !== 'vertical' && d.type !== 'horizontal' && (
                    <circle
                        cx={x2} cy={y2} r={6}
                        fill="#2962ff" stroke="white" strokeWidth={2}
                        cursor="grab" style={handleStyle}
                        onMouseDown={(e) => { e.stopPropagation(); onMouseDownHandle(e, d.id, 'p2'); }}
                    />
                )}
            </>
        );
    };

    let shape = null;

    switch (d.type) {
        case 'trendline':
            shape = (
                <g>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} {...hitAreaProps} />
                    <line x1={x1} y1={y1} x2={x2} y2={y2} {...commonProps} />
                </g>
            );
            break;

        case 'ray':
            const ray = getRayCoordinates(x1, y1, x2, y2, containerWidth, containerHeight);
            shape = (
                <g>
                    <line x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} {...hitAreaProps} />
                    <line x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} {...commonProps} />
                </g>
            );
            break;

        case 'arrow':
            shape = (
                <g>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} {...hitAreaProps} />
                    <g onClick={commonProps.onClick} onMouseDown={commonProps.onMouseDown} style={{ cursor: 'pointer' }}>
                        <defs>
                            <marker id={`arrowhead-${d.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                            </marker>
                        </defs>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={commonProps.strokeWidth} markerEnd={`url(#arrowhead-${d.id})`} />
                    </g>
                </g>
            );
            break;

        case 'rect':
            const rx = Math.min(x1, x2);
            const ry = Math.min(y1, y2);
            const rw = Math.max(1, Math.abs(x2 - x1));
            const rh = Math.max(1, Math.abs(y2 - y1));
            shape = (
                <g>
                    <rect x={rx} y={ry} width={rw} height={rh} stroke={color} strokeWidth={isSelected ? 2 : 1.5} fill={color} fillOpacity={0.15} {...commonProps} />
                    {isSelected && (
                        <rect x={rx} y={ry} width={rw} height={rh} stroke={color} strokeWidth={1} fill="none" strokeDasharray="4,4" opacity={0.5} pointerEvents="none" />
                    )}
                </g>
            );
            break;

        case 'vertical':
            shape = (
                <g>
                    <line x1={x1} y1={0} x2={x1} y2={containerHeight} {...commonProps} />
                    <rect x={x1 - 30} y={containerHeight - 20} width={60} height={16} fill={isDarkMode ? "#1e222d" : "#f1f5f9"} rx={4} stroke={color} strokeWidth={1} opacity={0.9} style={{ pointerEvents: 'none' }} />
                    <text x={x1} y={containerHeight - 8} fill={isDarkMode ? "white" : "#0f172a"} fontSize={10} fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                        {new Date(d.p1.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </text>
                </g>
            );
            break;

        case 'horizontal':
            shape = (
                <g>
                    <line x1={0} y1={y1} x2={containerWidth} y2={y1} {...commonProps} />
                    <rect x={containerWidth - 65} y={y1 - 10} width={60} height={20} fill={isDarkMode ? "#1e222d" : "#f1f5f9"} rx={4} stroke={color} strokeWidth={1} opacity={0.9} style={{ pointerEvents: 'none' }} />
                    <text x={containerWidth - 35} y={y1 + 4} fill={isDarkMode ? "white" : "#0f172a"} fontSize={10} fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                        {d.p1.price.toFixed(5)}
                    </text>
                </g>
            );
            break;

        case 'fib':
            const fibLevels = calculateFibLevels(y1, y2);
            const price1 = d.p1.price;
            const price2 = d.p2?.price || price1;
            const fibColors: Record<number, string> = {
                0: '#787b86', 0.236: '#f7525f', 0.382: '#ff9800',
                0.5: '#4caf50', 0.618: '#2962ff', 0.786: '#9c27b0', 1: '#787b86'
            };
            shape = (
                <g onClick={commonProps.onClick} onMouseDown={commonProps.onMouseDown} style={{ cursor: 'pointer' }}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
                    <rect
                        x={0}
                        y={Math.min(y1, y2)}
                        width={containerWidth}
                        height={Math.abs(y2 - y1)}
                        fill={color}
                        fillOpacity={0.03}
                        style={{ pointerEvents: 'none' }}
                    />
                    {fibLevels.map(({ level, y: yL }) => {
                        const fibPrice = price1 + (price2 - price1) * level;
                        const lineColor = fibColors[level] || color;
                        return (
                            <g key={level}>
                                <line
                                    x1={0}
                                    y1={yL}
                                    x2={containerWidth}
                                    y2={yL}
                                    stroke={lineColor}
                                    strokeWidth={level === 0.5 || level === 0.618 ? 1.5 : 1}
                                    opacity={level === 0.5 || level === 0.618 ? 0.8 : 0.5}
                                />
                                <rect
                                    x={5}
                                    y={yL - 8}
                                    width={35}
                                    height={14}
                                    fill={isDarkMode ? "#1e222d" : "#f1f5f9"}
                                    rx={2}
                                    style={{ pointerEvents: 'none' }}
                                />
                                <text
                                    x={8}
                                    y={yL + 3}
                                    fill={lineColor}
                                    fontSize={10}
                                    fontWeight="bold"
                                    fontFamily="monospace"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {(level * 100).toFixed(1)}%
                                </text>
                                <rect
                                    x={containerWidth - 75}
                                    y={yL - 8}
                                    width={70}
                                    height={14}
                                    fill={isDarkMode ? "#1e222d" : "#f1f5f9"}
                                    rx={2}
                                    style={{ pointerEvents: 'none' }}
                                />
                                <text
                                    x={containerWidth - 72}
                                    y={yL + 3}
                                    fill={lineColor}
                                    fontSize={10}
                                    fontWeight="bold"
                                    fontFamily="monospace"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {fibPrice.toFixed(5)}
                                </text>
                            </g>
                        );
                    })}
                </g>
            );
            break;

        case 'long':
        case 'short':
            if (!series) break;
            const entryY = series.priceToCoordinate(d.entry || d.p1.price) ?? y1;
            const targetY = series.priceToCoordinate(d.target || d.p1.price) ?? y1;
            const stopY = series.priceToCoordinate(d.stop || d.p1.price) ?? y1;

            const isLong = d.type === 'long';
            const profitColor = "#10b981";
            const lossColor = "#ef4444";

            const p1x = x1;
            const p2x = x2 || x1 + 150;

            const rectWidth = Math.abs(p2x - p1x);
            const rectLeft = Math.min(p1x, p2x);

            const risk = Math.abs((d.entry || d.p1.price) - (d.stop || d.p1.price));
            const reward = Math.abs((d.target || d.p1.price) - (d.entry || d.p1.price));
            const rr = risk > 0 ? (reward / risk).toFixed(2) : "0.00";

            const isJPY = (d.entry || d.p1.price) > 50 && (d.entry || d.p1.price) < 1000 && !((series as any)?._symbol?.includes('BTC'));
            const pipMultiplier = isJPY ? 100 : 10000;

            const targetPips = (reward * pipMultiplier).toFixed(1);
            const stopPips = (risk * pipMultiplier).toFixed(1);

            shape = (
                <g onClick={commonProps.onClick} onMouseDown={commonProps.onMouseDown} style={{ cursor: 'pointer' }}>
                    <rect
                        x={rectLeft} y={Math.min(entryY, targetY)}
                        width={rectWidth} height={Math.abs(targetY - entryY)}
                        fill={profitColor} fillOpacity={0.25}
                        stroke={profitColor} strokeWidth={1} strokeOpacity={0.4}
                    />
                    <rect
                        x={rectLeft} y={Math.min(entryY, stopY)}
                        width={rectWidth} height={Math.abs(stopY - entryY)}
                        fill={lossColor} fillOpacity={0.25}
                        stroke={lossColor} strokeWidth={1} strokeOpacity={0.4}
                    />
                    <line x1={rectLeft} y1={entryY} x2={rectLeft + rectWidth} y2={entryY} stroke="white" strokeWidth={1.5} opacity={0.9} />

                    <g transform={`translate(${rectLeft + rectWidth / 2}, ${entryY})`}>
                        <text y="-12" textAnchor="middle" fill="white" fontSize="11" fontWeight="900" style={{ paintOrder: 'stroke', stroke: 'black', strokeWidth: '2px', strokeLinecap: 'round', strokeLinejoin: 'round' }}>R:R {rr}</text>
                        <text y="4" textAnchor="middle" fill={profitColor} fontSize="10" fontWeight="900" style={{ paintOrder: 'stroke', stroke: 'black', strokeWidth: '2px', strokeLinecap: 'round', strokeLinejoin: 'round' }}>TP: {targetPips}</text>
                        <text y="18" textAnchor="middle" fill={lossColor} fontSize="10" fontWeight="900" style={{ paintOrder: 'stroke', stroke: 'black', strokeWidth: '2px', strokeLinecap: 'round', strokeLinejoin: 'round' }}>SL: {stopPips}</text>
                    </g>

                    {isSelected && !isLocked && !d.isLocked && (
                        <>
                            <circle cx={rectLeft + rectWidth / 2} cy={targetY} r="5" fill={profitColor} stroke="white" strokeWidth="1" onMouseDown={(e) => { e.stopPropagation(); onMouseDownHandle(e, d.id, 'target'); }} />
                            <circle cx={rectLeft + rectWidth / 2} cy={stopY} r="5" fill={lossColor} stroke="white" strokeWidth="1" onMouseDown={(e) => { e.stopPropagation(); onMouseDownHandle(e, d.id, 'stop'); }} />
                            <circle cx={rectLeft} cy={entryY} r="5" fill="white" stroke="black" strokeWidth="1" onMouseDown={(e) => { e.stopPropagation(); onMouseDownHandle(e, d.id, 'p1'); }} />
                            <circle cx={rectLeft + rectWidth} cy={entryY} r="5" fill="white" stroke="black" strokeWidth="1" onMouseDown={(e) => { e.stopPropagation(); onMouseDownHandle(e, d.id, 'p2'); }} />
                        </>
                    )}
                </g>
            );
            break;
    }

    return (
        <g key={d.id}>
            {shape}
            {renderHandles()}
        </g>
    );
});

DrawingItem.displayName = 'DrawingItem';

export const DrawingLayer = React.memo<DrawingLayerProps>(({
    drawings,
    currentDrawing,
    selectedDrawingId,
    mousePos,
    chart,
    series,
    containerWidth,
    containerHeight,
    activeTool,
    hoveredDrawingId,
    isSelectBarMode,
    onMouseDownHandle,
    onSelectDrawing,
    onHoverDrawing,
    onDoubleClickDrawing,
    onContextMenuDrawing,
    tick,
    isLocked,
    isDarkMode
}) => {
    // Early return if no chart/series
    if (!chart || !series) return null;

    // Use stable container dimensions - prevent layout thrashing
    const stableContainerWidth = useMemo(() => Math.max(containerWidth, 100), [containerWidth]);
    const stableContainerHeight = useMemo(() => Math.max(containerHeight, 100), [containerHeight]);

    // Memoized coordinate converter
    const convertCoordinate = useCoordinateConverter(chart, series);

    // Render active tool preview (follows mouse before click)
    const renderActiveToolPreview = useCallback(() => {
        if (!mousePos || currentDrawing || selectedDrawingId) return null;

        const color = "#2962ff";
        if (isSelectBarMode) {
            return <line x1={mousePos.x} y1={0} x2={mousePos.x} y2={stableContainerHeight} stroke="#ef4444" strokeWidth={2} strokeDasharray="5,5" />;
        }
        if (activeTool === 'vertical') {
            return <line x1={mousePos.x} y1={0} x2={mousePos.x} y2={stableContainerHeight} stroke={color} strokeWidth={1} strokeDasharray="5,5" opacity={0.5} />;
        }
        if (activeTool === 'horizontal') {
            return <line x1={0} y1={mousePos.y} x2={stableContainerWidth} y2={mousePos.y} stroke={color} strokeWidth={1} strokeDasharray="5,5" opacity={0.5} />;
        }
        return null;
    }, [mousePos, currentDrawing, selectedDrawingId, isSelectBarMode, activeTool, stableContainerWidth, stableContainerHeight]);

    // Memoize common props for DrawingItem to prevent unnecessary re-renders
    const itemProps = useMemo(() => ({
        selectedDrawingId,
        hoveredDrawingId,
        containerWidth: stableContainerWidth,
        containerHeight: stableContainerHeight,
        isDarkMode,
        isLocked,
        convertCoordinate,
        series,
        onSelectDrawing,
        onHoverDrawing,
        onMouseDownHandle,
        onDoubleClickDrawing,
        onContextMenuDrawing,
        tick
    }), [
        selectedDrawingId,
        hoveredDrawingId,
        stableContainerWidth,
        stableContainerHeight,
        isDarkMode,
        isLocked,
        convertCoordinate,
        series,
        onSelectDrawing,
        onHoverDrawing,
        onMouseDownHandle,
        onDoubleClickDrawing,
        onContextMenuDrawing,
        tick
    ]);

    return (
        <svg
            className="absolute inset-0 z-10"
            width="100%"
            height="100%"
            style={{ pointerEvents: 'none' }}
        >
            <g style={{ pointerEvents: 'auto' }}>
                {drawings.map(d => (
                    <DrawingItem
                        key={d.id}
                        drawing={d}
                        isPreview={false}
                        mousePos={null}
                        {...itemProps}
                    />
                ))}
                {currentDrawing && (
                    <DrawingItem
                        key={`preview-${currentDrawing.id}`}
                        drawing={currentDrawing}
                        isPreview={true}
                        mousePos={mousePos}
                        {...itemProps}
                    />
                )}
                {renderActiveToolPreview()}
            </g>
        </svg>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for React.memo - only re-render when actually needed
    // This prevents flickering during pan/zoom
    if (prevProps.tick !== nextProps.tick) {
        // Tick changed - but we only need to re-render if we have drawings
        if (prevProps.drawings.length === 0 && nextProps.drawings.length === 0 &&
            !prevProps.currentDrawing && !nextProps.currentDrawing) {
            return true; // Skip re-render if no drawings
        }
    }

    // Always re-render for these changes
    if (prevProps.drawings !== nextProps.drawings) return false;
    if (prevProps.currentDrawing !== nextProps.currentDrawing) return false;
    if (prevProps.selectedDrawingId !== nextProps.selectedDrawingId) return false;
    if (prevProps.hoveredDrawingId !== nextProps.hoveredDrawingId) return false;
    if (prevProps.mousePos !== nextProps.mousePos && (prevProps.currentDrawing || nextProps.currentDrawing || prevProps.activeTool !== 'cursor')) return false;
    if (prevProps.activeTool !== nextProps.activeTool) return false;
    if (prevProps.isSelectBarMode !== nextProps.isSelectBarMode) return false;
    if (prevProps.isLocked !== nextProps.isLocked) return false;
    if (prevProps.isDarkMode !== nextProps.isDarkMode) return false;
    if (prevProps.containerWidth !== nextProps.containerWidth) return false;
    if (prevProps.containerHeight !== nextProps.containerHeight) return false;
    if (prevProps.chart !== nextProps.chart) return false;
    if (prevProps.series !== nextProps.series) return false;

    // For tick changes with drawings, we need to re-render to update positions
    if (prevProps.tick !== nextProps.tick) return false;

    return true;
});

DrawingLayer.displayName = 'DrawingLayer';
