import React, { useState, useMemo } from 'react';
import { 
  Search, List, X, Upload, Image as ImageIcon, TrendingUp, TrendingDown, 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Activity, 
  Brain, ShieldCheck, ArrowUpRight, ArrowDownRight, Edit3, 
  ChevronDown, Clock, CheckCircle2, Trash2, CheckSquare, Square, 
  Trophy, CheckCircle, LayoutPanelTop, Target, Star, Eye
} from 'lucide-react';
import { Trade, UserProfile } from '../types';

interface JournalProps {
  isDarkMode: boolean;
  trades: Trade[];
  onUpdateTrade: (trade: Trade) => void;
  onDeleteTrades: (tradeIds: string[]) => void;
  onEditTrade: (trade: Trade) => void;
  userProfile: UserProfile;
}

const ReadOnlyStarRating = ({ rating, isDarkMode }: { rating: number, isDarkMode: boolean }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star 
        key={star} 
        size={12} 
        className={`${
          star <= rating 
            ? 'text-amber-400 fill-amber-400' 
            : isDarkMode ? 'text-zinc-700' : 'text-slate-200'
        }`} 
      />
    ))}
  </div>
);

const MiniCalendar = ({ year, month, trades, isDarkMode, onClick }: any) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthTrades = trades.filter((t: Trade) => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    const getDayStyle = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTrades = monthTrades.filter((t: Trade) => t.date === dateStr);
        if (dayTrades.length === 0) return { bg: isDarkMode ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600', text: '' };
        const pnl = dayTrades.reduce((acc: number, t: Trade) => acc + t.pnl, 0);
        if (pnl > 0) return { bg: 'bg-emerald-500 shadow-sm shadow-emerald-500/20', text: 'text-white font-bold' };
        if (pnl < 0) return { bg: 'bg-rose-500 shadow-sm shadow-rose-500/20', text: 'text-white font-bold' };
        return { bg: 'bg-zinc-400', text: 'text-white font-bold' };
    };

    return (
        <div onClick={onClick} className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${isDarkMode ? 'bg-[#121215] border-[#27272a]' : 'bg-white border-slate-100 shadow-md'}`}>
            <div className="flex justify-between items-center mb-4">
                <h4 className={`text-sm font-bold ${isDarkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{new Date(year, month).toLocaleString('default', { month: 'long' })}</h4>
                {monthTrades.length > 0 && (<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>{monthTrades.length} Trades</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
                {['S','M','T','W','T','F','S'].map(d => (<div key={d} className="text-[9px] font-bold opacity-30 text-center">{d}</div>))}
                {blanks.map(b => <div key={`b-${b}`} />)}
                {days.map(d => { 
                    const style = getDayStyle(d); 
                    return (<div key={d} className={`aspect-square rounded-md flex items-center justify-center text-[10px] transition-colors ${style.bg} ${style.text}`}>{d}</div>) 
                })}
            </div>
        </div>
    );
};

const CalendarView = ({ isDarkMode, trades, userProfile }: { isDarkMode: boolean, trades: Trade[], userProfile: UserProfile }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [mode, setMode] = useState<'month' | 'year'>('month');
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); 
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    const prev = () => { if (mode === 'month') setCurrentDate(new Date(year, month - 1, 1)); else setCurrentDate(new Date(year - 1, month, 1)); };
    const next = () => { if (mode === 'month') setCurrentDate(new Date(year, month + 1, 1)); else setCurrentDate(new Date(year + 1, month, 1)); };
    const getTradesForDay = (day: number) => { const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; return trades.filter(t => t.date === dateStr); };

    const { monthlyStats, weekdayStats } = useMemo(() => {
        const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        const monthTrades = trades.filter(t => t.date.startsWith(currentMonthStr));
        const totalPnL = monthTrades.reduce((acc, t) => acc + t.pnl, 0);
        const winTrades = monthTrades.filter(t => t.result === 'Win').length;
        const totalCount = monthTrades.length;
        const winRateTotal = totalCount > 0 ? (winTrades / totalCount) * 100 : 0;
        
        const dayMap: Record<string, number> = {};
        monthTrades.forEach(t => { dayMap[t.date] = (dayMap[t.date] || 0) + t.pnl; });
        const winDays = Object.values(dayMap).filter(p => p > 0).length;
        const lossDays = Object.values(dayMap).filter(p => p < 0).length;

        const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const wdStats = weekdayNames.map((name, index) => {
            const dayTrades = monthTrades.filter(t => new Date(t.date).getDay() === index);
            const netProfits = dayTrades.reduce((acc, t) => acc + t.pnl, 0);
            const totalProfits = dayTrades.reduce((acc, t) => t.pnl > 0 ? acc + t.pnl : acc, 0);
            const totalLoss = dayTrades.reduce((acc, t) => t.pnl < 0 ? acc + t.pnl : acc, 0);
            const wCount = dayTrades.filter(t => t.result === 'Win').length;
            const lCount = dayTrades.filter(t => t.result === 'Loss').length;
            const tCount = dayTrades.length;
            const wRate = tCount > 0 ? (wCount / tCount) * 100 : 0;
            const lRate = tCount > 0 ? (lCount / tCount) * 100 : 0;

            return { name, netProfits, totalProfits, totalLoss, wRate, lRate, tCount };
        });

        return { 
            monthlyStats: { totalPnL, winRate: winRateTotal, totalCount, winTrades, winDays, lossDays },
            weekdayStats: wdStats
        };
    }, [trades, year, month]);

    const isToday = (day: number) => { const today = new Date(); return day === today.getDate() && month === today.getMonth() && year === today.getFullYear(); };

    return (
        <div className="h-full flex flex-col">
            <div className={`flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b shrink-0 ${isDarkMode ? 'border-[#27272a] bg-[#121215]' : 'border-slate-100 bg-white'}`}>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center p-1 rounded-xl border ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                        <button onClick={prev} className={`p-2 rounded-lg hover:bg-opacity-10 ${isDarkMode ? 'hover:bg-white text-zinc-400' : 'hover:bg-black text-slate-500'}`}><ChevronLeft size={18} /></button>
                        <span className={`w-40 text-center font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{mode === 'month' ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : year}</span>
                        <button onClick={next} className={`p-2 rounded-lg hover:bg-opacity-10 ${isDarkMode ? 'hover:bg-white text-zinc-400' : 'hover:bg-black text-slate-500'}`}><ChevronRight size={18} /></button>
                    </div>
                    <div className={`flex rounded-lg border overflow-hidden p-1 gap-1 ${isDarkMode ? 'border-[#27272a] bg-[#09090b]' : 'border-slate-200 bg-slate-50'}`}>
                         <button onClick={() => setMode('month')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${mode === 'month' ? (isDarkMode ? 'bg-zinc-800 text-white shadow' : 'bg-white text-slate-900 shadow') : 'text-zinc-500'}`}>Month</button>
                         <button onClick={() => setMode('year')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${mode === 'year' ? (isDarkMode ? 'bg-zinc-800 text-white shadow' : 'bg-white text-slate-900 shadow') : 'text-zinc-500'}`}>Year</button>
                    </div>
                </div>
                {mode === 'month' && (
                    <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Winning Days</span>
                            <div className="flex items-center gap-1.5">
                                <Trophy size={14} className="text-amber-500" />
                                <span className={`font-bold ${isDarkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{monthlyStats.winDays}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Losing Days</span>
                            <div className="flex items-center gap-1.5">
                                <TrendingDown size={14} className="text-rose-500" />
                                <span className={`font-bold ${isDarkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{monthlyStats.lossDays}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Winning Trades</span>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle size={14} className="text-emerald-500" />
                                <span className={`font-bold ${isDarkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{monthlyStats.winTrades}</span>
                            </div>
                        </div>
                        <div className={`w-px h-8 hidden lg:block ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Net P&L</span>
                            <span className={`font-mono font-bold text-lg ${monthlyStats.totalPnL > 0 ? 'text-teal-500' : monthlyStats.totalPnL < 0 ? 'text-rose-500' : isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                                {monthlyStats.totalPnL > 0 ? '+' : ''}{userProfile.currencySymbol}{Math.abs(monthlyStats.totalPnL).toLocaleString()}
                            </span>
                        </div>
                        <div className={`w-px h-8 hidden lg:block ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Win Rate</span>
                            <div className="flex items-center gap-1.5"><Activity size={14} className="text-purple-500" /><span className={`font-bold ${isDarkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{monthlyStats.winRate.toFixed(0)}%</span></div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 pb-0 ${isDarkMode ? 'bg-[#09090b]' : 'bg-slate-50/50'}`}>
                {mode === 'month' && (
                    <div className={`mb-8 border-t border-l border-r rounded-t-2xl overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <button 
                            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                            className={`w-full flex items-center justify-between p-4 px-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
                        >
                            <div className="flex items-center gap-3">
                                <LayoutPanelTop size={18} className="text-indigo-500" />
                                <span className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-200' : 'text-slate-700'}`}>Performance Summary</span>
                            </div>
                            <ChevronDown size={20} className={`transition-transform duration-300 ${isSummaryOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
                        </button>
                        
                        <div className={`transition-all duration-300 overflow-hidden ${isSummaryOpen ? 'max-h-[1000px] border-t dark:border-zinc-800 border-slate-100' : 'max-h-0'}`}>
                            <div className="p-6 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className={`text-[10px] font-black uppercase tracking-widest border-b dark:border-zinc-800 border-slate-100 ${isDarkMode ? 'text-zinc-200 opacity-40' : 'text-slate-500 opacity-70'}`}>
                                            <th className="pb-4 font-bold">Day</th>
                                            <th className="pb-4 font-bold">Net Profits</th>
                                            <th className="pb-4 font-bold text-center">Winning %</th>
                                            <th className="pb-4 font-bold text-right">Total Profits</th>
                                            <th className="pb-4 font-bold text-right pr-4">Total Loss</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`text-xs font-bold divide-y dark:divide-zinc-800/50 divide-slate-100 ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                                        {weekdayStats.map((wd) => (
                                            <tr key={wd.name} className="group">
                                                <td className="py-4 opacity-80">{wd.name}</td>
                                                <td className={`py-4 font-mono font-black ${wd.netProfits > 0 ? 'text-emerald-500' : wd.netProfits < 0 ? 'text-rose-500' : (isDarkMode ? 'opacity-40' : 'text-slate-400')}`}>
                                                    {wd.netProfits === 0 ? userProfile.currencySymbol + '0.00' : (wd.netProfits > 0 ? '+' : '-') + userProfile.currencySymbol + Math.abs(wd.netProfits).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center justify-center">
                                                        {wd.tCount > 0 ? (
                                                            <div className={`relative w-32 h-2.5 rounded-full overflow-hidden flex ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                                                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-400/30 z-10" />
                                                                <div className="h-full bg-rose-500/80 ml-auto transition-all" style={{ width: `${wd.lRate / 2}%` }} />
                                                                <div className="h-full bg-emerald-500/80 transition-all" style={{ width: `${wd.wRate / 2}%` }} />
                                                            </div>
                                                        ) : (
                                                            <span className="opacity-30">--</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right font-mono text-emerald-500">
                                                    {userProfile.currencySymbol}{wd.totalProfits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-4 text-right pr-4 font-mono text-rose-500">
                                                    -{userProfile.currencySymbol}{Math.abs(wd.totalLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'month' ? (
                    <>
                        <div className="grid grid-cols-7 gap-4 text-center mb-4">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-xs font-bold uppercase opacity-30">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-4 auto-rows-fr">
                            {blanks.map(b => <div key={`blank-${b}`} className="min-h-[115px]" />)}
                            {days.map(day => { 
                                const dayTrades = getTradesForDay(day); 
                                const hasTrades = dayTrades.length > 0; 
                                const dayPnL = dayTrades.reduce((acc, t) => acc + t.pnl, 0); 
                                const isPositive = dayPnL > 0; 
                                const isCurrentDay = isToday(day); 
                                return (
                                    <div key={day} className={`relative rounded-xl border p-2.5 flex flex-col justify-between min-h-[115px] transition-all duration-200 overflow-hidden group ${isDarkMode ? 'bg-[#18181b] border-[#27272a] hover:border-zinc-600' : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'} ${isCurrentDay ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#09090b]' : ''} ${hasTrades ? (isPositive ? (isDarkMode ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100') : (isDarkMode ? 'bg-rose-900/10 border-rose-500/20' : 'bg-rose-50 border-rose-100')) : ''}`}>
                                        <div className="flex justify-between items-start relative z-10">
                                            <span className={`text-sm font-bold ${isCurrentDay ? 'text-indigo-500' : isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{day}</span>
                                            {hasTrades && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-zinc-900/50' : 'bg-white/50'}`}>{dayTrades.length}</span>}
                                        </div>
                                        <div className="flex flex-col items-center justify-center gap-1 my-2 relative z-10">
                                            {hasTrades ? <div className={`text-lg font-mono font-bold tracking-tight ${isPositive ? 'text-emerald-500' : dayPnL < 0 ? 'text-rose-500' : 'text-zinc-500'}`}>{isPositive ? '+' : dayPnL < 0 ? '-' : ''}{userProfile.currencySymbol}{Math.abs(dayPnL).toLocaleString()}</div> : null}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 justify-center relative z-10 h-2">
                                            {dayTrades.map((t, idx) => (
                                                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${t.result === 'Win' ? 'bg-emerald-500' : t.result === 'Loss' ? 'bg-rose-500' : 'bg-zinc-400'}`} title={`${t.pair} (${t.result})`} />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95">
                        {Array.from({length: 12}).map((_, i) => (
                            <MiniCalendar key={i} year={year} month={i} trades={trades} isDarkMode={isDarkMode} onClick={() => { setCurrentDate(new Date(year, i, 1)); setMode('month'); }} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Journal: React.FC<JournalProps> = ({ isDarkMode, trades, onUpdateTrade, onDeleteTrades, onEditTrade, userProfile }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    const filteredTrades = useMemo(() => {
        let result = trades.filter(t => 
            t.pair.toLowerCase().includes(searchTerm.toLowerCase()) || 
            t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
            t.assetType.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return result.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
            const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
            return dateB.getTime() - dateA.getTime();
        });
    }, [trades, searchTerm]);

    const toggleExpand = (id: string) => { setExpandedTradeId(expandedTradeId === id ? null : id); };
    const handleSelectAll = () => { if (selectedIds.length === filteredTrades.length) setSelectedIds([]); else setSelectedIds(filteredTrades.map(t => t.id)); };
    const handleSelectOne = (id: string) => { if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(item => item !== id)); else setSelectedIds(prev => [...prev, id]); };
    const handleBulkDelete = () => { if (selectedIds.length === 0) return; onDeleteTrades(selectedIds); setSelectedIds([]); };
    const handleUpload = (trade: Trade, type: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files || !e.target.files[0]) return; const file = e.target.files[0]; const reader = new FileReader(); reader.onloadend = () => { onUpdateTrade({ ...trade, [type === 'before' ? 'beforeScreenshot' : 'afterScreenshot']: reader.result as string }); }; reader.readAsDataURL(file); };
    const handleDeleteImage = (trade: Trade, type: 'before' | 'after') => {
        onUpdateTrade({
            ...trade,
            [type === 'before' ? 'beforeScreenshot' : 'afterScreenshot']: undefined
        });
    };

    const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);

    const renderTradeDetails = (trade: Trade) => (
        <div className={`col-span-8 mt-1 mb-6 rounded-2xl overflow-hidden border animate-in slide-in-from-top-2 duration-300 shadow-xl relative ${isDarkMode ? 'bg-[#09090b] border-[#27272a] shadow-black' : 'bg-white border-slate-200'}`}>
            <div className={`relative px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="flex items-center gap-6">
                    <div>
                        <div className={`text-4xl font-mono font-black tracking-tighter leading-none ${trade.pnl > 0 ? 'text-emerald-400' : trade.pnl < 0 ? 'text-rose-500' : 'text-zinc-500'}`}>
                            {trade.pnl > 0 ? '+' : trade.pnl < 0 ? '-' : ''}{userProfile.currencySymbol}{Math.abs(trade.pnl).toLocaleString()}
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mt-1">Net P&L</div>
                    </div>
                    <div className={`w-px h-10 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black tracking-tight">{trade.pair}</h2>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${trade.direction === 'Long' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{trade.direction}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-indigo-500 text-white`}>{trade.assetType}</span>
                        </div>
                        <div className="flex items-center gap-3 opacity-50 text-xs font-medium mt-0.5">
                            <span className="flex items-center gap-1">{trade.date}</span>
                            <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                            <span className="flex items-center gap-1">{trade.time}</span>
                            <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                            <span className="flex items-center gap-1">{trade.session}</span>
                            <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                            <div className="flex items-center gap-1" title={`Rating: ${trade.rating || 0}/5`}>
                                <ReadOnlyStarRating rating={trade.rating || 0} isDarkMode={isDarkMode} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => onEditTrade(trade)}
                        className={`p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-white text-slate-500 shadow-sm border border-slate-200'}`} 
                        title="Edit Entry"
                    >
                        <Edit3 size={16} />
                    </button>
                    <button onClick={() => setExpandedTradeId(null)} className={`p-2 rounded-lg transition-all bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white`}><X size={18} /></button>
                </div>
            </div>
            <div className="relative p-6">
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-4">
                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-slate-50/50 border-slate-200'}`}>
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Execution</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="opacity-50">Entry</span><span className="font-mono font-bold">{trade.entryPrice}</span></div>
                                <div className="flex justify-between"><span className="opacity-50">Stop Loss</span><span className="font-mono font-bold text-rose-500">{trade.stopLoss}</span></div>
                                <div className="flex justify-between"><span className="opacity-50">Take Profit</span><span className="font-mono font-bold text-emerald-500">{trade.takeProfit}</span></div>
                                <div className="h-px bg-current opacity-10 my-2" />
                                <div className="flex justify-between"><span className="opacity-50">Volume</span><span className="font-bold">{trade.lots} Lots</span></div>
                                <div className="flex justify-between"><span className="opacity-50">R:R Ratio</span><span className="font-bold text-indigo-500">1 : {trade.rr}</span></div>
                            </div>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-slate-50/50 border-slate-200'}`}>
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Psychology</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="opacity-50">Mindset</span><span className="font-bold">{trade.mindset || 'Neutral'}</span></div>
                                <div className="flex justify-between"><span className="opacity-50">Plan</span><span className="font-bold">{trade.planAdherence || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="opacity-50">Mistake</span><span className="font-bold text-rose-500">{trade.tradingMistake || 'None'}</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-12 md:col-span-8 lg:col-span-5 space-y-4">
                        <div className={`p-5 rounded-xl border min-h-[140px] ${isDarkMode ? 'bg-zinc-900/20 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Entry Note</h4>
                            {trade.notes ? (
                                <div 
                                    className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: trade.notes }}
                                />
                            ) : (
                                <p className="text-sm opacity-50 italic">No entry comments recorded.</p>
                            )}
                        </div>
                        <div className={`p-5 rounded-xl border min-h-[140px] ${isDarkMode ? 'bg-zinc-900/20 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Exit Note</h4>
                            {trade.exitComment ? (
                                <div 
                                    className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: trade.exitComment }}
                                />
                            ) : (
                                <p className="text-sm opacity-50 italic">No exit comments recorded.</p>
                            )}
                        </div>
                    </div>
                    <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-3 content-start">
                        {[{ id: 'before', label: 'Before', data: trade.beforeScreenshot }, { id: 'after', label: 'After', data: trade.afterScreenshot }].map((slot) => (
                            <div key={slot.id} className="relative group aspect-square rounded-xl border overflow-hidden bg-black/5 dark:bg-white/5 border-dashed border-zinc-300 dark:border-zinc-700">
                                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[9px] font-bold text-white uppercase tracking-wider">{slot.label}</div>
                                {slot.data ? (
                                    <>
                                        <img src={slot.data} alt={slot.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button 
                                                onClick={() => setPreviewImage({ url: slot.data!, title: `${trade.pair} - ${slot.label} Screenshot` })}
                                                className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-lg transition-all transform scale-90 group-hover:scale-100"
                                                title="View Full Size"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteImage(trade, slot.id as any)}
                                                className="p-2 bg-rose-500/80 backdrop-blur-md hover:bg-rose-500 text-white rounded-lg transition-all transform scale-90 group-hover:scale-100"
                                                title="Delete Image"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
                                            <ImageIcon size={20} className="mb-2" />
                                            <span className="text-[9px] font-bold">No Image</span>
                                        </div>
                                        <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                            <div className="p-2 bg-white text-black rounded-lg shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                                <Upload size={16} />
                                            </div>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(trade, slot.id as any, e)} />
                                        </label>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`w-full h-full overflow-hidden flex flex-col p-8 pb-0 ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-slate-50 text-slate-900'}`}>
            {/* Image Preview Modal */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200"
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
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Trade Journal</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Detailed history of your market execution.</p>
                </div>
                {selectedIds.length > 0 ? (
                    <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
                        <span className="text-sm font-bold opacity-60 mr-2">{selectedIds.length} Selected</span>
                        <button onClick={() => setSelectedIds([])} className={`p-2 rounded flex items-center gap-2 text-xs font-bold transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>Cancel</button>
                        <button onClick={handleBulkDelete} className="p-2 rounded flex items-center gap-2 text-xs font-bold transition-all bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20"><Trash2 size={16} /> Delete Selected</button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <div className={`flex rounded-lg border overflow-hidden p-1 gap-1 ${isDarkMode ? 'border-[#27272a] bg-[#18181b]' : 'border-slate-200 bg-white'}`}>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'list' ? (isDarkMode ? 'bg-zinc-800 text-white shadow' : 'bg-slate-100 text-slate-900') : 'text-zinc-500 hover:text-zinc-300'}`}><List size={16} /> List</button>
                            <button onClick={() => setViewMode('calendar')} className={`p-2 rounded flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'calendar' ? (isDarkMode ? 'bg-zinc-800 text-white shadow' : 'bg-slate-100 text-slate-900') : 'text-zinc-500 hover:text-zinc-300'}`}><CalendarIcon size={16} /> Calendar</button>
                        </div>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input 
                                placeholder="Search pair, tag or asset..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className={`pl-10 pr-4 py-2 rounded-lg border text-sm outline-none w-64 ${isDarkMode ? 'bg-[#18181b] border-[#27272a] focus:border-blue-500' : 'bg-white border-slate-200'}`} 
                            />
                        </div>
                    </div>
                )}
            </header>
            
            <div className={`flex-1 rounded-t-2xl border-t border-l border-r overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                {viewMode === 'calendar' ? (
                    <CalendarView isDarkMode={isDarkMode} trades={trades} userProfile={userProfile} />
                ) : (
                    <>
                        <div className={`grid grid-cols-[40px_1.5fr_1fr_1fr_1.2fr_1.2fr_1.5fr_0.8fr_1.2fr_40px] px-6 py-4 border-b text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'border-[#27272a] text-zinc-500' : 'border-slate-100 text-slate-400'}`}>
                            <div className="col-span-1 flex items-center justify-center">
                                <button onClick={handleSelectAll} className="opacity-50 hover:opacity-100">
                                    {selectedIds.length > 0 && selectedIds.length === filteredTrades.length ? <CheckSquare size={16} /> : <Square size={16} />}
                                </button>
                            </div>
                            <div className="col-span-1 pl-2">Date/Time</div>
                            <div className="col-span-1">Pair</div>
                            <div className="col-span-1">Type</div>
                            <div className="col-span-1">Direction</div>
                            <div className="col-span-1">Session</div>
                            <div className="col-span-1">Tags</div>
                            <div className="col-span-1">Rating</div>
                            <div className="col-span-1 text-right">PnL / Result</div>
                            <div className="col-span-1"></div>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar flex-1 px-4">
                            {filteredTrades.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-30">
                                    <h3 className="text-xl font-bold">No Trades Found</h3>
                                </div>
                            ) : (
                                filteredTrades.map(trade => (
                                    <React.Fragment key={trade.id}>
                                        <div className={`grid grid-cols-[40px_1.5fr_1fr_1fr_1.2fr_1.2fr_1.5fr_0.8fr_1.2fr_40px] px-2 py-4 border-b items-center transition-all rounded-xl mt-1 ${expandedTradeId === trade.id ? (isDarkMode ? 'bg-zinc-800/50 border-indigo-500/50' : 'bg-slate-50 border-indigo-200 shadow-inner') : (isDarkMode ? 'border-[#27272a] hover:bg-zinc-800/30' : 'border-slate-100 hover:bg-slate-50')} ${selectedIds.includes(trade.id) ? (isDarkMode ? 'bg-indigo-900/10' : 'bg-indigo-50') : ''}`}>
                                            <div className="col-span-1 flex items-center justify-center">
                                                <button onClick={() => handleSelectOne(trade.id)} className={`${selectedIds.includes(trade.id) ? 'text-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                                    {selectedIds.includes(trade.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                                </button>
                                            </div>
                                            <div className="col-span-1 pl-2 cursor-pointer" onClick={() => toggleExpand(trade.id)}>
                                                <p className="font-bold text-sm">{trade.date}</p>
                                                <p className="text-xs opacity-50">{trade.time}</p>
                                            </div>
                                            <div className="col-span-1 font-bold cursor-pointer" onClick={() => toggleExpand(trade.id)}>{trade.pair}</div>
                                            <div className="col-span-1 text-xs opacity-70 cursor-pointer" onClick={() => toggleExpand(trade.id)}>{trade.assetType}</div>
                                            <div className="col-span-1 cursor-pointer" onClick={() => toggleExpand(trade.id)}>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${trade.direction === 'Long' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    {trade.direction === 'Long' ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {trade.direction}
                                                </span>
                                            </div>
                                            <div className="col-span-1 text-xs opacity-80 cursor-pointer" onClick={() => toggleExpand(trade.id)}>{trade.session}</div>
                                            <div className="col-span-1 flex flex-wrap gap-1 cursor-pointer" onClick={() => toggleExpand(trade.id)}>
                                                {trade.tags.slice(0, 2).map((tag, i) => (
                                                    <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${isDarkMode ? 'border-zinc-700 bg-zinc-800' : 'border-slate-200 bg-slate-100'}`}>{tag}</span>
                                                ))}
                                                {trade.tags.length > 2 && <span className="text-[10px] opacity-50">+{trade.tags.length - 2}</span>}
                                            </div>
                                            <div className="col-span-1 cursor-pointer" onClick={() => toggleExpand(trade.id)}>
                                                <ReadOnlyStarRating rating={trade.rating || 0} isDarkMode={isDarkMode} />
                                            </div>
                                            <div className="col-span-1 text-right cursor-pointer" onClick={() => toggleExpand(trade.id)}>
                                                <p className={`font-mono font-bold ${trade.pnl > 0 ? 'text-emerald-500' : trade.pnl < 0 ? 'text-rose-500' : ''}`}>
                                                    {trade.pnl > 0 ? '+' : trade.pnl < 0 ? '-' : ''}{userProfile.currencySymbol}{Math.abs(trade.pnl).toLocaleString()}
                                                </p>
                                                <p className={`text-[10px] font-bold uppercase ${trade.result === 'Win' ? 'text-emerald-500' : trade.result === 'Loss' ? 'text-rose-500' : 'text-zinc-500'}`}>
                                                    {trade.result} {trade.rr > 0 ? `(${trade.rr}R)` : ''}
                                                </p>
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <div onClick={() => toggleExpand(trade.id)} className={`p-1 rounded-full cursor-pointer transition-all ${expandedTradeId === trade.id ? 'rotate-180 bg-indigo-500 text-white' : isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                                                    <ChevronDown size={18} />
                                                </div>
                                            </div>
                                        </div>
                                        {expandedTradeId === trade.id && renderTradeDetails(trade)}
                                    </React.Fragment>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Journal;