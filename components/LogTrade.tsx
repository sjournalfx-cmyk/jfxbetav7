import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Target, Hash, Image as ImageIcon, Save, ChevronRight, ChevronLeft, TrendingUp, TrendingDown, Layout, Type, CheckCircle2, XCircle, MinusCircle, Upload, FileText, ArrowRight, Brain, AlertTriangle, ShieldCheck, Check, ChevronDown, X, Star, Eye, Trash2, Square, Lock } from 'lucide-react';
import { Trade, AssetType, UserProfile } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import RichTextEditor from './RichTextEditor';
import { Select } from './Select';
import ConfirmationModal from './ConfirmationModal';
import { APP_CONSTANTS, PLAN_FEATURES } from '../lib/constants';
import { useToast } from './ui/Toast';

interface LogTradeProps {
    isDarkMode: boolean;
    onSave: (trade: Trade) => void;
    onBatchSave?: (trades: Trade[]) => Promise<void>;
    initialTrade?: Trade;
    onCancel?: () => void;
    currencySymbol: string;
    userProfile?: UserProfile | null;
}

// --- Helper Functions ---

const getSessionFromTime = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0);
    const hour = date.getUTCHours();

    if (hour >= 8 && hour < 12) return 'London Session';
    if (hour >= 13 && hour < 17) return 'New York Session';
    if (hour >= 0 && hour < 5) return 'Tokyo Session';
    if (hour >= 22 || hour < 0) return 'Sydney Session';

    // Transitions
    if (hour >= 12 && hour < 13) return 'London/NY Overlap';
    if (hour >= 5 && hour < 8) return 'Tokyo/London Overlap';

    return 'New York Session'; // Default
};

const calculatePnL = (trade: Partial<Trade>): number => {
    const { assetType, entryPrice, exitPrice, stopLoss, takeProfit, lots, direction, result } = trade;
    if (!entryPrice || !lots || !assetType) return 0;

    const exit = result === 'Win' ? (takeProfit || entryPrice) : (result === 'Loss' ? (stopLoss || entryPrice) : entryPrice);
    const diff = direction === 'Long' ? (exit - entryPrice) : (entryPrice - exit);

    switch (assetType) {
        case 'Forex':
            return diff * 10000 * lots * 10;
        case 'Indices':
            return diff * lots; // Simple 1 point = 1 unit for most indices
        case 'Commodities':
            return diff * 100 * lots; // Standard for Gold (XAUUSD)
        case 'Crypto':
            return diff * lots;
        default:
            return diff * lots;
    }
};

// --- Reusable UI Components ---

const Label = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
    <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 opacity-60 ${className}`}>
        {children}
    </label>
);

const InputWrapper = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
    <div className={`relative group transition-all duration-200 ${className}`}>
        {children}
    </div>
);

const StyledInput = ({ icon: Icon, isDarkMode, className = "", ...props }: any) => (
    <div className="relative">
        {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors z-10">
                <Icon size={16} strokeWidth={2} />
            </div>
        )}
        <input
            {...props}
            className={`
        w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 rounded-lg border outline-none font-medium transition-all text-sm
        ${isDarkMode
                    ? 'bg-[#18181b] border-[#27272a] text-zinc-100 placeholder-zinc-600 focus:bg-[#27272a] focus:border-violet-500/50 focus:shadow-[0_0_0_4_px_rgba(139,92,246,0.1)]'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 shadow-sm'
                }
        ${className}
      `}
        />
    </div>
);

const StarRating = ({ rating, onChange, isDarkMode }: { rating: number, onChange: (val: number) => void, isDarkMode: boolean }) => {
    const [hovered, setHovered] = useState<number | null>(null);

    const labels: { [key: number]: string } = {
        1: "Poor Setup",
        2: "Weak Setup",
        3: "Average Setup",
        4: "Good Setup",
        5: "A+ Setup"
    };

    const currentDisplay = hovered || rating;

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(null)}
                        className={`transition-all duration-200 transform hover:scale-110 active:scale-90 ${star <= (hovered || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : isDarkMode ? 'text-zinc-700 hover:text-zinc-500' : 'text-slate-200 hover:text-slate-300'
                            }`}
                    >
                        <Star size={20} strokeWidth={star <= (hovered || rating) ? 1 : 2} />
                    </button>
                ))}
            </div>
            <span className={`text-xs font-bold transition-opacity duration-200 ${currentDisplay > 0 ? 'opacity-100' : 'opacity-0'} ${currentDisplay >= 4 ? 'text-teal-500' : currentDisplay >= 3 ? 'text-amber-500' : 'text-rose-500'
                }`}>
                {labels[currentDisplay]}
            </span>
        </div>
    );
};

const StepIndicator = ({ current, total, isDarkMode }: { current: number, total: number, isDarkMode: boolean }) => (
    <div className="flex items-center gap-3 mb-10">
        {Array.from({ length: total }).map((_, i) => {
            const isActive = i + 1 === current;
            const isCompleted = i + 1 < current;
            return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                        ${isActive
                                ? 'border-violet-500 bg-violet-500 text-white shadow-lg shadow-violet-500/25 scale-110'
                                : isCompleted
                                    ? 'border-violet-500/30 bg-violet-500/10 text-violet-500'
                                    : isDarkMode ? 'border-[#27272a] bg-[#18181b] text-zinc-500' : 'border-slate-200 bg-slate-100 text-slate-400'
                            }
                    `}
                    >
                        {isCompleted ? <CheckCircle2 size={14} /> : i + 1}
                    </div>
                    {i < total - 1 && (
                        <div className={`flex-1 h-0.5 mx-3 rounded-full transition-all duration-500 ${isCompleted ? 'bg-violet-500/30' : isDarkMode ? 'bg-[#27272a]' : 'bg-slate-200'}`} />
                    )}
                </div>
            )
        })}
    </div>
);

const LogTrade: React.FC<LogTradeProps> = ({ isDarkMode, onSave, onBatchSave, initialTrade, onCancel, currencySymbol, userProfile }) => {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();
    
    const currentPlan = userProfile?.plan || APP_CONSTANTS.PLANS.FREE;
    const isFreeTier = currentPlan === APP_CONSTANTS.PLANS.FREE;
    const features = PLAN_FEATURES[currentPlan];
    const canUploadImages = features.allowImageUploads;
    const canImportTrades = features.directBrokerSync || features.allowImageUploads; // Assuming import might be restricted or tied to something else, using image uploads as proxy for now or just allowing it if manual import is allowed on pro. Actually "Import MT4/MT5" is likely manual or drag drop of CSV/HTML or EA. The current code checked isFreeTier. Let's assume PRO+ can import.
    // The previous code checked `isFreeTier` for "Import MT4/MT5" button. In `constants`, Free tier has `allowImageUploads: false`. Pro has `true`. Let's use `!canUploadImages` as the restriction flag for now to match previous logic, or better, strictly check plan level if needed. 
    // Re-reading code: `disabled={isFreeTier}` on Import button.
    const isRestricted = !canUploadImages; // Using image capability as proxy for "Basic Tier" restrictions in LogTrade for now.

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        showCancel?: boolean;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { }
    });

    const [formData, setFormData] = useState({
        pair: initialTrade?.pair || '',
        assetType: initialTrade?.assetType || 'Forex' as AssetType,
        date: initialTrade?.date || new Date().toISOString().split('T')[0],
        time: initialTrade?.time || new Date().toTimeString().split(' ')[0].slice(0, 5),
        session: initialTrade?.session || getSessionFromTime(new Date().toTimeString().split(' ')[0].slice(0, 5)),
        direction: initialTrade?.direction || 'Long' as 'Long' | 'Short',
        entryPrice: initialTrade?.entryPrice?.toString() || '',
        exitPrice: initialTrade?.exitPrice?.toString() || '',
        stopLoss: initialTrade?.stopLoss?.toString() || '',
        takeProfit: initialTrade?.takeProfit?.toString() || '',
        lots: initialTrade?.lots?.toString() || '1.00',
        result: initialTrade?.result || 'Pending' as 'Win' | 'Loss' | 'BE' | 'Pending',
        rating: initialTrade?.rating || 0,
        emotions: initialTrade?.emotions || [] as string[],
        notes: initialTrade?.notes || '',
        exitComment: initialTrade?.exitComment || '',
        planAdherence: initialTrade?.planAdherence || 'Followed Exactly',
        tradingMistake: initialTrade?.tradingMistake || 'None',
        mindset: initialTrade?.mindset || 'Neutral',
        tags: initialTrade?.tags?.join(', ') || '',
    });

    const [metrics, setMetrics] = useState({ risk: 0, reward: 0, rr: 0 });
    const [pairError, setPairError] = useState<string | null>(null);

    useEffect(() => {
        const pair = formData.pair;
        const type = formData.assetType;

        if (!pair || pair.length < 2) {
            setPairError(null);
            return;
        }

        let isValid = false;
        let hint = "";

        // Regex Helpers
        const isAlphanumeric = /^[A-Z0-9]+$/.test(pair);
        const hasSeparator = /[\/\-\s]/.test(pair);

        if (type === 'Forex') {
            // Strict 6 chars (EURUSD) OR 3+3 with separator (EUR/USD)
            const isStandardForex = /^[A-Z]{6}$/.test(pair);
            const isSeparatedForex = /^[A-Z]{3}[\/\-\s][A-Z]{3}$/.test(pair);

            if (isStandardForex || isSeparatedForex) {
                isValid = true;
            } else {
                hint = "Forex usually: 'EURUSD' or 'EUR/USD'";
            }
        }
        else if (type === 'Indices') {
            // NAS100, GER40, US30 -> Alphanumeric, 3-8 chars usually
            if (isAlphanumeric && pair.length >= 3 && pair.length <= 8) isValid = true;
            else if (hasSeparator && pair.length >= 6) isValid = true; // NAS100/USD
            else hint = "Indices example: 'NAS100', 'GER40'";
        }
        else if (type === 'Commodities') {
            // Allow codes (XAUUSD) or names (WTI Crude Oil)
            // "3 words" support -> just check min length
            if (pair.length >= 3) isValid = true;
        }
        else {
            // Crypto, Stocks -> Flexible
            if (pair.length >= 2) isValid = true;
        }

        setPairError(isValid ? null : hint);
    }, [formData.pair, formData.assetType]);
    const [screenshots, setScreenshots] = useState<{ before?: string, after?: string }>({
        before: initialTrade?.beforeScreenshot,
        after: initialTrade?.afterScreenshot
    });

    const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);

    useEffect(() => {
        const entry = parseFloat(formData.entryPrice);
        const sl = parseFloat(formData.stopLoss);
        const tp = parseFloat(formData.takeProfit);
        const lots = parseFloat(formData.lots) || 0;

        if (entry && sl && tp) {
            const riskDist = Math.abs(entry - sl);
            const rewardDist = Math.abs(tp - entry);
            const rrRatio = riskDist > 0 ? rewardDist / riskDist : 0;

            const riskPnL = calculatePnL({ 
                ...formData, 
                entryPrice: entry, 
                stopLoss: sl, 
                result: 'Loss', 
                lots,
                exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : undefined
            } as any);
            const rewardPnL = calculatePnL({ 
                ...formData, 
                entryPrice: entry, 
                takeProfit: tp, 
                result: 'Win', 
                lots,
                exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : undefined
            } as any);

            setMetrics({
                risk: Math.abs(riskPnL),
                reward: Math.abs(rewardPnL),
                rr: parseFloat(rrRatio.toFixed(2))
            });
        } else {
            setMetrics({ risk: 0, reward: 0, rr: 0 });
        }
    }, [formData.entryPrice, formData.stopLoss, formData.takeProfit, formData.lots, formData.assetType, formData.direction]);

    // Auto-session detection
    useEffect(() => {
        handleInputChange('session', getSessionFromTime(formData.time));
    }, [formData.time]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const beforeInputRef = useRef<HTMLInputElement>(null);
    const afterInputRef = useRef<HTMLInputElement>(null);
    const importTradesInputRef = useRef<HTMLInputElement>(null);

    const handleImportMT4MT5 = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onBatchSave) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                if (!text) return;

                // Simple CSV Parser logic for MT4/MT5 Standard Account History Export
                const lines = text.split(/\r?\n/);
                if (lines.length < 2) return;

                // Try to find the header row
                let headerIdx = lines.findIndex(l => l.toLowerCase().includes('ticket') && l.toLowerCase().includes('profit'));
                if (headerIdx === -1) {
                    // Fallback to first line if no clear header found
                    headerIdx = 0;
                }

                const headers = lines[headerIdx].split(/,|\t/).map(h => h.trim().replace(/"/g, ''));
                const tradeLines = lines.slice(headerIdx + 1);

                const importedTrades: Trade[] = [];

                tradeLines.forEach(line => {
                    const values = line.split(/,|\t/).map(v => v.trim().replace(/"/g, ''));
                    if (values.length < headers.length || !values[0]) return;

                    const tradeObj: any = {};
                    headers.forEach((h, i) => {
                        tradeObj[h.toLowerCase()] = values[i];
                    });

                    // Mapping Logic (adjust based on common MT4/MT5 field names)
                    const ticket = tradeObj.ticket || tradeObj['#'];
                    const openTime = tradeObj['open time'] || tradeObj['time'];
                    const type = tradeObj.type; // buy/sell
                    const size = parseFloat(tradeObj.size || tradeObj.volume || '0');
                    const item = tradeObj.item || tradeObj.symbol;
                    const openPrice = parseFloat(tradeObj['open price'] || tradeObj['price'] || '0');
                    const sl = parseFloat(tradeObj['s/l'] || '0');
                    const tp = parseFloat(tradeObj['t/p'] || '0');
                    const closeTime = tradeObj['close time'] || tradeObj['time'];
                    const closePrice = parseFloat(tradeObj['close price'] || tradeObj['price'] || '0');
                    const profit = parseFloat(tradeObj.profit || '0');
                    const swap = parseFloat(tradeObj.swap || '0');
                    const commission = parseFloat(tradeObj.commission || '0');

                    if (!item || isNaN(profit) || !type) return;
                    if (type.toLowerCase() !== 'buy' && type.toLowerCase() !== 'sell') return; // Skip deposits/withdrawals

                    const netPnl = profit + swap + commission;
                    const result = netPnl > 0 ? 'Win' : (netPnl < 0 ? 'Loss' : 'BE');

                    // Parse Date/Time
                    // Standard MT4 format: 2023.10.25 14:30:05
                    let date = new Date().toISOString().split('T')[0];
                    let time = '00:00';
                    if (openTime) {
                        const parts = openTime.split(' ');
                        if (parts.length >= 1) date = parts[0].replace(/\./g, '-');
                        if (parts.length >= 2) time = parts[1].slice(0, 5);
                    }

                    // Determine Asset Type
                    let assetType: AssetType = 'Forex';
                    const upperItem = item.toUpperCase();
                    if (upperItem.includes('USD') || upperItem.includes('EUR') || upperItem.includes('GBP')) assetType = 'Forex';
                    if (upperItem.includes('NAS') || upperItem.includes('US30') || upperItem.includes('GER') || upperItem.includes('DAX')) assetType = 'Indices';
                    if (upperItem.includes('XAU') || upperItem.includes('GOLD') || upperItem.includes('OIL') || upperItem.includes('XAG')) assetType = 'Commodities';
                    if (upperItem.includes('BTC') || upperItem.includes('ETH')) assetType = 'Crypto';

                    const newTrade: Trade = {
                        id: `imported-${ticket || Date.now() + Math.random()}`,
                        ticketId: ticket,
                        pair: item.toUpperCase(),
                        assetType,
                        date,
                        time,
                        session: getSessionFromTime(time),
                        direction: type.toLowerCase() === 'buy' ? 'Long' : 'Short',
                        entryPrice: openPrice,
                        exitPrice: closePrice,
                        stopLoss: sl,
                        takeProfit: tp,
                        lots: size,
                        result,
                        pnl: netPnl,
                        rr: sl && openPrice ? Math.abs(openPrice - tp) / Math.abs(openPrice - sl) : 0,
                        rating: 0,
                        tags: ['Imported'],
                        notes: `Imported from MT4/MT5. Ticket: ${ticket}`,
                        planAdherence: 'No Plan',
                        mindset: 'Neutral',
                        emotions: []
                    };

                    importedTrades.push(newTrade);
                });

                if (importedTrades.length > 0) {
                    setConfirmModal({
                        isOpen: true,
                        title: 'Import Trades',
                        description: `Found ${importedTrades.length} trades in the file. Would you like to import them now?`,
                        showCancel: true,
                        onConfirm: async () => {
                            await onBatchSave(importedTrades);
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                        }
                    });
                } else {
                    addToast({
                        type: 'error',
                        title: 'Import Failed',
                        message: 'No valid trades found in the file. Ensure it is a standard MT4/MT5 Account History export.'
                    });
                }

            } catch (err) {
                console.error("Import error:", err);
            }
        };
        reader.readAsText(file);
        // Clear input so same file can be selected again
        e.target.value = '';
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        if (isFreeTier) return;
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshots(prev => ({ ...prev, [type]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteScreenshot = (type: 'before' | 'after') => {
        setScreenshots(prev => ({ ...prev, [type]: undefined }));
    };

    const finalizeSave = async () => {
        const entry = parseFloat(formData.entryPrice);
        const sl = parseFloat(formData.stopLoss);
        const tp = parseFloat(formData.takeProfit);
        const lots = parseFloat(formData.lots) || 0;

        if (!formData.pair || !entry || !sl || !tp) {
            setConfirmModal({
                isOpen: true,
                title: 'Incomplete Entry',
                description: 'Please fill in all required fields (Pair, Entry, Stop Loss, Take Profit)',
                showCancel: false,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        setIsSaving(true);
        try {
            const simulatedPnL = calculatePnL({ 
                ...formData, 
                entryPrice: entry, 
                stopLoss: sl, 
                takeProfit: tp, 
                lots,
                exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : undefined
            } as any);

            const newTrade: Trade = {
                id: initialTrade?.id || Date.now().toString(),
                pair: formData.pair.toUpperCase(),
                assetType: formData.assetType,
                date: formData.date,
                time: formData.time,
                session: formData.session,
                direction: formData.direction,
                entryPrice: entry,
                stopLoss: sl,
                takeProfit: tp,
                lots: lots,
                result: formData.result,
                pnl: simulatedPnL,
                rr: metrics.rr,
                rating: formData.rating,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
                notes: formData.notes,
                exitComment: formData.exitComment,
                planAdherence: formData.planAdherence as any,
                tradingMistake: formData.tradingMistake,
                mindset: formData.mindset,
                emotions: formData.emotions,
                beforeScreenshot: screenshots.before,
                afterScreenshot: screenshots.after,
            };

            await onSave(newTrade);
        } catch (error) {
            console.error("Save failed:", error);
            setIsSaving(false);
        }
    };

    const isLong = formData.direction === 'Long';
    const themeColor = isLong ? 'text-teal-500' : 'text-rose-500';

    const getRatingTheme = (r: number) => {
        if (r === 5) return { border: 'border-amber-500', shadow: 'shadow-amber-500/20', glow: 'from-amber-500/20' };
        if (r === 4) return { border: 'border-teal-500', shadow: 'shadow-teal-500/20', glow: 'from-teal-500/20' };
        if (r === 3) return { border: 'border-blue-500', shadow: 'shadow-blue-500/20', glow: 'from-blue-500/20' };
        if (r >= 1) return { border: 'border-rose-500', shadow: 'shadow-rose-500/20', glow: 'from-rose-500/20' };
        return {
            border: isDarkMode ? 'border-[#27272a]' : 'border-slate-200',
            shadow: isDarkMode ? 'shadow-black/50' : 'shadow-slate-200',
            glow: 'from-transparent'
        };
    };

    const ratingTheme = getRatingTheme(formData.rating);

    const LockedBadge = () => (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
            <Lock size={10} /> PRO
        </div>
    );

    return (
        <div className={`w-full h-full overflow-hidden flex flex-col font-sans ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-[#F8FAFC] text-slate-900'}`}>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="flex items-center justify-between px-6 py-4 text-white">
                        <h3 className="font-bold">{previewImage.title}</h3>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                    </div>
                    <div className="flex-1 flex items-center justify-center overflow-hidden">
                        <img
                            src={previewImage.url}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {/* --- Top Header --- */}
            <div className={`h-18 shrink-0 flex items-center justify-between px-8 py-4 z-20 relative ${isDarkMode ? 'bg-[#09090b]' : 'bg-white'}`}>
                <div className={`absolute bottom-0 left-8 right-8 h-px ${isDarkMode ? 'bg-[#27272a]' : 'bg-slate-200'}`} />
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                        <FileText size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight leading-none">{initialTrade ? 'Edit Trade Entry' : 'Log New Trade'}</h1>
                        <p className="text-xs text-zinc-500 font-medium mt-1">{initialTrade ? `Editing ID: ${initialTrade.id}` : `Journal Entry #${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {initialTrade && onCancel && (
                        <button
                            onClick={onCancel}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${isDarkMode ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' : 'border-rose-200 text-rose-600 hover:bg-rose-50'}`}
                        >
                            <X size={14} /> Cancel Edit
                        </button>
                    )}
                    <button 
                        disabled={isRestricted}
                        onClick={() => importTradesInputRef.current?.click()}
                        className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            isRestricted
                            ? 'opacity-50 cursor-not-allowed border-zinc-200 text-zinc-400'
                            : isDarkMode ? 'border-[#27272a] text-zinc-400 hover:bg-[#27272a] hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        {isRestricted ? <Lock size={14} /> : <Upload size={14} />} 
                        Import MT4/MT5
                    </button>
                    <input
                        type="file"
                        ref={importTradesInputRef}
                        className="hidden"
                        accept=".csv,.txt"
                        onChange={handleImportMT4MT5}
                    />
                    <button
                        onClick={finalizeSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isSaving ? 'Saving...' : (initialTrade ? 'Update Entry' : 'Save Entry')}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto px-8 py-10 pb-32">
                        <StepIndicator current={step} total={3} isDarkMode={isDarkMode} />
                        <div className="space-y-8">
                            <div className="flex flex-col gap-2 mb-8">
                                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                                    {step === 1 && "Market Context"}
                                    {step === 2 && "Execution"}
                                    {step === 3 && "Performance Review"}
                                </h2>
                                <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                                    {step === 1 && "Document the market conditions and setup details before taking action."}
                                    {step === 2 && "Record precise entry, exit points, and risk management parameters."}
                                    {step === 3 && "Reflect on the outcome, adherence to plan, and psychology."}
                                </p>
                            </div>

                            {step === 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="col-span-2 md:col-span-1">
                                        <Label>Asset Pair</Label>
                                        <InputWrapper>
                                            <StyledInput
                                                isDarkMode={isDarkMode}
                                                icon={Layout}
                                                placeholder="e.g. EURUSD"
                                                value={formData.pair}
                                                onChange={(e: any) => handleInputChange('pair', e.target.value.toUpperCase())}
                                                autoFocus
                                                className={`uppercase placeholder:normal-case ${pairError ? 'border-amber-500/50 focus:border-amber-500' : ''}`}
                                            />
                                        </InputWrapper>
                                        {pairError && (
                                            <div className="mt-1.5 flex items-center gap-1.5 text-amber-500 animate-in fade-in slide-in-from-top-1">
                                                <AlertTriangle size={12} />
                                                <span className="text-[10px] font-bold tracking-tight">{pairError}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <Select
                                            isDarkMode={isDarkMode}
                                            label="Asset Type"
                                            icon={Target}
                                            value={formData.assetType}
                                            onChange={(val) => handleInputChange('assetType', val)}
                                            options={[
                                                { value: 'Forex', label: 'Forex' },
                                                { value: 'Indices', label: 'Indices' },
                                                { value: 'Commodities', label: 'Commodities (Gold/Oil)' },
                                                { value: 'Crypto', label: 'Crypto' },
                                                { value: 'Stocks', label: 'Stocks' },
                                            ]}
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <Select
                                            isDarkMode={isDarkMode}
                                            label="Trading Session"
                                            icon={Clock}
                                            value={formData.session}
                                            onChange={(val) => handleInputChange('session', val)}
                                            options={[
                                                { value: 'New York Session', label: 'New York Session' },
                                                { value: 'London Session', label: 'London Session' },
                                                { value: 'Tokyo Session', label: 'Tokyo Session' },
                                                { value: 'Sydney Session', label: 'Sydney Session' },
                                            ]}
                                        />
                                    </div>

                                    <div className="col-span-2 md:col-span-1">
                                        <Label>Entry Date</Label>
                                        <InputWrapper>
                                            <StyledInput
                                                isDarkMode={isDarkMode}
                                                icon={Calendar}
                                                type="date"
                                                value={formData.date}
                                                onChange={(e: any) => handleInputChange('date', e.target.value)}
                                            />
                                        </InputWrapper>
                                        <div className="mt-4">
                                            <Label className="!mb-1">Setup Quality Rating</Label>
                                            <StarRating
                                                rating={formData.rating}
                                                onChange={(val) => handleInputChange('rating', val)}
                                                isDarkMode={isDarkMode}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <Label>Entry Time</Label>
                                        <InputWrapper>
                                            <StyledInput
                                                isDarkMode={isDarkMode}
                                                icon={Clock}
                                                type="time"
                                                value={formData.time}
                                                onChange={(e: any) => handleInputChange('time', e.target.value)}
                                            />
                                        </InputWrapper>
                                    </div>

                                    <div className="col-span-2">
                                        <Label>Entry Comment</Label>
                                        <div className="relative">
                                            <RichTextEditor
                                                isDarkMode={isDarkMode}
                                                placeholder="Describe your rationale for entering the trade..."
                                                content={formData.notes}
                                                onChange={(val) => handleInputChange('notes', val)}
                                                minHeight="150px"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2 md:col-span-1">
                                            <Label>Trade Direction</Label>
                                            <div className={`p-1.5 rounded-xl flex border ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-100 border-slate-200'}`}>
                                                <button
                                                    onClick={() => handleInputChange('direction', 'Long')}
                                                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.direction === 'Long'
                                                        ? 'bg-teal-500 text-white shadow-md'
                                                        : 'text-zinc-500 hover:text-zinc-300'
                                                        }`}
                                                >
                                                    <TrendingUp size={16} /> Long
                                                </button>
                                                <button
                                                    onClick={() => handleInputChange('direction', 'Short')}
                                                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.direction === 'Short'
                                                        ? 'bg-rose-500 text-white shadow-md'
                                                        : 'text-zinc-500 hover:text-zinc-300'
                                                        }`}
                                                >
                                                    <TrendingDown size={16} /> Short
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <Label>Position Size (Lots)</Label>
                                            <InputWrapper>
                                                <StyledInput
                                                    isDarkMode={isDarkMode}
                                                    icon={Hash}
                                                    type="number"
                                                    placeholder="1.00"
                                                    step="0.01"
                                                    value={formData.lots}
                                                    onChange={(e: any) => handleInputChange('lots', e.target.value)}
                                                />
                                            </InputWrapper>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label>Entry Price</Label>
                                            <InputWrapper>
                                                <StyledInput
                                                    isDarkMode={isDarkMode}
                                                    type="number"
                                                    placeholder="0.00000"
                                                    className="font-mono tracking-wide"
                                                    value={formData.entryPrice}
                                                    onChange={(e: any) => handleInputChange('entryPrice', e.target.value)}
                                                />
                                            </InputWrapper>
                                        </div>
                                        <div>
                                            <Label>Exit Price</Label>
                                            <InputWrapper>
                                                <StyledInput
                                                    isDarkMode={isDarkMode}
                                                    type="number"
                                                    placeholder="0.00000"
                                                    className="font-mono tracking-wide"
                                                    value={formData.exitPrice}
                                                    onChange={(e: any) => handleInputChange('exitPrice', e.target.value)}
                                                />
                                            </InputWrapper>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label className="text-rose-500 !opacity-100">Stop Loss</Label>
                                            <InputWrapper className="border-b-2 border-rose-500/30 focus-within:border-rose-500 rounded-lg overflow-hidden">
                                                <StyledInput
                                                    isDarkMode={isDarkMode}
                                                    type="number"
                                                    placeholder="0.00000"
                                                    className="font-mono tracking-wide !border-none !rounded-none"
                                                    value={formData.stopLoss}
                                                    onChange={(e: any) => handleInputChange('stopLoss', e.target.value)}
                                                />
                                            </InputWrapper>
                                        </div>
                                        <div>
                                            <Label className="text-teal-500 !opacity-100">Take Profit</Label>
                                            <InputWrapper className="border-b-2 border-teal-500/30 focus-within:border-teal-500 rounded-lg overflow-hidden">
                                                <StyledInput
                                                    isDarkMode={isDarkMode}
                                                    type="number"
                                                    placeholder="0.00000"
                                                    className="font-mono tracking-wide !border-none !rounded-none"
                                                    value={formData.takeProfit}
                                                    onChange={(e: any) => handleInputChange('takeProfit', e.target.value)}
                                                />
                                            </InputWrapper>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-dashed border-slate-200 dark:border-[#27272a]">
                                        <Label>Trade Outcome</Label>
                                        <div className="grid grid-cols-4 gap-4">
                                            {['Win', 'Loss', 'BE', 'Pending'].map(res => (
                                                <button
                                                    key={res}
                                                    onClick={() => handleInputChange('result', res)}
                                                    className={`py-4 px-2 rounded-xl border font-bold text-sm transition-all flex flex-col items-center gap-2 ${formData.result === res
                                                        ? (res === 'Win' ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                                                            : res === 'Loss' ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400'
                                                                : 'bg-violet-500/10 border-violet-500 text-violet-600 dark:text-violet-400')
                                                        : `border-transparent ${isDarkMode ? 'bg-[#18181b] text-zinc-500 hover:bg-[#27272a]' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`
                                                        }`}
                                                >
                                                    {res === 'Win' && <CheckCircle2 size={20} />}
                                                    {res === 'Loss' && <XCircle size={20} />}
                                                    {res === 'BE' && <MinusCircle size={20} />}
                                                    {res === 'Pending' && <Clock size={20} />}
                                                    {res}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="relative group">
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="!mb-0">Mindset/Psychology</Label>
                                                {isRestricted && <LockedBadge />}
                                            </div>
                                            <Select
                                                isDarkMode={isDarkMode}
                                                disabled={isRestricted}
                                                icon={Brain}
                                                value={formData.mindset}
                                                onChange={(val) => handleInputChange('mindset', val)}
                                                options={[
                                                    { value: 'Neutral', label: 'Neutral' },
                                                    { value: 'Confident', label: 'Confident' },
                                                    { value: 'Hesitant', label: 'Hesitant' },
                                                    { value: 'Anxious', label: 'Anxious' },
                                                    { value: 'FOMO', label: 'FOMO' },
                                                ]}
                                            />
                                        </div>
                                        <div className="relative group">
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="!mb-0">Plan Adherence</Label>
                                                {isRestricted && <LockedBadge />}
                                            </div>
                                            <Select
                                                isDarkMode={isDarkMode}
                                                disabled={isRestricted}
                                                icon={ShieldCheck}
                                                value={formData.planAdherence}
                                                onChange={(val) => handleInputChange('planAdherence', val)}
                                                options={[
                                                    { value: 'Followed Exactly', label: 'Followed Exactly' },
                                                    { value: 'Minor Deviation', label: 'Minor Deviation' },
                                                    { value: 'Major Deviation', label: 'Major Deviation' },
                                                    { value: 'No Plan', label: 'No Plan' },
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        <div className="col-span-2 relative group">
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="!mb-0">Trading Mistake</Label>
                                                {isRestricted && <LockedBadge />}
                                            </div>
                                            <Select
                                                isDarkMode={isDarkMode}
                                                disabled={isRestricted}
                                                icon={AlertTriangle}
                                                value={formData.tradingMistake}
                                                onChange={(val) => handleInputChange('tradingMistake', val)}
                                                options={[
                                                    { value: 'None', label: 'None' },
                                                    { value: 'Overtrading', label: 'Overtrading' },
                                                    { value: 'Early Exit', label: 'Early Exit' },
                                                    { value: 'Late Entry', label: 'Late Entry' },
                                                    { value: 'Ignored Stop Loss', label: 'Ignored Stop Loss' },
                                                    { value: 'Revenge Trade', label: 'Revenge Trade' },
                                                    { value: 'Wrong Position Size', label: 'Wrong Position Size' },
                                                    { value: 'Ignored Setup', label: 'Ignored Setup' },
                                                    { value: 'FOMO Entry', label: 'FOMO Entry' },
                                                    { value: 'No Plan', label: 'No Plan' },
                                                    { value: 'Other', label: 'Other' },
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Label>Exit Comment</Label>
                                        <RichTextEditor
                                            isDarkMode={isDarkMode}
                                            placeholder="Describe why you exited the trade..."
                                            content={formData.exitComment}
                                            onChange={(val) => handleInputChange('exitComment', val)}
                                            minHeight="120px"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="relative group">
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="!mb-0">Entry/Before Screenshot</Label>
                                                {isRestricted && <LockedBadge />}
                                            </div>
                                            <input
                                                type="file"
                                                ref={beforeInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                disabled={isRestricted}
                                                onChange={(e) => handleFileUpload(e, 'before')}
                                            />
                                            <div
                                                onClick={() => !isRestricted && beforeInputRef.current?.click()}
                                                className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all overflow-hidden relative ${
                                                    isRestricted ? 'opacity-50 cursor-not-allowed border-zinc-200 bg-zinc-50 dark:bg-zinc-900/30' :
                                                    isDarkMode ? 'border-[#27272a] bg-[#18181b]/50 hover:border-violet-500 hover:bg-[#18181b] cursor-pointer' : 'border-slate-300 bg-slate-50 hover:border-violet-500 hover:bg-slate-100 cursor-pointer'
                                                }`}>
                                                {screenshots.before ? (
                                                    <>
                                                        <img src={screenshots.before} className="w-full h-full object-cover" alt="Before" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setPreviewImage({ url: screenshots.before!, title: 'Before Screenshot' }); }}
                                                                className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-lg transition-all"
                                                                title="View Full Size"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteScreenshot('before'); }}
                                                                className="p-2 bg-rose-500/80 backdrop-blur-md hover:bg-rose-500 text-white rounded-lg transition-all"
                                                                title="Delete Image"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                                        <div className={`p-3 rounded-full ${isRestricted ? 'bg-zinc-200 text-zinc-400' : isDarkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                                                            {isRestricted ? <Lock size={20} /> : <ImageIcon size={20} />}
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs font-semibold">{isRestricted ? 'Feature Locked' : 'Click to upload before'}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="!mb-0">Exit/After Screenshot</Label>
                                                {isRestricted && <LockedBadge />}
                                            </div>
                                            <input
                                                type="file"
                                                ref={afterInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                disabled={isRestricted}
                                                onChange={(e) => handleFileUpload(e, 'after')}
                                            />
                                            <div
                                                onClick={() => !isRestricted && afterInputRef.current?.click()}
                                                className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all overflow-hidden relative ${
                                                    isRestricted ? 'opacity-50 cursor-not-allowed border-zinc-200 bg-zinc-50 dark:bg-zinc-900/30' :
                                                    isDarkMode ? 'border-[#27272a] bg-[#18181b]/50 hover:border-violet-500 hover:bg-[#18181b] cursor-pointer' : 'border-slate-300 bg-slate-50 hover:border-violet-500 hover:bg-slate-100 cursor-pointer'
                                                }`}>
                                                {screenshots.after ? (
                                                    <>
                                                        <img src={screenshots.after} className="w-full h-full object-cover" alt="After" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setPreviewImage({ url: screenshots.after!, title: 'After Screenshot' }); }}
                                                                className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-lg transition-all"
                                                                title="View Full Size"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteScreenshot('after'); }}
                                                                className="p-2 bg-rose-500/80 backdrop-blur-md hover:bg-rose-500 text-white rounded-lg transition-all"
                                                                title="Delete Image"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                                        <div className={`p-3 rounded-full ${isRestricted ? 'bg-zinc-200 text-zinc-400' : isDarkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                                                            {isRestricted ? <Lock size={20} /> : <ImageIcon size={20} />}
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs font-semibold">{isRestricted ? 'Feature Locked' : 'Click to upload after'}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="col-span-2">
                                            <Label>Strategy</Label>
                                            <InputWrapper>
                                                <StyledInput
                                                    isDarkMode={isDarkMode}
                                                    icon={Type}
                                                    placeholder="e.g. Trendline Break, News Event"
                                                    value={formData.tags}
                                                    onChange={(e: any) => handleInputChange('tags', e.target.value)}
                                                />
                                            </InputWrapper>
                                            <p className="text-[10px] opacity-50 mt-2 pl-1">Separate strategies with commas</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`w-[380px] shrink-0 border-l p-8 hidden xl:flex flex-col z-10 ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-[#F1F5F9] border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <Label className="!mb-0">Live Ticket Preview</Label>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700 animate-pulse" />
                            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700 animate-pulse delay-75" />
                            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700 animate-pulse delay-150" />
                        </div>
                    </div>

                    <div className={`relative w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 group 
                ${isDarkMode ? 'bg-[#18181b]' : 'bg-white'} 
                ${formData.rating > 0 ? `${ratingTheme.border} ${ratingTheme.shadow} border-2` : (isDarkMode ? 'border border-[#27272a] shadow-black/50' : 'shadow-slate-200')}
            `}>
                        <div className={`h-1.5 w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${themeColor}`} />
                        <div className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-b opacity-5 ${isLong ? 'from-teal-500' : 'from-rose-500'} to-transparent pointer-events-none`} />
                        {formData.rating > 0 && <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${ratingTheme.glow} to-transparent opacity-30 pointer-events-none transition-all duration-500`} />}

                        <div className="p-7 space-y-7 relative">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight">{formData.pair || "---"}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-40 mt-1 flex items-center gap-1.5">
                                        {formData.assetType} <span className="w-1 h-1 rounded-full bg-current opacity-50" /> {formData.session}
                                    </p>
                                    <div key={formData.rating} className="flex items-center gap-0.5 mt-2 animate-in zoom-in-50 duration-300 origin-left">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={10}
                                                className={`${star <= formData.rating
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : isDarkMode ? 'text-zinc-800' : 'text-slate-100'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm ${formData.direction === 'Long'
                                    ? 'bg-teal-500 text-white border-teal-400'
                                    : 'bg-rose-500 text-white border-rose-400'
                                    }`}>
                                    {formData.direction}
                                </div>
                            </div>

                            <div className={`grid grid-cols-2 gap-y-4 gap-x-6 py-5 mx-6 border-y border-dashed ${isDarkMode ? 'border-[#27272a]' : 'border-slate-100'}`}>
                                <div>
                                    <p className="text-[10px] uppercase font-bold opacity-40 mb-1.5">Entry Price</p>
                                    <p className="font-mono text-base font-semibold">{formData.entryPrice || "---"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold opacity-40 mb-1.5">Risk / Reward</p>
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${metrics.rr >= 2 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-[#27272a]'}`}>R</span>
                                        <p className="font-mono text-base font-bold">1 : {metrics.rr > 0 ? metrics.rr : "-"}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold opacity-40 mb-1.5">Stop Loss</p>
                                    <p className="font-mono text-sm font-medium text-rose-500">{formData.stopLoss || "---"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold opacity-40 mb-1.5">Take Profit</p>
                                    <p className="font-mono text-sm font-medium text-teal-500">{formData.takeProfit || "---"}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="opacity-50 font-medium">Position Size</span>
                                    <span className="font-mono font-bold">{formData.lots} Lots</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="opacity-50 font-medium">Potential Risk</span>
                                    <span className="font-mono font-medium text-rose-500">-{currencySymbol}{metrics.risk.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="opacity-50 font-medium">Potential Reward</span>
                                    <span className="font-mono font-bold text-teal-500">+{currencySymbol}{metrics.reward.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className={`py-3 px-6 text-center text-[10px] font-bold uppercase tracking-widest flex items-center justify-between ${isDarkMode ? 'bg-[#09090b] text-zinc-500 border-t border-[#27272a]' : 'bg-slate-50 text-slate-500'}`}>
                            <span>Status</span>
                            <span className={formData.entryPrice && formData.stopLoss ? 'text-blue-500' : 'opacity-50'}>
                                {formData.entryPrice && formData.stopLoss ? 'Ready to Submit' : 'Incomplete'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`p-6 shrink-0 flex justify-between items-center z-20 relative ${isDarkMode ? 'bg-[#09090b]' : 'bg-white border-slate-200'}`}>
                <div className={`absolute top-0 left-8 right-8 h-px ${isDarkMode ? 'bg-[#27272a]' : 'bg-slate-200'}`} />
                <button
                    onClick={prevStep}
                    disabled={step === 1}
                    className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-slate-100 dark:hover:bg-[#27272a] text-zinc-500'
                        }`}
                >
                    <ChevronLeft size={16} /> Back
                </button>

                {step < 3 ? (
                    <button
                        onClick={nextStep}
                        className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md ${isDarkMode ? 'bg-zinc-100 text-black hover:bg-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                    >
                        Continue <ChevronRight size={16} />
                    </button>
                ) : (
                    <div className="w-24" /> // Spacer
                )}
            </div>

            {confirmModal.isOpen && (
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    description={confirmModal.description}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    showCancel={confirmModal.showCancel}
                    isDarkMode={isDarkMode}
                />
            )}
        </div>
    );
};

export default LogTrade;
