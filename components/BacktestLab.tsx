import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';
import {
    Play, Pause, ChevronRight, RotateCcw,
    TrendingUp, TrendingDown, XCircle, X,
    Settings, Zap, ArrowLeftToLine, StepForward, ChevronDown, Database,
    Trash2, Lock, Unlock, Check, Search, Download, FileUp, RefreshCw, Clock
} from 'lucide-react';
import { useToast } from './ui/Toast';
import { DrawingToolbar } from './backtest/DrawingToolbar';
import { DrawingLayer } from './backtest/DrawingLayer';
import { Drawing, Point, ToolType } from './backtest/types';
import { useMT5Bridge } from '../hooks/useMT5Bridge';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { UserProfile, BacktestTrade, BacktestSession } from '../types';
import { dataService } from '../services/dataService';

interface BacktestLabProps {
    isDarkMode: boolean;
    userProfile: UserProfile;
}

const POPULAR_SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'XAUUSD', 'BTCUSD', 'ETHUSD', 'US30', 'NAS100', 'GER40'];

const BacktestLab: React.FC<BacktestLabProps> = ({ isDarkMode, userProfile }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const { addToast } = useToast();

    // MT5 Bridge & Data
    const {
        symbol, setSymbol, timeframe, setTimeframe, isFetching,
        allData, setAllData, currentIndex, setCurrentIdx, fetchData
    } = useMT5Bridge('EURUSD', 'H1');

    // UI State
    const [isSymbolMenuOpen, setIsSymbolMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dataSource, setDataSource] = useState<'live' | 'cache' | 'none'>('none');

    // Replay State
    const [isPlaying, setIsPlaying] = useState(false);
    const [playSpeed, setPlaySpeed] = useState(500);
    const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

    // Trade State
    const [balance, setBalance] = useState(10000);
    const [position, setPosition] = useState<{ type: 'BUY' | 'SELL', entry: number, lots: number } | null>(null);
    const [history, setHistory] = useState<BacktestTrade[]>([]);
    const [markers, setMarkers] = useState<any[]>([]);

    // Tools State
    const [activeTool, setActiveTool] = useState<ToolType>('cursor');
    const [isSticky, setIsSticky] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
    const [magnetMode, setMagnetMode] = useState(false);

    // Selection & Edit State
    const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
    const [hoveredDrawingId, setHoveredDrawingId] = useState<string | null>(null);
    const [dragState, setDragState] = useState<{ drawingId: string, handle: 'p1' | 'p2' | 'move' | 'target' | 'stop' } | null>(null);
    const [dragStartPos, setDragStartPos] = useState<{ time: number, price: number, logical?: number } | null>(null);

    // Replay Modes
    const [isSelectBarMode, setIsSelectBarMode] = useState(false);
    const [isTFMenuOpen, setIsTFMenuOpen] = useState(false);

    // Feature: Drawing Settings Modal
    const [editingDrawingSettings, setEditingDrawingSettings] = useState<Drawing | null>(null);

    // Feature: Context Menu
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, drawing: Drawing } | null>(null);
    const [clipboard, setClipboard] = useState<Drawing | null>(null);

    // Undo/Redo State
    const [historyStates, setHistoryStates] = useState<Drawing[][]>([]);
    const [historyPointer, setHistoryStep] = useState(-1);

    // Feature: Backtest Settings Modal
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [savedSessions, setSavedSessions] = useState<BacktestSession[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    const fetchSavedSessions = useCallback(async () => {
        setIsLoadingSessions(true);
        try {
            const sessions = await dataService.getBacktestSessions();
            setSavedSessions(sessions);
        } catch (err: any) {
            console.error('Failed to fetch sessions', err);
        } finally {
            setIsLoadingSessions(false);
        }
    }, []);

    useEffect(() => {
        if (isSettingsOpen) {
            fetchSavedSessions();
        }
    }, [isSettingsOpen, fetchSavedSessions]);

    const handleSaveToCloud = async () => {
        if (allData.length === 0) return;

        // Enforce Data Retention Policy
        const currentPlan = userProfile.plan || 'FREE TIER (JOURNALER)';
        const limits: Record<string, number> = {
            'FREE TIER (JOURNALER)': 5,
            'PRO TIER (ANALYSTS)': 50,
            'PREMIUM (MASTERS)': Infinity
        };
        const maxSessions = limits[currentPlan] || 5;

        if (savedSessions.length >= maxSessions) {
            addToast({
                type: 'error',
                title: 'Limit Reached',
                message: `You've reached the ${maxSessions} session limit for the ${currentPlan}. Please upgrade or delete old sessions.`
            });
            return;
        }

        try {
            // Suggestion 2: Ensure data structures are clean before saving to JSONB
            // We strip any non-serializable properties if they exist
            const cleanDrawings = drawings.map(d => ({
                id: d.id,
                type: d.type,
                p1: { time: d.p1.time, price: d.p1.price, logical: d.p1.logical },
                p2: d.p2 ? { time: d.p2.time, price: d.p2.price, logical: d.p2.logical } : undefined,
                entry: d.entry,
                target: d.target,
                stop: d.stop,
                color: d.color,
                strokeWidth: d.strokeWidth,
                strokeStyle: d.strokeStyle,
                isLocked: d.isLocked,
                syncAllTimeframes: d.syncAllTimeframes
            }));

            await dataService.saveBacktestSession({
                symbol,
                timeframe,
                data: allData,
                drawings: cleanDrawings,
                trades: history
            });
            addToast({ type: 'success', title: 'Saved to Cloud', message: `Backtest session for ${symbol} saved successfully.` });
            fetchSavedSessions();
        } catch (err: any) {
            addToast({ type: 'error', title: 'Cloud Save Failed', message: err.message });
        }
    };

    const handleLoadSession = (session: BacktestSession) => {
        try {
            setSymbol(session.symbol);
            setTimeframe(session.timeframe);
            setAllData(session.data);
            setDrawings(session.drawings || []);
            setHistory(session.trades || []);

            if (candlestickSeriesRef.current) {
                candlestickSeriesRef.current.setData(session.data.slice(0, 51));
                centerChart();
            }
            setCurrentIdx(50);
            setDataSource('live'); // It's cloud-synced so it's fresh/live source
            addToast({ type: 'success', title: 'Session Loaded', message: `Restored ${session.symbol} ${session.timeframe} session.` });
            setIsSettingsOpen(false);
        } catch (err: any) {
            addToast({ type: 'error', title: 'Load Failed', message: 'The saved data is corrupted.' });
        }
    };

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Don't trigger load
        try {
            await dataService.deleteBacktestSession(id);
            addToast({ type: 'info', title: 'Deleted', message: 'Session removed from cloud.' });
            fetchSavedSessions();
        } catch (err: any) {
            addToast({ type: 'error', title: 'Delete Failed', message: err.message });
        }
    };

    const centerChart = useCallback(() => {
        if (!chartRef.current || !candlestickSeriesRef.current) return;

        // Use a small timeout to ensure the DOM and series data are fully processed
        setTimeout(() => {
            const chart = chartRef.current;
            const series = candlestickSeriesRef.current;
            if (!chart || !series) return;

            // 1. Reset the price scale to auto-scale mode
            series.priceScale().applyOptions({
                autoScale: true,
            });

            // 2. Fit the entire data content into the visible range
            chart.timeScale().fitContent();

            // 3. Ensure the crosshair is not causing weird offsets
            chart.applyOptions({
                crosshair: { mode: 0 }
            });
        }, 50);
    }, []);

    const saveToLocalCache = useCallback((data: any[], overrideSymbol?: string, overrideTimeframe?: string) => {
        try {
            const activeSymbol = overrideSymbol || symbol;
            const activeTF = overrideTimeframe || timeframe;
            const key = `jfx_backtest_cache_${activeSymbol}_${activeTF}`;
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to cache data', e);
        }
    }, [symbol, timeframe]);

    const loadFromLocalCache = useCallback((overrideSymbol?: string, overrideTimeframe?: string) => {
        const activeSymbol = overrideSymbol || symbol;
        const activeTF = overrideTimeframe || timeframe;
        const key = `jfx_backtest_cache_${activeSymbol}_${activeTF}`;
        const cached = localStorage.getItem(key);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (Array.isArray(data) && data.length > 0) {
                    setAllData(data);
                    if (candlestickSeriesRef.current) {
                        candlestickSeriesRef.current.setData(data.slice(0, 51));
                        centerChart();
                    }
                    setCurrentIdx(50);
                    setDataSource('cache');
                    addToast({ type: 'info', title: 'Loaded from Cache', message: `Restored ${data.length} bars for ${activeSymbol}` });
                    return true;
                }
            } catch (e) {
                console.error('Failed to parse cached data', e);
            }
        }
        return false;
    }, [symbol, timeframe, setAllData, setCurrentIdx, addToast, centerChart]);

    const handleDownloadData = () => {
        if (allData.length === 0) return;
        const blob = new Blob([JSON.stringify(allData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jfx_data_${symbol}_${timeframe}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addToast({ type: 'success', title: 'Data Exported', message: `Saved ${allData.length} bars to file.` });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (Array.isArray(data)) {
                    setAllData(data);
                    if (candlestickSeriesRef.current) {
                        candlestickSeriesRef.current.setData(data.slice(0, 51));
                        centerChart();
                    }
                    setCurrentIdx(50);
                    setDataSource('cache');
                    addToast({ type: 'success', title: 'Data Imported', message: `Loaded ${data.length} bars from file.` });
                }
            } catch (err) {
                addToast({ type: 'error', title: 'Import Failed', message: 'Invalid JSON file format.' });
            }
        };
        reader.readAsText(file);
    };

    const handleFetchMT5Data = useCallback(async (overrideSymbol?: string, overrideTimeframe?: string) => {
        setIsPlaying(false);
        const activeSymbol = overrideSymbol || symbol;
        const activeTF = overrideTimeframe || timeframe;

        // Try cache first
        if (loadFromLocalCache(overrideSymbol, overrideTimeframe)) {
            // Keep dataSource as 'cache' until fetch completes
        }

        try {
            const { data, startIdx } = await fetchData(overrideSymbol, overrideTimeframe);
            if (candlestickSeriesRef.current) {
                candlestickSeriesRef.current.setData(data.slice(0, startIdx + 1));
                centerChart();
            }
            setBalance(10000);
            setPosition(null);
            setHistory([]);
            setMarkers([]);
            const series = candlestickSeriesRef.current as any;
            if (series && typeof series.setMarkers === 'function') {
                series.setMarkers([]);
            }
            saveToLocalCache(data, overrideSymbol, overrideTimeframe);
            setDataSource('live');
            addToast({ type: 'success', title: 'Data Synced', message: `Loaded ${data.length} bars for ${activeSymbol}` });
        } catch (err: any) {
            addToast({
                type: 'error',
                title: 'Sync Failed',
                message: err.message || 'Make sure bridge is running.'
            });
        }
    }, [fetchData, addToast, saveToLocalCache, loadFromLocalCache, symbol, timeframe, centerChart]);

    const handleUpdateData = useCallback(async () => {
        if (allData.length === 0) return handleFetchMT5Data();
        setIsPlaying(false);
        try {
            // We fetch the latest 1000 bars and merge/replace
            const { data } = await fetchData();
            saveToLocalCache(data);
            setDataSource('live');
            addToast({ type: 'success', title: 'Data Updated', message: 'Latest bars synced from MT5' });
        } catch (err: any) {
            addToast({ type: 'error', title: 'Update Failed', message: err.message });
        }
    }, [allData, fetchData, handleFetchMT5Data, saveToLocalCache, addToast]);

    const pushToHistory = useCallback((newDrawings: Drawing[]) => {
        setHistoryStates(prev => {
            const newHistory = prev.slice(0, historyPointer + 1);
            newHistory.push([...newDrawings]);
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
        });
        setHistoryStep(prev => {
            const next = prev + 1;
            return next > 49 ? 49 : next;
        });
    }, [historyPointer]);

    const handleUndo = useCallback(() => {
        if (historyPointer > 0) {
            const nextStep = historyPointer - 1;
            setHistoryStep(nextStep);
            setDrawings(historyStates[nextStep]);
        } else if (historyPointer === 0) {
            setHistoryStep(-1);
            setDrawings([]);
        }
    }, [historyPointer, historyStates]);

    const handleRedo = useCallback(() => {
        if (historyPointer < historyStates.length - 1) {
            const nextStep = historyPointer + 1;
            setHistoryStep(nextStep);
            setDrawings(historyStates[nextStep]);
        }
    }, [historyPointer, historyStates]);

    const updateDrawingProperty = useCallback((id: string, updates: Partial<Drawing>) => {
        setDrawings(prev => {
            const next = prev.map(d => d.id === id ? { ...d, ...updates } : d);
            pushToHistory(next);
            return next;
        });

        setEditingDrawingSettings(prev => (prev && prev.id === id) ? { ...prev, ...updates } : prev);
    }, [pushToHistory]);

    const handleDuplicateDrawing = useCallback((drawing: Drawing) => {
        const tfSecondsMap: Record<string, number> = {
            'M1': 60, 'M5': 300, 'M15': 900, 'M30': 1800, 'H1': 3600, 'H4': 14400, 'D1': 86400
        };
        const offsetTime = tfSecondsMap[timeframe] || 3600;

        const newDrawing: Drawing = {
            ...drawing,
            id: Date.now().toString(),
            p1: {
                ...drawing.p1,
                time: drawing.p1.time + offsetTime,
                logical: drawing.p1.logical !== undefined ? drawing.p1.logical + 1 : undefined
            },
            p2: drawing.p2 ? {
                ...drawing.p2,
                time: drawing.p2.time + offsetTime,
                logical: drawing.p2.logical !== undefined ? drawing.p2.logical + 1 : undefined
            } : undefined,
            entry: drawing.entry,
            target: drawing.target,
            stop: drawing.stop
        };
        setDrawings(prev => {
            const next = [...prev, newDrawing];
            pushToHistory(next);
            return next;
        });
        addToast({ type: 'success', title: 'Duplicated', message: 'Drawing duplicated with offset' });
    }, [timeframe, pushToHistory, addToast]);

    const handleCopyDrawing = useCallback((drawing: Drawing) => {
        setClipboard(drawing);
        addToast({ type: 'info', title: 'Copied', message: 'Drawing copied to clipboard' });
    }, [addToast]);

    // Helper: Convert X/Y to Price/Time
    const getChartCoordinates = useCallback((x: number, y: number) => {
        if (!chartRef.current || !candlestickSeriesRef.current) return null;
        const timeScale = chartRef.current.timeScale();
        const priceScale = candlestickSeriesRef.current;
        const price = priceScale.coordinateToPrice(y) as number;
        
        // Use coordinateToLogical for higher precision than coordinateToTime
        const logical = timeScale.coordinateToLogical(x);
        let time = timeScale.coordinateToTime(x) as number;

        if (!time && logical !== null && allData.length > 0) {
            const lastBar = allData[allData.length - 1];
            const tfSecondsMap: Record<string, number> = { 'M1': 60, 'M5': 300, 'M15': 900, 'M30': 1800, 'H1': 3600, 'H4': 14400, 'D1': 86400 };
            const secondsPerBar = tfSecondsMap[timeframe] || 3600;
            
            // Calculate time based on logical offset if we are in the 'future' area of the chart
            const lastLogical = timeScale.coordinateToLogical(timeScale.timeToCoordinate(lastBar.time as any) || 0) || allData.length;
            time = lastBar.time + (logical - lastLogical) * secondsPerBar;
        }
        
        if (price === null || !time) return null;
        return { time, price, logical: logical !== null ? (logical as number) : undefined };
    }, [allData, timeframe]);

    const handlePasteDrawing = useCallback((x: number, y: number) => {
        if (!clipboard) return;
        const coords = getChartCoordinates(x, y);
        if (!coords) return;

        const timeOffset = coords.time - clipboard.p1.time;
        const priceOffset = coords.price - clipboard.p1.price;
        const logicalOffset = (coords.logical ?? 0) - (clipboard.p1.logical ?? 0);

        const newDrawing: Drawing = {
            ...clipboard,
            id: Date.now().toString(),
            p1: {
                time: clipboard.p1.time + timeOffset,
                price: clipboard.p1.price + priceOffset,
                logical: clipboard.p1.logical !== undefined ? clipboard.p1.logical + logicalOffset : undefined
            },
            p2: clipboard.p2 ? {
                time: clipboard.p2.time + timeOffset,
                price: clipboard.p2.price + priceOffset,
                logical: clipboard.p2.logical !== undefined ? clipboard.p2.logical + logicalOffset : undefined
            } : undefined,
            entry: clipboard.entry !== undefined ? clipboard.entry + priceOffset : undefined,
            target: clipboard.target !== undefined ? clipboard.target + priceOffset : undefined,
            stop: clipboard.stop !== undefined ? clipboard.stop + priceOffset : undefined
        };

        setDrawings(prev => {
            const next = [...prev, newDrawing];
            pushToHistory(next);
            return next;
        });
        addToast({ type: 'success', title: 'Pasted', message: 'Drawing pasted at cursor' });
    }, [clipboard, getChartCoordinates, pushToHistory, addToast]);

    // Helper: Snap to OHLC
    const getSnappedPoint = useCallback((time: number, price: number, logical?: number): Point => {
        if (!magnetMode || !allData.length || !chartRef.current || !candlestickSeriesRef.current) return { time, price, logical };
        const timeScale = chartRef.current.timeScale();
        const effectiveLogical = logical ?? timeScale.coordinateToLogical(timeScale.timeToCoordinate(time as any) || 0);
        if (effectiveLogical === null) return { time, price, logical };
        
        // Find the closest bar by rounding the logical coordinate
        const barIndex = Math.round(effectiveLogical as number);
        const candle = allData[barIndex];
        if (!candle) return { time, price, logical: effectiveLogical as number };
        
        const levels = [candle.open, candle.high, candle.low, candle.close];
        const closestLevel = levels.reduce((p, c) => Math.abs(c - price) < Math.abs(p - price) ? c : p);
        
        // Return the exact bar time but keep the fractional logical for smoother anchoring if possible
        // However, snapping usually implies bar-alignment.
        return { time: candle.time, price: closestLevel, logical: barIndex };
    }, [magnetMode, allData]);

    const onMouseDown = (e: React.MouseEvent) => {
        if (!chartRef.current || !candlestickSeriesRef.current || e.button !== 0) return;
        if (contextMenu) setContextMenu(null);
        const rect = chartContainerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const coords = getChartCoordinates(e.clientX - rect.left, e.clientY - rect.top);
        if (!coords) return;

        if (isSelectBarMode) {
            const tfSecondsMap: Record<string, number> = { 'M1': 60, 'M5': 300, 'M15': 900, 'M30': 1800, 'H1': 3600, 'H4': 14400, 'D1': 86400 };
            const threshold = (tfSecondsMap[timeframe] || 3600) / 2;
            const foundIdx = allData.findIndex(d => Math.abs(d.time - coords.time) <= threshold);
            if (foundIdx !== -1) {
                setCurrentIdx(foundIdx);
                candlestickSeriesRef.current.setData(allData.slice(0, foundIdx + 1));
                setIsSelectBarMode(false);
            }
            return;
        }

        if (activeTool === 'cursor') {
            if (selectedDrawingId) setSelectedDrawingId(null);
            return;
        }
        if (isLocked) {
            addToast({ type: 'info', title: 'Drawings Locked', message: 'Unlock to place new drawings' });
            return;
        }

        const snapped = getSnappedPoint(coords.time, coords.price as any, coords.logical);
        const isPositionTool = activeTool === 'long' || activeTool === 'short';
        const defaultStopOffset = 0.00100;
        const rrVal = userProfile.defaultRR || 2.0;

        setCurrentDrawing({
            id: Date.now().toString(),
            type: activeTool,
            p1: snapped,
            p2: (activeTool === 'horizontal' || activeTool === 'vertical') ? undefined : (isPositionTool ? { ...snapped, time: snapped.time + 3600 * 24, logical: (snapped.logical ?? 0) + 20 } : snapped),
            entry: isPositionTool ? snapped.price : undefined,
            target: isPositionTool ? (activeTool === 'long' ? snapped.price + (defaultStopOffset * rrVal) : snapped.price - (defaultStopOffset * rrVal)) : undefined,
            stop: isPositionTool ? (activeTool === 'long' ? snapped.price - defaultStopOffset : snapped.price + defaultStopOffset) : undefined
        });
    };

    const onMouseMove = (e: React.MouseEvent) => {
        const rect = chartContainerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });
        const coords = getChartCoordinates(x, y);
        if (!coords) return;

        if (dragState && dragStartPos) {
            const dPrice = coords.price - dragStartPos.price;
            const dTime = coords.time - dragStartPos.time;
            const dLog = (coords.logical ?? 0) - (dragStartPos.logical ?? 0);

            const initialData = dragStartPos as any;

            setDrawings(prev => prev.map(d => {
                if (d.id !== dragState.drawingId) return d;
                const newD = { ...d };
                
                if (dragState.handle === 'move') {
                    const p1Base = initialData.initialP1;
                    const p2Base = initialData.initialP2;
                    
                    newD.p1 = { 
                        time: p1Base.time + dTime, 
                        price: p1Base.price + dPrice, 
                        logical: p1Base.logical !== undefined ? p1Base.logical + dLog : undefined 
                    };
                    
                    if (p2Base) {
                        newD.p2 = { 
                            time: p2Base.time + dTime, 
                            price: p2Base.price + dPrice, 
                            logical: p2Base.logical !== undefined ? p2Base.logical + dLog : undefined 
                        };
                    }
                    
                    if (d.type === 'long' || d.type === 'short') {
                        newD.entry = (initialData.initialEntry || 0) + dPrice;
                        newD.target = (initialData.initialTarget || 0) + dPrice;
                        newD.stop = (initialData.initialStop || 0) + dPrice;
                    }
                } else if (dragState.handle === 'target') {
                    newD.target = d.type === 'long' ? Math.max(coords.price, d.entry || d.p1.price) : Math.min(coords.price, d.entry || d.p1.price);
                } else if (dragState.handle === 'stop') {
                    newD.stop = d.type === 'long' ? Math.min(coords.price, d.entry || d.p1.price) : Math.max(coords.price, d.entry || d.p1.price);
                } else {
                    const snp = getSnappedPoint(coords.time, coords.price as any, coords.logical);
                    if (dragState.handle === 'p1') { 
                        newD.p1 = snp; 
                        if (d.type === 'long' || d.type === 'short') newD.entry = snp.price; 
                    } else if (dragState.handle === 'p2') {
                        newD.p2 = snp;
                    }
                }
                return newD;
            }));
        }
        if (currentDrawing) {
            const snp = getSnappedPoint(coords.time, coords.price as any, coords.logical);
            setCurrentDrawing(prev => prev ? { ...prev, p2: snp } : null);
        }
    };

    const handleMouseUp = () => {
        if (dragState) pushToHistory(drawings);
        if (currentDrawing && (currentDrawing.p2 || currentDrawing.type === 'horizontal' || currentDrawing.type === 'vertical')) {
            const next = [...drawings, currentDrawing];
            setDrawings(next);
            pushToHistory(next);
            setSelectedDrawingId(currentDrawing.id);
            setCurrentDrawing(null);
            if (!isSticky) setActiveTool('cursor');
        }
        setDragState(null);
        setDragStartPos(null);
    };

    const handleMouseDownHandle = useCallback((e: React.MouseEvent, drawingId: string, handle: 'p1' | 'p2' | 'move' | 'target' | 'stop') => {
        if (!chartRef.current || !candlestickSeriesRef.current || !mousePos || isLocked) return;
        const coords = getChartCoordinates(mousePos.x, mousePos.y);
        if (coords) { 
            const drawing = drawings.find(d => d.id === drawingId);
            if (drawing) {
                setDragStartPos({
                    ...coords,
                    initialP1: { ...drawing.p1 },
                    initialP2: drawing.p2 ? { ...drawing.p2 } : undefined,
                    initialEntry: drawing.entry,
                    initialTarget: drawing.target,
                    initialStop: drawing.stop
                } as any); 
                setDragState({ drawingId, handle }); 
            }
        }
    }, [mousePos, isLocked, getChartCoordinates, drawings]);

    const handleContextMenuInternal = (e: React.MouseEvent) => {
        e.preventDefault();
        if (activeTool !== 'cursor' || currentDrawing) { setActiveTool('cursor'); setCurrentDrawing(null); setIsSticky(false); return; }
        if (clipboard) setContextMenu({ x: e.clientX, y: e.clientY, drawing: { id: 'paste-dummy' } as any });
    };

    const handleContextMenuDrawing = useCallback((e: React.MouseEvent, drawing: Drawing) => {
        setContextMenu({ x: e.clientX, y: e.clientY, drawing });
    }, []);

    const [chartReady, setChartReady] = useState(false);
    const [tick, setTick] = useState(0);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!chartContainerRef.current) return;
        
        const updateDimensions = () => {
            if (chartContainerRef.current) {
                setDimensions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight
                });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: { background: { type: ColorType.Solid, color: isDarkMode ? '#000000' : '#ffffff' }, textColor: isDarkMode ? '#a1a1aa' : '#64748b' },
            grid: { vertLines: { color: isDarkMode ? '#18181b' : '#f1f5f9' }, horzLines: { color: isDarkMode ? '#18181b' : '#f1f5f9' } },
            width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight,
            timeScale: { timeVisible: true, secondsVisible: false, borderColor: isDarkMode ? '#27272a' : '#e2e8f0' },
            rightPriceScale: { borderColor: isDarkMode ? '#27272a' : '#e2e8f0' },
            crosshair: { mode: 0, vertLine: { color: '#FF4F01', style: 3 }, horzLine: { color: '#FF4F01', style: 3 } }
        });

        const series = chart.addSeries(CandlestickSeries, { upColor: '#10b981', downColor: '#ef4444', borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#ef4444' });
        chartRef.current = chart; 
        candlestickSeriesRef.current = series; 
        
        updateDimensions();
        setChartReady(true);

        // Improved Sync Logic: Use a persistent animation frame to sync the SVG overlay with the Canvas chart
        // We track the last known visible range to avoid redundant state updates
        let lastVisibleRange: any = null;
        let animationFrameId: number;

        const syncOverlay = () => {
            const chart = chartRef.current;
            if (chart) {
                const currentRange = chart.timeScale().getVisibleLogicalRange();
                // If the range has changed, or we're in the middle of an interaction, update the tick
                // We use JSON.stringify for a quick deep comparison of the range object
                const rangeStr = JSON.stringify(currentRange);
                if (rangeStr !== lastVisibleRange) {
                    setTick(t => t + 1);
                    lastVisibleRange = rangeStr;
                }
            }
            animationFrameId = requestAnimationFrame(syncOverlay);
        };
        animationFrameId = requestAnimationFrame(syncOverlay);

        const handleResize = () => {
            if (chartContainerRef.current) {
                const width = chartContainerRef.current.clientWidth;
                const height = chartContainerRef.current.clientHeight;
                chart.applyOptions({ width, height });
                setDimensions({ width, height });
                setTick(t => t + 1); // Force update on resize
            }
        };

        window.addEventListener('resize', handleResize);
        if (!loadFromLocalCache()) {
            handleFetchMT5Data();
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            chart.remove();
        };
    }, [isDarkMode]);

    const stepForward = () => {
        if (currentIndex < allData.length - 1) {
            const nextIdx = currentIndex + 1; 
            const nextBar = allData[nextIdx];
            setCurrentIdx(nextIdx); 
            candlestickSeriesRef.current?.update(nextBar); 
            // Explicitly update tick to sync drawings immediately with the new bar
            setTick(t => t + 1);
        } else { 
            setIsPlaying(false); 
            addToast({ type: 'info', title: 'End of Data' }); 
        }
    };

    useEffect(() => {
        let interval: any; if (isPlaying) interval = setInterval(stepForward, playSpeed);
        return () => clearInterval(interval);
    }, [isPlaying, currentIndex, playSpeed, allData]);

    const handleBuy = () => {
        if (position || allData.length === 0) return;
        const price = allData[currentIndex].close; const time = allData[currentIndex].time;
        setPosition({ type: 'BUY', entry: price, lots: 0.1 });
        const series = candlestickSeriesRef.current as any;
        const newMarkers = [...markers, { time, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'BUY' }];
        setMarkers(newMarkers); series?.setMarkers(newMarkers);
    };

    const handleSell = () => {
        if (position || allData.length === 0) return;
        const price = allData[currentIndex].close; const time = allData[currentIndex].time;
        setPosition({ type: 'SELL', entry: price, lots: 0.1 });
        const series = candlestickSeriesRef.current as any;
        const newMarkers = [...markers, { time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'SELL' }];
        setMarkers(newMarkers); series?.setMarkers(newMarkers);
    };

    const handleClose = () => {
        if (!position || allData.length === 0) return;
        const exit = allData[currentIndex].close;
        const pnl = position.type === 'BUY' ? (exit - position.entry) * 100000 * position.lots : (position.entry - exit) * 100000 * position.lots;
        const series = candlestickSeriesRef.current as any;
        const newMarkers = [...markers, { time: allData[currentIndex].time, position: position.type === 'BUY' ? 'aboveBar' : 'belowBar', color: '#6366f1', shape: 'arrowDown', text: 'CLOSE' }];
        setMarkers(newMarkers); series?.setMarkers(newMarkers);
        setBalance(prev => prev + pnl); setHistory(prev => [...prev, { ...position, exit, pnl, time: allData[currentIndex].time }]); setPosition(null);
    };

    const resetReplay = useCallback(() => {
        setIsPlaying(false);
        setCurrentIdx(0);
        if (candlestickSeriesRef.current && allData.length > 0) {
            candlestickSeriesRef.current.setData([allData[0]]);
            setTimeout(() => chartRef.current?.timeScale().fitContent(), 0);
        }
        setBalance(10000);
        setPosition(null);
        setHistory([]);
        setMarkers([]);
        const series = candlestickSeriesRef.current as any;
        if (series && typeof series.setMarkers === 'function') {
            series.setMarkers([]);
        }
        addToast({ type: 'info', title: 'Replay Reset' });
    }, [allData, setCurrentIdx, addToast]);

    const clearDrawings = useCallback(() => {
        setDrawings([]);
        pushToHistory([]);
        addToast({ type: 'info', title: 'Drawings Cleared' });
    }, [pushToHistory, addToast]);

    const floatingPnL = useMemo(() => {
        if (!position || allData.length === 0 || !allData[currentIndex]) return 0;
        const currentPrice = allData[currentIndex].close;
        const diff = currentPrice - position.entry;
        const pnl = position.type === 'BUY'
            ? diff * 100000 * position.lots
            : -diff * 100000 * position.lots;
        return pnl;
    }, [position, allData, currentIndex]);

    return (
        <div className={`w-full h-full flex flex-col overflow-hidden font-sans ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-white text-slate-900'}`} onMouseUp={handleMouseUp}>
            <div className={`h-16 shrink-0 border-b flex items-center justify-between px-8 z-50 relative shadow-sm ${isDarkMode ? 'border-zinc-800 bg-[#09090b]/95 backdrop-blur-sm' : 'border-slate-200 bg-white/95 backdrop-blur-sm'}`}>
                <div className="flex items-center gap-5 w-72">
                    <div className={`p-2.5 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-gradient-to-br from-[#FF4F01]/20 to-[#FF4F01]/5 border-[#FF4F01]/20 shadow-[#FF4F01]/10 text-[#FF4F01]' : 'bg-[#FF4F01]/5 border-[#FF4F01]/20 shadow-[#FF4F01]/5 text-[#FF4F01]'}`}>
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h2 className={`text-base font-black uppercase tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Backtest Lab</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <p className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>MT5 Replay Engine</p>
                        </div>
                    </div>
                </div>

                <div className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-2xl border shadow-xl ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800 shadow-black/20' : 'bg-slate-50 border-slate-200 shadow-slate-200/50'}`}>
                    <div className={`flex items-center rounded-xl border px-2 relative ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-2 px-1">
                            <div className="relative group/status">
                                <div className={`w-2 h-2 rounded-full shadow-sm ${dataSource === 'live' ? 'bg-emerald-500 animate-pulse' :
                                    dataSource === 'cache' ? 'bg-amber-500' : 'bg-zinc-600'
                                    }`} />
                                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/status:opacity-100 transition-opacity z-[110] pointer-events-none ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-white text-slate-900 border shadow-lg'}`}>
                                    {dataSource === 'live' ? 'Live Bridge Data' : dataSource === 'cache' ? 'Cached Offline Data' : 'No Data Loaded'}
                                </div>
                            </div>
                            <Search size={14} className="text-zinc-500 ml-1" />
                            <input
                                value={symbol}
                                onChange={(e) => { setSymbol(e.target.value.toUpperCase()); setIsSymbolMenuOpen(true); }}
                                onFocus={() => setIsSymbolMenuOpen(true)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { handleFetchMT5Data(symbol); setIsSymbolMenuOpen(false); } }}
                                className={`bg-transparent text-xs font-black w-20 py-2 outline-none uppercase text-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                                placeholder="SYMBOL"
                            />
                        </div>

                        {isSymbolMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-[90]" onClick={() => setIsSymbolMenuOpen(false)} />
                                <div className={`absolute top-full left-0 mt-2 w-64 border rounded-2xl shadow-2xl p-2 z-[100] max-h-80 overflow-y-auto ${isDarkMode ? 'bg-[#1e222d] border-zinc-700' : 'bg-white border-slate-200'}`}>
                                    <div className="p-2 mb-2 border-b border-zinc-700/50">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Popular Symbols</span>
                                    </div>
                                    {POPULAR_SYMBOLS.filter(s => s.includes(symbol) || symbol === '').map(s => (
                                        <button
                                            key={s}
                                            onClick={() => { setSymbol(s); setIsSymbolMenuOpen(false); handleFetchMT5Data(s); }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left ${symbol === s ? 'bg-[#FF4F01] text-white' : (isDarkMode ? 'text-zinc-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}`}
                                        >
                                            <span className="text-xs font-black">{s}</span>
                                            {symbol === s && <Check size={14} />}
                                        </button>
                                    ))}
                                    {symbol && !POPULAR_SYMBOLS.includes(symbol) && (
                                        <button
                                            onClick={() => { setIsSymbolMenuOpen(false); handleFetchMT5Data(symbol); }}
                                            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-[#FF4F01] hover:bg-[#FF4F01]/10`}
                                        >
                                            <Search size={14} />
                                            <span className="text-xs font-black italic">Search for "{symbol}"</span>
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                        <div className="relative group/tf">
                            <button onClick={() => setIsTFMenuOpen(!isTFMenuOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'text-zinc-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                                <span className="text-xs font-black">{timeframe}</span>
                                <ChevronDown size={12} />
                            </button>
                            {isTFMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsTFMenuOpen(false)} />
                                    <div className={`absolute top-full left-0 mt-2 w-48 border rounded-2xl shadow-2xl p-2 z-[100] ${isDarkMode ? 'bg-[#1e222d] border-zinc-700' : 'bg-white border-slate-200'}`}>
                                        {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map(tf => (
                                            <button key={tf} onClick={() => { setTimeframe(tf); setIsTFMenuOpen(false); handleFetchMT5Data(undefined, tf); }} className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left ${timeframe === tf ? 'bg-[#FF4F01] text-white shadow-lg shadow-[#FF4F01]/20' : (isDarkMode ? 'text-zinc-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}`}>
                                                <span className="text-sm font-black">{tf}</span>
                                                {timeframe === tf && <Check size={14} className="text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 ml-1 border-l pl-2 border-zinc-800">
                        <button onClick={handleUpdateData} disabled={isFetching} title="Update to Latest" className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-emerald-500' : 'hover:bg-emerald-50 text-emerald-600'}`}>
                            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={() => setIsSettingsOpen(true)} disabled={allData.length === 0} title="Download Chart.json" className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-blue-500' : 'hover:bg-blue-50 text-blue-600'}`}>
                            <Download size={18} />
                        </button>
                        <label title="Load from File" className={`p-2 rounded-xl cursor-pointer transition-all ${isDarkMode ? 'hover:bg-white/5 text-amber-500' : 'hover:bg-amber-50 text-amber-600'}`}>
                            <FileUp size={18} />
                            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                        </label>
                    </div>

                    <button onClick={() => handleFetchMT5Data()} disabled={isFetching} className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest ${isFetching ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-gradient-to-r from-[#FF4F01] to-[#ff7e42] text-white active:scale-95 shadow-lg shadow-[#FF4F01]/25'}`}>
                        {isFetching ? 'Syncing...' : 'Sync'}
                    </button>
                </div>

                <div className="flex items-center gap-6 w-72 justify-end">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Account Balance</span>
                        <span className={`text-lg font-mono font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className={`w-px h-8 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                    <div className="flex flex-col items-end min-w-[100px]">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Session P&L</span>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border bg-opacity-10 ${floatingPnL >= 0 ? 'bg-emerald-500 border-emerald-500/20 text-emerald-500' : 'bg-rose-500 border-rose-500/20 text-rose-500'}`}>
                            {floatingPnL >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span className="text-xs font-mono font-black tracking-tight">{floatingPnL >= 0 ? '+' : ''}{floatingPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`flex-1 flex relative overflow-hidden min-h-0 group ${isDarkMode ? 'bg-black' : 'bg-slate-50'}`}>
                <DrawingToolbar activeTool={activeTool} setActiveTool={setActiveTool} clearDrawings={clearDrawings} magnetMode={magnetMode} toggleMagnetMode={() => setMagnetMode(!magnetMode)} isSticky={isSticky} toggleSticky={() => setIsSticky(!isSticky)} isLocked={isLocked} toggleLocked={() => setIsLocked(!isLocked)} isDarkMode={isDarkMode} />
                <div className="flex-1 relative min-w-0" onContextMenu={handleContextMenuInternal} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={handleMouseUp}>
                    {!chartReady && <div className={`absolute inset-0 flex items-center justify-center z-50 ${isDarkMode ? 'bg-black' : 'bg-white'}`}><div className="w-10 h-10 border-4 border-[#FF4F01] border-t-transparent rounded-full animate-spin"></div></div>}
                    <ChartErrorBoundary>
                        <div ref={chartContainerRef} className="w-full h-full" />
                        <DrawingLayer drawings={drawings} currentDrawing={currentDrawing} selectedDrawingId={selectedDrawingId} hoveredDrawingId={hoveredDrawingId} mousePos={mousePos} chart={chartRef.current} series={candlestickSeriesRef.current} containerWidth={dimensions.width} containerHeight={dimensions.height} activeTool={activeTool} isSelectBarMode={isSelectBarMode} onMouseDownHandle={handleMouseDownHandle} onSelectDrawing={setSelectedDrawingId} onHoverDrawing={setHoveredDrawingId} onDoubleClickDrawing={setEditingDrawingSettings} onContextMenuDrawing={handleContextMenuDrawing} tick={tick} isLocked={isLocked} isDarkMode={isDarkMode} />
                    </ChartErrorBoundary>
                    {position && <div className={`absolute top-4 left-4 p-3 rounded-lg backdrop-blur border z-10 shadow-xl flex items-center gap-3 ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-slate-200'}`}><div className={`w-2 h-2 rounded-full ${position.type === 'BUY' ? 'bg-emerald-500' : 'bg-rose-500'}`} /><div className="flex flex-col"><span className={`text-[10px] font-black uppercase ${position.type === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{position.type}</span><span className={`font-mono text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{position.entry.toFixed(5)}</span></div></div>}
                </div>
            </div>

            <div className={`h-16 shrink-0 border-t flex items-center px-8 justify-between relative z-20 ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                    {position ? <button onClick={handleClose} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-xs shadow-lg ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}><XCircle size={16} /> CLOSE POSITION</button> : <><button onClick={handleBuy} disabled={isFetching || allData.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-[#10b981] text-white rounded-lg font-bold text-xs shadow-lg shadow-[#10b981]/20"><TrendingUp size={16} /> BUY</button><button onClick={handleSell} disabled={isFetching || allData.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-[#ef4444] text-white rounded-lg font-bold text-xs shadow-lg shadow-[#ef4444]/20"><TrendingDown size={16} /> SELL</button></>}
                </div>
                <div className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-2xl border backdrop-blur shadow-2xl ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-slate-50/80 border-slate-200'}`}>
                    <button onClick={() => setIsSelectBarMode(!isSelectBarMode)} className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest ${isSelectBarMode ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : (isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 border border-transparent' : 'hover:bg-slate-200 text-slate-500 border border-transparent')}`}><ArrowLeftToLine size={16} /> Select bar</button>
                    <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                    <button onClick={resetReplay} className={`p-2.5 rounded-xl ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-200 text-slate-500'}`}><RotateCcw size={18} /></button>
                    <button onClick={() => setIsPlaying(!isPlaying)} disabled={isFetching || allData.length === 0} className={`w-10 h-10 flex items-center justify-center rounded-xl bg-[#FF4F01] text-white shadow-lg shadow-[#FF4F01]/30`}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
                    <button onClick={stepForward} disabled={isFetching || allData.length === 0} className={`p-2.5 rounded-xl ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-200 text-slate-500'}`}><StepForward size={18} /></button>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end gap-1 relative">
                        <button onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)} className="flex flex-col items-end gap-1 opacity-70 hover:opacity-100">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Replay Speed</span>
                            <div className={`flex items-center gap-2 px-2 py-0.5 rounded border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'}`}><span className="text-[10px] font-mono font-black text-[#FF4F01]">{playSpeed === 1000 ? '0.5x' : playSpeed === 500 ? '1.0x' : playSpeed === 200 ? '2.5x' : '10x'}</span><ChevronDown size={12} /></div>
                        </button>
                        {isSpeedMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsSpeedMenuOpen(false)} />
                                <div className={`absolute bottom-full right-0 mb-4 w-48 border rounded-xl shadow-2xl p-2 z-50 ${isDarkMode ? 'bg-[#1e222d] border-zinc-800' : 'bg-white border-slate-200'}`}>
                                    {[{ l: '0.5x', v: 1000 }, { l: '1.0x', v: 500 }, { l: '2.5x', v: 200 }, { l: '10x', v: 50 }].map(opt => (
                                        <button key={opt.v} onClick={() => { setPlaySpeed(opt.v); setIsSpeedMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between ${playSpeed === opt.v ? 'bg-[#FF4F01]/10 text-[#FF4F01]' : (isDarkMode ? 'text-zinc-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50')}`}><span>{opt.l}</span>{playSpeed === opt.v && <Check size={14} />}</button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={() => setIsSettingsOpen(true)} className={`p-3 rounded-xl border shadow-lg ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}><Settings size={18} /></button>
                </div>
            </div>

            {isSettingsOpen && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
                    <div className={`relative w-full max-w-sm rounded-2xl border shadow-2xl p-6 ${isDarkMode ? 'bg-[#1e222d] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                    <Database size={18} />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest">Backtest Settings</h3>
                            </div>
                            <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-black/5 rounded-lg">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 block">Save & Export Chart</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { handleDownloadData(); setIsSettingsOpen(false); }}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 hover:border-blue-500/50' : 'bg-slate-50 border-slate-200 hover:border-blue-500/50'}`}
                                    >
                                        <Download size={20} className="text-blue-500" />
                                        <span className="text-[10px] font-black uppercase">Local PC</span>
                                        <span className="text-[8px] text-zinc-500 text-center uppercase tracking-tighter">Download .json</span>
                                    </button>
                                    <button
                                        onClick={() => { handleSaveToCloud(); setIsSettingsOpen(false); }}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-200 hover:border-emerald-500/50'}`}
                                    >
                                        <RefreshCw size={20} className="text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase">Cloud Sync</span>
                                        <span className="text-[8px] text-zinc-500 text-center uppercase tracking-tighter">Save to Account</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 block">Load from Cloud</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                    {isLoadingSessions ? (
                                        <div className="flex items-center justify-center py-4">
                                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : savedSessions.length === 0 ? (
                                        <div className="text-center py-4 text-[10px] text-zinc-600 uppercase font-bold italic">
                                            No saved sessions found
                                        </div>
                                    ) : (
                                        savedSessions.map((sess) => (
                                            <button
                                                key={sess.id}
                                                onClick={() => handleLoadSession(sess)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800 hover:border-emerald-500/30 hover:bg-emerald-500/5' : 'bg-white border-slate-200 hover:border-emerald-500/30'}`}
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className="text-xs font-black">{sess.symbol}</span>
                                                    <span className="text-[8px] text-zinc-500 uppercase font-bold">{sess.timeframe} • {new Date(sess.updated_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold uppercase">{sess.data?.length || 0} Bars</span>
                                                    <button
                                                        onClick={(e) => handleDeleteSession(e, sess.id)}
                                                        className="p-1.5 rounded-md hover:bg-rose-500/10 text-zinc-600 hover:text-rose-500 transition-colors"
                                                        title="Delete Session"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                    <ChevronRight size={12} className="text-zinc-600" />
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">Auto-Sync Drawings</span>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-tighter font-bold">Save drawings automatically</span>
                                    </div>
                                    <div className="w-10 h-5 bg-emerald-500/20 rounded-full relative">
                                        <div className="absolute right-1 top-1 w-3 h-3 bg-emerald-500 rounded-full" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">Advanced Simulation</span>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-tighter font-bold">Real-time spread & slippage</span>
                                    </div>
                                    <div className="w-10 h-5 bg-zinc-700 rounded-full relative">
                                        <div className="absolute left-1 top-1 w-3 h-3 bg-zinc-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-8 py-3 bg-[#FF4F01] text-white rounded-xl font-bold text-xs shadow-lg shadow-[#FF4F01]/20 uppercase tracking-widest">Done</button>
                    </div>
                </div>
            )}

            {editingDrawingSettings && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingDrawingSettings(null)} />
                    <div className={`relative w-full max-w-xs rounded-2xl border shadow-2xl p-6 ${isDarkMode ? 'bg-[#1e222d] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                        <div className="flex items-center justify-between mb-6"><h3 className="text-sm font-black uppercase tracking-widest">Drawing Settings</h3><button onClick={() => setEditingDrawingSettings(null)} className="p-1 hover:bg-black/5 rounded-lg"><X size={16} /></button></div>
                        <div className="space-y-6">
                            <div><label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Stroke Color</label><div className="grid grid-cols-5 gap-2">{['#2962ff', '#FF4F01', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#787b86', (isDarkMode ? '#ffffff' : '#000000'), (isDarkMode ? '#000000' : '#e2e8f0')].map(c => <button key={c} onClick={() => updateDrawingProperty(editingDrawingSettings.id, { color: c })} className={`w-8 h-8 rounded-full border-2 ${editingDrawingSettings.color === c ? 'border-[#FF4F01]' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}</div></div>
                            <div><label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Thickness: {editingDrawingSettings.strokeWidth || 2}px</label><input type="range" min="1" max="8" value={editingDrawingSettings.strokeWidth || 2} onChange={(e) => updateDrawingProperty(editingDrawingSettings.id, { strokeWidth: parseInt(e.target.value) })} className="w-full accent-[#FF4F01]" /></div>
                            <div><label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Line Style</label><div className="flex gap-2">{['solid', 'dashed', 'dotted'].map(s => <button key={s} onClick={() => updateDrawingProperty(editingDrawingSettings.id, { strokeStyle: s as any })} className={`flex-1 py-2 rounded-lg border text-[10px] font-bold uppercase ${editingDrawingSettings.strokeStyle === s || (!editingDrawingSettings.strokeStyle && s === 'solid') ? 'bg-[#FF4F01] text-white' : 'bg-zinc-800 text-zinc-400'}`}>{s}</button>)}</div></div>
                            <div><button onClick={() => updateDrawingProperty(editingDrawingSettings.id, { syncAllTimeframes: !editingDrawingSettings.syncAllTimeframes })} className={`w-full py-2.5 rounded-xl text-[10px] font-black border flex items-center justify-center gap-2 ${editingDrawingSettings.syncAllTimeframes ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}><Database size={14} /> {editingDrawingSettings.syncAllTimeframes ? 'Synced' : 'Local Only'}</button></div>
                            <div className="pt-4 border-t border-zinc-800/50"><button onClick={() => { setDrawings(drawings.filter(d => d.id !== editingDrawingSettings.id)); pushToHistory(drawings.filter(d => d.id !== editingDrawingSettings.id)); setEditingDrawingSettings(null); setSelectedDrawingId(null); }} className="w-full py-2.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"><Trash2 size={14} /> Remove</button></div>
                        </div>
                        <button onClick={() => setEditingDrawingSettings(null)} className="w-full mt-8 py-3 bg-[#FF4F01] text-white rounded-xl font-bold text-xs shadow-lg shadow-[#FF4F01]/20">DONE</button>
                    </div>
                </div>
            )}

            {contextMenu && (
                <div className="fixed z-[500] w-48 rounded-xl border shadow-2xl overflow-hidden" style={{ left: contextMenu.x, top: contextMenu.y }}>
                    <div className={`flex flex-col p-1 ${isDarkMode ? 'bg-[#1e222d] border-zinc-800' : 'bg-white border-slate-200'}`}>
                        {contextMenu.drawing.id === 'paste-dummy' ? (
                            <button onClick={() => { const rect = chartContainerRef.current?.getBoundingClientRect(); if (rect) handlePasteDrawing(contextMenu.x - rect.left, contextMenu.y - rect.top); setContextMenu(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-left ${isDarkMode ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-slate-50 text-slate-600'}`}><StepForward size={14} /> Paste Drawing</button>
                        ) : (
                            <>
                                <button onClick={() => { handleDuplicateDrawing(contextMenu.drawing); setContextMenu(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-left ${isDarkMode ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-slate-50 text-slate-600'}`}><StepForward size={14} /> Duplicate</button>
                                <button onClick={() => { handleCopyDrawing(contextMenu.drawing); setContextMenu(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-left ${isDarkMode ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-slate-50 text-slate-600'}`}><Database size={14} /> Copy</button>
                                <button onClick={() => { updateDrawingProperty(contextMenu.drawing.id, { isLocked: !contextMenu.drawing.isLocked }); setContextMenu(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-left ${isDarkMode ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-slate-50 text-slate-600'}`}>{contextMenu.drawing.isLocked ? <Unlock size={14} /> : <Lock size={14} />} {contextMenu.drawing.isLocked ? 'Unlock' : 'Lock'}</button>
                                <button onClick={() => { updateDrawingProperty(contextMenu.drawing.id, { syncAllTimeframes: !contextMenu.drawing.syncAllTimeframes }); setContextMenu(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-left ${isDarkMode ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-slate-50 text-slate-600'}`}><Database size={14} /> {contextMenu.drawing.syncAllTimeframes ? 'Local Only' : 'Sync to all TFs'}</button>
                                <button onClick={() => { setEditingDrawingSettings(contextMenu.drawing); setContextMenu(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-left ${isDarkMode ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-slate-50 text-slate-600'}`}><Settings size={14} /> Settings...</button>
                                <div className={`h-px mx-2 my-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'}`} />
                                <button onClick={() => { setDrawings(drawings.filter(d => d.id !== contextMenu.drawing.id)); pushToHistory(drawings.filter(d => d.id !== contextMenu.drawing.id)); setContextMenu(null); setSelectedDrawingId(null); addToast({ type: 'info', title: 'Deleted' }); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-left text-rose-500 hover:bg-rose-500/10"><Trash2 size={14} /> Remove</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BacktestLab;