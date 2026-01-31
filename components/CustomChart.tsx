
import React, { useEffect, useRef, useLayoutEffect, useCallback, useState, useMemo } from 'react';
import { Candle, Trade, Drawing, Point } from '../types';
import { getRayCoordinates, calculateFibLevels } from './backtest/utils';

interface CustomChartProps {
  data: Candle[];
  trades: Trade[];
  drawings: Drawing[];
  isDarkMode: boolean;
  onCoordinatesChange?: (chart: any, series: any) => void;
  onMouseUpdate?: (x: number, y: number, coords: { time: number, price: number, logical: number } | null) => void;
  onSelectBar?: (index: number) => void;
  isSelectBarMode?: boolean;
  disablePan?: boolean;
  children?: React.ReactNode;
}

const PADDING_RIGHT = 60;
const PADDING_BOTTOM = 26;

const CustomChart: React.FC<CustomChartProps> = ({ 
  data, 
  trades, 
  drawings,
  isDarkMode,
  onCoordinatesChange,
  onMouseUpdate,
  onSelectBar,
  isSelectBarMode,
  disablePan,
  children
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Viewport State
  const viewState = useRef({ 
    scaleX: 10, 
    offsetX: 0, 
    width: 0, 
    height: 0,
    minPrice: 0,
    maxPrice: 0,
    isManualPriceRange: false,
    manualMinPrice: 0,
    manualMaxPrice: 0
  });

  const mouse = useRef({
    isDown: false,
    lastX: 0,
    lastY: 0,
    dragType: 'NONE' as 'NONE' | 'PAN' | 'PRICE_SCALE' | 'TIME_SCALE'
  });

  const [chartRevision, setChartRevision] = useState(0);

  const getInterval = useCallback(() => {
    if (data.length < 2) return 60;
    return data[data.length - 1].time - data[data.length - 2].time;
  }, [data]);

  const getX = useCallback((index: number) => {
    const { width, offsetX, scaleX } = viewState.current;
    const chartWidth = width - PADDING_RIGHT;
    return chartWidth - offsetX - (data.length - 1 - index) * scaleX;
  }, [data.length, chartRevision]); // Depend on chartRevision

  const getY = useCallback((price: number) => {
    const { height, minPrice, maxPrice } = viewState.current;
    const chartHeight = height - PADDING_BOTTOM;
    const priceRange = maxPrice - minPrice || 1;
    return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  }, [chartRevision]);

  const getPriceFromY = useCallback((y: number) => {
    const { height, minPrice, maxPrice } = viewState.current;
    const chartHeight = height - PADDING_BOTTOM;
    const priceRange = maxPrice - minPrice || 1;
    return minPrice + ((chartHeight - y) / chartHeight) * priceRange;
  }, [chartRevision]);

  const getIndexFromX = useCallback((x: number) => {
    const { width, offsetX, scaleX } = viewState.current;
    const chartWidth = width - PADDING_RIGHT;
    return (x - (chartWidth - offsetX)) / scaleX + (data.length - 1);
  }, [data.length, chartRevision]);

  // Mock "Chart/Series" objects for compatibility with existing DrawingLayer
  const mockApi = useMemo(() => {
    return {
      chart: {
        timeScale: () => ({
          timeToCoordinate: (time: number) => {
             const idx = data.findIndex(d => d.time === time);
             if (idx !== -1) return getX(idx);
             
             // If not found, estimate based on last known interval
             if (data.length < 2) return null;
             
             // Use the last interval for extrapolation (more stable than average)
             const lastTime = data[data.length - 1].time;
             const prevTime = data[data.length - 2].time;
             const interval = lastTime - prevTime;
             
             if (interval <= 0) return null; // Should not happen on valid data

             const logicalOffset = (time - lastTime) / interval;
             return getX(data.length - 1 + logicalOffset);
          },
          logicalToCoordinate: (logical: number) => getX(logical),
          coordinateToLogical: (x: number) => getIndexFromX(x),
          coordinateToTime: (x: number) => {
             const logical = getIndexFromX(x);
             const idx = Math.round(logical);
             if (idx >= 0 && idx < data.length) return data[idx].time;
             
             // Estimate future/past time
             if (data.length < 2) return null;
             const lastTime = data[data.length - 1].time;
             const prevTime = data[data.length - 2].time;
             const interval = lastTime - prevTime;
             
             return lastTime + (logical - (data.length - 1)) * interval;
          },
          fitContent: () => {
             viewState.current.offsetX = 0;
             viewState.current.scaleX = (viewState.current.width - PADDING_RIGHT) / Math.max(data.length, 1);
             viewState.current.isManualPriceRange = false;
             setChartRevision(r => r + 1);
          }
        })
      },
      series: {
        priceToCoordinate: (price: number) => getY(price),
        coordinateToPrice: (y: number) => getPriceFromY(y)
      }
    };
  }, [data, getX, getY, getIndexFromX, getPriceFromY]); // Implicitly depends on chartRevision via getX/getY

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const { width, height, scaleX, offsetX, isManualPriceRange, manualMinPrice, manualMaxPrice } = viewState.current;
    const chartWidth = width - PADDING_RIGHT;
    const chartHeight = height - PADDING_BOTTOM;

    // 1. Calculate Scales
    const leftIdx = Math.floor(getIndexFromX(0));
    const rightIdx = Math.ceil(getIndexFromX(chartWidth));
    const start = Math.max(0, leftIdx);
    const end = Math.min(data.length - 1, rightIdx);

    if (!isManualPriceRange) {
        let min = Infinity;
        let max = -Infinity;
        for (let i = start; i <= end; i++) {
          if (data[i].low < min) min = data[i].low;
          if (data[i].high > max) max = data[i].high;
        }
        const padding = (max - min) * 0.1 || 0.0001;
        viewState.current.minPrice = min - padding;
        viewState.current.maxPrice = max + padding;
    } else {
        viewState.current.minPrice = manualMinPrice;
        viewState.current.maxPrice = manualMaxPrice;
    }

    const { minPrice, maxPrice } = viewState.current;

    // 2. Clear
    ctx.fillStyle = isDarkMode ? '#09090b' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 3. Grid
    ctx.strokeStyle = isDarkMode ? '#18181b' : '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const y = (chartHeight / 10) * i;
      ctx.moveTo(0, y); ctx.lineTo(chartWidth, y);
    }
    const timeStep = Math.max(1, Math.ceil(100 / scaleX));
    for (let i = start - (start % timeStep); i <= end; i += timeStep) {
      const x = getX(i);
      ctx.moveTo(x, 0); ctx.lineTo(x, chartHeight);
    }
    ctx.stroke();

    // 4. Candles
    const candleWidth = Math.max(1, scaleX * 0.8);
    const wickWidth = Math.max(1, Math.floor(scaleX * 0.1));
    
    data.slice(start, end + 1).forEach((candle, i) => {
      const idx = start + i;
      const x = Math.round(getX(idx));
      const yOpen = getY(candle.open);
      const yClose = getY(candle.close);
      const yHigh = getY(candle.high);
      const yLow = getY(candle.low);
      
      const isUp = candle.close >= candle.open;
      ctx.fillStyle = isUp ? '#10b981' : '#ef4444';
      
      ctx.fillRect(x - wickWidth/2, yHigh, wickWidth, yLow - yHigh);
      const barHeight = Math.max(1, Math.abs(yOpen - yClose));
      ctx.fillRect(x - candleWidth/2, Math.min(yOpen, yClose), candleWidth, barHeight);
    });

    // 5. Drawings (Canvas Layer)
    drawings.forEach(d => {
        // Calculate coords
        let x1, x2;
        
        // Use logical mapping for stability
        if (d.p1.logical !== undefined) x1 = getX(d.p1.logical);
        else x1 = mockApi.chart.timeScale().timeToCoordinate(d.p1.time) ?? -1000;

        const y1 = getY(d.p1.price);

        if (d.p2) {
            if (d.p2.logical !== undefined) x2 = getX(d.p2.logical);
            else x2 = mockApi.chart.timeScale().timeToCoordinate(d.p2.time) ?? -1000;
        } else {
            x2 = x1;
        }
        
        const y2 = d.p2 ? getY(d.p2.price) : y1;

        ctx.strokeStyle = d.color || (isDarkMode ? '#2962ff' : '#475569');
        ctx.lineWidth = d.strokeWidth || 2;
        
        // Line Styles
        ctx.setLineDash([]);
        if (d.strokeStyle === 'dashed') ctx.setLineDash([6, 6]);
        if (d.strokeStyle === 'dotted') ctx.setLineDash([2, 4]);

        ctx.beginPath();

        if (d.type === 'trendline' || d.type === 'arrow') {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            if (d.type === 'arrow') {
                const angle = Math.atan2(y2 - y1, x2 - x1);
                const headLen = 10;
                ctx.moveTo(x2, y2);
                ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(x2, y2);
                ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
            }
        } 
        else if (d.type === 'ray') {
            const { width, height } = viewState.current;
            const ray = getRayCoordinates(x1, y1, x2, y2, width, height);
            ctx.moveTo(ray.x1, ray.y1);
            ctx.lineTo(ray.x2, ray.y2);
            ctx.stroke();
        }
        else if (d.type === 'rect') {
            ctx.fillStyle = d.color ? d.color : (isDarkMode ? '#2962ff' : '#475569');
            ctx.globalAlpha = 0.15;
            ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
            ctx.globalAlpha = 1.0;
            ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        }
        else if (d.type === 'horizontal') {
            ctx.moveTo(0, y1);
            ctx.lineTo(chartWidth, y1);
            ctx.stroke();
            
            // Label
            ctx.fillStyle = isDarkMode ? "#1e222d" : "#f1f5f9";
            ctx.fillRect(chartWidth - 65, y1 - 10, 60, 20);
            ctx.strokeStyle = d.color || '#2962ff';
            ctx.strokeRect(chartWidth - 65, y1 - 10, 60, 20);
            ctx.fillStyle = isDarkMode ? "white" : "#0f172a";
            ctx.textAlign = "center";
            ctx.fillText(d.p1.price.toFixed(5), chartWidth - 35, y1 + 4);
        }
        else if (d.type === 'vertical') {
            ctx.moveTo(x1, 0);
            ctx.lineTo(x1, chartHeight);
            ctx.stroke();
        }
        else if (d.type === 'fib') {
            const levels = calculateFibLevels(y1, y2);
            ctx.setLineDash([3, 3]);
            ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.setLineDash([]);
            
            const fibColors: Record<number, string> = {
                0: '#787b86', 0.236: '#f7525f', 0.382: '#ff9800',
                0.5: '#4caf50', 0.618: '#2962ff', 0.786: '#9c27b0', 1: '#787b86'
            };

            levels.forEach(l => {
                const lc = fibColors[l.level] || '#787b86';
                ctx.strokeStyle = lc;
                ctx.fillStyle = lc;
                ctx.beginPath();
                ctx.moveTo(0, l.y); ctx.lineTo(chartWidth, l.y);
                ctx.stroke();
                ctx.fillText(`${(l.level * 100).toFixed(1)}%`, chartWidth - 30, l.y - 2);
            });
        }
        else if (d.type === 'long' || d.type === 'short') {
            const entryY = d.entry ? getY(d.entry) : y1;
            const targetY = d.target ? getY(d.target) : y1;
            const stopY = d.stop ? getY(d.stop) : y1;
            
            const w = Math.abs(x2 - x1) || 100;
            const left = Math.min(x1, x2 || x1 + 100);
            
            // Target Box
            ctx.fillStyle = "#10b981";
            ctx.globalAlpha = 0.25;
            ctx.fillRect(left, Math.min(entryY, targetY), w, Math.abs(targetY - entryY));
            
            // Stop Box
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(left, Math.min(entryY, stopY), w, Math.abs(stopY - entryY));
            ctx.globalAlpha = 1.0;
            
            // Lines
            ctx.strokeStyle = "#ffffff";
            ctx.beginPath();
            ctx.moveTo(left, entryY); ctx.lineTo(left + w, entryY);
            ctx.stroke();
        }
    });
    ctx.setLineDash([]); // Reset

    // 5. Axes Rendering
    ctx.fillStyle = isDarkMode ? '#09090b' : '#ffffff';
    ctx.fillRect(chartWidth, 0, PADDING_RIGHT, height);
    ctx.fillRect(0, chartHeight, width, PADDING_BOTTOM);

    ctx.strokeStyle = isDarkMode ? '#27272a' : '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(chartWidth, 0); ctx.lineTo(chartWidth, chartHeight);
    ctx.moveTo(0, chartHeight); ctx.lineTo(chartWidth, chartHeight);
    ctx.stroke();

    // Price Labels
    ctx.fillStyle = isDarkMode ? '#a1a1aa' : '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const priceRange = maxPrice - minPrice;
    for (let i = 0; i <= 8; i++) {
      const p = minPrice + (priceRange * (i/8));
      ctx.fillText(p.toFixed(5), chartWidth + 5, getY(p));
    }

    // Time Labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = start - (start % timeStep); i <= end; i += timeStep) {
      const x = getX(i);
      if (x < 0 || x > chartWidth) continue;
      const date = new Date(data[i].time * 1000);
      const txt = `${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}`;
      ctx.fillText(txt, x, chartHeight + 5);
    }
  }, [data, isDarkMode, getX, getY, getIndexFromX, drawings]); // Added drawings dependency

  // Sync API with parent only when necessary
  useEffect(() => {
    if (onCoordinatesChange) {
        onCoordinatesChange(mockApi.chart, mockApi.series);
    }
  }, [mockApi, onCoordinatesChange]);

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { width, height } = viewState.current;
    const chartWidth = width - PADDING_RIGHT;
    const chartHeight = height - PADDING_BOTTOM;

    if (isSelectBarMode && onSelectBar) {
        const idx = Math.round(getIndexFromX(x));
        if (idx >= 0 && idx < data.length) onSelectBar(idx);
        return;
    }

    let dragType: 'NONE' | 'PAN' | 'PRICE_SCALE' | 'TIME_SCALE' = 'NONE';
    if (x > chartWidth) dragType = 'PRICE_SCALE';
    else if (y > chartHeight) dragType = 'TIME_SCALE';
    else if (!disablePan) dragType = 'PAN';

    mouse.current = { ...mouse.current, isDown: true, lastX: x, lastY: y, dragType };
    
    if (containerRef.current) {
        if (dragType === 'PRICE_SCALE') containerRef.current.style.cursor = 'ns-resize';
        else if (dragType === 'TIME_SCALE') containerRef.current.style.cursor = 'ew-resize';
        else if (dragType === 'PAN') containerRef.current.style.cursor = 'grabbing';
        else containerRef.current.style.cursor = 'crosshair';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mouse.current.isDown) {
      const dx = x - mouse.current.lastX;
      const dy = y - mouse.current.lastY;

      if (mouse.current.dragType === 'PAN') {
        viewState.current.offsetX -= dx;
        
        // Vertical Panning Logic
        const { height, minPrice, maxPrice } = viewState.current;
        const chartHeight = height - PADDING_BOTTOM;
        const priceRange = maxPrice - minPrice;
        const pricePerPixel = priceRange / chartHeight;
        
        const dPrice = dy * pricePerPixel;
        
        viewState.current.isManualPriceRange = true;
        viewState.current.manualMinPrice = minPrice + dPrice;
        viewState.current.manualMaxPrice = maxPrice + dPrice;
        
      } else if (mouse.current.dragType === 'PRICE_SCALE') {
        const { minPrice, maxPrice, height } = viewState.current;
        const chartHeight = height - PADDING_BOTTOM;
        const priceRange = maxPrice - minPrice;
        
        // Use a non-linear scaling for better control
        const stretchFactor = Math.pow(1.1, dy / 20);
        const midPrice = (maxPrice + minPrice) / 2;
        const newHalfRange = (priceRange * stretchFactor) / 2;
        
        viewState.current.isManualPriceRange = true;
        viewState.current.manualMinPrice = midPrice - newHalfRange;
        viewState.current.manualMaxPrice = midPrice + newHalfRange;
      } else if (mouse.current.dragType === 'TIME_SCALE') {
        // Zoom around the center or start of dragging? 
        // For Time Scale dragging, usually it's a zoom factor
        const zoomFactor = Math.pow(0.99, dx);
        const oldScaleX = viewState.current.scaleX;
        const newScaleX = Math.max(0.5, Math.min(200, oldScaleX * zoomFactor));
        
        // To keep it smooth, we adjust offsetX so the right-side doesn't jump too much
        // Or better yet, zoom around the mouse.current.lastX
        const logicalAtMouse = getIndexFromX(x);
        viewState.current.scaleX = newScaleX;
        
        const { width, scaleX } = viewState.current;
        const chartWidth = width - PADDING_RIGHT;
        viewState.current.offsetX = chartWidth - x - (data.length - 1 - logicalAtMouse) * scaleX;
      }

      mouse.current.lastX = x;
      mouse.current.lastY = y;
      
      // Force drawing layer update
      setChartRevision(r => r + 1);
      draw();
    }

    if (onMouseUpdate) {
        const logical = getIndexFromX(x);
        const price = getPriceFromY(y);
        const time = data[Math.round(logical)]?.time || 0;
        onMouseUpdate(x, y, { time, price, logical });
    }
  };

  const handleMouseUp = () => {
    mouse.current.isDown = false;
    if (containerRef.current) containerRef.current.style.cursor = 'crosshair';
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    
    const logicalBefore = getIndexFromX(x);
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    viewState.current.scaleX = Math.max(0.5, Math.min(200, viewState.current.scaleX * zoomFactor));
    
    const { width, scaleX } = viewState.current;
    const chartWidth = width - PADDING_RIGHT;
    viewState.current.offsetX = chartWidth - x - (data.length - 1 - logicalBefore) * scaleX;
    
    // Force drawing layer update
    setChartRevision(r => r + 1);
    draw();
  }, [draw, data.length, getIndexFromX]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) {
        container.addEventListener('wheel', handleWheel, { passive: false });
    }

    const resize = () => {
      if (containerRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = clientWidth * dpr;
        canvasRef.current.height = clientHeight * dpr;
        canvasRef.current.style.width = `${clientWidth}px`;
        canvasRef.current.style.height = `${clientHeight}px`;
        canvasRef.current.getContext('2d')?.scale(dpr, dpr);
        viewState.current.width = clientWidth;
        viewState.current.height = clientHeight;
        draw();
      }
    };
    window.addEventListener('resize', resize);
    resize();
    return () => {
        window.removeEventListener('resize', resize);
        if (container) {
            container.removeEventListener('wheel', handleWheel);
        }
    };
  }, [draw, handleWheel]);

  useEffect(() => { draw(); }, [draw, data, trades, drawings]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-black cursor-crosshair">
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="block touch-none"
      />
      {children}
    </div>
  );
};

export default CustomChart;
