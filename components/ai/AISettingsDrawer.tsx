import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings as SettingsIcon } from 'lucide-react';

interface AISettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    selectedModel: string;
    setSelectedModel: (value: string) => void;
    communicationStyle: string;
    setCommunicationStyle: (value: string) => void;
    autoRevealCharts: boolean;
    setAutoRevealCharts: (value: boolean) => void;
    recallMemory: boolean;
    setRecallMemory: (value: boolean) => void;
}

export const AISettingsDrawer: React.FC<AISettingsDrawerProps> = ({
    isOpen,
    onClose,
    isDarkMode,
    selectedModel,
    setSelectedModel,
    communicationStyle,
    setCommunicationStyle,
    autoRevealCharts,
    setAutoRevealCharts,
    recallMemory,
    setRecallMemory
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex justify-end">
                    <div
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`relative w-full max-w-sm h-full shadow-2xl flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#0a0a0c] border-l border-white/5' : 'bg-white border-l border-slate-200'
                            }`}
                    >
                        <div className="flex flex-col h-full">
                            {/* Drawer Header */}
                            <div className={`p-8 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <SettingsIcon size={20} />
                                        </div>
                                        <h3 className="text-lg font-black uppercase tracking-tight">AI Settings</h3>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-zinc-500' : 'hover:bg-black/5 text-slate-400'}`}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">Personalize your experience</p>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Model Engine</label>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'gemini-3-pro-preview', name: 'Pro 3.0 (Preview)', desc: 'Next-generation reasoning & multimodal excellence' },
                                            { id: 'gemini-3-flash-preview', name: 'Flash 3.0 (Preview)', desc: 'Ultra-low latency with Gemini 3 intelligence' },
                                            { id: 'gemini-2.5-pro', name: 'Pro 2.5', desc: 'Expert-level data synthesis and pattern recognition' },
                                            { id: 'gemini-2.5-flash', name: 'Flash 2.5', desc: 'High-speed professional trading analysis' },
                                            { id: 'gemini-2.5-flash-lite', name: 'Flash 2.5 Lite', desc: 'Lightweight & efficient for instant insights' },
                                        ].map((model) => (
                                            <button
                                                key={model.id}
                                                onClick={() => setSelectedModel(model.id)}
                                                className={`w-full p-5 rounded-3xl border text-left transition-all relative overflow-hidden group ${selectedModel === model.id
                                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/30'
                                                        : (isDarkMode ? 'bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/[0.06]' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100')
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between relative z-10">
                                                    <span className="text-[11px] font-black uppercase tracking-widest">{model.name}</span>
                                                    {selectedModel === model.id && (
                                                        <motion.div layoutId="activeModel" className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]" />
                                                    )}
                                                </div>
                                                <p className={`text-[9.5px] font-bold mt-1 opacity-60 leading-tight relative z-10 ${selectedModel === model.id ? 'text-indigo-100' : ''}`}>
                                                    {model.desc}
                                                </p>
                                                {selectedModel === model.id && (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Communication Style</label>
                                    </div>
                                    <div className={`p-2 rounded-3xl border flex gap-1 transition-all ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                        {['Professional', 'Casual', 'Strict'].map((tone) => (
                                            <button
                                                key={tone}
                                                onClick={() => setCommunicationStyle(tone)}
                                                className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${communicationStyle === tone
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                                        : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-700')
                                                    }`}
                                            >
                                                {tone}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Preferences</label>
                                    </div>

                                    {/* Auto-Reveal Charts Toggle */}
                                    <div
                                        className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`}
                                    >
                                        <div>
                                            <h4 className="text-[11px] font-black uppercase tracking-wide">Auto-Reveal Charts</h4>
                                            <p className="text-[9px] opacity-40 font-bold uppercase mt-1">Bypass accordion triggers</p>
                                        </div>
                                        <button
                                            onClick={() => setAutoRevealCharts(!autoRevealCharts)}
                                            className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors ${autoRevealCharts ? 'bg-indigo-600' : (isDarkMode ? 'bg-zinc-800' : 'bg-slate-300')}`}
                                        >
                                            <div className={`w-3 h-3 bg-white rounded-full shadow-md transition-transform ${autoRevealCharts ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {/* Recall Memory Toggle */}
                                    <div
                                        className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`}
                                    >
                                        <div>
                                            <h4 className="text-[11px] font-black uppercase tracking-wide">Recall Memory</h4>
                                            <p className="text-[9px] opacity-40 font-bold uppercase mt-1">Cross-session context</p>
                                        </div>
                                        <button
                                            onClick={() => setRecallMemory(!recallMemory)}
                                            className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors ${recallMemory ? 'bg-indigo-600' : (isDarkMode ? 'bg-zinc-800' : 'bg-slate-300')}`}
                                        >
                                            <div className={`w-3 h-3 bg-white rounded-full shadow-md transition-transform ${recallMemory ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className={`p-8 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                                <button
                                    onClick={onClose}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/30 active:scale-95"
                                >
                                    Apply Config
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
