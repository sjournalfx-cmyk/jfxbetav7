import React, { useMemo, useCallback } from 'react';
import { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { Drawing, Point } from './types';
import { getRayCoordinates } from './utils';

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
// SVG is now HIT-AREA ONLY. All visual rendering is done by the Canvas in CustomChart.
interface DrawingItemProps {
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
}

const DrawingItem = React.memo<DrawingItemProps>(({
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
        if (d.p2) {
            const converted = convertCoordinate(d.p2);
            if (converted) return converted;
        }
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

    const commonEvents = {
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

    // All hit areas are invisible - canvas handles visuals
    const hitProps = {
        stroke: 'transparent',
        fill: 'transparent',
        strokeWidth: 15,
        style: { cursor: 'pointer' } as React.CSSProperties,
        ...commonEvents,
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
                {d.type !== 'vertical' && d.type !== 'horizontal' && d.type !== 'long' && d.type !== 'short' && (
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
                <line x1={x1} y1={y1} x2={x2} y2={y2} {...hitProps} />
            );
            break;

        case 'ray':
            const ray = getRayCoordinates(x1, y1, x2, y2, containerWidth, containerHeight);
            shape = (
                <line x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} {...hitProps} />
            );
            break;

        case 'arrow':
            shape = (
                <line x1={x1} y1={y1} x2={x2} y2={y2} {...hitProps} />
            );
            break;

        case 'rect':
            const rx = Math.min(x1, x2);
            const ry = Math.min(y1, y2);
            const rw = Math.max(1, Math.abs(x2 - x1));
            const rh = Math.max(1, Math.abs(y2 - y1));
            shape = (
                <rect x={rx} y={ry} width={rw} height={rh} {...hitProps} />
            );
            break;

        case 'vertical':
            shape = (
                <line x1={x1} y1={0} x2={x1} y2={containerHeight} {...hitProps} />
            );
            break;

        case 'horizontal':
            shape = (
                <line x1={0} y1={y1} x2={containerWidth} y2={y1} {...hitProps} />
            );
            break;

        case 'fib': {
            const fibY1 = Math.min(y1, y2);
            const fibY2 = Math.max(y1, y2);
            const fibDiff = fibY2 - fibY1;
            const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
            shape = (
                <g {...commonEvents} style={{ cursor: 'pointer' }}>
                    {fibLevels.map((level) => {
                        const y = fibY1 + fibDiff * level;
                        return (
                            <line key={level} x1={Math.min(x1, x2)} y1={y} x2={Math.max(x1, x2)} y2={y} stroke="transparent" strokeWidth={12} />
                        );
                    })}
                    <rect x={Math.min(x1, x2)} y={fibY1} width={Math.abs(x2 - x1)} height={fibDiff} fill="transparent" stroke="transparent" strokeWidth={1} />
                </g>
            );
            break;
        }

        case 'channel': {
            const channelDx = x2 - x1;
            const channelDy = y2 - y1;
            const channelAngle = Math.atan2(channelDy, channelDx);
            const perpAngle = channelAngle + Math.PI / 2;
            const channelOffset = 50;

            const cx1 = x1;
            const cy1 = y1;
            const cx2 = x2;
            const cy2 = y2;
            const cx3 = x2 + Math.cos(perpAngle) * channelOffset;
            const cy3 = y2 + Math.sin(perpAngle) * channelOffset;
            const cx4 = x1 + Math.cos(perpAngle) * channelOffset;
            const cy4 = y1 + Math.sin(perpAngle) * channelOffset;

            shape = (
                <polygon
                    points={`${cx1},${cy1} ${cx2},${cy2} ${cx3},${cy3} ${cx4},${cy4}`}
                    {...hitProps}
                />
            );
            break;
        }

        case 'text': {
            const textContent = d.text || 'Text';
            // Invisible hit area rect around text
            shape = (
                <g {...commonEvents} style={{ cursor: 'pointer' }}>
                    <rect x={x1 - 5} y={y1 - (d.fontSize || 14)} width={textContent.length * ((d.fontSize || 14) * 0.65)} height={(d.fontSize || 14) + 6} fill="transparent" stroke="transparent" />
                </g>
            );
            break;
        }

        case 'long':
        case 'short': {
            const isLong = d.type === 'long';
            const entryPrice = d.entry ?? d.p1.price;
            const targetPrice = d.target ?? (isLong ? entryPrice * 1.02 : entryPrice * 0.98);
            const stopPrice = d.stop ?? (isLong ? entryPrice * 0.99 : entryPrice * 1.01);

            const entryY = series?.priceToCoordinate(entryPrice) ?? y1;
            const targetY = series?.priceToCoordinate(targetPrice) ?? y1;
            const stopY = series?.priceToCoordinate(stopPrice) ?? y1;

            const p1x = x1;
            const p2x = x2 || x1 + 150;
            const rectWidth = Math.max(Math.abs(p2x - p1x), 50);
            const rectLeft = Math.min(p1x, p2x);

            const targetColor = '#10b981';
            const stopColor = '#ef4444';

            const targetBoxY = Math.min(entryY, targetY);
            const targetBoxHeight = Math.abs(targetY - entryY);
            const stopBoxY = Math.min(entryY, stopY);
            const stopBoxHeight = Math.abs(stopY - entryY);

            shape = (
                <g {...commonEvents} style={{ cursor: 'pointer' }}>
                    {/* Target area hit zone */}
                    <rect
                        x={rectLeft} y={targetBoxY}
                        width={rectWidth} height={Math.max(targetBoxHeight, 5)}
                        fill="transparent" stroke="transparent" strokeWidth={1}
                    />
                    {/* Stop area hit zone */}
                    <rect
                        x={rectLeft} y={stopBoxY}
                        width={rectWidth} height={Math.max(stopBoxHeight, 5)}
                        fill="transparent" stroke="transparent" strokeWidth={1}
                    />

                    {/* Draggable handles when selected */}
                    {isSelected && !isLocked && !d.isLocked && (
                        <>
                            {/* Target handle */}
                            <circle cx={rectLeft + rectWidth / 2} cy={targetY} r="6" fill={targetColor} stroke="white" strokeWidth={2}
                                style={{ cursor: 'grab', filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))' }}
                                onMouseDown={(e) => { e.stopPropagation(); onMouseDownHandle(e, d.id, 'target'); }}
                            />
                            {/* Stop handle */}
                            <circle cx={rectLeft + rectWidth / 2} cy={stopY} r="6" fill={stopColor} stroke="white" strokeWidth={2}
                                style={{ cursor: 'grab', filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))' }}
                                onMouseDown={(e) => { e.stopPropagation(); onMouseDownHandle(e, d.id, 'stop'); }}
                            />
                            {/* P1 (left edge) */}
                            <circle cx={rectLeft} cy={entryY} r="6" fill="white" stroke={isLong ? targetColor : stopColor} strokeWidth={2}
                                style={{ cursor: 'grab', filter: 'drop-shadow(0 0 4px rgba(41, 98, 255, 0.6))' }}
                                onMouseDown={(e) => { e.stopPropagation(); onMouseDownHandle(e, d.id, 'p1'); }}
                            />
                            {/* P2 (right edge) */}
                            <circle cx={rectLeft + rectWidth} cy={entryY} r="6" fill="white" stroke={isLong ? targetColor : stopColor} strokeWidth={2}
                                style={{ cursor: 'grab', filter: 'drop-shadow(0 0 4px rgba(41, 98, 255, 0.6))' }}
                                onMouseDown={(e) => { e.stopPropagation(); onMouseDownHandle(e, d.id, 'p2'); }}
                            />
                        </>
                    )}
                </g>
            );
            break;
        }
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
    // Always re-render when tick changes - this is critical for updating drawing positions
    if (prevProps.tick !== nextProps.tick) return false;

    // Always re-render for these changes
    if (prevProps.drawings !== nextProps.drawings) return false;
    if (prevProps.currentDrawing !== nextProps.currentDrawing) return false;
    if (prevProps.selectedDrawingId !== nextProps.selectedDrawingId) return false;
    if (prevProps.hoveredDrawingId !== nextProps.hoveredDrawingId) return false;
    if (prevProps.isSelectBarMode !== nextProps.isSelectBarMode) return false;
    if (prevProps.activeTool !== nextProps.activeTool) return false;
    if (prevProps.isLocked !== nextProps.isLocked) return false;
    if (prevProps.isDarkMode !== nextProps.isDarkMode) return false;
    if (prevProps.containerWidth !== nextProps.containerWidth) return false;
    if (prevProps.containerHeight !== nextProps.containerHeight) return false;
    if (prevProps.chart !== nextProps.chart) return false;
    if (prevProps.series !== nextProps.series) return false;

    return true;
});

DrawingLayer.displayName = 'DrawingLayer';
