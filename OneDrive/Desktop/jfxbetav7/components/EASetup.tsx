import React, { useState, useEffect, useMemo } from 'react';
import {
    Download, Copy, Check, Info, AlertCircle,
    Terminal, Shield, Cpu, ArrowRight, Loader2,
    Play, Command, Code, Zap, Globe, Link, X,
    Power, ExternalLink, Activity, Clock, PlusCircle, CheckCircle2,
    Settings, LayoutDashboard, ChevronDown, Wifi, WifiOff,
    TrendingUp, TrendingDown, DollarSign, BarChart3,
    RefreshCw, Trash2, Edit3, Eye, EyeOff
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { UserProfile, Trade, EASession, EADeal, EAPosition } from '../types';
import OpenPositions from './OpenPositions';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getSASTDateTime } from '../lib/timeUtils';
import { normalizeTrade } from '../lib/trade-normalization';

interface BridgeProps {
    isDarkMode: boolean;
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => Promise<void>;
    eaSession?: EASession | null;
    onTradeAdded?: (trade: Trade) => void;
    onEditTrade?: (trade: Trade) => void;
    onAddOffline?: (trade: Trade) => void;
    trades: Trade[];
    userId: string;
}

const Bridge: React.FC<BridgeProps> = ({ isDarkMode, userProfile, onUpdateProfile, eaSession, onTradeAdded, onEditTrade, onAddOffline, trades, userId }) => {
    const [isInternalConnected, setIsInternalConnected] = useState(userProfile.eaConnected);
    const [syncKey, setSyncKey] = useState(userProfile.syncKey || '');
    
    // Persistent cache for bridge data
    const [liveData, setLiveData] = useLocalStorage<any>(`jfx_bridge_live_data_${userId}`, eaSession?.data || null);
    const [cachedHeartbeat, setCachedHeartbeat] = useLocalStorage<string | null>(`jfx_bridge_heartbeat_${userId}`, eaSession?.last_updated || null);
    const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(() => {
        if (eaSession?.last_updated) return new Date(eaSession.last_updated);
        if (cachedHeartbeat) return new Date(cachedHeartbeat);
        return null;
    });
    const [syncLog, setSyncLog] = useLocalStorage<{ time: string; message: string; type: 'success' | 'info' | 'error' }[]>(`jfx_bridge_log_${userId}`, []);

    // Sync internal connection state with profile
    useEffect(() => {
        setIsInternalConnected(userProfile.eaConnected);
    }, [userProfile.eaConnected]);

    // Update live data from prop
    useEffect(() => {
        if (eaSession?.data) {
            // Only update main trading data if it's a valid data heartbeat
            if (eaSession.data.isHeartbeat !== false) {
                setLiveData(eaSession.data);
            }
            
            if (eaSession.last_updated) {
                const date = new Date(eaSession.last_updated);
                setLastHeartbeat(date);
                setCachedHeartbeat(eaSession.last_updated);
            }

            // Only log and update heartbeats if it's a real sync or explicit heartbeat
            if (eaSession.data.isHeartbeat !== false) {
                const isHeartbeat = eaSession.data.isHeartbeat;
                const tradeCount = eaSession.data.trades?.length || 0;
                const msg = isHeartbeat ? 'Heartbeat received' : `Synced ${tradeCount} trades from terminal`;

                setSyncLog(prev => [
                    { time: new Date().toISOString(), message: msg, type: 'success' } as const,
                    ...prev
                ].slice(0, 10));
            } else {
                // If it's an explicit offline signal, log it
                setSyncLog(prev => [
                    { time: new Date().toISOString(), message: 'Bridge manually stopped', type: 'info' } as const,
                    ...prev
                ].slice(0, 10));
            }
        }
    }, [eaSession]);

    if (isInternalConnected) {
        return (
            <BridgeMonitor
                isDarkMode={isDarkMode}
                userProfile={userProfile}
                liveData={liveData}
                lastHeartbeat={lastHeartbeat}
                isHeartbeat={eaSession?.data?.isHeartbeat !== false}
                syncKey={syncKey}
                syncLog={syncLog}
                onDisconnect={async () => {
                    const updated = { ...userProfile, eaConnected: false };
                    await onUpdateProfile(updated);
                    setIsInternalConnected(false);
                }}
                onTradeAdded={onTradeAdded}
                onEditTrade={onEditTrade}
                onAddOffline={onAddOffline}
                trades={trades}
                userId={userId}
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
interface BridgeMonitorProps {
    isDarkMode: boolean;
    userProfile: UserProfile;
    liveData: any;
    lastHeartbeat: Date | null;
    isHeartbeat: boolean;
    syncKey: string;
    syncLog: { time: string; message: string; type: 'success' | 'info' | 'error' }[];
    onDisconnect: () => Promise<void>;
    onTradeAdded?: (trade: Trade) => void;
    onEditTrade?: (trade: Trade) => void;
    onAddOffline?: (trade: Trade) => void;
    trades: Trade[];
    userId: string;
}

const BridgeMonitor: React.FC<BridgeMonitorProps> = ({ isDarkMode, userProfile, liveData, lastHeartbeat, isHeartbeat, syncKey, syncLog, onDisconnect, onTradeAdded, onEditTrade, onAddOffline, trades, userId }) => {
    const [activeTab, setActiveTab] = useState<'monitor' | 'settings'>('monitor');
    const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
    const [autoLog, setAutoLog] = useLocalStorage('bridge_auto_log', false);
    const [activeSetup, setActiveSetup] = useState<{ id: string, name: string } | null>(null);
    const [now, setNow] = useState(new Date());
    const [isSavingTrade, setIsSavingTrade] = useState<string | null>(null); // Track specific trade being saved
    const [copied, setCopied] = useState(false);

    // Headless local proxy state
    const [localHeadlessData, setLocalHeadlessData] = useState<any>(null);
    const [localLastHeartbeat, setLocalLastHeartbeat] = useState<Date | null>(null);

    // âœ… SUGGESTION 3: Equity Sparkline History (last 20 points)
    const [equityHistory, setEquityHistory] = useState<number[]>([]);

    // Derive unique setups for the selector
    const recentSetups = useMemo(() => {
        const setups: { id: string, pair: string, name: string }[] = [];
        const seenIds = new Set();
        [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach(t => {
            if (t.setupId && !seenIds.has(t.setupId)) {
                setups.push({
                    id: t.setupId,
                    pair: t.pair,
                    name: t.setupName || `${t.pair} Cluster`
                });
                seenIds.add(t.setupId);
            }
        });
        return setups.slice(0, 8);
    }, [trades]);

    // âœ… FIX: cardStyle defined here â€” used throughout the component
    // Obsidian Black theme: deeper blacks and subtle borders
    const cardStyle = 'bg-[#000000]/80 border border-white/5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]';

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

    // Local Headless MT5 Polling directly from Docker instance 
    useEffect(() => {
        let isActive = true;
        const fetchHeadlessData = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000); // Fast timeout
                
                const [accountRes, positionsRes, historyRes] = await Promise.all([
                    fetch('http://localhost:8888/api/account', { signal: controller.signal }),
                    fetch('http://localhost:8888/api/positions', { signal: controller.signal }),
                    fetch('http://localhost:8888/api/history', { signal: controller.signal })
                ]);
                clearTimeout(timeoutId);

                if (accountRes.ok && positionsRes.ok && historyRes.ok) {
                    const accData = await accountRes.json();
                    const posData = await positionsRes.json();
                    const histData = await historyRes.json();
                    
                    if (isActive) {
                        setLocalHeadlessData({
                           isHeartbeat: true,
                           account: accData.account,
                           openPositions: posData.openPositions,
                           trades: histData.trades
                        });
                        setLocalLastHeartbeat(new Date());
                    }
                }
            } catch (e) {
                // Ignore, fallback to standard stream if offline or not using local headless mode
            }
        };

        const interval = setInterval(fetchHeadlessData, 2000);
        fetchHeadlessData(); // Fire immediately
        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, []);

    // Master Display Logic (Prefer local 8888 if active, fallback to remote Supabase event push)
    const effectiveLiveData = localHeadlessData || liveData;
    const effectiveLastHeartbeat = localLastHeartbeat || lastHeartbeat;
    const effectiveIsHeartbeat = localHeadlessData ? true : isHeartbeat;

    const timeAgo = effectiveLastHeartbeat ? Math.floor((now.getTime() - effectiveLastHeartbeat.getTime()) / 1000) : null;
    const isOnline = effectiveIsHeartbeat && timeAgo !== null && timeAgo < 15; // 15s threshold for 'offline'

    // Filter "Pending" trades (from bridge but not in DB)
    // Only show "Exit" deals (entry=1 or 2) as candidates for Journal
    const incomingTrades = (effectiveLiveData?.trades || []).filter((t: EADeal) => t.entry === 1 || t.entry === 2);
    const pendingTrades = incomingTrades.filter((t: EADeal) => !trades.some(st => st.ticketId === String(t.ticket)));

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

    // âœ… Capture Equity history for sparkline
    useEffect(() => {
        const currentEquity = effectiveLiveData?.account?.equity;
        if (currentEquity !== undefined && currentEquity !== null) {
            setEquityHistory(prev => {
                const next = [...prev, currentEquity];
                return next.slice(-20); // Keep last 20 points
            });
        }
    }, [effectiveLiveData?.account?.equity]);

    // âœ… SUGGESTION 2: High-Performance Sparkline Calculation
    const sparklineData = useMemo(() => {
        if (equityHistory.length < 2) return { path: '', points: [] };
        const min = Math.min(...equityHistory);
        const max = Math.max(...equityHistory);
        const range = max - min || 1;
        const width = 140;
        const height = 40;
        const points = equityHistory.map((v, i) => ({
            x: (i / (equityHistory.length - 1)) * width,
            y: height - ((v - min) / range) * height
        }));
        const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return { path, points };
    }, [equityHistory]);


    const handleAddTrade = async (mt5Trade: EADeal) => {
        setIsSavingTrade(String(mt5Trade.ticket));
        try {
            // MT5 deal.profit does NOT include swap or commission. 
            // For a perfect journal, we need the Net PnL.
            const netPnL = Number((mt5Trade.profit + (mt5Trade.swap || 0) + (mt5Trade.commission || 0)).toFixed(2));

            // Validate timestamps before creating Date objects
            const tradeTimestamp = mt5Trade.time && !isNaN(mt5Trade.time) ? mt5Trade.time * 1000 : Date.now();
            const entryTimestamp = mt5Trade.entry_time && !isNaN(mt5Trade.entry_time) ? mt5Trade.entry_time * 1000 : Date.now();
            
            const tradeDate = new Date(tradeTimestamp);
            const entryDate = new Date(entryTimestamp);
            
            // Additional validation - ensure dates are valid
            if (isNaN(tradeDate.getTime()) || isNaN(entryDate.getTime())) {
                throw new Error('Invalid date values in trade data');
            }
            
            const sast = getSASTDateTime(tradeDate);
            const sastEntry = getSASTDateTime(entryDate);

            const newTrade = normalizeTrade({
                id: '', // Generated by DB
                ticketId: String(mt5Trade.ticket),
                pair: mt5Trade.symbol,
                assetType: 'Forex',
                date: sast.date,
                time: sast.fullTime, // Use full time for accuracy
                openTime: entryDate.toISOString(),
                closeTime: tradeDate.toISOString(),
                direction: mt5Trade.type === 'BUY' ? 'Long' : 'Short',
                entryPrice: mt5Trade.entry_price || mt5Trade.price,
                exitPrice: mt5Trade.price,
                stopLoss: mt5Trade.sl || 0,
                takeProfit: mt5Trade.tp || 0,
                lots: mt5Trade.volume,
                result: netPnL > 0 ? 'Win' : netPnL < 0 ? 'Loss' : 'BE',
                pnl: netPnL,
                rr: 0,
                rating: 0,
                tags: ['Others'],
                notes: `Synced from MT5. Deal #${mt5Trade.ticket} | Order #${mt5Trade.order}`,
                planAdherence: 'No Plan',
                tradingMistake: 'None',
                mindset: 'Neutral',
                setupId: activeSetup?.id
            });

            if (!autoLog && onEditTrade) {
                onEditTrade(newTrade);
                return;
            }

            try {
                const saved = await dataService.addTrade(newTrade);
                // Notify global state
                if (onTradeAdded) {
                    onTradeAdded(saved);
                }
            } catch (syncError) {
                console.warn("Sync failed, queuing offline:", syncError);
                if (onAddOffline) {
                    onAddOffline(newTrade);
                }
            }
        } catch (error) {
            console.error("Failed to process trade:", error);
        } finally {
            setIsSavingTrade(null);
        }
    };

    // Derived account values for bento cells
    const equity      = effectiveLiveData?.account?.equity   || 0;
    const balance     = effectiveLiveData?.account?.balance  || 0;
    const profit      = effectiveLiveData?.account?.profit   || 0;
    const margin      = effectiveLiveData?.account?.margin   || 0;
    const openCount   = effectiveLiveData?.openPositions?.length || 0;
    const freeMargin  = equity - margin;
    const marginLevelPct = margin > 0 ? ((equity / margin) * 100).toFixed(0) : '∞';

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar" style={{ background: `linear-gradient(135deg,#000000 0%,#000000 60%,#000000 100%)` }}>
            <div className="w-full p-4 lg:p-5 flex flex-col gap-4">

        {/* TOP NAV */}
      <div className="flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center relative shrink-0 overflow-hidden bg-slate-800/50">
            <img src="/mt5-logo.png" alt="MetaTrader 5" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black tracking-tight text-white">Desktop Bridge</h1>
              {localHeadlessData && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[9px] font-black tracking-widest uppercase border border-indigo-500/20">Headless</span>
              )}
              <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {isOnline ? `Live · ${timeAgo}s ago` : 'Offline'}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{effectiveLiveData?.account?.server || 'MetaTrader 5 Terminal'}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="p-1 rounded-xl flex items-center border border-white/5 bg-slate-900/40 backdrop-blur-md">
                            <button onClick={() => setActiveTab('monitor')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTab === 'monitor' ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
                                <LayoutDashboard size={12} strokeWidth={2.5} /> Monitor
                            </button>
                            <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTab === 'settings' ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
                                <Settings size={12} strokeWidth={2.5} /> Settings
                            </button>
                        </div>
                        <button onClick={onDisconnect} className="h-10 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2">
                            <Power size={12} strokeWidth={3} /> Disconnect
                        </button>
                    </div>
                </div>

                {activeTab === 'monitor' ? (
                    <div className="grid grid-cols-12 gap-4">

                        {/* â•â• ROW 1 â€” Hero Metric Bento Cells â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â• */}

                        {/* Equity â€” wide hero cell */}
                        <div className={`col-span-12 lg:col-span-5 ${cardStyle} rounded-3xl p-6 relative overflow-hidden group`}>
                            <div className="absolute top-0 right-0 w-56 h-56 bg-amber-500/5 blur-[70px] -mr-28 -mt-28 rounded-full group-hover:bg-amber-500/8 transition-all pointer-events-none" />
                            

                            {/* âœ… SUGGESTION 1: Pulse Animated Sparkline */}
                            <div className="absolute bottom-6 right-6 opacity-40 group-hover:opacity-80 transition-opacity">
                                <svg width="140" height="40" viewBox="0 0 140 40" className="overflow-visible">
                                    <path 
                                        d={sparklineData.path} 
                                        fill="none" 
                                        stroke="url(#sparkline-grad)" 
                                        strokeWidth="2.5" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                    />
                                    <defs>
                                        <linearGradient id="sparkline-grad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#f59e0b" />
                                        </linearGradient>
                                    </defs>
                                    {sparklineData.points.length > 0 && (
                                        <g>
                                            <circle 
                                                cx={sparklineData.points[sparklineData.points.length - 1].x} 
                                                cy={sparklineData.points[sparklineData.points.length - 1].y} 
                                                r="4" 
                                                fill="#f59e0b" 
                                                className="animate-pulse"
                                            />
                                            <circle 
                                                cx={sparklineData.points[sparklineData.points.length - 1].x} 
                                                cy={sparklineData.points[sparklineData.points.length - 1].y} 
                                                r="8" 
                                                fill="none"
                                                stroke="#f59e0b"
                                                strokeWidth="1"
                                                className="animate-ping opacity-40"
                                            />
                                        </g>
                                    )}
                                </svg>
                            </div>

                            <div className="relative z-10">
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Portfolio Net Equity</div>
                                <div className="text-4xl font-mono font-black tracking-tighter text-white flex items-baseline gap-1 mb-3">
                                    <span className="text-amber-500 text-2xl font-sans mr-1">{userProfile.currencySymbol}</span>
                                    {equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${profit >= 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(251,113,133,0.8)]'}`} />
                                    <span className={`text-sm font-mono font-black ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {profit >= 0 ? '+' : ''}{userProfile.currencySymbol}{profit.toLocaleString(undefined, { minimumFractionDigits: 2 })} Live P&amp;L
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className={`col-span-6 lg:col-span-2 ${cardStyle} rounded-3xl p-5 group hover:-translate-y-0.5 transition-all duration-200`}>
                            <div className="p-2 rounded-xl bg-slate-800/70 w-fit mb-3"><DollarSign size={15} className="text-slate-400" /></div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Balance</div>
                            <div className="text-lg font-mono font-black text-white">{userProfile.currencySymbol}{balance.toLocaleString()}</div>
                        </div>

                        {/* Used Margin */}
                        <div className={`col-span-6 lg:col-span-2 ${cardStyle} rounded-3xl p-5 group hover:-translate-y-0.5 transition-all duration-200`}>
                            <div className="p-2 rounded-xl bg-amber-500/10 w-fit mb-3"><BarChart3 size={15} className="text-amber-500" /></div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Used Margin</div>
                            <div className="text-lg font-mono font-black text-amber-400">{userProfile.currencySymbol}{margin.toLocaleString()}</div>
                        </div>

                        {/* Free Margin */}
                        <div className={`col-span-6 lg:col-span-2 ${cardStyle} rounded-3xl p-5 group hover:-translate-y-0.5 transition-all duration-200`}>
                            <div className="p-2 rounded-xl bg-indigo-500/10 w-fit mb-3"><Activity size={15} className="text-indigo-400" /></div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Free Margin</div>
                            <div className="text-lg font-mono font-black text-indigo-400">{userProfile.currencySymbol}{freeMargin.toLocaleString()}</div>
                        </div>

                        {/* Open Trades + Leverage stacked */}
                        <div className="col-span-6 lg:col-span-1 flex flex-col gap-4">
                            <div className={`${cardStyle} rounded-3xl p-4 flex flex-col items-center justify-center text-center group hover:-translate-y-0.5 transition-all duration-200 flex-1`}>
                                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 mb-1">Active</div>
                                <div className="text-2xl font-mono font-black text-indigo-400">{openCount}</div>
                                <div className="text-[8px] font-black text-slate-600 uppercase tracking-wider mt-0.5">Trades</div>
                            </div>
                            <div className={`${cardStyle} rounded-3xl p-4 flex flex-col items-center justify-center text-center group hover:-translate-y-0.5 transition-all duration-200 flex-1`}>
                                <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 mb-1">Leverage</div>
                                <div className="text-lg font-mono font-black text-violet-400">1:{effectiveLiveData?.account?.leverage || '—'}</div>
                            </div>
                        </div>

                        {/* â•â• ROW 2 â€” Main Dashboard â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

                        {/* Live Positions â€” large bento cell */}
                        <div className={`col-span-12 lg:col-span-8 ${cardStyle} rounded-3xl p-6 flex flex-col`} style={{ minHeight: '340px' }}>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Activity size={17} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm text-white uppercase tracking-wider leading-none">Terminal Pipeline</h3>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Real-time · MetaTrader 5</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500">MT5 CORE</div>
                                    {isOnline && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />}
                                </div>
                            </div>
                            <div className="flex-1 -mx-2 overflow-auto custom-scrollbar">
                                <OpenPositions
                                    positions={(effectiveLiveData?.openPositions || []).map((p: any) => ({
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

                        {/* Right column â€” Setup Linker + Journal Queue */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">

                            {/* Setup Intelligence */}
                            <div className={`${cardStyle} rounded-3xl p-5`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${activeSetup ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>
                                        <Link size={17} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-white leading-none">Setup Linker</h3>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Cluster Engine</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <select
                                        id="setup-linker"
                                        className="w-full pl-4 pr-9 py-3 rounded-2xl border border-slate-800 text-[10px] font-black uppercase tracking-wider outline-none appearance-none cursor-pointer transition-all bg-slate-900 text-slate-300 focus:border-amber-500/50"
                                        value={activeSetup?.id || ''}
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            if (!id) setActiveSetup(null);
                                            else {
                                                const s = recentSetups.find(rs => rs.id === id);
                                                if (s) setActiveSetup({ id: s.id, name: s.name || `Setup Cluster (${s.pair})` });
                                            }
                                        }}
                                    >
                                        <option value="">Standalone Mode</option>
                                        {recentSetups.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                </div>
                                {recentSetups.length === 0 && (
                                    <p className="mt-3 text-[10px] font-medium text-slate-500 leading-relaxed">
                                        Link trades in Trade History to create reusable setup clusters here.
                                    </p>
                                )}
                                {activeSetup && (
                                    <button onClick={() => setActiveSetup(null)} className="mt-3 w-full py-2.5 rounded-2xl bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-rose-500/20">
                                        <X size={12} strokeWidth={3} /> Clear Link
                                    </button>
                                )}
                            </div>

                            {/* Journal Queue */}
                            <div className={`${cardStyle} rounded-3xl p-5 flex-1 flex flex-col`} style={{ minHeight: '220px' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                            <Download size={15} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[11px] uppercase tracking-widest text-white leading-none">Journal Queue</h3>
                                            {pendingTrades.length > 0 && (
                                                <p className="text-[9px] text-amber-400 font-bold mt-0.5">{pendingTrades.length} pending</p>
                                            )}
                                        </div>
                                    </div>
                                    {pendingTrades.length > 0 && (
                                        <button
                                            onClick={async () => {
                                                setIsSavingTrade('bulk_all');
                                                try { for (const t of pendingTrades) await handleAddTrade(t); }
                                                finally { setIsSavingTrade(null); }
                                            }}
                                            disabled={isSavingTrade !== null}
                                            className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                                        >
                                            {isSavingTrade === 'bulk_all' ? '...' : 'Sync All'}
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1 -mr-1">
                                    {pendingTrades.length > 0 ? (
                                        pendingTrades.map((trade: any) => {
                                            const pipSize = trade.symbol?.includes('JPY') ? 0.01 : 0.0001;
                                            const pipMov = trade.entry_price ? (trade.type === 'BUY' ? trade.price - trade.entry_price : trade.entry_price - trade.price) / pipSize : 0;
                                            return (
                                                <div key={trade.ticket} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/30 transition-all group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-xs text-white">{trade.symbol}</span>
                                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{trade.type}</span>
                                                        </div>
                                                        <span className={`text-xs font-mono font-black ${trade.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{trade.profit >= 0 ? '+' : ''}{trade.profit?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-mono text-slate-500">#{trade.ticket} · {trade.volume}L · {pipMov >= 0 ? '+' : ''}{pipMov.toFixed(1)}p</span>
                                                        {trades.some(st => st.ticketId === String(trade.ticket)) ? (
                                                            <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest"><CheckCircle2 size={10} strokeWidth={3} /> Logged</div>
                                                        ) : (
                                                            <button onClick={() => handleAddTrade(trade)} disabled={isSavingTrade !== null} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all border border-slate-700 disabled:opacity-50">
                                                                {isSavingTrade === String(trade.ticket) ? '...' : 'Log'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 text-center">
                                            <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center mb-3">
                                                <RefreshCw size={18} className="text-slate-600" />
                                            </div>
                                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Awaiting Activity</div>
                                            <p className="text-[9px] text-slate-700 font-bold mt-1 uppercase tracking-wider">Bridge active. Listening...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* â•â• ROW 3 â€” Telemetry + Margin Level â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

                        {/* Margin Level */}
                        <div className={`col-span-6 lg:col-span-2 ${cardStyle} rounded-3xl p-5 group hover:-translate-y-0.5 transition-all duration-200`}>
                            <div className="p-2 rounded-xl bg-emerald-500/10 w-fit mb-3"><TrendingUp size={15} className="text-emerald-400" /></div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Margin Level</div>
                            <div className="text-lg font-mono font-black text-emerald-400">{marginLevelPct}%</div>
                        </div>

                        {/* Diagnostics toggle */}
                        <div className={`col-span-6 lg:col-span-2 ${cardStyle} rounded-3xl p-5 flex flex-col items-center justify-center gap-2 group hover:-translate-y-0.5 transition-all duration-200 cursor-pointer`} onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}>
                            <div className={`p-2 rounded-xl w-fit ${showTechnicalDetails ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}><Cpu size={15} /></div>
                            <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 text-center">{showTechnicalDetails ? 'Hide Diag.' : 'Diagnostics'}</div>
                        </div>

                        {/* Telemetry Feed â€” spans remaining */}
                        <div className={`col-span-12 lg:col-span-8 ${cardStyle} rounded-3xl p-5 relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[30px] -mr-10 -mt-10 rounded-full pointer-events-none" />
                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <Clock size={15} strokeWidth={2.5} />
                                </div>
                                <h3 className="font-black text-[11px] uppercase tracking-widest text-white">Telemetry Feed</h3>
                                <div className="ml-auto text-[9px] font-black uppercase tracking-widest text-slate-600">{syncLog?.length || 0} events</div>
                            </div>
                            <div className="flex items-start gap-5 overflow-x-auto custom-scrollbar pb-1 relative z-10">
                                {syncLog?.length > 0 ? (
                                    syncLog.slice(0, 10).map((log: any, i: number) => (
                                        <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 text-center min-w-[72px]">
                                            <div className={`w-2.5 h-2.5 rounded-full ${log.type === 'success' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : log.type === 'error' ? 'bg-rose-500 shadow-[0_0_6px_rgba(251,113,133,0.5)]' : 'bg-indigo-500'}`} />
                                            <div className="text-[8px] font-mono text-slate-600 whitespace-nowrap">{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                                            <div className="text-[8px] font-bold text-slate-400 leading-tight">{log.message}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic py-2">Link standby...</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* â”€â”€ SETTINGS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
                    <div className="grid grid-cols-12 gap-4">

                        {/* Connection Diagnostics */}
                        <div className={`col-span-12 ${cardStyle} rounded-3xl p-6 relative overflow-hidden`}>
                            <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
                                <div className="space-y-4 flex-1">
                                    <div>
                                        <h3 className="text-lg font-black mb-1 text-white uppercase tracking-wider">Connection Diagnostics</h3>
                                        <p className="text-sm text-slate-400 max-w-md">Technical details about your current bridge session. Ensure the JournalFX Bridge app is running.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800">
                                            <div className="text-[9px] font-black uppercase tracking-tighter text-slate-500 mb-1">Last Heartbeat</div>
                                            <div className="text-sm font-mono font-bold text-white">
                                                {effectiveLastHeartbeat ? effectiveLastHeartbeat.toLocaleTimeString() : 'Never'}
                                                <span className="ml-2 text-[10px] text-slate-500">({timeAgo !== null ? `${timeAgo}s ago` : '—'})</span>
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800">
                                            <div className="text-[9px] font-black uppercase tracking-tighter text-slate-500 mb-1">Session ID</div>
                                            <div className="text-sm font-mono font-bold text-slate-300">{syncKey.substring(0, 8)}...</div>
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800">
                                            <div className="text-[9px] font-black uppercase tracking-tighter text-slate-500 mb-1">Stream Source</div>
                                            <div className="text-sm font-mono font-bold text-indigo-400">{localHeadlessData ? 'Local :8888' : 'Supabase Cloud'}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`hidden md:flex w-24 h-24 rounded-full border-8 items-center justify-center shrink-0 transition-colors duration-500 ${isOnline ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                                    <Activity size={36} className={isOnline ? 'text-emerald-500 animate-pulse' : 'text-rose-500'} />
                                </div>
                            </div>
                        </div>

                        {/* Automation */}
                        <div className={`col-span-12 md:col-span-4 ${cardStyle} rounded-3xl p-6`}>
                            <h3 className="font-black mb-5 flex items-center gap-2 text-white uppercase tracking-widest text-sm"><Zap size={16} className="text-amber-500" /> Automation</h3>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="font-bold text-sm text-slate-200">Auto-Log Trades</div>
                                    <div className="text-[10px] text-slate-500 max-w-[200px] leading-tight mt-1">Automatically add closed trades without manual confirmation.</div>
                                </div>
                                <button onClick={() => setAutoLog(!autoLog)} className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${autoLog ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-800'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${autoLog ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Bridge Security */}
                        <div className={`col-span-12 md:col-span-4 ${cardStyle} rounded-3xl p-6`}>
                            <h3 className="font-black mb-5 flex items-center gap-2 text-white uppercase tracking-widest text-sm"><Shield size={16} className="text-indigo-400" /> Bridge Security</h3>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Active Sync Key</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm font-bold text-amber-500 truncate">{syncKey}</div>
                                <button onClick={() => handleCopy(syncKey)} className={`p-3 rounded-xl transition-all shrink-0 ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                                    {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="col-span-12 md:col-span-4 p-6 rounded-3xl border border-rose-500/20 bg-rose-500/5">
                            <h3 className="font-black mb-3 flex items-center gap-2 text-rose-400 uppercase tracking-widest text-sm"><AlertCircle size={16} /> Danger Zone</h3>
                            <p className="text-sm text-slate-400 mb-5 leading-relaxed">Disconnecting stops all real-time streaming. You'll need the setup wizard to reconnect.</p>
                            <button onClick={onDisconnect} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-black uppercase tracking-widest text-xs hover:bg-rose-500 hover:text-white transition-all">
          <Power size={16} strokeWidth={3} /> Disconnect System
        </button>
      </div>
    </div>
  )}
</div>
);
};

/* --- SUB-COMPONENT: BRIDGE WIZARD --- */
interface BridgeWizardProps {
    isDarkMode: boolean;
    onComplete: (syncKey: string) => void;
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => Promise<void>;
}

const BridgeWizard: React.FC<BridgeWizardProps> = ({ isDarkMode, onComplete, userProfile, onUpdateProfile }) => {
    const [step, setStep] = useState(0);
    const [syncKey, setSyncKey] = useState(userProfile.syncKey || '');
    const [copied, setCopied] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'success' | 'error'>('waiting');

    useEffect(() => {
        if (!syncKey) {
            const newKey = `JFX-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            setSyncKey(newKey);
            if (onUpdateProfile) {
                onUpdateProfile({ ...userProfile, syncKey: newKey });
            }
        }
    }, []);

    useEffect(() => {
        if (step === 2 && connectionStatus === 'waiting' && syncKey) {
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

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#000000]">
            <div className="max-w-4xl w-full mx-auto p-8">
                <div className="mb-12">
                    <h1 className="text-5xl font-black tracking-tight mb-4 italic text-white">Desktop Bridge</h1>
                    <div className="flex items-center gap-4">
                        <p className={`text-lg ${subTextColor}`}>Connect MT5 to JournalFX using our secure Desktop App.</p>
                        <div className="px-3 py-1 rounded bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                            Windows Only
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 space-y-3">
                        {[
                            { id: 0, label: 'Download Bridge', icon: Download },
                            { id: 1, label: 'Launch & Login', icon: Play },
                            { id: 2, label: 'Live Connection', icon: Cpu },
                        ].map((s) => (
                            <div
                                key={s.id}
                                onClick={() => step >= s.id && setStep(s.id)}
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${step === s.id
                                    ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                                    : step > s.id ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' : `border-transparent opacity-40 ${subTextColor}`
                                    }`}
                            >
                                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${step === s.id ? 'bg-amber-500 text-white' : step > s.id ? 'bg-emerald-500 text-white' : 'bg-slate-800'
                                    }`}>
                                    {step > s.id ? <Check size={16} /> : <s.icon size={16} />}
                                </div>
                                <span className="font-bold text-xs uppercase tracking-widest">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-8">
                        <div className={`p-10 rounded-[32px] border border-slate-800 bg-slate-900/50 backdrop-blur-xl h-full flex flex-col min-h-[500px] shadow-2xl`}>

                            {step === 0 && (
                                <div className="animate-in fade-in duration-300 text-white">
                                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-8">
                                        <Download size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 uppercase tracking-wider">Step 1: Download the Bridge</h3>
                                    <p className={`mb-8 leading-relaxed text-slate-400 font-medium`}>
                                        Download the <b>Standalone App</b> for the easiest experience. It's self-contained and doesn't require Python or any manual setup.
                                    </p>

                                    <a
                                        href="/JournalFX_Bridge.exe"
                                        download="JournalFX_Bridge.exe"
                                        className="flex items-center justify-center gap-4 p-6 bg-amber-500 text-slate-900 rounded-2xl font-black uppercase tracking-[0.1em] hover:bg-amber-600 transition-all shadow-2xl shadow-amber-500/20 hover:scale-[1.02] mb-6"
                                    >
                                        <LayoutDashboard size={28} />
                                        <div className="text-left leading-tight">
                                            <div className="text-xl">Download Standalone App</div>
                                            <div className="text-[10px] opacity-70 font-black tracking-widest">WINDOWS • v2.2.0 • RECOMMENDED</div>
                                        </div>
                                    </a>

                                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                                        <Info className="text-blue-500 shrink-0" size={18} />
                                        <p className="text-xs text-blue-500/80 font-bold uppercase tracking-wide">
                                            Portable application. Run from any local terminal folder.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="animate-in fade-in duration-300 text-white">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-8">
                                        <Play size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 uppercase tracking-wider">Step 2: Launch & Login</h3>
                                    <p className={`mb-6 leading-relaxed text-slate-400`}>
                                        Run the <b>JournalFX_Bridge.exe</b> file you just downloaded.
                                    </p>

                                    <div className="space-y-4 mb-8">
                                        {[
                                            { t: "Sign in using your JournalFX Email & Password." },
                                            { t: "Ensure your MetaTrader 5 terminal is open and logged in." },
                                            { t: "Click \"Start Bridge\" in the app." }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                                                <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-900 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i+1}</div>
                                                <p className="text-sm font-bold text-slate-300">{item.t}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-4 items-start">
                                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                        <p className="text-xs text-amber-500/80 leading-relaxed font-bold uppercase tracking-wide">
                                            Key Discovery: The system will automatically detect your profile data.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-in fade-in duration-300 flex flex-col items-center justify-center text-center py-10 text-white">
                                    {connectionStatus === 'waiting' ? (
                                        <>
                                            <div className="relative mb-12">
                                                <div className="w-24 h-24 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                                                <div className="absolute inset-0 flex items-center justify-center text-amber-500">
                                                    <Cpu size={32} />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-black mb-4 uppercase tracking-widest">Waiting for Uplink...</h3>
                                            <p className={`max-w-md mx-auto mb-8 text-slate-400 font-medium`}>
                                                Once you click "Start Bridge" in the desktop app, this screen will update automatically.
                                            </p>
                                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 space-y-2">
                                                <p>â€¢ Check if MT5 is logged in</p>
                                                <p>â€¢ Ensure "Start Bridge" is clicked in the app</p>
                                                <p>â€¢ Keep this page open while connecting</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="animate-in zoom-in duration-500">
                                            <div className="w-24 h-24 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-emerald-500/20">
                                                <Check size={48} strokeWidth={4} />
                                            </div>
                                            <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter">Bridge Connected!</h3>
                                            <p className={`max-w-md mx-auto mb-12 text-slate-400`}>
                                                Connection established. Your terminal data is now streaming to JournalFX Cloud.
                                            </p>
                                            <button
                                                onClick={() => onComplete(syncKey)}
                                                className="px-12 py-5 bg-emerald-500 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-lg shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-all"
                                            >
                                                Open Command Monitor
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-auto pt-10 flex items-center justify-between">
                                {step < 2 && (
                                    <>
                                        <button
                                            onClick={() => setStep(s => Math.max(0, s - 1))}
                                            disabled={step === 0}
                                            className={`text-[10px] font-black uppercase tracking-[0.3em] ${step === 0 ? 'opacity-0' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Previous Phase
                                        </button>
                                        <button
                                            onClick={() => setStep(s => Math.min(2, s + 1))}
                                            className="flex items-center gap-3 px-8 py-4 bg-amber-500 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:translate-x-1 transition-all"
                                        >
                                            Proceed <ArrowRight size={18} />
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
