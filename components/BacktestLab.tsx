import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Play, Pause, ChevronRight, RotateCcw,
    TrendingUp, TrendingDown, XCircle, X,
    Settings, Zap, ArrowLeftToLine, StepForward, ChevronDown, Database,
    Trash2, Lock, Unlock, Check, Search, Download, FileUp, RefreshCw, Clock, Brain
} from 'lucide-react';
import { useToast } from './ui/Toast';
import { DrawingToolbar } from './backtest/DrawingToolbar';
import { DrawingLayer } from './backtest/DrawingLayer';
import { Drawing, Point, ToolType } from './backtest/types';
import { useMT5Bridge } from '../hooks/useMT5Bridge';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { UserProfile, BacktestSession, Trade } from '../types';
import { dataService } from '../services/dataService';
import CustomChart from './CustomChart';

interface BacktestLabProps {
    isDarkMode: boolean;
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => Promise<void>;
}

const POPULAR_SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'XAUUSD', 'BTCUSD', 'ETHUSD', 'US30', 'NAS100', 'GER40'];

const BacktestLab: React.FC<BacktestLabProps> = ({ isDarkMode, userProfile, onUpdateProfile }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const candlestickSeriesRef = useRef<any>(null);
    const { addToast } = useToast();

    // MT5 Bridge & Data
    const [symbol, setSymbol] = useLocalStorage<string>('jfx_backtest_symbol', 'EURUSD');
    const [timeframe, setTimeframe] = useLocalStorage<string>('jfx_backtest_tf', 'H1');
    const {
        isFetching,
        allData, setAllData, currentIndex, setCurrentIdx, fetchData
    } = useMT5Bridge(symbol, timeframe);

    // Persist currentIndex
    useEffect(() => {
        localStorage.setItem('jfx_backtest_currentIndex', currentIndex.toString());
    }, [currentIndex]);

    // Restore currentIndex on mount if data exists
    useEffect(() => {
        const saved = localStorage.getItem('jfx_backtest_currentIndex');
        if (saved && allData.length > 0) {
            const idx = parseInt(saved);
            if (!isNaN(idx) && idx < allData.length) {
                setCurrentIdx(idx);
            }
        }
    }, [allData.length, setCurrentIdx]);

    // UI State
    const [isSymbolMenuOpen, setIsSymbolMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dataSource, setDataSource] = useState<'live' | 'cache' | 'none'>('none');
    const [bridgeStatus, setBridgeStatus] = useState<'online' | 'offline' | 'checking'>('checking');

    // Bridge Heartbeat
    useEffect(() => {
        const checkBridge = async () => {
            try {
                const res = await fetch('http://localhost:5001/ping');
                if (res.ok) setBridgeStatus('online');
                else setBridgeStatus('offline');
            } catch {
                setBridgeStatus('offline');
            }
        };
        checkBridge();
        const interval = setInterval(checkBridge, 5000);
        return () => clearInterval(interval);
    }, []);

    // Replay State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAutoFollow, setIsAutoFollow] = useLocalStorage<boolean>('jfx_backtest_autofollow', true);
    const [history, setHistory] = useState<Trade[]>([]);
    const [playSpeed, setPlaySpeed] = useLocalStorage<number>('jfx_backtest_playSpeed', 500);
    const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);


    // Tools State
    const [activeTool, setActiveTool] = useState<ToolType>('cursor');
    const [isSticky, setIsSticky] = useLocalStorage<boolean>('jfx_backtest_sticky', false);
    const [isLocked, setIsLocked] = useLocalStorage<boolean>('jfx_backtest_locked', false);
    const [drawings, setDrawings] = useLocalStorage<Drawing[]>('jfx_backtest_drawings', []);
    const [toolDefaults, setToolDefaults] = useLocalStorage<Record<string, any>>('jfx_tool_defaults', {
        trendline: { color: '#2962ff', strokeWidth: 2, strokeStyle: 'solid' },
        ray: { color: '#2962ff', strokeWidth: 2, strokeStyle: 'solid' },
        arrow: { color: '#2962ff', strokeWidth: 2, strokeStyle: 'solid' },
        rect: { color: '#2962ff', strokeWidth: 2, strokeStyle: 'solid' },
        vertical: { color: '#2962ff', strokeWidth: 2, strokeStyle: 'solid' },
        horizontal: { color: '#2962ff', strokeWidth: 2, strokeStyle: 'solid' },
        long: { color: '#10b981', strokeWidth: 2, strokeStyle: 'solid', rr2: 2, rr3: 3 },
        short: { color: '#ef4444', strokeWidth: 2, strokeStyle: 'solid', rr2: 2, rr3: 3 },
        fib: { color: '#2962ff', strokeWidth: 1, strokeStyle: 'solid' },
        channel: { color: '#2962ff', strokeWidth: 2, strokeStyle: 'solid' },
        text: { color: '#2962ff', fontSize: 14 },
    });
    const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
    const [magnetMode, setMagnetMode] = useLocalStorage<boolean>('jfx_backtest_magnet', false);
    const [currentColor, setCurrentColor] = useLocalStorage<string>('jfx_backtest_color', '#2962ff');

    const [chartViewState, setChartViewState] = useLocalStorage<any>(`jfx_backtest_viewstate_${symbol}_${timeframe}`, null);

    // Toolbar State (Position: pixels from top-left, Orientation)
    const [toolbarPos, setToolbarPos] = useLocalStorage<{ x: number, y: number }>('jfx_backtest_toolbar_pos_v2', { x: 60, y: 80 });
    const [toolbarOrientation, setToolbarOrientation] = useLocalStorage<'horizontal' | 'vertical'>('jfx_backtest_toolbar_orientation', 'horizontal');

    // Selection & Edit State
    const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
    const [hoveredDrawingId, setHoveredDrawingId] = useState<string | null>(null);
    const [dragState, setDragState] = useState<{ drawingId: string, handle: 'p1' | 'p2' | 'move' | 'target' | 'stop' } | null>(null);
    const [dragStartPos, setDragStartPos] = useState<{ time: number, price: number, logical?: number } | null>(null);

    // Replay Modes
    const [isSelectBarMode, setIsSelectBarMode] = useState(false);
    const [isTFMenuOpen, setIsTFMenuOpen] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);

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
    const [isImporting, setIsImporting] = useState(false);

    // Feature: AI Analysis
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

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
                trades: [] // Initialize with empty trades for now
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

            setCurrentIdx(session.data.length - 1);
            setDataSource('live');
            setShowWelcome(false);
            addToast({ type: 'success', title: 'Session Loaded', message: `Restored ${session.symbol} ${session.timeframe} session.` });
            setIsSettingsOpen(false);
        } catch (err: any) {
            addToast({ type: 'error', title: 'Load Failed', message: 'The saved data is corrupted.' });
        }
    };

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await dataService.deleteBacktestSession(id);
            addToast({ type: 'info', title: 'Deleted', message: 'Session removed from cloud.' });
            fetchSavedSessions();
        } catch (err: any) {
            addToast({ type: 'error', title: 'Delete Failed', message: err.message });
        }
    };

    const centerChart = useCallback(() => {
        if (!chartRef.current) return;
        chartRef.current.timeScale().fitContent();
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
                    setCurrentIdx(Math.min(data.length - 1, 50));
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
        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (Array.isArray(data)) {
                    setTimeout(() => {
                        setAllData(data);
                        setCurrentIdx(Math.min(data.length - 1, 50));
                        setDataSource('cache');
                        setShowWelcome(false);
                        setIsImporting(false);
                        addToast({ type: 'success', title: 'Data Imported', message: `Loaded ${data.length} bars from file.` });
                    }, 800);
                } else {
                    setIsImporting(false);
                }
            } catch (err) {
                setIsImporting(false);
                addToast({ type: 'error', title: 'Import Failed', message: 'Invalid JSON file format.' });
            }
        };
        reader.onerror = () => {
            setIsImporting(false);
            addToast({ type: 'error', title: 'Read Failed', message: 'Could not read file.' });
        };
        reader.readAsText(file);
    };

    const handleFetchMT5Data = useCallback(async (overrideSymbol?: string, overrideTimeframe?: string) => {
        setIsPlaying(false);
        const activeSymbol = overrideSymbol || symbol;
        const activeTF = overrideTimeframe || timeframe;

        if (loadFromLocalCache(overrideSymbol, overrideTimeframe)) {
            // Success
        }

        try {
            const { data, startIdx } = await fetchData(overrideSymbol, overrideTimeframe);
            setHistory([]);
            saveToLocalCache(data, overrideSymbol, overrideTimeframe);
            setDataSource('live');
            setShowWelcome(false);
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

    const clearDrawings = useCallback(() => {
        setDrawings([]);
        pushToHistory([]);
        addToast({ type: 'info', title: 'Drawings cleared' });
    }, [pushToHistory, addToast]);

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
        let drawingType: string | undefined;

        setDrawings(prev => {
            const next = prev.map(d => {
                if (d.id === id) {
                    drawingType = d.type;
                    return { ...d, ...updates };
                }
                return d;
            });
            pushToHistory(next);
            return next;
        });

        // Save these as defaults for future drawings of this SPECIFIC tool
        if (drawingType && (updates.color || updates.strokeWidth || updates.strokeStyle)) {
            setToolDefaults(prev => ({
                ...prev,
                [drawingType!]: {
                    ...(prev[drawingType!] || {}),
                    ...updates
                }
            }));
        }

        setEditingDrawingSettings(prev => (prev && prev.id === id) ? { ...prev, ...updates } : prev);
    }, [pushToHistory, setToolDefaults]);

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

    const getChartCoordinates = useCallback((x: number, y: number) => {
        if (!chartRef.current || !candlestickSeriesRef.current) return null;
        const price = candlestickSeriesRef.current.coordinateToPrice(y);
        const logical = chartRef.current.timeScale().coordinateToLogical(x);
        const time = chartRef.current.timeScale().coordinateToTime(x);
        if (price === null || logical === null) return null;
        return { time, price, logical };
    }, []);

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

    const getSnappedPoint = useCallback((time: number, price: number, logical?: number): Point => {
        if (!magnetMode || !allData.length) return { time, price, logical };
        const candle = allData[Math.round(logical ?? 0)];
        if (!candle) return { time, price, logical };
        const levels = [candle.open, candle.high, candle.low, candle.close];
        const closestLevel = levels.reduce((p, c) => Math.abs(c - price) < Math.abs(p - price) ? c : p);
        return { time: candle.time, price: closestLevel, logical: Math.round(logical ?? 0) };
    }, [magnetMode, allData]);

    const onMouseDown = (e: React.MouseEvent) => {
        if (!chartRef.current || !candlestickSeriesRef.current || e.button !== 0) return;
        if (contextMenu) setContextMenu(null);

        const rect = chartContainerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const coords = getChartCoordinates(x, y);
        if (!coords) return;

        if (isSelectBarMode) {
            const foundIdx = Math.round(coords.logical);
            if (foundIdx >= 0 && foundIdx < allData.length) {
                setCurrentIdx(foundIdx);
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

        let drawingProps: any = {
            id: Date.now().toString(),
            type: activeTool,
            p1: snapped,
            p2: (activeTool === 'horizontal' || activeTool === 'vertical') ? undefined : snapped,
            ...(toolDefaults[activeTool] || { color: '#2962ff', strokeWidth: 2, strokeStyle: 'solid' })
        };

        // Initialize Long/Short position tool with entry/target/stop
        if (activeTool === 'long' || activeTool === 'short') {
            const isLong = activeTool === 'long';
            const entryPrice = snapped.price;
            const defaults = toolDefaults[activeTool] || {};
            const rrRatio = defaults.rr2 || 2; // Default R:R of 2
            // Use a reasonable default risk based on price level
            const defaultRisk = entryPrice * 0.005; // 0.5% default risk
            drawingProps.entry = entryPrice;
            drawingProps.target = isLong ? entryPrice + (defaultRisk * rrRatio) : entryPrice - (defaultRisk * rrRatio);
            drawingProps.stop = isLong ? entryPrice - defaultRisk : entryPrice + defaultRisk;
        }

        setCurrentDrawing(drawingProps);
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
                    newD.p1 = { time: p1Base.time + dTime, price: p1Base.price + dPrice, logical: p1Base.logical !== undefined ? p1Base.logical + dLog : undefined };
                    if (p2Base) newD.p2 = { time: p2Base.time + dTime, price: p2Base.price + dPrice, logical: p2Base.logical !== undefined ? p2Base.logical + dLog : undefined };
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

            // For Long/Short tools, dynamically update target/stop based on mouse position
            if (currentDrawing.type === 'long' || currentDrawing.type === 'short') {
                const isLong = currentDrawing.type === 'long';
                const entryPrice = currentDrawing.entry ?? currentDrawing.p1.price;
                const mousePriceDist = Math.abs(snp.price - entryPrice);
                const defaults = toolDefaults[currentDrawing.type] || {};
                const rrRatio = defaults.rr2 || 2;
                const risk = mousePriceDist > 0 ? mousePriceDist : entryPrice * 0.005;

                setCurrentDrawing(prev => prev ? {
                    ...prev,
                    p2: snp,
                    target: isLong ? entryPrice + (risk * rrRatio) : entryPrice - (risk * rrRatio),
                    stop: isLong ? entryPrice - risk : entryPrice + risk
                } : null);
            } else {
                setCurrentDrawing(prev => prev ? { ...prev, p2: snp } : null);
            }
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
        if (!mousePos || isLocked) return;
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
        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        const observer = new ResizeObserver(updateDimensions);
        observer.observe(chartContainerRef.current);

        // Always show welcome on refresh as requested
        setShowWelcome(true);
        fetchSavedSessions();

        return () => {
            window.removeEventListener('resize', updateDimensions);
            observer.disconnect();
        };
    }, [fetchSavedSessions]);

    const resetReplay = () => {
        setCurrentIdx(0);
        setIsPlaying(false);
    };

    const stepForward = () => {
        if (currentIndex < allData.length - 1) {
            setCurrentIdx(currentIndex + 1);
            setTick(t => t + 1);
            if (chartRef.current) {
                // Handle horizontal following logic intelligently
                chartRef.current.timeScale().updateOffsetForNewBar(isAutoFollow);
            }
        } else { setIsPlaying(false); addToast({ type: 'info', title: 'End of Data' }); }
    };

    useEffect(() => {
        let interval: any; if (isPlaying) interval = setInterval(stepForward, playSpeed);
        return () => clearInterval(interval);
    }, [isPlaying, currentIndex, playSpeed, allData]);

    const handleAnalyze = async () => {
        if (allData.length < 20) return;
        setIsAnalyzing(true);
        try {
            // Suggestion: Link to the geminiService from Pro lab if needed
            // For now, we'll simulate or placeholder this
            setTimeout(() => {
                setAnalysisResult({
                    trend: allData[currentIndex].close > allData[Math.max(0, currentIndex - 10)].close ? 'BULLISH' : 'BEARISH',
                    summary: "Market structure shows localized momentum. Price is testing key levels."
                });
                setIsAnalyzing(false);
            }, 1500);
        } catch (e) {
            setIsAnalyzing(false);
        }
    };

    const handleCoordinatesChange = useCallback((c: any, s: any) => {
        chartRef.current = c;
        candlestickSeriesRef.current = s;
        setTick(t => t + 1);
    }, []);

    // Tool keyboard shortcuts mapping
    const toolShortcuts: Record<string, ToolType> = {
        'KeyV': 'cursor',
        'KeyT': 'trendline',
        'KeyR': 'ray',
        'KeyA': 'arrow',
        'KeyH': 'horizontal',
        'KeyN': 'vertical',
        'KeyB': 'rect',
        'KeyL': 'long',
        'KeyS': 'short',
        'KeyF': 'fib',
        'KeyC': 'channel',
        'KeyX': 'text',
    };

    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.code === 'Space') {
                e.preventDefault(); // Prevent page scroll
                centerChart();
            }

            // Tool shortcuts (only when not pressing Ctrl/Cmd)
            if (!e.ctrlKey && !e.metaKey) {
                const tool = toolShortcuts[e.code];
                if (tool) {
                    e.preventDefault();
                    setActiveTool(tool);
                    addToast({ type: 'info', title: 'Tool Selected', message: tool.charAt(0).toUpperCase() + tool.slice(1), duration: 1000 });
                }
            }

            // Toggle magnet mode with M
            if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setMagnetMode(!magnetMode);
                addToast({ type: 'info', title: 'Magnet Mode', message: magnetMode ? 'Disabled' : 'Enabled', duration: 1000 });
            }

            // Toggle lock with L (when not drawing)
            if (e.code === 'KeyL' && !e.ctrlKey && !e.metaKey && e.shiftKey) {
                e.preventDefault();
                setIsLocked(!isLocked);
                addToast({ type: 'info', title: 'Drawings', message: isLocked ? 'Unlocked' : 'Locked', duration: 1000 });
            }

            // Undo/Redo with Ctrl/Cmd
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
                e.preventDefault();
                handleUndo();
            }
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
                e.preventDefault();
                handleRedo();
            }

            // Delete selected drawing
            if (e.code === 'Delete' || e.code === 'Backspace') {
                if (selectedDrawingId && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
                    e.preventDefault();
                    setDrawings(drawings.filter(d => d.id !== selectedDrawingId));
                    pushToHistory(drawings.filter(d => d.id !== selectedDrawingId));
                    setSelectedDrawingId(null);
                    addToast({ type: 'info', title: 'Deleted' });
                }
            }

            // Escape to deselect or exit modes
            if (e.code === 'Escape') {
                setSelectedDrawingId(null);
                setIsSelectBarMode(false);
                setActiveTool('cursor');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [centerChart, magnetMode, isLocked, selectedDrawingId, handleUndo, handleRedo, drawings, pushToHistory, addToast]);

    const visibleData = useMemo(() => allData.slice(0, currentIndex + 1), [allData, currentIndex]);

    return (
        <div className={`w-full h-full flex flex-col overflow-hidden font-sans ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-white text-slate-900'}`} onMouseUp={handleMouseUp}>
            <div className={`h-16 shrink-0 border-b flex items-center justify-between px-8 z-50 relative shadow-sm ${isDarkMode ? 'border-zinc-800 bg-[#09090b]/95 backdrop-blur-sm' : 'border-slate-200 bg-white/95 backdrop-blur-sm'}`}>
                <div className="flex items-center gap-5 w-72">
                    {!showWelcome ? (
                        <button
                            onClick={() => setShowWelcome(true)}
                            className={`p-2.5 rounded-2xl border transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-[#FF4F01] hover:border-[#FF4F01]/50' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-[#FF4F01] hover:border-[#FF4F01]/50'}`}
                            title="Back to Lab Menu"
                        >
                            <ArrowLeftToLine size={20} />
                        </button>
                    ) : (
                        <div className={`p-2.5 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-gradient-to-br from-[#FF4F01]/20 to-[#FF4F01]/5 border-[#FF4F01]/20 shadow-[#FF4F01]/10 text-[#FF4F01]' : 'bg-[#FF4F01]/5 border-[#FF4F01]/20 shadow-[#FF4F01]/5 text-[#FF4F01]'}`}>
                            <Zap size={20} fill="currentColor" />
                        </div>
                    )}
                    <div className="flex flex-col justify-center">
                        <h2 className={`text-base font-black uppercase tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Backtest Lab</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <p className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Pro Canvas Engine</p>
                        </div>
                    </div>
                </div>

                <div className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-2xl border shadow-xl ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800 shadow-black/20' : 'bg-slate-50 border-slate-200 shadow-slate-200/50'}`}>
                    <div className={`flex items-center rounded-xl border px-2 relative ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-2 px-1">
                            <div className="relative group/status">
                                <div className={`w-2 h-2 rounded-full shadow-sm ${bridgeStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-zinc-800 text-[8px] font-black uppercase tracking-widest text-white whitespace-nowrap opacity-0 group-hover/status:opacity-100 transition-opacity border border-white/5`}>
                                    Bridge: {bridgeStatus}
                                </div>
                            </div>
                            <Search size={14} className="text-zinc-500 ml-1" />
                            <input
                                id="backtest-symbol-input"
                                name="symbol"
                                aria-label="Enter trading symbol for backtesting"
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
                                    {POPULAR_SYMBOLS.filter(s => s.includes(symbol) || symbol === '').map(s => (
                                        <button key={s} onClick={() => { setSymbol(s); setIsSymbolMenuOpen(false); handleFetchMT5Data(s); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left ${symbol === s ? 'bg-[#FF4F01] text-white' : (isDarkMode ? 'text-zinc-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}`}>
                                            <span className="text-xs font-black">{s}</span>
                                            {symbol === s && <Check size={14} />}
                                        </button>
                                    ))}
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
                                            <button key={tf} onClick={() => { setTimeframe(tf); setIsTFMenuOpen(false); handleFetchMT5Data(undefined, tf); }} className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left ${timeframe === tf ? 'bg-[#FF4F01] text-white' : (isDarkMode ? 'text-zinc-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}`}>
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
                    </div>

                    <button onClick={() => handleFetchMT5Data()} disabled={isFetching} className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest ${isFetching ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-gradient-to-r from-[#FF4F01] to-[#ff7e42] text-white active:scale-95 shadow-lg shadow-[#FF4F01]/25'}`}>
                        {isFetching ? 'Syncing...' : 'Sync'}
                    </button>
                </div>

                <div className="flex items-center gap-6 w-72 justify-end">
                    {allData.length > 0 && (
                        <div className="flex flex-col w-full">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Replay Progress</span>
                                <span className={`text-[10px] font-mono font-bold ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                                    {currentIndex + 1} / {allData.length} Bars
                                </span>
                            </div>
                            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                                    style={{ width: `${Math.min(100, ((currentIndex + 1) / allData.length) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={`flex-1 flex relative overflow-hidden min-h-0 group ${isDarkMode ? 'bg-black' : 'bg-slate-50'}`}>
                <DrawingToolbar
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    clearDrawings={clearDrawings}
                    magnetMode={magnetMode}
                    toggleMagnetMode={() => setMagnetMode(!magnetMode)}
                    isSticky={isSticky}
                    toggleSticky={() => setIsSticky(!isSticky)}
                    isLocked={isLocked}
                    toggleLocked={() => setIsLocked(!isLocked)}
                    orientation={toolbarOrientation}
                    toggleOrientation={() => setToolbarOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
                    isDarkMode={isDarkMode}
                    style={{ left: `${toolbarPos.x}px`, top: `${toolbarPos.y}px` }}
                    onPositionChange={setToolbarPos}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={historyPointer > 0}
                    canRedo={historyPointer < historyStates.length - 1}
                    currentColor={currentColor}
                    setCurrentColor={setCurrentColor}
                />
                <div
                    ref={chartContainerRef}
                    className="relative flex-1 w-full h-full min-w-0 outline-none"
                    onContextMenu={handleContextMenuInternal}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    <ChartErrorBoundary>
                        <CustomChart
                            data={visibleData}
                            trades={history as any}
                            drawings={drawings}
                            isDarkMode={isDarkMode}
                            isSelectBarMode={isSelectBarMode}
                            onSelectBar={(idx) => { setCurrentIdx(idx); setIsSelectBarMode(false); }}
                            onCoordinatesChange={handleCoordinatesChange}
                            onMouseUpdate={(x, y) => setMousePos({ x, y })}
                            onViewStateChange={setChartViewState}
                            initialViewState={chartViewState}
                            disablePan={activeTool !== 'cursor'}
                        >
                            <DrawingLayer drawings={drawings} currentDrawing={currentDrawing} selectedDrawingId={selectedDrawingId} hoveredDrawingId={hoveredDrawingId} mousePos={mousePos} chart={chartRef.current} series={candlestickSeriesRef.current} containerWidth={dimensions.width} containerHeight={dimensions.height} activeTool={activeTool} isSelectBarMode={isSelectBarMode} onMouseDownHandle={handleMouseDownHandle} onSelectDrawing={setSelectedDrawingId} onHoverDrawing={setHoveredDrawingId} onDoubleClickDrawing={setEditingDrawingSettings} onContextMenuDrawing={handleContextMenuDrawing} tick={tick} isLocked={isLocked} isDarkMode={isDarkMode} />
                        </CustomChart>
                    </ChartErrorBoundary>

                    <AnimatePresence>
                        {showWelcome && (
                            <motion.div
                                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                                animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="absolute inset-0 flex items-center justify-center z-[60] p-8 bg-black/40"
                            >
                                <motion.div
                                    initial={{ scale: 0.95, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.95, y: 20 }}
                                    transition={{ duration: 0.4, delay: 0.1 }}
                                    className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-6xl"
                                >
                                    {/* Option 1: Live Sync */}
                                    <div
                                        onClick={() => handleFetchMT5Data()}
                                        className={`p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-6 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'bg-white border-slate-200 hover:border-emerald-500/50'}`}
                                    >
                                        <div className={`p-6 rounded-2xl border-2 border-dashed transition-all group-hover:rotate-12 ${isDarkMode ? 'bg-black border-zinc-800 group-hover:border-emerald-500 group-hover:text-emerald-500 text-zinc-600' : 'bg-slate-50 border-slate-200 group-hover:border-emerald-500 group-hover:text-emerald-500 text-slate-400'}`}>
                                            <RefreshCw size={48} className={isFetching ? 'animate-spin' : ''} />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h3 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Live MT5 Sync</h3>
                                            <p className={`text-xs font-bold uppercase tracking-widest leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Requires JournalFX Bridge to be running<br />Connects directly to your MT5 Terminal</p>
                                        </div>
                                        <div className={`px-6 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:text-emerald-400' : 'bg-white border-slate-200 text-slate-500 group-hover:text-emerald-600'}`}>
                                            {isFetching ? 'Connecting...' : 'Start Sync'}
                                        </div>
                                    </div>

                                    {/* Option 2: Manual Upload */}
                                    <label htmlFor="backtest-file-upload" className={`p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-6 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800 hover:border-[#FF4F01]/50 hover:bg-[#FF4F01]/5' : 'bg-white border-slate-200 hover:border-[#FF4F01]/50'}`}>
                                        <input
                                            id="backtest-file-upload"
                                            name="backtest-data-file"
                                            type="file"
                                            accept=".json"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <div className={`p-6 rounded-2xl border-2 border-dashed transition-all group-hover:-rotate-12 ${isDarkMode ? 'bg-black border-zinc-800 group-hover:border-[#FF4F01] group-hover:text-[#FF4F01] text-zinc-600' : 'bg-slate-50 border-slate-200 group-hover:border-[#FF4F01] group-hover:text-[#FF4F01] text-slate-400'}`}>
                                            <FileUp size={48} />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h3 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Import JSON File</h3>
                                            <p className={`text-xs font-bold uppercase tracking-widest leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Upload an MT5 Export JSON<br />Array of OHLC objects</p>
                                        </div>
                                        <div className={`px-6 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:text-[#FF4F01]' : 'bg-white border-slate-200 text-slate-500 group-hover:text-[#FF4F01]'}`}>
                                            Browse Files
                                        </div>
                                    </label>

                                    {/* Option 3: Recent Sessions */}
                                    <div
                                        className={`p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-start gap-6 transition-all group overflow-hidden ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800 hover:border-purple-500/50 hover:bg-purple-500/5' : 'bg-white border-slate-200 hover:border-purple-500/50'}`}
                                    >
                                        <div className="flex flex-col items-center gap-4 w-full h-full">
                                            <div className={`p-6 rounded-2xl border-2 border-dashed transition-all group-hover:scale-110 ${isDarkMode ? 'bg-black border-zinc-800 group-hover:border-purple-500 group-hover:text-purple-500 text-zinc-600' : 'bg-slate-50 border-slate-200 group-hover:border-purple-500 group-hover:text-purple-500 text-slate-400'}`}>
                                                <Database size={48} />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <h3 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recent Sessions</h3>
                                                <p className={`text-xs font-bold uppercase tracking-widest leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Continue where you left off<br />Saved to your JFX Cloud</p>
                                            </div>

                                            <div className="flex-1 w-full space-y-2 mt-2 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                                                {isLoadingSessions ? (
                                                    <div className="flex items-center justify-center py-10">
                                                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                ) : savedSessions.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center">
                                                        <Database size={24} className="mb-2" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">No Cloud Data</p>
                                                    </div>
                                                ) : (
                                                    savedSessions.slice(0, 1).map((sess) => (
                                                        <button
                                                            key={sess.id}
                                                            onClick={() => handleLoadSession(sess)}
                                                            className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all group/item ${isDarkMode ? 'bg-black/40 border-zinc-800 hover:border-emerald-500/30 hover:bg-emerald-500/5' : 'bg-white border-slate-200 hover:border-emerald-500/30 hover:bg-emerald-50/50'}`}
                                                        >
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>{sess.symbol}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-1.5 py-0.5 rounded bg-zinc-500/10 text-[8px] font-bold text-zinc-500 uppercase">{sess.timeframe}</span>
                                                                    <span className="text-[8px] font-bold text-zinc-500 uppercase">{new Date(sess.updated_at).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover/item:opacity-40 transition-opacity">Quick Load</span>
                                                                <ChevronRight size={16} className="text-zinc-600 group-hover/item:translate-x-1 transition-transform" />
                                                            </div>
                                                        </button>
                                                    ))
                                                )}

                                            </div>

                                            {savedSessions.length > 0 && (
                                                <button
                                                    onClick={() => setIsSettingsOpen(true)}
                                                    className={`w-full py-3 rounded-xl border border-dashed text-[9px] font-black uppercase tracking-[0.2em] transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900'
                                                        }`}
                                                >
                                                    View All ({savedSessions.length})
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {isImporting && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
                            >
                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 border-2 border-dashed border-zinc-800 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <FileUp size={32} className="text-[#FF4F01] animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-xl font-black uppercase tracking-tight text-white">Importing Data</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                {[0, 1, 2].map(i => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                                        className="w-1.5 h-1.5 rounded-full bg-[#FF4F01]"
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Processing JSON structures</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {analysisResult && (
                        <div className={`absolute top-4 right-4 w-64 p-4 rounded-xl border backdrop-blur-md shadow-2xl z-20 ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-slate-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Brain size={14} className="text-purple-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">AI Analysis</span>
                                </div>
                                <button onClick={() => setAnalysisResult(null)} className="text-zinc-500 hover:text-white"><X size={12} /></button>
                            </div>
                            <div className={`text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block ${analysisResult.trend === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{analysisResult.trend}</div>
                            <p className="text-[11px] leading-relaxed opacity-80 italic">"{analysisResult.summary}"</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={`h-16 shrink-0 border-t flex items-center px-8 justify-between relative z-20 ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                    {/* Buy/Sell buttons removed */}
                </div>
                <div className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-2xl border backdrop-blur shadow-2xl ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-slate-50/80 border-slate-200'}`}>
                    <button onClick={() => setIsSelectBarMode(!isSelectBarMode)} className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest ${isSelectBarMode ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : (isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 border border-transparent' : 'hover:bg-slate-200 text-slate-500 border border-transparent')}`}><ArrowLeftToLine size={16} /> Select bar</button>
                    <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                    <button onClick={centerChart} disabled={allData.length === 0} className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest ${allData.length === 0 ? 'opacity-30 cursor-not-allowed' : (isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 border border-transparent' : 'hover:bg-slate-200 text-slate-500 border border-transparent')}`}><Search size={16} /> Find Chart</button>
                    <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                    <button onClick={resetReplay} className={`p-2.5 rounded-xl ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-200 text-slate-500'}`}><RotateCcw size={18} /></button>
                    <button onClick={() => setIsPlaying(!isPlaying)} disabled={isFetching || allData.length === 0} className={`w-10 h-10 flex items-center justify-center rounded-xl bg-[#FF4F01] text-white shadow-lg shadow-[#FF4F01]/30`}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
                    <button onClick={stepForward} disabled={isFetching || allData.length === 0} className={`p-2.5 rounded-xl ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-200 text-slate-500'}`}><StepForward size={18} /></button>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSettingsOpen(true)} disabled={allData.length === 0} title="Settings" className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-blue-500' : 'hover:bg-blue-50 text-blue-600'}`}>
                        <Settings size={20} />
                    </button>
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
                </div>
            </div>

            {isSettingsOpen && (
                <div className="fixed inset-0 z-[400] flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setIsSettingsOpen(false)} />
                    <div className={`relative w-full max-w-sm h-full shadow-2xl border-l flex flex-col animate-in slide-in-from-right duration-300 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-slate-200'}`}>
                        {/* Drawer Header */}
                        <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#FF4F01]/10 text-[#FF4F01] rounded-xl">
                                    <Settings size={20} />
                                </div>
                                <div>
                                    <h3 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Lab Settings</h3>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Configure your backtest environment</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-black/5 text-slate-500'}`}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {/* Backtest Lab Config */}
                            <div className={`p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-2 mb-5">
                                    <Zap size={16} className="text-[#FF4F01]" />
                                    <h4 className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Lab Configuration</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-3">
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>Auto-Follow Price</p>
                                            <p className="text-[8px] font-bold opacity-40 uppercase">Keep latest bar centered</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const next = !isAutoFollow;
                                                setIsAutoFollow(next);
                                                if (next && chartRef.current) {
                                                    chartRef.current.timeScale().scrollToRealtime();
                                                }
                                            }}
                                            className={`w-10 h-5 rounded-full relative transition-all ${isAutoFollow ? 'bg-[#FF4F01]' : 'bg-zinc-800'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoFollow ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Save & Export */}
                            <div className={`p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-2 mb-5">
                                    <Download size={16} className="text-blue-500" />
                                    <h4 className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Data Persistence</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { handleDownloadData(); }}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all group ${isDarkMode ? 'bg-black/20 border-zinc-800 hover:border-blue-500/50 hover:bg-blue-500/5' : 'bg-white border-slate-200 hover:border-blue-500/50 hover:bg-blue-50/50'}`}
                                    >
                                        <Download size={20} className="text-blue-500 transition-transform group-hover:-translate-y-1" />
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Local PC</span>
                                    </button>
                                    <button
                                        onClick={() => { handleSaveToCloud(); }}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all group ${isDarkMode ? 'bg-black/20 border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'bg-white border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/50'}`}
                                    >
                                        <RefreshCw size={20} className="text-emerald-500 transition-transform group-hover:rotate-180 duration-500" />
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Cloud Sync</span>
                                    </button>
                                </div>
                            </div>

                            {/* Saved Sessions */}
                            <div className={`p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-2 mb-5">
                                    <Database size={16} className="text-purple-500" />
                                    <h4 className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Recent Sessions</h4>
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                    {isLoadingSessions ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="w-5 h-5 border-2 border-[#FF4F01] border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : savedSessions.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed border-zinc-800/50 rounded-xl">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">No saved sessions</p>
                                        </div>
                                    ) : (
                                        savedSessions.map((sess) => (
                                            <div
                                                key={sess.id}
                                                onClick={() => handleLoadSession(sess)}
                                                className={`w-full group relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isDarkMode ? 'bg-black/20 border-zinc-800 hover:border-emerald-500/30 hover:bg-emerald-500/5' : 'bg-white border-slate-200 hover:border-emerald-500/30 hover:bg-emerald-50/50'}`}
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className={`text-xs font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sess.symbol}</span>
                                                    <span className="text-[8px] text-zinc-500 uppercase font-black">{sess.timeframe} • {new Date(sess.updated_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => handleDeleteSession(e, sess.id)}
                                                        className="p-2 rounded-lg hover:bg-rose-500/10 text-zinc-600 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                    <ChevronRight size={14} className="text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className={`p-6 border-t ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/50 border-slate-100'}`}>
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="w-full py-4 bg-[#FF4F01] hover:bg-[#e64601] text-white rounded-2xl font-black text-xs shadow-xl shadow-[#FF4F01]/20 uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                CLOSE DRAWER
                            </button>
                        </div>
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
                            <div>
                                <label htmlFor="drawing-thickness-input" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Thickness: {editingDrawingSettings.strokeWidth || 2}px</label>
                                <input
                                    id="drawing-thickness-input"
                                    name="thickness"
                                    type="range"
                                    min="1"
                                    max="8"
                                    value={editingDrawingSettings.strokeWidth || 2}
                                    onChange={(e) => updateDrawingProperty(editingDrawingSettings.id, { strokeWidth: parseInt(e.target.value) })}
                                    className="w-full accent-[#FF4F01]"
                                />
                            </div>
                            <div><label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Line Style</label><div className="flex gap-2">{['solid', 'dashed', 'dotted'].map(s => <button key={s} onClick={() => updateDrawingProperty(editingDrawingSettings.id, { strokeStyle: s as any })} className={`flex-1 py-2 rounded-lg border text-[10px] font-bold uppercase ${editingDrawingSettings.strokeStyle === s || (!editingDrawingSettings.strokeStyle && s === 'solid') ? 'bg-[#FF4F01] text-white' : 'bg-zinc-800 text-zinc-400'}`}>{s}</button>)}</div></div>
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
                                <button onClick={() => { updateDrawingProperty(contextMenu.drawing.id, { isLocked: !contextMenu.drawing.isLocked }); setContextMenu(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-left ${isDarkMode ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-slate-50 text-slate-600'}`}>{contextMenu.drawing.isLocked ? <Unlock size={14} /> : <Lock size={14} />} {contextMenu.drawing.isLocked ? 'Unlock' : 'Lock'}</button>
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