
import React, { useState, useMemo } from 'react';
import {
    Target, Trophy, Calendar, Plus, Activity, TrendingUp, Sparkles, Clock,
    DollarSign, Brain, Shield, Flag, BarChart, Percent, CheckCircle2,
    ArrowRight, ChevronLeft, Trash2, Settings2, TrendingDown, X,
    ChevronDown, Info, Check, Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Goal, Trade, MetricType, GoalType, GoalMilestone } from '../types'; import { Select } from './Select';
import ConfirmationModal from './ConfirmationModal';

interface GoalsProps {
    isDarkMode: boolean;
    trades: Trade[];
    goals: Goal[];
    onAddGoal: (goal: Goal) => Promise<void>;
    onUpdateGoal: (goal: Goal) => Promise<void>;
    onDeleteGoal: (id: string) => Promise<void>;
    currencySymbol: string;
}

// --- UTILITY COMPONENTS ---

const DateInput = ({ label, value, onChange, min, isDarkMode }: any) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return 'Select Date';
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        return adjustedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const displayDate = value ? formatDate(value) : 'Select Date';

    return (
        <div className="relative w-full group">
            {label && <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1.5 block ml-1">{label}</label>}
            <div className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 
            ${isDarkMode
                    ? 'bg-[#0c0c0e] border-[#27272a] hover:border-zinc-600 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10'
                    : 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-indigo-500 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10'
                }`}>
                <Calendar size={16} className="text-indigo-500 shrink-0" />
                <span className={`text-sm font-medium flex-1 ${!value ? 'opacity-50' : ''}`}>{displayDate}</span>
                <ChevronDown size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />

                <input
                    type="date"
                    value={value || ''}
                    min={min}
                    onChange={onChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                />
            </div>
        </div>
    );
};

const ProgressBar = ({ progress, colorClass, height = 'h-2' }: { progress: number, colorClass: string, height?: string }) => (
    <div className={`w-full ${height} rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden`}>
        <div
            className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
    </div>
);

const ProgressChart = ({ goal, trades, isDarkMode }: { goal: Goal, trades: Trade[], isDarkMode: boolean }) => {
    const data = useMemo(() => {
        let points: { date: string, value: number }[] = [];
        
        if (goal.autoTrackRule) {
            const relevantTrades = trades
                .filter(t => t.date >= goal.startDate && t.date <= goal.endDate)
                .filter(t => !goal.autoTrackRule?.filterTag || t.tags.some(tag => tag.includes(goal.autoTrackRule!.filterTag!)))
                .sort((a, b) => a.date.localeCompare(b.date));

            let cumulative = 0;
            points = relevantTrades.map(t => {
                if (goal.autoTrackRule?.type === 'pnl') cumulative += t.pnl;
                else if (goal.autoTrackRule?.type === 'trade_count') cumulative += 1;
                else if (goal.autoTrackRule?.type === 'win_rate') {
                    // Win rate is harder to cumulative line, showing simple count for now or skip
                    cumulative += t.result === 'Win' ? 1 : 0;
                }
                return { date: t.date, value: cumulative };
            });
        } else {
            const entries = [...(goal.manualEntries || [])].sort((a, b) => a.date.localeCompare(b.date));
            let cumulative = goal.startValue || 0;
            points = entries.map(e => {
                cumulative += e.value;
                return { date: e.date, value: cumulative };
            });
        }

        if (points.length < 2) return null;

        const values = points.map(p => p.value);
        const min = Math.min(...values, goal.targetValue * 0.1);
        const max = Math.max(...values, goal.targetValue);
        const range = max - min || 1;

        const path = points.map((p, i) => {
            const x = (i / (points.length - 1)) * 100;
            const y = 100 - ((p.value - min) / range) * 100;
            return `${x},${y}`;
        }).join(' L ');

        return { path, min, max };
    }, [goal, trades]);

    if (!data) return null;

    return (
        <div className="h-32 w-full mt-6 relative group">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="goalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path 
                    d={`M 0,100 L ${data.path} L 100,100 Z`} 
                    fill="url(#goalGradient)" 
                    className="transition-all duration-1000"
                />
                <path 
                    d={`M ${data.path}`} 
                    fill="none" 
                    stroke="#6366f1" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="transition-all duration-1000"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className={`px-2 py-1 rounded text-[10px] font-bold ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-slate-500'} border border-current opacity-20`}>
                    Progress Curve
                </div>
            </div>
        </div>
    );
};

// --- LOGIC HELPERS ---

const calculateProgress = (goal: Goal, trades: Trade[]) => {
    if (goal.autoTrackRule) {
        let relevantTrades = trades.filter(t => t.date >= goal.startDate && t.date <= goal.endDate);
        if (goal.autoTrackRule?.filterTag) {
            relevantTrades = relevantTrades.filter(t => t.tags.some(tag => tag.includes(goal.autoTrackRule!.filterTag!)));
        }
        switch (goal.autoTrackRule.type) {
            case 'pnl':
                return relevantTrades.reduce((acc, t) => acc + t.pnl, 0);
            case 'trade_count':
                return relevantTrades.length;
            case 'win_rate':
                if (relevantTrades.length === 0) return 0;
                const wins = relevantTrades.filter(t => t.result === 'Win').length;
                return (wins / relevantTrades.length) * 100;
            case 'drawdown':
                if (relevantTrades.length === 0) return 0;
                // Sort trades chronologically for accurate drawdown tracking
                const sortedTrades = [...relevantTrades].sort((a, b) => {
                    const timeA = new Date(`${a.date} ${a.time || '00:00'}`).getTime();
                    const timeB = new Date(`${b.date} ${b.time || '00:00'}`).getTime();
                    return timeA - timeB;
                });

                let maxDrawdown = 0;
                let peak = 0;
                let currentBalance = 0;
                sortedTrades.forEach(t => {
                    currentBalance += t.pnl;
                    if (currentBalance > peak) peak = currentBalance;
                    const dd = peak - currentBalance;
                    if (dd > maxDrawdown) maxDrawdown = dd;
                });
                return maxDrawdown;
            default:
                return 0;
        }
    }
    
    // Sum of manual entries
    const manualSum = (goal.manualEntries || []).reduce((acc, entry) => acc + entry.value, 0);
    return (goal.manualProgress || 0) + manualSum;
};

const formatMetric = (val: number, type: MetricType, symbol: string) => {
    if (type === 'currency') return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (type === 'percentage') return `${val.toFixed(1)}%`;
    if (type === 'count') return `${val}`;
    return val.toString();
};

const getDaysRemaining = (endDate: string) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(0, 0, 0, 0);
    return Math.ceil((end - today) / (1000 * 3600 * 24));
};

const Goals: React.FC<GoalsProps> = ({ isDarkMode, trades, goals, onAddGoal, onUpdateGoal, onDeleteGoal, currencySymbol }) => {
    const [view, setView] = useState<'dashboard' | 'wizard' | 'detail'>('dashboard');
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { }
    });

    // Wizard State
    const [wizardStep, setWizardStep] = useState(1);
    const [isEditing, setIsEditing] = useState(false);
    const [newGoal, setNewGoal] = useState<Partial<Goal>>({
        type: 'Financial',
        metric: 'currency',
        startDate: new Date().toLocaleDateString('en-CA'),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
        autoTrackRule: { type: 'pnl' },
        milestones: []
    });

    // Milestone Add State
    const [isAddingMilestone, setIsAddingMilestone] = useState(false);
    const [milestoneForm, setMilestoneForm] = useState({ title: '', target: '' });

    // Manual Progress Add State
    const [isAddingManualEntry, setIsAddingManualEntry] = useState(false);
    const [manualEntryForm, setManualEntryForm] = useState({ value: '', note: '' });

    // Celebration State
    const [celebratedGoals, setCelebratedGoals] = useState<Set<string>>(new Set());

    const selectedGoal = useMemo(() => goals.find(g => g.id === selectedGoalId), [goals, selectedGoalId]);

    // Actions
    const checkMilestones = (goal: Goal, currentProgress: number): Goal => {
        let changed = false;
        const updatedMilestones = goal.milestones.map(m => {
            // Auto-achieve if progress meets target and not already achieved
            if (currentProgress >= m.targetValue && !m.isAchieved) {
                changed = true;
                confetti({
                    particleCount: 60,
                    spread: 60,
                    origin: { y: 0.7 },
                    colors: ['#10b981', '#6366f1']
                });
                return { ...m, isAchieved: true, dateAchieved: new Date().toISOString().split('T')[0] };
            }
            // Optional: Auto-unachieve if progress falls below target (e.g. after deletion)
            if (currentProgress < m.targetValue && m.isAchieved && !goal.autoTrackRule) {
                changed = true;
                return { ...m, isAchieved: false, dateAchieved: undefined };
            }
            return m;
        });

        return changed ? { ...goal, milestones: updatedMilestones } : goal;
    };

    const handleAddManualEntry = async () => {
        if (!selectedGoalId || !selectedGoal || !manualEntryForm.value) return;
        
        const newValue = parseFloat(manualEntryForm.value);
        const newEntry = {
            id: Date.now().toString(),
            value: newValue,
            date: new Date().toISOString().split('T')[0],
            note: manualEntryForm.note
        };

        const updatedEntries = [...(selectedGoal.manualEntries || []), newEntry];
        const newTotalProgress = (selectedGoal.manualProgress || 0) + updatedEntries.reduce((acc, e) => acc + e.value, 0);
        
        let updatedGoal: Goal = {
            ...selectedGoal,
            manualEntries: updatedEntries
        };

        // Auto-check milestones
        updatedGoal = checkMilestones(updatedGoal, newTotalProgress);

        await onUpdateGoal(updatedGoal);
        setIsAddingManualEntry(false);
        setManualEntryForm({ value: '', note: '' });
        
        if (newTotalProgress < updatedGoal.targetValue) {
            confetti({
                particleCount: 40,
                spread: 50,
                origin: { y: 0.8 },
                colors: ['#6366f1', '#10b981']
            });
        }
    };

    const handleDeleteManualEntry = async (entryId: string) => {
        if (!selectedGoal) return;

        setConfirmModal({
            isOpen: true,
            title: 'Remove Entry',
            description: 'Are you sure you want to remove this progress entry?',
            onConfirm: async () => {
                const updatedEntries = (selectedGoal.manualEntries || []).filter(e => e.id !== entryId);
                const newTotalProgress = (selectedGoal.manualProgress || 0) + updatedEntries.reduce((acc, e) => acc + e.value, 0);
                
                let updatedGoal: Goal = {
                    ...selectedGoal,
                    manualEntries: updatedEntries
                };

                // Re-check milestones (might un-achieve)
                updatedGoal = checkMilestones(updatedGoal, newTotalProgress);

                await onUpdateGoal(updatedGoal);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Track Goal Completion for Celebrations
    React.useEffect(() => {
        goals.forEach(goal => {
            const current = calculateProgress(goal, trades);
            const progress = (current / goal.targetValue) * 100;

            if (progress >= 100 && !celebratedGoals.has(goal.id)) {
                // Big celebration for full goal completion
                const duration = 3 * 1000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

                const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);
                    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                }, 250);

                setCelebratedGoals(prev => new Set(prev).add(goal.id));
            }
        });
    }, [goals, trades, celebratedGoals]);

    // Actions
    const handleSaveGoal = async () => {
        if (!newGoal.title) return;

        if (isEditing && selectedGoal) {
            const updatedGoal: Goal = {
                ...selectedGoal,
                ...newGoal,
                title: newGoal.title!,
                description: newGoal.description || '',
                type: newGoal.type as GoalType,
                metric: newGoal.metric as MetricType,
                targetValue: newGoal.targetValue || 0,
                startValue: newGoal.startValue || 0,
                startDate: newGoal.startDate!,
                endDate: newGoal.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
                autoTrackRule: newGoal.autoTrackRule,
                milestones: newGoal.milestones || [],
            };
            await onUpdateGoal(updatedGoal);
            setView('detail');
        } else {
            const goal: Goal = {
                id: '', // Set by DB
                title: newGoal.title!,
                description: newGoal.description || '',
                type: newGoal.type as GoalType,
                metric: newGoal.metric as MetricType,
                targetValue: newGoal.targetValue || 0,
                startValue: newGoal.startValue || 0,
                startDate: newGoal.startDate!,
                endDate: newGoal.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
                autoTrackRule: newGoal.autoTrackRule,
                manualProgress: 0,
                milestones: newGoal.milestones || [],
                status: 'active',
                createdAt: new Date().toISOString()
            };
            await onAddGoal(goal);
            setView('dashboard');
        }

        setIsEditing(false);
        setWizardStep(1);
        setNewGoal({ type: 'Financial', metric: 'currency', startDate: new Date().toLocaleDateString('en-CA'), endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'), autoTrackRule: { type: 'pnl' }, milestones: [] });
    };

    const handleEditGoal = () => {
        if (!selectedGoal) return;
        setNewGoal({
            ...selectedGoal
        });
        setIsEditing(true);
        setView('wizard');
        setWizardStep(1);
    };

    const deleteGoal = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Goal',
            description: 'Are you sure you want to delete this goal? This cannot be undone.',
            onConfirm: async () => {
                await onDeleteGoal(id);
                if (selectedGoalId === id) setView('dashboard');
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const toggleMilestone = async (goalId: string, milestoneId: string) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;

        const updatedGoal: Goal = {
            ...goal,
            milestones: goal.milestones.map(m => {
                if (m.id !== milestoneId) return m;
                const isNowAchieved = !m.isAchieved;
                if (isNowAchieved) {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#6366f1', '#10b981', '#f59e0b']
                    });
                }
                return { ...m, isAchieved: isNowAchieved, dateAchieved: isNowAchieved ? new Date().toISOString().split('T')[0] : undefined };
            })
        };
        await onUpdateGoal(updatedGoal);
    };

    const handleAddMilestone = async () => {
        if (!selectedGoalId || !selectedGoal || !milestoneForm.title || !milestoneForm.target) return;
        const newMilestone: GoalMilestone = {
            id: Date.now().toString(),
            title: milestoneForm.title,
            targetValue: parseFloat(milestoneForm.target),
            isAchieved: false
        };
        const updatedGoal: Goal = {
            ...selectedGoal,
            milestones: [...selectedGoal.milestones, newMilestone]
        };
        await onUpdateGoal(updatedGoal);
        setIsAddingMilestone(false);
        setMilestoneForm({ title: '', target: '' });
    };

    const renderDashboard = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Goals & Targets</h1>
                    <p className={`text-sm max-w-xl ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Define measurable objectives and track progress automatically.</p>
                </div>
                <button onClick={() => setView('wizard')} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"><Plus size={18} strokeWidth={3} /> Create Goal</button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Active Goals', value: goals.filter(g => g.status === 'active').length, sub: 'Keep pushing forward', icon: Target, color: 'text-indigo-500', bg: isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50' },
                    { label: 'Avg Completion', value: `${goals.length ? Math.round(goals.reduce((acc, g) => acc + Math.min(100, (calculateProgress(g, trades) / g.targetValue) * 100), 0) / goals.length) : 0}%`, sub: 'Across all active goals', icon: TrendingUp, color: 'text-emerald-500', bg: isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50' },
                    { label: 'Linked Trades', value: goals.reduce((acc, g) => acc + (g.autoTrackRule ? trades.filter(t => (t.tags.some(tag => tag.includes(g.autoTrackRule?.filterTag || '')) || !g.autoTrackRule.filterTag)).length : 0), 0), sub: 'Contributing to progress', icon: Activity, color: 'text-amber-500', bg: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50' }
                ].map((stat, i) => (
                    <div key={i} className={`p-4 rounded-xl border transition-all hover:-translate-y-1 hover:shadow-md ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-md'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon size={16} /></div>
                            <Info size={12} className="opacity-20 hover:opacity-100 cursor-help transition-opacity" />
                        </div>
                        <div className="text-xl font-black tracking-tight">{stat.value}</div>
                        <div className="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1">{stat.label}</div>
                        <div className="text-[9px] opacity-60 font-medium">{stat.sub}</div>
                    </div>
                ))}
            </div>

            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4 flex items-center gap-2"><Target size={12} /> My Objectives</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                    {goals.map(goal => {
                        const current = calculateProgress(goal, trades);
                        const isRisk = goal.type === 'Risk';
                        const progress = Math.min(100, Math.max(0, (current / goal.targetValue) * 100));
                        const isExceeded = isRisk && current > goal.targetValue;
                        const daysLeft = getDaysRemaining(goal.endDate);
                        const isExpired = daysLeft < 0;

                        let typeColor = isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500';
                        if (goal.type === 'Financial') typeColor = isDarkMode ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-600 border-emerald-200';
                        if (goal.type === 'Skill') typeColor = isDarkMode ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-600 border-purple-200';
                        if (goal.type === 'Process') typeColor = isDarkMode ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200';
                        if (goal.type === 'Risk') typeColor = isDarkMode ? 'bg-rose-900/30 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-600 border-rose-200';

                        return (
                            <div key={goal.id} onClick={() => { setSelectedGoalId(goal.id); setView('detail'); }} className={`group relative p-6 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl ${isDarkMode ? 'bg-[#18181b] border-[#27272a] hover:border-zinc-600' : 'bg-white border-slate-100 hover:border-indigo-300 shadow-md'}`}>
                                <div className="mb-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-2">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeColor}`}>{goal.type}</span>
                                            {isRisk && (
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${isExceeded ? 'bg-rose-500 text-white border-rose-600' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                                    {isExceeded ? 'Limit Exceeded' : 'Safe'}
                                                </span>
                                            )}
                                        </div>
                                        {goal.autoTrackRule ? (<div className="text-indigo-500 bg-indigo-500/10 p-1.5 rounded-md"><Sparkles size={14} /></div>) : (<div className="text-zinc-500 bg-zinc-500/10 p-1.5 rounded-md"><Clock size={14} /></div>)}
                                    </div>
                                    <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-indigo-500 transition-colors">{goal.title}</h3>
                                    <p className={`text-xs line-clamp-2 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{goal.description}</p>
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="font-mono font-bold text-xl">{formatMetric(current, goal.metric, currencySymbol)}<span className="text-xs opacity-40 ml-1 font-sans">/ {formatMetric(goal.targetValue, goal.metric, currencySymbol)}</span></div>
                                        <div className={`text-[10px] font-bold uppercase ${isExpired ? 'text-rose-500' : 'text-zinc-500'}`}>{isExpired ? 'Ended' : `${daysLeft} days left`}</div>
                                    </div>
                                    <ProgressBar
                                        progress={progress}
                                        height="h-1.5"
                                        colorClass={
                                            isRisk
                                                ? (progress >= 90 ? 'bg-rose-500' : progress >= 70 ? 'bg-amber-500' : 'bg-emerald-500')
                                                : (progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-indigo-500' : 'bg-amber-500')
                                        }
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderWizard = () => (
        <div className="max-w-xl mx-auto py-10 animate-in slide-in-from-bottom-8 duration-500 flex flex-col items-center">
            <div className="text-center mb-8 w-full">
                <h2 className="text-2xl font-black tracking-tight mb-6">{isEditing ? 'Edit Goal' : 'Create New Goal'}</h2>
                <div className="flex justify-center gap-3">{[1, 2, 3, 4].map(s => (<div key={s} className={`h-1.5 w-12 rounded-full transition-all duration-300 ${s <= wizardStep ? 'bg-indigo-600' : (isDarkMode ? 'bg-zinc-800' : 'bg-slate-200')}`} />))}</div>
            </div>
            <div className={`w-full p-8 rounded-3xl border shadow-2xl relative overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100'}`}>
                {wizardStep === 1 && (
                    <div className="space-y-6 flex-1">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-500"><Target size={18} /> Goal Category</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { id: 'Financial', icon: DollarSign, title: 'Financial', desc: 'Net Profit, Revenue, Equity' },
                                { id: 'Process', icon: Activity, title: 'Process', desc: 'Habits, Execution counts' },
                                { id: 'Skill', icon: Brain, title: 'Skill Dev', desc: 'Win rate, R:R improvement' },
                                { id: 'Risk', icon: Shield, title: 'Risk Control', desc: 'Drawdown limits, Discipline' },
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        const typeId = type.id as GoalType;
                                        let metric: MetricType = 'count';
                                        let autoTrackType: 'pnl' | 'win_rate' | 'trade_count' | 'drawdown' = 'pnl';

                                        if (typeId === 'Financial') {
                                            metric = 'currency';
                                            autoTrackType = 'pnl';
                                        } else if (typeId === 'Skill') {
                                            metric = 'percentage';
                                            autoTrackType = 'win_rate';
                                        } else if (typeId === 'Process') {
                                            metric = 'count';
                                            autoTrackType = 'trade_count';
                                        } else if (typeId === 'Risk') {
                                            metric = 'currency';
                                            autoTrackType = 'drawdown';
                                        }

                                        setNewGoal({
                                            ...newGoal,
                                            type: typeId,
                                            metric,
                                            autoTrackRule: { type: autoTrackType }
                                        });
                                    }}
                                    className={`p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-95 ${newGoal.type === type.id ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/50' : (isDarkMode ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700' : 'border-slate-100 bg-slate-50 hover:border-slate-200')}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${newGoal.type === type.id ? 'bg-indigo-500 text-white' : (isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-500')}`}><type.icon size={20} /></div>
                                    <h4 className={`font-bold text-sm mb-1 ${newGoal.type === type.id ? 'text-indigo-400' : ''}`}>{type.title}</h4>
                                    <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{type.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {wizardStep === 2 && (
                    <div className="space-y-6 flex-1">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-500"><Flag size={18} /> Define Objective</h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1.5 block ml-1">Title</label>
                                <input
                                    value={newGoal.title}
                                    autoFocus
                                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                    placeholder={
                                        newGoal.type === 'Financial' ? "e.g. Achieve $5,000 Profit" :
                                            newGoal.type === 'Skill' ? "e.g. Maintain 60% Win Rate" :
                                                newGoal.type === 'Process' ? "e.g. Execute 20 'Silver Bullet' Setups" :
                                                    newGoal.type === 'Risk' ? "e.g. Keep Drawdown under $1,000" :
                                                        "e.g. Achieve $5,000 Profit"
                                    }
                                    className={`w-full p-3.5 rounded-xl border outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 ${isDarkMode ? 'bg-[#0c0c0e] border-[#27272a] text-white' : 'bg-white border-slate-200'}`}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4"><DateInput label="Start Date" value={newGoal.startDate} onChange={(e: any) => setNewGoal({ ...newGoal, startDate: e.target.value })} isDarkMode={isDarkMode} /><DateInput label="Target Date" value={newGoal.endDate} min={newGoal.startDate} onChange={(e: any) => setNewGoal({ ...newGoal, endDate: e.target.value })} isDarkMode={isDarkMode} /></div>
                            <div><label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1.5 block ml-1">Description (Optional)</label><textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="Why is this goal important?" className={`w-full p-3.5 rounded-xl border outline-none min-h-[80px] resize-none text-sm transition-all focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 ${isDarkMode ? 'bg-[#0c0c0e] border-[#27272a] text-white' : 'bg-white border-slate-200'}`} /></div>
                        </div>
                    </div>
                )}
                {wizardStep === 3 && (
                    <div className="space-y-6 flex-1">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-500"><BarChart size={18} /> Measurement</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1.5 block ml-1">Target Value</label><div className={`flex items-center gap-2 px-4 py-3 rounded-xl border focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 ${isDarkMode ? 'bg-[#0c0c0e] border-[#27272a]' : 'bg-white border-slate-200'}`}>{newGoal.metric === 'currency' && <span className="text-zinc-500 font-mono">{currencySymbol}</span>}<input type="number" autoFocus value={newGoal.targetValue || ''} onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) })} placeholder="0" className={`bg-transparent outline-none w-full font-mono font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />{newGoal.metric === 'percentage' && <Percent size={16} className="text-zinc-500" />}</div></div>
                            <div><label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1.5 block ml-1">Start Value</label><div className={`flex items-center gap-2 px-4 py-3 rounded-xl border opacity-70 ${isDarkMode ? 'bg-[#0c0c0e] border-[#27272a]' : 'bg-white border-slate-200'}`}>{newGoal.metric === 'currency' && <span className="text-zinc-500 font-mono">{currencySymbol}</span>}<input type="number" value={newGoal.startValue || ''} onChange={(e) => setNewGoal({ ...newGoal, startValue: parseFloat(e.target.value) })} placeholder="0" className={`bg-transparent outline-none w-full font-mono font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`} /></div></div>
                        </div>
                        <div className={`p-4 rounded-xl border mt-4 transition-all ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${newGoal.autoTrackRule ? 'bg-indigo-500 text-white' : 'bg-zinc-500/20 text-zinc-500'}`}><Sparkles size={16} /></div><div><div className="text-sm font-bold">Automated Tracking</div><div className="text-xs opacity-60">Update progress from journal entries</div></div></div><button onClick={() => setNewGoal({ ...newGoal, autoTrackRule: newGoal.autoTrackRule ? undefined : { type: 'pnl' } })} className={`w-12 h-6 rounded-full relative transition-colors ${newGoal.autoTrackRule ? 'bg-indigo-600' : 'bg-zinc-600'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${newGoal.autoTrackRule ? 'left-7' : 'left-1'}`} /></button></div>
                            {newGoal.autoTrackRule && (
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-500/20 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                    <div>
                                                                                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1.5 block">Metric Source</label>
                                                                                    <Select
                                                                                        value={newGoal.autoTrackRule.type}
                                                                                        onChange={(val) => setNewGoal({ ...newGoal, autoTrackRule: { ...newGoal.autoTrackRule!, type: val as any } })}
                                                                                        options={[
                                                                                            { value: 'pnl', label: 'Net Profit (P&L)' },
                                                                                            { value: 'win_rate', label: 'Win Rate %' },
                                                                                            { value: 'trade_count', label: 'Trade Count' },
                                                                                            { value: 'drawdown', label: 'Max Drawdown' },
                                                                                        ]}
                                                                                        isDarkMode={isDarkMode}
                                                                                    />
                                                                                </div>
                                                                                <div><label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1.5 block">Filter Strategy (Optional)</label><input placeholder="e.g. 'Trendline Break'" value={newGoal.autoTrackRule.filterTag || ''} onChange={(e) => setNewGoal({ ...newGoal, autoTrackRule: { ...newGoal.autoTrackRule!, filterTag: e.target.value } })} className={`w-full p-2.5 rounded-lg text-sm border outline-none ${isDarkMode ? 'bg-[#0c0c0e] border-zinc-700 text-white' : 'bg-white border-slate-300'}`} /></div>
                                                                            </div>                            )}
                        </div>
                    </div>
                )}
                {wizardStep === 4 && (
                    <div className="space-y-6 text-center py-4 flex-1"><div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/30 mb-6"><CheckCircle2 size={40} /></div><div><h3 className="text-2xl font-black mb-2">{isEditing ? 'Save Changes?' : 'Ready to Launch?'}</h3><p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>"Success is the sum of small efforts, repeated day in and day out."</p></div><div className={`mx-auto max-w-sm p-4 rounded-2xl border text-left mt-6 ${isDarkMode ? 'bg-[#0c0c0e] border-zinc-800' : 'bg-slate-50 border-slate-200'}`}><div className="flex justify-between text-sm mb-2"><span className="opacity-50">Goal:</span><span className="font-bold">{newGoal.title}</span></div><div className="flex justify-between text-sm mb-2"><span className="opacity-50">Target:</span><span className="font-mono font-bold text-emerald-500">{formatMetric(newGoal.targetValue || 0, newGoal.metric!, currencySymbol)}</span></div>                        <div className="flex justify-between text-sm">
                        <span className="opacity-50">Deadline:</span>
                        <span className="font-bold">{newGoal.endDate ? new Date(newGoal.endDate).toLocaleDateString() : 'Not Set'}</span>
                    </div></div></div>
                )}
                <div className="flex justify-between mt-8 pt-6 border-t border-dashed border-gray-500/20">
                    <button onClick={() => wizardStep === 1 ? setView('dashboard') : setWizardStep(s => s - 1)} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'}`}>{wizardStep === 1 ? 'Cancel' : 'Back'}</button>
                    <button onClick={() => wizardStep === 4 ? handleSaveGoal() : setWizardStep(s => s + 1)} disabled={(wizardStep === 2 && !newGoal.title)} className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:translate-x-1">{wizardStep === 4 ? (isEditing ? 'Save Changes' : 'Confirm & Create') : 'Next Step'} <ArrowRight size={16} /></button>
                </div>
            </div>
        </div>
    );

    const renderDetail = () => {
        if (!selectedGoal) return null;
        const current = calculateProgress(selectedGoal, trades);
        const progressPercent = Math.min(100, Math.max(0, (current / selectedGoal.targetValue) * 100));
        const startDate = new Date(selectedGoal.startDate);
        const endDate = new Date(selectedGoal.endDate);
        const today = new Date();
        const totalDays = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        const daysPassed = Math.max(1, (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        const daysLeft = Math.max(0, totalDays - daysPassed);
        const currentRunRate = daysPassed > 0 ? current / daysPassed : 0;
        const projectedTotal = currentRunRate * totalDays;
        const requiredRunRate = daysLeft > 0 ? (selectedGoal.targetValue - current) / daysLeft : 0;
        
        // Forecasting Logic
        const remainingToTarget = selectedGoal.targetValue - current;
        const estDaysToFinish = currentRunRate > 0 && remainingToTarget > 0 ? remainingToTarget / currentRunRate : Infinity;
        const projectedFinishDate = estDaysToFinish !== Infinity && estDaysToFinish < 3650 
            ? new Date(Date.now() + estDaysToFinish * 24 * 60 * 60 * 1000) 
            : null;
        const isProjectedLate = projectedFinishDate ? projectedFinishDate > endDate : false;

        const isRisk = selectedGoal.type === 'Risk';
        const isExceeded = isRisk && current > selectedGoal.targetValue;
        const isOnTrack = isRisk ? current <= selectedGoal.targetValue : projectedTotal >= selectedGoal.targetValue;
        const isAhead = isRisk ? currentRunRate < requiredRunRate : currentRunRate > requiredRunRate;
        const filteredTrades = trades
            .filter(t => !selectedGoal.autoTrackRule?.filterTag || t.tags.some(tag => tag.includes(selectedGoal.autoTrackRule!.filterTag!)))
            .filter(t => t.date >= selectedGoal.startDate && t.date <= selectedGoal.endDate);

        return (
            <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-300">
                <header className="shrink-0 mb-6 flex items-center justify-between">
                    <button onClick={() => setView('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}><ChevronLeft size={16} /> Back to Goals</button>
                    <div className="flex gap-2">
                        <button onClick={() => deleteGoal(selectedGoal.id)} className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors" title="Delete Goal"><Trash2 size={18} /></button>
                        <button 
                            onClick={handleEditGoal}
                            className={`p-2.5 rounded-xl transition-colors ${isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'}`}
                            title="Edit Goal"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-settings2 lucide-settings-2" aria-hidden="true"><path d="M14 17H5"></path><path d="M19 7h-9"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle></svg>
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className={`p-8 rounded-3xl border mb-8 relative overflow-hidden ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Target size={120} /></div>
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>{selectedGoal.status}</span>
                                    {isRisk && (
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${isExceeded ? 'bg-rose-500 text-white border-rose-600' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                            {isExceeded ? 'Limit Exceeded' : 'Safe'}
                                        </span>
                                    )}
                                    <span className="text-xs font-bold opacity-50 flex items-center gap-1"><Calendar size={12} /> {new Date(selectedGoal.endDate).toLocaleDateString()} Deadline</span>
                                </div>
                                <h1 className="text-4xl font-black tracking-tight mb-2">{selectedGoal.title}</h1>
                                <p className={`text-sm max-w-lg mb-8 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{selectedGoal.description}</p>
                                <div className="mb-2 flex justify-between items-end">
                                    <div className="text-5xl font-black font-mono tracking-tighter">{formatMetric(current, selectedGoal.metric, currencySymbol)}<span className={`text-lg font-bold ml-2 font-sans ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`}>/ {formatMetric(selectedGoal.targetValue, selectedGoal.metric, currencySymbol)}</span></div>
                                    <div className={`text-right font-bold ${isOnTrack ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        <div className="flex items-center gap-1">{isOnTrack ? <TrendingUp size={18} /> : <TrendingDown size={18} />}{Math.round(progressPercent)}%</div>
                                    </div>
                                </div>
                                <div className="relative h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`absolute top-0 left-0 h-full ${isRisk ? (progressPercent >= 90 ? 'bg-rose-500' : progressPercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500') : (isOnTrack ? 'bg-emerald-500' : 'bg-amber-500')} transition-all duration-1000 shadow-[0_0_20px_rgba(0,0,0,0.2)]`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                    {projectedTotal > 0 && !isRisk && (
                                        <div className="absolute top-0 bottom-0 w-1 bg-indigo-500 z-20 shadow-[0_0_10px_#6366f1]" style={{ left: `${Math.min(100, (projectedTotal / selectedGoal.targetValue) * 100)}%` }}>
                                            <div className="absolute -top-6 -translate-x-1/2 text-[10px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded">Proj</div>
                                        </div>
                                    )}
                                </div>
                                <ProgressChart goal={selectedGoal} trades={trades} isDarkMode={isDarkMode} />
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className={`flex-1 p-5 rounded-2xl border flex flex-col justify-center ${isDarkMode ? 'bg-[#0c0c0e] border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <span className="text-xs font-bold uppercase opacity-50 mb-1">{isRisk ? 'Risk Allowance' : 'Required Run Rate'}</span>
                                    <div className="text-2xl font-black font-mono">
                                        {isRisk ? formatMetric(selectedGoal.targetValue - current, selectedGoal.metric, currencySymbol) : formatMetric(requiredRunRate, selectedGoal.metric, currencySymbol)}
                                        <span className="text-xs font-sans font-normal opacity-50 ml-1">/ {isRisk ? 'left' : 'day'}</span>
                                    </div>
                                    <div className={`text-xs mt-1 font-medium ${isAhead ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {isRisk ? `Current: ${formatMetric(current, selectedGoal.metric, currencySymbol)} used` : `Current: ${formatMetric(currentRunRate, selectedGoal.metric, currencySymbol)}/day`}
                                    </div>
                                </div>
                                <div className={`flex-1 p-5 rounded-2xl border flex flex-col justify-center ${isDarkMode ? 'bg-[#0c0c0e] border-zinc-800' : 'bg-slate-50 border-slate-200'}`}><span className="text-xs font-bold uppercase opacity-50 mb-1">Time Elapsed</span><div className="text-2xl font-black font-mono">{Math.round((daysPassed / totalDays) * 100)}%</div><div className="text-xs opacity-50 mt-1">{Math.floor(daysLeft)} days remaining</div></div>
                                
                                {!isRisk && (
                                    <div className={`flex-1 p-5 rounded-2xl border flex flex-col justify-center relative overflow-hidden ${isDarkMode ? 'bg-[#0c0c0e] border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className={`absolute top-0 right-0 p-2 opacity-10 ${isProjectedLate ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            <Sparkles size={24} />
                                        </div>
                                        <span className="text-xs font-bold uppercase opacity-50 mb-1">Forecast Insight</span>
                                        {projectedFinishDate ? (
                                            <>
                                                <div className={`text-xl font-black ${isProjectedLate ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {projectedFinishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-tight opacity-60 mt-1">
                                                    {isProjectedLate ? 'Projected after deadline' : 'On track for deadline'}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-sm font-bold opacity-40">Insufficient data to forecast</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Flag size={18} className="text-indigo-500" /> Milestones</h3>
                            <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                                <div className="space-y-6 relative pl-4">
                                    <div className={`absolute top-2 bottom-2 left-[27px] w-0.5 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'}`} />
                                    {(selectedGoal.milestones || []).map((milestone) => (
                                        <div key={milestone.id} className="relative flex items-center gap-4 group">
                                            <div onClick={() => toggleMilestone(selectedGoal.id, milestone.id)} className={`w-6 h-6 rounded-full border-4 shrink-0 flex items-center justify-center z-10 transition-colors cursor-pointer bg-white dark:bg-zinc-900 ${milestone.isAchieved ? 'border-emerald-500 text-emerald-500' : 'border-zinc-300 dark:border-zinc-700 text-zinc-400 group-hover:border-indigo-400'}`}>{milestone.isAchieved && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}</div>
                                            <div className={`flex-1 p-3 rounded-xl border transition-colors ${milestone.isAchieved ? (isDarkMode ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100') : (isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100')}`}>
                                                <div className="flex justify-between items-center mb-0.5"><h4 className={`font-bold text-sm ${milestone.isAchieved ? '' : 'opacity-50'}`}>{milestone.title}</h4>{milestone.isAchieved && (<span className="text-[10px] font-mono opacity-50">{milestone.dateAchieved}</span>)}</div>
                                                <p className="text-xs font-mono opacity-50">Target: {formatMetric(milestone.targetValue, selectedGoal.metric, currencySymbol)}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {isAddingMilestone ? (
                                        <div className="relative flex items-center gap-4 animate-in fade-in slide-in-from-left-2">
                                            <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center z-10 ${isDarkMode ? 'bg-zinc-900 border-indigo-500' : 'bg-white border-indigo-500'}`}><div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" /></div>
                                            <div className={`flex-1 p-3 rounded-xl border flex gap-3 items-center ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                                                <input autoFocus placeholder="Milestone Title" value={milestoneForm.title} onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })} className={`bg-transparent outline-none text-sm font-bold flex-1 min-w-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />
                                                <div className="w-px h-4 bg-gray-500/20" />
                                                <input type="number" placeholder="Target" value={milestoneForm.target} onChange={e => setMilestoneForm({ ...milestoneForm, target: e.target.value })} className={`bg-transparent outline-none text-sm font-mono w-24 text-right ${isDarkMode ? 'text-white' : 'text-slate-900'}`} onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()} />
                                                <button onClick={handleAddMilestone} disabled={!milestoneForm.title || !milestoneForm.target} className="p-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-50"><Check size={14} /></button>
                                                <button onClick={() => setIsAddingMilestone(false)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"><X size={14} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsAddingMilestone(true)} className="relative flex items-center gap-4 w-full text-left group pl-1">
                                            <div className={`w-6 h-6 rounded-full border-2 border-dashed shrink-0 flex items-center justify-center z-10 transition-colors ${isDarkMode ? 'border-zinc-700 group-hover:border-indigo-500' : 'border-zinc-300 group-hover:border-indigo-500'}`}><Plus size={12} className="opacity-50 group-hover:opacity-100 group-hover:text-indigo-500" /></div>
                                            <span className="text-xs font-bold uppercase tracking-wider opacity-50 group-hover:opacity-100 group-hover:text-indigo-500 transition-colors">Add Milestone</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2"><Activity size={18} className="text-amber-500" /> Contributing Activity</h3>{selectedGoal.autoTrackRule && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">Auto-Linked</span>}</div>
                            <div className={`p-1 rounded-2xl border min-h-[300px] flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200'}`}>
                                {selectedGoal.autoTrackRule ? (
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar p-2 space-y-1">
                                            {filteredTrades.map(trade => (
                                                <div key={trade.id} className={`flex justify-between items-center p-3 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-slate-50'}`}>
                                                    <div className="flex items-center gap-3"><div className={`w-1 h-8 rounded-full ${trade.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} /><div><div className="font-bold text-sm flex items-center gap-2">{trade.pair} <span className={`text-[10px] uppercase px-1 rounded ${trade.direction === 'Long' ? 'bg-teal-500/20 text-teal-500' : 'bg-rose-500/20 text-rose-500'}`}>{trade.direction}</span></div><div className="text-xs opacity-50">{trade.date}</div></div></div>
                                                    <div className={`font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{trade.pnl >= 0 ? '+' : ''}{currencySymbol}{Math.abs(trade.pnl)}</div>
                                                </div>
                                            ))}
                                            {filteredTrades.length === 0 && (<div className="flex flex-col items-center justify-center py-12 text-center opacity-60"><Layers size={32} className="mb-3 opacity-50" /><p className="font-bold text-sm">No matching trades found</p></div>)}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 overflow-y-auto max-h-[350px] custom-scrollbar p-2 space-y-1">
                                            {(selectedGoal.manualEntries || []).length > 0 ? (
                                                [...(selectedGoal.manualEntries || [])].reverse().map(entry => (
                                                    <div key={entry.id} className={`flex justify-between items-center p-3 rounded-xl transition-colors group/item ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-slate-50'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-1 h-8 rounded-full bg-indigo-500`} />
                                                            <div>
                                                                <div className="font-bold text-sm">{entry.note || 'Progress Update'}</div>
                                                                <div className="text-xs opacity-50">{entry.date}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="font-mono font-bold text-indigo-500">+{formatMetric(entry.value, selectedGoal.metric, currencySymbol)}</div>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteManualEntry(entry.id); }}
                                                                className="p-1.5 text-rose-500 opacity-0 group-hover/item:opacity-100 hover:bg-rose-500/10 rounded-lg transition-all"
                                                                title="Delete Entry"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : !isAddingManualEntry && (
                                                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                                                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4"><Clock size={24} className="opacity-50" /></div>
                                                    <h4 className="font-bold mb-1">Manual Tracking</h4>
                                                    <p className="text-xs opacity-50 max-w-[200px] mb-4">This goal requires manual entry.</p>
                                                </div>
                                            )}

                                            {isAddingManualEntry ? (
                                                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 animate-in slide-in-from-top-2">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-[9px] font-bold uppercase opacity-50 mb-1 block">Value to Add ({selectedGoal.metric})</label>
                                                            <input 
                                                                type="number" 
                                                                autoFocus
                                                                value={manualEntryForm.value}
                                                                onChange={e => setManualEntryForm({ ...manualEntryForm, value: e.target.value })}
                                                                className={`w-full p-2 rounded-lg border outline-none font-mono font-bold ${isDarkMode ? 'bg-[#0c0c0e] border-zinc-700' : 'bg-white border-slate-200'}`}
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold uppercase opacity-50 mb-1 block">Note (Optional)</label>
                                                            <input 
                                                                value={manualEntryForm.note}
                                                                onChange={e => setManualEntryForm({ ...manualEntryForm, note: e.target.value })}
                                                                className={`w-full p-2 rounded-lg border outline-none text-sm ${isDarkMode ? 'bg-[#0c0c0e] border-zinc-700' : 'bg-white border-slate-200'}`}
                                                                placeholder="What did you achieve?"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 pt-1">
                                                            <button 
                                                                onClick={handleAddManualEntry}
                                                                disabled={!manualEntryForm.value}
                                                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 disabled:opacity-50"
                                                            >
                                                                Save Entry
                                                            </button>
                                                            <button 
                                                                onClick={() => setIsAddingManualEntry(false)}
                                                                className={`px-4 py-2 rounded-lg text-xs font-bold border ${isDarkMode ? 'border-zinc-700 text-zinc-400' : 'border-slate-200 text-slate-500'}`}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-2">
                                                    <button 
                                                        onClick={() => setIsAddingManualEntry(true)}
                                                        className={`w-full py-3 rounded-xl font-bold text-xs border border-dashed transition-all flex items-center justify-center gap-2 ${isDarkMode ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-400' : 'border-slate-300 hover:bg-slate-50 text-slate-500'}`}
                                                    >
                                                        <Plus size={14} /> Add Progress Entry
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`w-full h-full overflow-hidden flex flex-col p-6 lg:p-8 font-sans ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-[#F8FAFC] text-slate-900'}`}>
            {view === 'dashboard' && renderDashboard()}
            {view === 'wizard' && renderWizard()}
            {view === 'detail' && renderDetail()}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                description={confirmModal.description}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                isDarkMode={isDarkMode}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export default Goals;
