import React, { useState, useEffect } from 'react';
import {
    Download, Copy, Check, Info, AlertCircle,
    Terminal, Shield, Cpu, ArrowRight, Loader2,
    Play, Command, Code, Zap, Globe,
    Power, ExternalLink, Activity, Clock, PlusCircle, CheckCircle2,
    Settings, LayoutDashboard, ChevronDown
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { UserProfile, Trade } from '../types';
import OpenPositions from './OpenPositions';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getSASTDateTime } from '../lib/timeUtils';

interface BridgeProps {
    isDarkMode: boolean;
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => Promise<void>;
    eaSession?: any;
    onTradeAdded?: (trade: Trade) => void;
    onEditTrade?: (trade: Trade) => void;
}

const Bridge: React.FC<BridgeProps> = ({ isDarkMode, userProfile, onUpdateProfile, eaSession, onTradeAdded, onEditTrade }) => {
    const [isInternalConnected, setIsInternalConnected] = useState(userProfile.eaConnected);
    const [syncKey, setSyncKey] = useState(userProfile.syncKey || '');
    const [liveData, setLiveData] = useState<any>(eaSession?.data || null);
    const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(eaSession?.last_updated ? new Date(eaSession.last_updated) : null);
    const [syncLog, setSyncLog] = useState<{ time: Date; message: string; type: 'success' | 'info' | 'error' }[]>([]);

    // Sync internal connection state with profile
    useEffect(() => {
        setIsInternalConnected(userProfile.eaConnected);
    }, [userProfile.eaConnected]);

    // Update live data from prop
    useEffect(() => {
        if (eaSession?.data) {
            setLiveData(eaSession.data);
            setLastHeartbeat(new Date(eaSession.last_updated));

            // Add entry to log if it's a new update
            const isHeartbeat = eaSession.data.isHeartbeat;
            const tradeCount = eaSession.data.trades?.length || 0;
            const msg = isHeartbeat ? 'Heartbeat received' : `Synced ${tradeCount} trades from terminal`;

            setSyncLog(prev => [
                { time: new Date(), message: msg, type: 'success' } as const,
                ...prev
            ].slice(0, 5));
        }
    }, [eaSession]);

    if (isInternalConnected) {
        return (
            <BridgeMonitor
                isDarkMode={isDarkMode}
                userProfile={userProfile}
                liveData={liveData}
                lastHeartbeat={lastHeartbeat}
                syncKey={syncKey}
                syncLog={syncLog}
                onDisconnect={async () => {
                    const updated = { ...userProfile, eaConnected: false };
                    await onUpdateProfile(updated);
                    setIsInternalConnected(false);
                }}
                onTradeAdded={onTradeAdded}
                onEditTrade={onEditTrade}
            />
        );
    }

    return (
        <BridgeWizard
            isDarkMode={isDarkMode}
            userProfile={userProfile}
            onUpdateProfile={onUpdateProfile}
            onComplete={async (key) => {
                const updated = { ...userProfile, syncKey: key, eaConnected: true };
                await onUpdateProfile(updated);
                setSyncKey(key);
                setIsInternalConnected(true);
            }}
        />
    );
};

/* --- SUB-COMPONENT: BRIDGE MONITOR (The "Connected" Page) --- */
const BridgeMonitor = ({ isDarkMode, userProfile, liveData, lastHeartbeat, syncKey, syncLog, onDisconnect, onTradeAdded, onEditTrade }: any) => {
    const [activeTab, setActiveTab] = useState<'monitor' | 'settings'>('monitor');
    const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
    const [autoLog, setAutoLog] = useLocalStorage('bridge_auto_log', false);
    const [now, setNow] = useState(new Date());
    const [savedTrades, setSavedTrades] = useState<Trade[]>([]);
    const [isSavingTrade, setIsSavingTrade] = useState<string | null>(null); // Track specific trade being saved
    const [copied, setCopied] = useState(false);

    const cardBg = isDarkMode ? 'bg-[#111] border-zinc-800' : 'bg-white border-zinc-100 shadow-sm';
    const subTextColor = isDarkMode ? 'text-zinc-500' : 'text-[#666666]';
    const backendUrl = `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/sync-trades`;
    const apiKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Update 'now' every second to make the timeAgo counter live
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Load saved trades to compare
    useEffect(() => {
        const loadSavedTrades = async () => {
            try {
                const trades = await dataService.getTrades();
                setSavedTrades(trades);
            } catch (err) {
                console.error("Failed to load saved trades:", err);
            }
        };
        loadSavedTrades();
    }, [liveData]); // Reload when live data updates to reflect new saves

    const timeAgo = lastHeartbeat ? Math.floor((now.getTime() - lastHeartbeat.getTime()) / 1000) : null;
    const isOnline = timeAgo !== null && timeAgo < 15; // 15s threshold for 'offline'

    // Filter "Pending" trades (from bridge but not in DB)
    // Only show "Exit" deals (entry=1 or 2) as candidates for Journal
    const incomingTrades = (liveData?.trades || []).filter((t: any) => t.entry === 1 || t.entry === 2);
    const pendingTrades = incomingTrades.filter((t: any) => !savedTrades.some(st => st.ticketId === String(t.ticket)));

    // Auto-Log Logic
    useEffect(() => {
        if (autoLog && pendingTrades.length > 0 && isSavingTrade === null) {
            const autoSave = async () => {
                for (const trade of pendingTrades) {
                    await handleAddTrade(trade);
                }
            };
            autoSave();
        }
    }, [pendingTrades, autoLog]);


    const handleAddTrade = async (mt5Trade: any) => {
        setIsSavingTrade(String(mt5Trade.ticket));
        try {
            // MT5 deal.profit does NOT include swap or commission. 
            // For a perfect journal, we need the Net PnL.
            const netPnL = Number((mt5Trade.profit + (mt5Trade.swap || 0) + (mt5Trade.commission || 0)).toFixed(2));

            const tradeDate = new Date(mt5Trade.time * 1000);
            const entryDate = new Date(mt5Trade.entry_time * 1000);
            const sast = getSASTDateTime(tradeDate);
            const sastEntry = getSASTDateTime(entryDate);

            const newTrade: Trade = {
                id: '', // Generated by DB
                ticketId: String(mt5Trade.ticket),
                pair: mt5Trade.symbol,
                assetType: 'Forex',
                date: sast.date,
                time: sast.fullTime, // Use full time for accuracy
                openTime: entryDate.toISOString(),
                closeTime: tradeDate.toISOString(),
                session: 'New York',
                direction: mt5Trade.type === 'BUY' ? 'Long' : 'Short',
                entryPrice: mt5Trade.entry_price || mt5Trade.price,
                exitPrice: mt5Trade.price,
                stopLoss: 0,
                takeProfit: 0,
                lots: mt5Trade.volume,
                result: netPnL >= 0 ? 'Win' : 'Loss',
                pnl: netPnL,
                rr: 0,
                rating: 0,
                tags: ['MT5_Sync'],
                notes: `Synced from MT5. Deal #${mt5Trade.ticket} | Order #${mt5Trade.order}`,
                planAdherence: 'No Plan'
            };

            if (!autoLog && onEditTrade) {
                onEditTrade(newTrade);
                return;
            }

            const saved = await dataService.addTrade(newTrade);
            setSavedTrades(prev => [saved, ...prev]);

            // Notify global state
            if (onTradeAdded) {
                onTradeAdded(saved);
            }
        } catch (error) {
            console.error("Failed to add trade:", error);
        } finally {
            setIsSavingTrade(null);
        }
    };

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar">
            <div className="animate-in fade-in duration-500 max-w-6xl w-full mx-auto p-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-black tracking-tight">Desktop Bridge</h1>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${isOnline ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                {isOnline ? 'Active' : 'Offline'}
                            </div>
                        </div>
                        <p className={subTextColor}>Real-time connection to your MetaTrader terminal.</p>
                    </div>

                    <div className={`p-1 rounded-xl flex items-center border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                        <button
                            onClick={() => setActiveTab('monitor')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'monitor'
                                ? (isDarkMode ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-black shadow-sm')
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            <LayoutDashboard size={16} /> Monitor
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'settings'
                                ? (isDarkMode ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-black shadow-sm')
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            <Settings size={16} /> Settings
                        </button>
                    </div>
                </div>

                {activeTab === 'monitor' ? (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">

                        {/* Primary Metrics Strip (Immediate Visibility) */}
                        <div className={`p-6 rounded-[32px] border-2 flex flex-wrap items-center justify-between gap-8 ${cardBg}`}>
                            <div className="flex items-center gap-8">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Total Equity</div>
                                    <div className="text-3xl font-mono font-black text-[#FF4F01]">
                                        {userProfile.currencySymbol}{liveData?.account?.equity?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-zinc-500/10 hidden md:block" />
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Floating P/L</div>
                                    <div className={`text-xl font-mono font-black ${liveData?.account?.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {liveData?.account?.profit >= 0 ? '+' : ''}{userProfile.currencySymbol}{liveData?.account?.profit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-zinc-500/10 hidden md:block" />
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Open Trades</div>
                                    <div className="text-xl font-mono font-black text-indigo-500">
                                        {liveData?.openPositions?.length || 0}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${showTechnicalDetails ? 'bg-zinc-800 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-500/10'}`}
                            >
                                <Cpu size={14} /> {showTechnicalDetails ? 'Hide Details' : 'Account Details'}
                                <ChevronDown size={14} className={`transition-transform duration-300 ${showTechnicalDetails ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Collapsible Technical Details */}
                        {showTechnicalDetails && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
                                <div className={`p-6 rounded-[24px] border-2 ${cardBg}`}>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Broker & Identity</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold opacity-60">Company:</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black">{liveData?.account?.company || '---'}</span>
                                                {liveData?.account?.is_demo !== undefined && (
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${liveData.account.is_demo ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                                        {liveData.account.is_demo ? 'Demo' : 'Real'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold opacity-60">Login ID:</span>
                                            <span className="text-xs font-mono font-bold">{liveData?.account?.login || '---'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold opacity-60">Server:</span>
                                            <span className="text-xs font-bold truncate max-w-[150px]">{liveData?.account?.server || '---'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-6 rounded-[24px] border-2 ${cardBg}`}>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Margin & Risk</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold opacity-60">Balance:</span>
                                            <span className="text-xs font-bold">{userProfile.currencySymbol}{liveData?.account?.balance?.toLocaleString() || '---'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold opacity-60">Used Margin:</span>
                                            <span className="text-xs font-bold">{userProfile.currencySymbol}{liveData?.account?.margin?.toLocaleString() || '---'}</span>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold opacity-60">Margin Level:</span>
                                                <span className={`text-xs font-black ${liveData?.account?.margin_level > 200 ? 'text-emerald-500' : liveData?.account?.margin_level > 100 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                    {liveData?.account?.margin_level?.toFixed(2) || '0.00'}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-500/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${liveData?.account?.margin_level > 200 ? 'bg-emerald-500' :
                                                        liveData?.account?.margin_level > 100 ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`}
                                                    style={{ width: `${Math.min(100, (liveData?.account?.margin_level || 0) / 5)}%` }} // Visual scaling
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Content: Live Positions */}
                            <div className={`lg:col-span-2 p-6 rounded-[24px] border-2 min-h-[400px] flex flex-col ${cardBg}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Activity size={18} className="text-emerald-500" /> Live Positions
                                    </h3>
                                    <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                        MT5 Terminal Active
                                    </div>
                                </div>
                                <div className="flex-1 -mx-2 px-2">
                                    <OpenPositions
                                        positions={(liveData?.openPositions || []).map((p: any) => ({
                                            ...p,
                                            lots: p.volume,
                                            openTime: p.time ? new Date(p.time * 1000).toISOString() : '',
                                            openPrice: p.open_price,
                                            currentPrice: p.current_price,
                                            profit: p.profit
                                        }))}
                                        isDarkMode={isDarkMode}
                                        currencySymbol={userProfile.currencySymbol}
                                        lastUpdated={lastHeartbeat?.toISOString()}
                                    />
                                </div>
                            </div>

                            {/* Sidebar Column: Pending Trades & Logs */}
                            <div className="space-y-6">
                                {/* Pending Trades */}
                                <div className={`p-6 rounded-[24px] border-2 ${cardBg}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Download size={16} className="text-indigo-500" />
                                            <h3 className="font-bold text-sm">Pending Journal</h3>
                                        </div>
                                        {pendingTrades.length > 0 && (
                                            <button
                                                onClick={async () => {
                                                    setIsSavingTrade('bulk_all');
                                                    try {
                                                        for (const trade of pendingTrades) {
                                                            await handleAddTrade(trade);
                                                        }
                                                    } catch (err) {
                                                        console.error("Bulk save error:", err);
                                                    } finally {
                                                        setIsSavingTrade(null);
                                                    }
                                                }}
                                                disabled={isSavingTrade !== null}
                                                className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 hover:underline disabled:opacity-50"
                                            >
                                                {isSavingTrade === 'bulk_all' ? 'Saving...' : 'Add All'}
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                                        {pendingTrades.length > 0 ? (
                                            pendingTrades.map((trade: any) => {
                                                const pipSize = trade.symbol.includes('JPY') ? 0.01 : 0.0001;
                                                const pipMovement = trade.entry_price ? (trade.type === 'BUY' ? trade.price - trade.entry_price : trade.entry_price - trade.price) / pipSize : 0;
                                                return (
                                                    <div key={trade.ticket} className="p-3 rounded-xl border border-dashed border-zinc-500/20 hover:border-indigo-500/50 transition-colors">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-xs">{trade.symbol}</span>
                                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                                    {trade.type}
                                                                </span>
                                                            </div>
                                                            <div className={`text-xs font-black font-mono ${trade.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="text-[10px] opacity-50 font-mono">
                                                                #{trade.ticket} • {trade.volume} Lots
                                                            </div>
                                                            <div className={`text-[10px] font-mono ${pipMovement >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {pipMovement >= 0 ? '+' : ''}{pipMovement.toFixed(2)} pip
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div></div>
                                                            {savedTrades.some(st => st.ticketId === String(trade.ticket)) ? (
                                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleAddTrade(trade)}
                                                                    disabled={isSavingTrade !== null}
                                                                    className="text-[10px] font-bold text-indigo-500 hover:underline disabled:opacity-50"
                                                                >
                                                                    {isSavingTrade === String(trade.ticket) ? 'Saving...' : 'Add'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-8 opacity-40 text-xs font-medium border-2 border-dashed border-zinc-500/10 rounded-xl">
                                                No new trades detected
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sync Feed (Scrollable Feed) */}
                                <div className={`p-6 rounded-[24px] border-2 ${cardBg} max-h-[300px] flex flex-col`}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Clock size={16} className="text-amber-500" />
                                        <h3 className="font-bold text-sm">Sync Feed</h3>
                                    </div>
                                    <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
                                        {syncLog?.length > 0 ? (
                                            syncLog.map((log: any, i: number) => (
                                                <div key={i} className="flex items-start gap-3 text-[11px] font-mono leading-tight">
                                                    <div className="opacity-30 whitespace-nowrap">{log.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${log.type === 'success' ? 'bg-emerald-500' :
                                                        log.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
                                                        }`} />
                                                    <div className={`break-words ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{log.message}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs opacity-30 font-mono italic">Waiting for events...</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                        {/* Settings Tab Content */}

                        {/* Connection Diagnostic */}
                        <div className={`p-8 rounded-[32px] border-2 ${cardBg} relative overflow-hidden`}>
                            <div className="flex flex-col md:flex-row items-start justify-between relative z-10 gap-8">
                                <div className="space-y-6 flex-1">
                                    <div>
                                        <h3 className="text-xl font-black mb-2">Connection Diagnostics</h3>
                                        <p className="text-sm opacity-60 max-w-md">Technical details about your current bridge session. Keep the Python terminal window open.</p>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <div className="px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-dashed border-zinc-500/30">
                                            <div className="text-[9px] font-black uppercase tracking-tighter opacity-40 mb-1">Last Heartbeat</div>
                                            <div className="text-sm font-mono font-bold">
                                                {lastHeartbeat ? lastHeartbeat.toLocaleTimeString() : 'Never'}
                                                <span className="ml-2 text-[10px] opacity-40">({timeAgo}s ago)</span>
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-dashed border-zinc-500/30">
                                            <div className="text-[9px] font-black uppercase tracking-tighter opacity-40 mb-1">Session ID</div>
                                            <div className="text-sm font-mono font-bold opacity-60">
                                                {syncKey.substring(0, 8)}...
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`hidden md:flex w-32 h-32 rounded-full border-8 ${isOnline ? 'border-emerald-500/30' : 'border-rose-500/30'} items-center justify-center relative transition-colors duration-500 shrink-0`}>
                                    {isOnline ? (
                                        <div className="relative flex items-center justify-center">
                                            <Activity size={40} className="text-emerald-500 animate-pulse" />
                                        </div>
                                    ) : (
                                        <Activity size={40} className="text-rose-500" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Configuration */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Workflow Settings */}
                            <div className={`p-6 rounded-[24px] border-2 ${cardBg}`}>
                                <h3 className="font-bold mb-4 flex items-center gap-2"><Zap size={18} className="text-amber-500" /> Automation</h3>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-sm">Auto-Log Trades</div>
                                        <div className="text-[10px] opacity-60 max-w-[200px] leading-tight mt-1">
                                            Automatically add closed trades to your journal without manual confirmation.
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAutoLog(!autoLog)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${autoLog ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${autoLog ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className={`p-6 rounded-[24px] border-2 ${cardBg}`}>
                                <h3 className="font-bold mb-4 flex items-center gap-2"><Shield size={18} /> Bridge Configuration</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Your Sync Key</label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 p-3 rounded-xl bg-black/5 dark:bg-white/5 font-mono text-sm font-bold tracking-wider text-[#FF4F01]">
                                                {syncKey}
                                            </div>
                                            <button
                                                onClick={() => handleCopy(syncKey)}
                                                className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}
                                            >
                                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Bridge Command</label>
                                        <div
                                            onClick={() => handleCopy(`python jfx_bridge.py --key ${syncKey} --url ${backendUrl} --apikey ${apiKey}`)}
                                            className="p-3 rounded-xl bg-black/5 dark:bg-white/5 font-mono text-[10px] break-all cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                        >
                                            <div className="opacity-50 mb-1"># Click to copy</div>
                                            python jfx_bridge.py --key {syncKey} --url ...
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-6 rounded-[24px] border-2 border-rose-500/20 bg-rose-500/5`}>
                                <h3 className="font-bold mb-4 flex items-center gap-2 text-rose-500"><AlertCircle size={18} /> Danger Zone</h3>
                                <p className="text-sm opacity-60 mb-6 leading-relaxed">
                                    Disconnecting the bridge will stop all real-time data streaming. You will need to re-run the setup wizard to reconnect.
                                </p>
                                <button
                                    onClick={onDisconnect}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                                >
                                    <Power size={18} /> Disconnect Bridge
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* --- SUB-COMPONENT: BRIDGE WIZARD (The Setup Steps) --- */
const BridgeWizard = ({ isDarkMode, onComplete, userProfile, onUpdateProfile }: any) => {
    const [step, setStep] = useState(0);
    const [syncKey, setSyncKey] = useState(userProfile.syncKey || '');
    const [copied, setCopied] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'success' | 'error'>('waiting');

    useEffect(() => {
        if (!syncKey) {
            const newKey = `JFX-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            setSyncKey(newKey);
            // Auto-save the key immediately so the bridge can connect
            if (onUpdateProfile) {
                onUpdateProfile({ ...userProfile, syncKey: newKey });
            }
        }
    }, []);

    useEffect(() => {
        if (step === 5 && connectionStatus === 'waiting' && syncKey) {
            const channel = supabase
                .channel('ea_session_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'ea_sessions',
                    filter: `sync_key=eq.${syncKey}`
                }, (payload) => {
                    setConnectionStatus('success');
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [step, connectionStatus, syncKey]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const cardBg = isDarkMode ? 'bg-[#111] border-zinc-800' : 'bg-white border-zinc-100 shadow-sm';
    const subTextColor = isDarkMode ? 'text-zinc-500' : 'text-[#666666]';
    const codeBg = isDarkMode ? 'bg-[#000] border-zinc-800' : 'bg-zinc-100 border-zinc-200';
    const backendUrl = `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/sync-trades`;
    const apiKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl w-full mx-auto p-8">
                <div className="mb-12">
                    <h1 className="text-5xl font-black tracking-tight mb-4 italic">Desktop Bridge</h1>
                    <div className="flex items-center gap-4">
                        <p className={`text-lg ${subTextColor}`}>Connect MT5 to JournalFX using our secure Python bridge.</p>
                        <div className="px-3 py-1 rounded bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                            Windows Only
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 space-y-3">
                        {[
                            { id: 0, label: 'Install Python', icon: Terminal },
                            { id: 1, label: 'Get Sync Key', icon: Shield },
                            { id: 2, label: 'Setup Libraries', icon: Command },
                            { id: 3, label: 'Download Bridge', icon: Download },
                            { id: 4, label: 'Run Script', icon: Play },
                            { id: 5, label: 'Live Connection', icon: Cpu },
                        ].map((s) => (
                            <div
                                key={s.id}
                                onClick={() => step >= s.id && setStep(s.id)}
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${step === s.id
                                    ? 'border-[#FF4F01] bg-[#FF4F01]/5 text-[#FF4F01]'
                                    : step > s.id ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' : `border-transparent opacity-40 ${subTextColor}`
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step === s.id ? 'bg-[#FF4F01] text-white' : step > s.id ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'
                                    }`}>
                                    {step > s.id ? <Check size={16} /> : <s.icon size={16} />}
                                </div>
                                <span className="font-bold text-xs uppercase tracking-widest">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-8">
                        <div className={`p-10 rounded-[32px] border-2 h-full flex flex-col min-h-[500px] ${cardBg}`}>

                            {step === 0 && (
                                <div className="animate-in fade-in duration-300">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-8">
                                        <Terminal size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4">Step 0: Install Python</h3>
                                    <p className={`mb-8 leading-relaxed ${subTextColor}`}>
                                        The bridge requires Python to be installed on your computer. If you already have it, you can skip to the next step.
                                    </p>
                                    <div className="space-y-4">
                                        <a href="https://www.python.org/downloads/windows/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all group">
                                            <div className="flex items-center gap-3">
                                                <Globe size={20} />
                                                <span className="font-bold">Download Python for Windows</span>
                                            </div>
                                            <ExternalLink size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                                            <Info className="text-amber-500 shrink-0" size={18} />
                                            <p className="text-xs text-amber-500/80 font-medium">
                                                IMPORTANT: During installation, check the box that says <b>"Add Python to PATH"</b> or the bridge won't run.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="animate-in fade-in duration-300">
                                    <div className="w-16 h-16 rounded-2xl bg-[#FF4F01]/10 text-[#FF4F01] flex items-center justify-center mb-8">
                                        <Shield size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4">Your Secure Sync Key</h3>
                                    <p className={`mb-8 leading-relaxed ${subTextColor}`}>
                                        This unique key identifies your account and allows the Python script to securely transmit your trading data.
                                    </p>
                                    <div className={`p-6 rounded-2xl border-2 border-dashed mb-8 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 block">Your Unique Sync Key</label>
                                        <div className="flex items-center gap-4 relative">
                                            <div className="flex-1 font-mono text-2xl font-black tracking-wider text-[#FF4F01]">
                                                {syncKey}
                                            </div>
                                            <button
                                                onClick={() => handleCopy(syncKey)}
                                                className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:scale-105'}`}
                                            >
                                                {copied ? <Check size={20} /> : <Copy size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-in fade-in duration-300">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-8">
                                        <Command size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4">Install Requirements</h3>
                                    <p className={`mb-8 leading-relaxed ${subTextColor}`}>
                                        Open your terminal or command prompt and run this command to install the bridge dependencies.
                                    </p>
                                    <div className={`p-4 rounded-xl border font-mono text-sm mb-6 flex items-center justify-between group ${codeBg}`}>
                                        <code className="text-[#FF4F01]">python -m pip install MetaTrader5 requests</code>
                                        <button
                                            onClick={() => handleCopy('python -m pip install MetaTrader5 requests')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${copied ? 'bg-emerald-500 text-white border-emerald-500' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
                                        >
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                            <span className="text-[10px] font-bold uppercase">Copy</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="animate-in fade-in duration-300">
                                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-8">
                                        <Download size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4">Download the Bridge</h3>
                                    <p className={`mb-8 leading-relaxed ${subTextColor}`}>
                                        Download the <b>Standalone App</b> for the easiest experience - no Python required! Just download, run, and connect.
                                    </p>
                                    {/* Primary: Standalone EXE */}
                                    <a
                                        href="/JournalFX_Bridge.exe"
                                        download="JournalFX_Bridge.exe"
                                        className="flex items-center justify-center gap-4 p-6 bg-[#FF4F01] text-white rounded-xl font-bold hover:bg-[#e64601] transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02] mb-6"
                                    >
                                        <LayoutDashboard size={28} />
                                        <div className="text-left">
                                            <div className="text-lg">Download Standalone App</div>
                                            <div className="text-xs opacity-70 font-normal">Windows • No Python Required • Recommended</div>
                                        </div>
                                    </a>

                                    {/* Secondary: Python Scripts */}
                                    <div className="pt-4 border-t border-zinc-500/10">
                                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${subTextColor}`}>
                                            For Developers (Python Required)
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <a
                                                href="/jfx_bridge_gui.py"
                                                download="jfx_bridge_gui.py"
                                                className="flex items-center justify-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                            >
                                                <Code size={16} />
                                                <span>GUI Script (.py)</span>
                                            </a>
                                            <a
                                                href="/jfx_bridge.py"
                                                download="jfx_bridge.py"
                                                className="flex items-center justify-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                            >
                                                <Terminal size={16} />
                                                <span>CLI Script (.py)</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="animate-in fade-in duration-300">
                                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-8">
                                        <Play size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4">Run the Bridge</h3>
                                    <p className={`mb-6 leading-relaxed ${subTextColor}`}>
                                        Open your terminal <b>in the folder where you saved the file</b> and run the command below.
                                    </p>
                                    <div className={`p-4 rounded-xl border font-mono text-xs break-all leading-loose mb-6 relative group ${codeBg}`}>
                                        <div className="text-zinc-400 select-none mb-2"># Command</div>
                                        <div className="pr-24">
                                            <span className="text-[#FF4F01]">python jfx_bridge.py</span> --key <span className="text-emerald-500">{syncKey}</span> --url <span className="text-blue-500">{backendUrl}</span> --apikey <span className="text-purple-500">{apiKey}</span>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(`python jfx_bridge.py --key ${syncKey} --url ${backendUrl} --apikey ${apiKey}`)}
                                            className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${copied ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300'}`}
                                        >
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                            <span className="text-[10px] font-bold uppercase">Copy Command</span>
                                        </button>
                                    </div>
                                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-4 items-start">
                                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                        <p className="text-xs text-amber-500/80 leading-relaxed font-medium">
                                            Make sure your MT5 terminal is open and logged in before running this command. <b>Keep the terminal window open</b> while trading.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="animate-in fade-in duration-300 flex flex-col items-center justify-center text-center py-10">
                                    {connectionStatus === 'waiting' ? (
                                        <>
                                            <div className="relative mb-12">
                                                <div className="w-24 h-24 rounded-full border-4 border-[#FF4F01]/20 border-t-[#FF4F01] animate-spin" />
                                                <div className="absolute inset-0 flex items-center justify-center text-[#FF4F01]">
                                                    <Cpu size={32} />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-black mb-4">Waiting for Heartbeat...</h3>
                                            <p className={`max-w-md mx-auto mb-12 ${subTextColor}`}>
                                                Run the script in Step 4. This screen will update automatically once the bridge connects.
                                            </p>
                                        </>
                                    ) : (
                                        <div className="animate-in zoom-in duration-500">
                                            <div className="w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-emerald-500/20">
                                                <Check size={48} strokeWidth={3} />
                                            </div>
                                            <h3 className="text-3xl font-black mb-4">Bridge Connected!</h3>
                                            <p className={`max-w-md mx-auto mb-12 ${subTextColor}`}>
                                                Connection established. Your terminal data is now streaming to JournalFX.
                                            </p>
                                            <button
                                                onClick={() => onComplete(syncKey)}
                                                className="px-12 py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-all"
                                            >
                                                Go to Live Monitor
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-auto pt-10 flex items-center justify-between">
                                {step < 5 && (
                                    <>
                                        <button
                                            onClick={() => setStep(s => Math.max(0, s - 1))}
                                            disabled={step === 0}
                                            className={`text-sm font-bold uppercase tracking-widest ${step === 0 ? 'opacity-0' : 'opacity-40 hover:opacity-100'}`}
                                        >
                                            Previous Step
                                        </button>
                                        <button
                                            onClick={() => setStep(s => Math.min(5, s + 1))}
                                            className="flex items-center gap-3 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-black text-sm hover:translate-x-1 transition-all"
                                        >
                                            Next Step <ArrowRight size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bridge;