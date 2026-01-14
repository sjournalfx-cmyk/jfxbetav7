import React, { useState, useEffect } from 'react';
import {
    Download, Copy, Check, Info, AlertCircle,
    Terminal, Shield, Cpu, ArrowRight, Loader2,
    Play, Command, Code, Link, Zap, Globe,
    Monitor, RefreshCcw, Power, ExternalLink, Activity, Clock, PlusCircle, CheckCircle2
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { UserProfile, Trade } from '../types';

interface BridgeProps {
    isDarkMode: boolean;
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => Promise<void>;
    eaSession?: any;
    onTradeAdded?: (trade: Trade) => void;
}

const Bridge: React.FC<BridgeProps> = ({ isDarkMode, userProfile, onUpdateProfile, eaSession, onTradeAdded }) => {
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
const BridgeMonitor = ({ isDarkMode, liveData, lastHeartbeat, syncKey, syncLog, onDisconnect, onTradeAdded }: any) => {
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

    const handleAddTrade = async (mt5Trade: any) => {
        setIsSavingTrade(String(mt5Trade.ticket));
        try {
            // MT5 deal.profit does NOT include swap or commission. 
            // For a perfect journal, we need the Net PnL.
            const netPnL = Number((mt5Trade.profit + (mt5Trade.swap || 0) + (mt5Trade.commission || 0)).toFixed(2));
            
            const tradeDate = new Date(mt5Trade.time * 1000);
            
            const newTrade: Trade = {
                id: '', // Generated by DB
                ticketId: String(mt5Trade.ticket),
                pair: mt5Trade.symbol,
                assetType: 'Forex',
                date: tradeDate.toISOString().split('T')[0],
                time: tradeDate.toTimeString().split(' ')[0], // Format: HH:MM:SS
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
            <div className="animate-in fade-in duration-500 max-w-5xl w-full mx-auto p-8">
                <div className="flex items-center justify-between mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-black tracking-tight">Desktop Bridge</h1>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {isOnline ? 'Active' : 'Connection Lost'}
                        </div>
                    </div>
                    <p className={subTextColor}>Your MetaTrader terminal is linked and streaming live data.</p>
                </div>
                <button
                    onClick={onDisconnect}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 font-bold text-sm hover:bg-rose-500 hover:text-white transition-all"
                >
                    <Power size={16} /> Disconnect Bridge
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`p-6 rounded-[24px] border-2 ${cardBg}`}>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Account Equity</div>
                    <div className="text-3xl font-mono font-black text-[#FF4F01]">
                        ${liveData?.account?.equity?.toLocaleString() || '---'}
                    </div>
                    <div className="text-[10px] mt-2 opacity-60 font-bold">Balance: ${liveData?.account?.balance?.toLocaleString() || '---'}</div>
                </div>
                <div className={`p-6 rounded-[24px] border-2 ${cardBg}`}>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Active Positions</div>
                    <div className="text-3xl font-mono font-black text-indigo-500">
                        {liveData?.openPositions?.length || 0}
                    </div>
                    <div className="text-[10px] mt-2 opacity-60 font-bold">Total Lots: {liveData?.openPositions?.reduce((acc: any, p: any) => acc + (p.volume || 0), 0).toFixed(2)}</div>
                </div>
                <div className={`p-6 rounded-[24px] border-2 ${cardBg}`}>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Terminal Status</div>
                    <div className="text-lg font-bold mb-1 truncate">{liveData?.account?.company || 'Waiting for data...'}</div>
                    <div className="text-[10px] opacity-60 font-medium">MT5 Build {liveData?.account?.login ? 'Active' : '---'}</div>
                </div>
            </div>

            <style>{`
                @keyframes heartbeat {
                    0% { transform: scale(1); opacity: 0.4; }
                    15% { transform: scale(1.1); opacity: 1; }
                    30% { transform: scale(1); opacity: 0.4; }
                    45% { transform: scale(1.15); opacity: 1; }
                    60% { transform: scale(1); opacity: 0.4; }
                    100% { transform: scale(1); opacity: 0.4; }
                }
                @keyframes pulse-line {
                    0% { stroke-dashoffset: 100; opacity: 0.2; }
                    20% { stroke-dashoffset: 0; opacity: 1; }
                    40% { stroke-dashoffset: -100; opacity: 0.2; }
                    100% { stroke-dashoffset: -100; opacity: 0.2; }
                }
            `}</style>

            <div className={`p-8 rounded-[32px] border-2 mb-8 ${cardBg} relative overflow-hidden`}>
                <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-black mb-2">Live Connection Pulse</h3>
                            <p className="text-sm opacity-60 max-w-md">Keep the Python terminal window open on your desktop. If you close it, the sync will stop immediately.</p>
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
                                <div className="text-[9px] font-black uppercase tracking-tighter opacity-40 mb-1">Your Sync Key</div>
                                <div className="text-sm font-mono font-bold text-[#FF4F01]">{syncKey}</div>
                            </div>
                            <div 
                                onClick={() => handleCopy(`python jfx_bridge.py --key ${syncKey} --url ${backendUrl} --apikey ${apiKey}`)}
                                className="px-4 py-3 rounded-2xl bg-[#FF4F01]/5 border border-dashed border-[#FF4F01]/30 cursor-pointer group hover:bg-[#FF4F01]/10 transition-all"
                            >
                                <div className="flex items-center justify-between gap-4 mb-1">
                                    <div className="text-[9px] font-black uppercase tracking-tighter text-[#FF4F01]">Run Command</div>
                                    {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="opacity-40 group-hover:opacity-100 transition-opacity" />}
                                </div>
                                <div className="text-[10px] font-mono font-bold opacity-60 truncate max-w-[150px]">
                                    python jfx_bridge.py --key {syncKey}...
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={`w-32 h-32 rounded-full border-8 ${isOnline ? 'border-emerald-500/30' : 'border-rose-500/30'} flex items-center justify-center relative transition-colors duration-500`}>
                        {isOnline ? (
                            <div className="relative flex items-center justify-center" style={{ animation: 'heartbeat 2s infinite ease-in-out' }}>
                                <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M0 20H15L18 28L24 8L30 35L34 20H60"
                                        stroke="#10b981"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{
                                            strokeDasharray: '100',
                                            animation: 'pulse-line 2s infinite linear',
                                            filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
                                        }}
                                    />
                                </svg>
                            </div>
                        ) : (
                            <Activity size={48} className="text-rose-500" />
                        )}
                        {isOnline ? (
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/60 animate-ping" />
                        ) : (
                            <div className="absolute inset-0 rounded-full border-4 border-rose-500/60" />
                        )}
                    </div>
                </div>
            </div>

            {/* Pending Trades Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-[24px] border-2 ${cardBg}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                <Download size={16} />
                            </div>
                            <div>
                                <h3 className="font-bold">Detected Trades</h3>
                                <div className="text-[10px] opacity-60">Trades closed in MT5 but not yet in your Journal.</div>
                            </div>
                        </div>
                        {pendingTrades.length > 0 && (
                            <button
                                onClick={async () => {
                                    setIsSavingTrade('bulk_all');
                                    try {
                                        // Save all trades sequentially
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

                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {pendingTrades.length > 0 ? (
                            pendingTrades.map((trade: any) => (
                                <div key={trade.ticket} className="flex items-center justify-between p-3 rounded-xl border border-dashed border-zinc-500/20 hover:border-indigo-500/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-black text-sm">{trade.symbol}</span>
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {trade.type}
                                            </span>
                                            <span className="text-[9px] font-bold opacity-40">#{trade.ticket}</span>
                                        </div>
                                        <div className="text-[10px] opacity-50 font-mono flex gap-2">
                                            <span>{new Date(trade.time * 1000).toLocaleTimeString()}</span>
                                            <span>•</span>
                                            <span>{trade.volume.toFixed(2)} Lots</span>
                                            {(trade.swap !== 0 || trade.commission !== 0) && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-amber-500/80">
                                                        Net: {(trade.profit + (trade.swap || 0) + (trade.commission || 0)).toFixed(2)} 
                                                        <span className="opacity-40 ml-1">(S: {trade.swap || 0} C: {trade.commission || 0})</span>
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`text-sm font-black font-mono ${trade.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                                        </div>
                                        {savedTrades.some(st => st.ticketId === String(trade.ticket)) ? (
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500" title="Added to Journal">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAddTrade(trade)}
                                                disabled={isSavingTrade !== null}
                                                className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                                                title="Add to Journal"
                                            >
                                                {isSavingTrade === String(trade.ticket) ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 opacity-40 text-sm font-medium">
                                No new pending trades found.
                            </div>
                        )}
                    </div>
                </div>

                <div className={`p-6 rounded-[24px] border-2 ${cardBg}`}>                    <div className="flex items-center gap-3 mb-4">
                    <Clock size={16} className="opacity-40" />
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Recent Activity Log</div>
                </div>
                    <div className="space-y-3">
                        {syncLog?.length > 0 ? (
                            syncLog.map((log: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 text-xs font-mono">
                                    <div className="opacity-30">{log.time.toLocaleTimeString()}</div>
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${log.type === 'success' ? 'bg-emerald-500' :
                                        log.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
                                        }`} />
                                    <div className={isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}>{log.message}</div>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs opacity-30 font-mono italic">Waiting for events...</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 mt-8">
                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                <p className="text-xs text-amber-500/80 font-medium">
                    Tip: If trades aren't appearing, check your terminal for errors. Make sure "Allow Algo Trading" is enabled if you use EAs alongside this bridge.
                </p>
            </div>
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
                                    Save the bridge script to your computer. You can place it anywhere (e.g., your Desktop or Documents).
                                </p>
                                <a
                                    href="/jfx_bridge.py"
                                    download="jfx_bridge.py"
                                    className="flex items-center justify-center gap-3 w-full py-5 bg-[#FF4F01] text-white rounded-xl font-bold hover:bg-[#e64601] transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02]"
                                >
                                    <Code size={20} /> Download jfx_bridge.py
                                </a>
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