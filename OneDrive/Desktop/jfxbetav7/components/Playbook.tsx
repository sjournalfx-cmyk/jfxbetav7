
import React, { useState, useMemo } from 'react';
import { PlaybookEntry, LogicRule, LogicPhase, RuleType } from '../types';
import {
    Plus, Search, Image as ImageIcon, X, Clock, Crosshair,
    ListChecks, CheckCircle2, ChevronRight, LayoutGrid, Zap,
    Award, TrendingUp, ShieldCheck, Edit3, Trash2, ChevronLeft, Target,
    AlertTriangle, FileText, Layers, Eye, Smartphone, PlayCircle, Lock, Upload,
    MoreVertical, Check, RefreshCw
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface PlaybookProps {
    isDarkMode: boolean;
    entries: PlaybookEntry[];
    onAddEntry: (entry: PlaybookEntry) => void;
    onUpdateEntry: (entry: PlaybookEntry) => void;
    onDeleteEntry: (id: string) => void;
}

// --- UTILITY COMPONENTS ---

const Badge = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${className}`}>
        {children}
    </span>
);

const StatPill = ({ icon: Icon, label, value, isDarkMode }: any) => (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
            <Icon size={14} />
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase opacity-50 leading-none mb-1">{label}</span>
            <span className={`text-sm font-black font-mono leading-none ${isDarkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{value}</span>
        </div>
    </div>
);

interface LogicCardProps {
    rule: LogicRule;
    isDarkMode: boolean;
    showCheck?: boolean;
}

const LogicCard: React.FC<LogicCardProps> = ({ rule, isDarkMode, showCheck = false }) => (
    <div className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${rule.type === 'Hard'
            ? (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200')
            : (isDarkMode ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100')
        }`}>
        {showCheck ? (
            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${isDarkMode ? 'border-zinc-700' : 'border-slate-300'}`}>
                {/* Empty check box visual */}
            </div>
        ) : (
            <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${rule.type === 'Hard' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
        )}
        <div className="flex-1">
            <div className="flex justify-between items-start">
                <span className={`text-sm font-medium leading-tight ${isDarkMode ? 'text-zinc-200' : 'text-slate-800'}`}>{rule.description}</span>
                {rule.type === 'Soft' && (
                    <span className="text-[10px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded-full ml-2">
                        +{rule.points}
                    </span>
                )}
            </div>
            {rule.type === 'Hard' && <span className="text-[10px] uppercase font-bold text-rose-500 mt-1 block">Mandatory</span>}
        </div>
    </div>
);

const Playbook: React.FC<PlaybookProps> = ({ isDarkMode, entries = [], onAddEntry, onUpdateEntry, onDeleteEntry }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'identity' | 'parameters' | 'logic' | 'visuals'>('identity');
    const [selectedEntry, setSelectedEntry] = useState<PlaybookEntry | null>(null);
    const [isCheatSheetMode, setIsCheatSheetMode] = useState(false);

    // Gallery State
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        confirmText?: string;
        variant?: 'danger' | 'warning' | 'info';
        showCancel?: boolean;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { }
    });

    // Form State
    const [formData, setFormData] = useState<Partial<PlaybookEntry>>({});
    const [isEditing, setIsEditing] = useState(false);

    // Logic Builder State
    const [logicInput, setLogicInput] = useState('');
    const [logicType, setLogicType] = useState<RuleType>('Hard');
    const [logicPoints, setLogicPoints] = useState(1);
    const [logicPhase, setLogicPhase] = useState<LogicPhase>('Trigger');

    // Stats Calculation
    const stats = useMemo(() => {
        const safeEntries = entries || [];
        const total = safeEntries.length;
        const avgWinRate = total > 0 ? Math.round(safeEntries.reduce((acc, e) => acc + (e.avgWinRate || e.baselineWinRate || 50), 0) / total) : 0;
        const activeCount = safeEntries.filter(e => e.status === 'Active').length;
        const mostCommonType = safeEntries.length > 0
            ? safeEntries.sort((a, b) => safeEntries.filter(v => v.setupType === a.setupType).length - safeEntries.filter(v => v.setupType === b.setupType).length).pop()?.setupType
            : 'N/A';
        return { total, avgWinRate, activeCount, mostCommonType };
    }, [entries]);

    const filteredEntries = (entries || []).filter(e => {
        const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'All' || e.setupType === filterType;
        return matchesSearch && matchesType;
    });

    const resetForm = () => {
        setFormData({
            title: '',
            setupType: 'Reversal',
            market: 'Forex',
            status: 'Incubating',
            description: '',
            imageUrls: [],
            tags: [],
            timeframe: '',
            minRR: 2,
            maxRisk: 1,
            logicRules: [],
            baselineWinRate: 50,
            baselineRR: 2,
            bestSession: 'New York',
            invalidationRules: '',
            phaseImages: {}
        });
        setLogicInput('');
        setModalTab('identity');
        setIsEditing(false);
    };

    const handleOpenCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (entry: PlaybookEntry) => {
        setFormData({ ...entry });
        setIsEditing(true);
        setModalTab('identity');
        setIsModalOpen(true);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // Increased limit to 20 images
            const currentCount = formData.imageUrls?.length || 0;
            if (currentCount + files.length > 20) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Limit Reached',
                    description: 'Maximum 20 images allowed per strategy.',
                    confirmText: 'Got it',
                    showCancel: false,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
                return;
            }

            const base64Promises = files.map(fileToBase64);
            const newImages = await Promise.all(base64Promises);

            setFormData(prev => ({
                ...prev,
                imageUrls: [...(prev.imageUrls || []), ...newImages]
            }));
        }
    };

    const handlePhaseImageUpload = async (phase: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await fileToBase64(file);
            setFormData(prev => ({
                ...prev,
                phaseImages: {
                    ...(prev.phaseImages || {}),
                    [phase]: base64
                }
            }));
        }
    };

    const removePhaseImage = (phase: string) => {
        const newImages = { ...formData.phaseImages };
        delete newImages[phase];
        setFormData(prev => ({ ...prev, phaseImages: newImages }));
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            imageUrls: prev.imageUrls?.filter((_, i) => i !== index)
        }));
    };

    const handleSave = () => {
        if (!formData.title) return; // Only title is strictly required

        const entryId = formData.id || Date.now().toString();

        const mainImage = formData.imageUrls && formData.imageUrls.length > 0
            ? formData.imageUrls[0]
            : `https://picsum.photos/seed/${entryId}/800/600`;

        const newEntry: PlaybookEntry = {
            id: entryId,
            title: formData.title,
            setupType: (formData.setupType as any) || 'Reversal',
            market: (formData.market as any) || 'Forex',
            description: formData.description || '',
            imageUrl: mainImage,
            imageUrls: (formData.imageUrls && formData.imageUrls.length > 0) ? formData.imageUrls : [mainImage],
            tags: formData.tags || [],
            date: formData.date || new Date().toLocaleDateString('en-CA'),
            rating: formData.rating || 0,
            timeframe: formData.timeframe || 'Any',
            minRR: formData.minRR || 1,
            maxRisk: formData.maxRisk || 1,
            baselineWinRate: formData.baselineWinRate,
            baselineRR: formData.baselineRR,
            bestSession: formData.bestSession || 'Any',
            logicRules: formData.logicRules || [],
            invalidationRules: formData.invalidationRules || '',
            phaseImages: formData.phaseImages || {},
            status: (formData.status as any) || 'Incubating',
            lastUpdated: new Date().toLocaleDateString('en-CA')
        };

        if (isEditing) {
            onUpdateEntry(newEntry);
            if (selectedEntry && selectedEntry.id === newEntry.id) {
                setSelectedEntry(newEntry);
            }
        } else {
            onAddEntry(newEntry);
            // Explicitly clear filters so the new item shows up in the grid
            setFilterType('All');
            setSearchTerm('');
        }

        setIsModalOpen(false);
        resetForm();
    };

    const handleDelete = () => {
        if (!selectedEntry) return;
        setConfirmModal({
            isOpen: true,
            title: 'Delete Strategy',
            description: 'Are you sure you want to delete this strategy? This cannot be undone.',
            onConfirm: () => {
                onDeleteEntry(selectedEntry.id);
                setSelectedEntry(null);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const deleteFromGrid = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConfirmModal({
            isOpen: true,
            title: 'Delete Strategy',
            description: 'Are you sure you want to delete this strategy?',
            onConfirm: () => {
                onDeleteEntry(id);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const cycleStatus = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedEntry) return;
        const statuses = ['Incubating', 'Active', 'Archived'];
        const currentIndex = statuses.indexOf(selectedEntry.status || 'Incubating');
        const nextStatus = statuses[(currentIndex + 1) % statuses.length] as any;

        const updated = { ...selectedEntry, status: nextStatus };
        setSelectedEntry(updated);
        onUpdateEntry(updated);
    };

    const getStatusColor = (status?: string) => {
        if (status === 'Active') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (status === 'Archived') return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    };

    return (
        <div className={`w-full h-full overflow-hidden flex flex-col font-sans ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-[#F8FAFC] text-slate-900'}`}>

            {/* --- Top Dashboard --- */}
            <div className={`shrink-0 px-8 py-8 border-b ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="flex-1">
                        <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
                            Strategy Vault
                            <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${isDarkMode ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                                v3.3 Pro
                            </span>
                        </h1>
                        <p className={`text-sm max-w-2xl leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                            Your codified edge. Define robust setups with logic phases, invalidation criteria, and scoring systems.
                        </p>

                        {/* Stats Row */}
                        <div className="flex flex-wrap gap-4 mt-6">
                            <StatPill icon={LayoutGrid} label="Total Models" value={stats.total} isDarkMode={isDarkMode} />
                            <StatPill icon={TrendingUp} label="Avg Win Rate" value={`${stats.avgWinRate}%`} isDarkMode={isDarkMode} />
                            <StatPill icon={CheckCircle2} label="Active Setups" value={stats.activeCount} isDarkMode={isDarkMode} />
                            <StatPill icon={Zap} label="Top Type" value={stats.mostCommonType} isDarkMode={isDarkMode} />
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className={`flex items-center gap-4 mt-8 p-1.5 rounded-xl border overflow-x-auto no-scrollbar ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                    <div className="relative shrink-0">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search strategies..."
                            className={`pl-9 pr-4 py-2 rounded-lg border-none outline-none w-48 text-xs font-bold bg-transparent ${isDarkMode ? 'text-white placeholder-zinc-600' : 'text-slate-900 placeholder-slate-400'}`}
                        />
                    </div>

                    <div className={`w-px h-6 shrink-0 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />

                    <div className="flex gap-1">
                        {['All', 'Reversal', 'Continuation', 'Breakout', 'Range', 'Scalp'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filterType === type
                                        ? 'bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                                        : isDarkMode ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300' : 'text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Gallery Grid --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
                    {/* New Strategy Card */}
                    <button
                        onClick={handleOpenCreateModal}
                        className={`group relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.02] active:scale-95 h-full min-h-[300px] ${isDarkMode ? 'border-zinc-800 bg-zinc-900/20 hover:border-indigo-500/50 hover:bg-zinc-900/50' : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50'}`}
                    >
                        <div className={`p-4 rounded-full transition-colors ${isDarkMode ? 'bg-zinc-800 group-hover:bg-indigo-600 text-zinc-400 group-hover:text-white' : 'bg-white group-hover:bg-indigo-500 text-slate-400 group-hover:text-white shadow-sm'}`}>
                            <Plus size={32} />
                        </div>
                        <div className="text-center">
                            <span className={`block font-bold text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Create Strategy</span>
                            <span className={`text-xs opacity-50 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Define a new edge</span>
                        </div>
                    </button>

                    {filteredEntries.map(entry => {
                        const statusColor = getStatusColor(entry.status);

                        return (
                            <div
                                key={entry.id}
                                onClick={() => { setSelectedEntry(entry); setActiveImageIndex(0); setIsCheatSheetMode(false); }}
                                className={`group relative rounded-2xl overflow-hidden border flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer bg-clip-padding ${isDarkMode ? 'bg-[#121215] border-zinc-800 hover:border-zinc-600' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-md'}`}
                            >
                                {/* Status Stripe */}
                                <div className={`absolute top-0 left-0 bottom-0 w-1 ${entry.status === 'Active' ? 'bg-emerald-500' : entry.status === 'Archived' ? 'bg-zinc-500' : 'bg-amber-500'}`} />

                                {/* Image Header */}
                                <div className="aspect-[16/9] bg-zinc-900 relative overflow-hidden ml-1">
                                    <img src={entry.imageUrl} alt={entry.title} className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent opacity-90" />

                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${statusColor}`}>
                                            {entry.status || 'Incubating'}
                                        </span>
                                    </div>

                                    {/* Quick Actions Overlay */}
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(entry); }}
                                            className="p-1.5 bg-black/60 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => deleteFromGrid(e, entry.id)}
                                            className="p-1.5 bg-black/60 text-white rounded-lg hover:bg-rose-600 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="p-5 flex flex-col flex-1 relative -mt-8 ml-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-black text-lg leading-tight group-hover:text-indigo-500 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{entry.title}</h3>
                                    </div>
                                    <p className={`text-xs line-clamp-2 mb-4 leading-relaxed font-medium ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{entry.description}</p>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex gap-2">
                                            <Badge className={`${isDarkMode ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {entry.setupType}
                                            </Badge>
                                            <Badge className={`${isDarkMode ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {entry.timeframe || 'Any'}
                                            </Badge>
                                        </div>

                                        <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${isDarkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
                                            <div>
                                                <span className="text-[9px] uppercase font-bold opacity-40 block mb-0.5">Win Rate</span>
                                                <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{entry.baselineWinRate || entry.avgWinRate || 0}%</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] uppercase font-bold opacity-40 block mb-0.5">R:R Ratio</span>
                                                <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>1:{entry.baselineRR || entry.minRR || 2}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- View Dossier Modal --- */}
            {selectedEntry && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div
                        className={`w-full max-w-7xl h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative ${isDarkMode ? 'bg-[#121215] border border-zinc-800' : 'bg-white'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Control Bar */}
                        <div className={`h-16 shrink-0 border-b flex items-center justify-between px-6 ${isDarkMode ? 'bg-[#0f111a] border-zinc-800' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-black tracking-tight">{selectedEntry.title}</h2>
                                <button
                                    onClick={cycleStatus}
                                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border cursor-pointer hover:scale-105 transition-transform ${getStatusColor(selectedEntry.status)}`}
                                    title="Click to cycle status"
                                >
                                    {selectedEntry.status}
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsCheatSheetMode(!isCheatSheetMode)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${isCheatSheetMode
                                            ? 'bg-amber-500 text-white border-amber-500'
                                            : isDarkMode ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}
                                >
                                    {isCheatSheetMode ? <FileText size={14} /> : <Smartphone size={14} />}
                                    {isCheatSheetMode ? 'Standard View' : 'Cheat Sheet'}
                                </button>

                                <div className={`w-px h-6 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />

                                <button
                                    onClick={() => handleOpenEditModal(selectedEntry)}
                                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-indigo-500/20 text-zinc-400 hover:text-indigo-400' : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-500'}`}
                                    title="Edit Strategy"
                                >
                                    <Edit3 size={18} />
                                </button>

                                <button
                                    onClick={handleDelete}
                                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-rose-500/20 text-zinc-400 hover:text-rose-500' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500'}`}
                                    title="Delete Strategy"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <div className={`w-px h-6 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />

                                <button onClick={() => setSelectedEntry(null)} className={`p-2 rounded-full hover:bg-zinc-800 hover:text-white transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-slate-400'}`}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {isCheatSheetMode ? (
                            // --- CHEAT SHEET VIEW ---
                            <div className={`flex-1 overflow-y-auto p-8 lg:p-12 flex justify-center ${isDarkMode ? 'bg-[#09090b]' : 'bg-slate-50'}`}>
                                <div className="max-w-3xl w-full space-y-12">
                                    {/* Header Stats */}
                                    <div className="flex justify-between items-end border-b pb-6 border-dashed border-gray-500/30">
                                        <div>
                                            <span className="text-xs font-bold uppercase opacity-50 block mb-1">Execution Mode</span>
                                            <h1 className="text-4xl font-black">{selectedEntry.title}</h1>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold uppercase opacity-50 block mb-1">Target</span>
                                            <span className="text-2xl font-black font-mono text-emerald-500">1:{selectedEntry.minRR}</span>
                                        </div>
                                    </div>

                                    {/* Checklist */}
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-widest mb-4 opacity-70">Mandatory Checks</h3>
                                            <div className="space-y-4">
                                                {(selectedEntry.logicRules || []).filter(r => r.type === 'Hard').map((rule, idx) => (
                                                    <div key={idx} className={`p-6 rounded-xl border-l-4 flex gap-4 items-center ${isDarkMode ? 'bg-zinc-900 border-l-rose-500 border-y border-r border-zinc-800' : 'bg-white border-l-rose-500 shadow-sm'}`}>
                                                        <div className="w-8 h-8 rounded-full border-2 border-zinc-500 flex items-center justify-center shrink-0">
                                                            <span className="text-sm font-bold opacity-50">{idx + 1}</span>
                                                        </div>
                                                        <span className="text-xl font-bold">{rule.description}</span>
                                                    </div>
                                                ))}
                                                {(!selectedEntry.logicRules || selectedEntry.logicRules.filter(r => r.type === 'Hard').length === 0) && (
                                                    <div className="opacity-50 italic">No hard rules defined.</div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-widest mb-4 opacity-70">Invalidation</h3>
                                            <div className={`p-6 rounded-xl border-l-4 ${isDarkMode ? 'bg-rose-950/20 border-l-rose-600 text-rose-200' : 'bg-rose-50 border-l-rose-500 text-rose-800'}`}>
                                                <div className="flex items-center gap-3 mb-2 font-bold text-rose-500">
                                                    <AlertTriangle size={24} /> KILL TRADE IF:
                                                </div>
                                                <p className="text-xl font-medium leading-relaxed">{selectedEntry.invalidationRules || "No invalidation criteria specified."}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // --- STANDARD VIEW ---
                            <div className="flex-1 flex overflow-hidden">
                                {/* Left: Gallery */}
                                <div className={`w-[35%] border-r relative flex flex-col ${isDarkMode ? 'bg-black border-zinc-800' : 'bg-slate-100 border-slate-200'}`}>
                                    <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden group">
                                        {selectedEntry.imageUrls && selectedEntry.imageUrls.length > 0 ? (
                                            <img src={selectedEntry.imageUrls[activeImageIndex]} className="w-full h-full object-contain" alt="Strategy" />
                                        ) : (
                                            <img src={selectedEntry.imageUrl} className="w-full h-full object-cover" alt="Strategy" />
                                        )}

                                        {/* Nav Buttons (only if multiple images) */}
                                        {selectedEntry.imageUrls && selectedEntry.imageUrls.length > 1 && (
                                            <>
                                                <button onClick={() => setActiveImageIndex(i => (i - 1 + selectedEntry.imageUrls!.length) % selectedEntry.imageUrls!.length)} className="absolute left-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <button onClick={() => setActiveImageIndex(i => (i + 1) % selectedEntry.imageUrls!.length)} className="absolute right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronRight size={20} />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Updated Thumbnails Strip - Improved for "All Images" visibility */}
                                    {selectedEntry.imageUrls && selectedEntry.imageUrls.length > 1 && (
                                        <div className={`p-4 grid grid-cols-4 gap-2 overflow-y-auto max-h-[160px] border-t shrink-0 custom-scrollbar ${isDarkMode ? 'bg-[#0f111a] border-zinc-800' : 'bg-white border-slate-200'}`}>
                                            {selectedEntry.imageUrls.map((url, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveImageIndex(idx)}
                                                    className={`aspect-video rounded-lg border-2 overflow-hidden shrink-0 relative transition-all ${activeImageIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                                >
                                                    <img src={url} className="w-full h-full object-cover" />
                                                    {activeImageIndex === idx && <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right: Logic & Params */}
                                <div className={`flex-1 overflow-y-auto custom-scrollbar p-10 ${isDarkMode ? 'bg-[#121215]' : 'bg-slate-50'}`}>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-4 gap-4 mb-10">
                                        {[
                                            { l: 'Market', v: selectedEntry.market },
                                            { l: 'Timeframe', v: selectedEntry.timeframe },
                                            { l: 'Session', v: selectedEntry.bestSession },
                                            { l: 'Risk Limit', v: `${selectedEntry.maxRisk}%` },
                                        ].map((item, i) => (
                                            <div key={i} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'}`}>
                                                <div className="text-[10px] font-bold uppercase opacity-50 mb-1">{item.l}</div>
                                                <div className="font-bold">{item.v}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mb-10">
                                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-6 flex items-center gap-2">
                                            <Layers size={16} className="text-indigo-500" /> Logic Engine
                                        </h3>

                                        {/* Phases Timeline */}
                                        <div className="relative border-l-2 border-dashed border-zinc-700 ml-10 space-y-12 pb-4">
                                            {['Setup', 'Trigger', 'Management'].map((phase, idx) => {
                                                const rules = (selectedEntry.logicRules || []).filter(r => r.phase === phase);
                                                const phaseImage = selectedEntry.phaseImages?.[phase];

                                                return (
                                                    <div key={phase} className="relative pl-8">
                                                        {/* Circle positioning */}
                                                        <div className={`absolute left-[-13px] top-0 w-6 h-6 rounded-full border-4 flex items-center justify-center text-[10px] font-bold z-20 ${isDarkMode ? 'bg-[#121215] border-indigo-500 text-white' : 'bg-slate-50 border-indigo-500 text-slate-900'}`}>
                                                            {idx + 1}
                                                        </div>

                                                        <h4 className="text-lg font-bold mb-4">{phase} Phase</h4>

                                                        {rules.length > 0 ? (
                                                            <div className="grid gap-3">
                                                                {/* Fixed: Iterate through the rules array to render each LogicCard */}
                                                                {rules.map((rule) => (
                                                                    <LogicCard key={rule.id} rule={rule} isDarkMode={isDarkMode} />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs opacity-40 italic">No rules defined for this phase.</div>
                                                        )}

                                                        {phaseImage && (
                                                            <div className="mt-4 pt-4 border-t border-dashed border-gray-500/20">
                                                                <span className="text-[10px] font-bold uppercase opacity-50 block mb-2">Phase Reference</span>
                                                                <div className="rounded-xl overflow-hidden border border-zinc-700/50">
                                                                    <img src={phaseImage} className="w-full object-cover" alt={`${phase} reference`} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {selectedEntry.invalidationRules && (
                                        <div className={`p-6 rounded-2xl border-l-4 ${isDarkMode ? 'bg-rose-950/20 border-l-rose-600 border-y border-r border-rose-900/30' : 'bg-rose-50 border-l-rose-500 border-y border-r border-rose-100'}`}>
                                            <h3 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-rose-500">
                                                <X size={14} /> Invalidation
                                            </h3>
                                            <p className="text-sm leading-relaxed opacity-90">{selectedEntry.invalidationRules}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                description={confirmModal.description}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                isDarkMode={isDarkMode}
                confirmText={confirmModal.confirmText || "Delete"}
                variant={confirmModal.variant || "danger"}
                showCancel={confirmModal.showCancel !== undefined ? confirmModal.showCancel : true}
            />
        </div>
    );
};

export default Playbook;
