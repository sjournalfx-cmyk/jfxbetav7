import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trade, UserProfile, Goal, DailyBias, EASession, MetricType } from '../types';
import { geminiService } from '../services/geminiService';
import { calculateStats } from '../lib/statsUtils';
import { PerformanceByPairWidget } from './analytics/PerformanceByPairWidget';
import { OutcomeDistributionWidget } from './analytics/OutcomeDistributionWidget';
import { PerformanceRadarWidget } from './analytics/PerformanceRadarWidget';
import { PerformanceBySession } from './analytics/PerformanceBySession';
import { EquityCurveWidget } from './analytics/EquityCurveWidget';
import { ExecutionPerformanceTable } from './analytics/ExecutionPerformanceTable';
import { DrawdownOverTimeWidget } from './analytics/DrawdownOverTimeWidget';
import { StrategyPerformanceBubbleChart } from './analytics/StrategyPerformanceBubbleChart';
import { SymbolPerformanceWidget } from './analytics/SymbolPerformanceWidget';
import { MomentumStreakWidget } from './analytics/MomentumStreakWidget';
import { TradeExitAnalysisWidget } from './analytics/TradeExitAnalysisWidget';
import { CurrencyStrengthMeter } from './analytics/CurrencyStrengthMeter';
import { MonthlyPerformanceWidget } from './analytics/MonthlyPerformanceWidget';
import { PLByPlanAdherenceWidget } from './analytics/PLByPlanAdherenceWidget';
import { PLByMindsetWidget } from './analytics/PLByMindsetWidget';
import TradingViewWidget from './TradingViewWidget';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TrendingUp, PieChart, Brain, Clock, Wand2, Send, Bot, User, Trash2, Coins, ChevronDown, List, Settings as SettingsIcon, X, History, Plus, ChevronRight, Workflow, CheckCircle2, StickyNote, Download, FileText, Activity, Sparkles, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { ChecklistWidget, MermaidWidget } from './ai/AIWidgets';
import { AISettingsDrawer } from './ai/AISettingsDrawer';
import { APP_CONSTANTS } from '../lib/constants';
import { useToast } from './ui/Toast';

// --- Goal Creation Widget ---
const GoalCreationWidget = ({ 
  isDarkMode, 
  onAddGoal,
  initialTitle = "",
  initialTarget = 0,
  initialMetric = "currency" as "currency" | "percentage" | "count"
}: { 
  isDarkMode: boolean, 
  onAddGoal: (goal: any) => Promise<void>,
  initialTitle?: string,
  initialTarget?: number,
  initialMetric?: "currency" | "percentage" | "count"
}) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(initialTitle);
  const [type, setType] = useState<Goal['type']>('Financial');
  const [metric, setMetric] = useState<MetricType>(initialMetric);
  const [target, setTarget] = useState(initialTarget);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + 30); // Default 30 days

      await onAddGoal({
        title,
        type,
        metric,
        targetValue: target,
        startValue: 0,
        startDate: now.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'active',
        milestones: [],
        createdAt: now.toISOString()
      });
      setIsDone(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-6 rounded-[32px] border flex flex-col items-center text-center gap-4 ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h4 className="text-lg font-black uppercase tracking-tight">Goal Created!</h4>
          <p className="text-xs font-medium opacity-60 mt-1">Your new objective has been added to the Goals page.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`p-6 rounded-[32px] border flex flex-col gap-6 relative overflow-hidden w-fit max-w-full ${isDarkMode ? 'bg-zinc-900/60 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
      {/* Lava Lamp Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.08] dark:opacity-[0.12]">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500 blur-[40px] animate-lava" style={{ animationDelay: '0s' }} />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-purple-500 blur-[50px] animate-lava" style={{ animationDelay: '-5s' }} />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Target size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest">Goal Architect</h4>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-4 bg-indigo-500' : (i < step ? 'w-2 bg-emerald-500' : 'w-2 bg-zinc-500/20')}`} />
              ))}
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold opacity-30">Step {step} of 3</span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 relative z-10">
            <p className="text-sm font-medium opacity-60">What should we call this objective?</p>
            <input 
              autoFocus
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. 5% Monthly Return"
              className={`w-full bg-transparent border-b-2 border-zinc-500/20 py-2 text-lg font-black focus:border-indigo-500 focus:outline-none transition-all ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            />
            <button 
              disabled={!title}
              onClick={() => setStep(2)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
            >
              Next Strategy Step
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 relative z-10">
            <p className="text-sm font-medium opacity-60">What is the measurement metric?</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Currency ($)', value: 'currency' },
                { label: 'Percentage (%)', value: 'percentage' },
                { label: 'Trade Count', value: 'count' },
                { label: 'Win/Loss', value: 'boolean' }
              ].map(m => (
                <button
                  key={m.value}
                  onClick={() => setMetric(m.value as any)}
                  className={`p-4 rounded-2xl border text-left transition-all ${metric === m.value ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500' : 'border-zinc-500/10 hover:border-zinc-500/30'}`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest ${metric === m.value ? 'text-indigo-500' : 'opacity-40'}`}>{m.label}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setStep(3)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Confirm Metric
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 relative z-10">
            <p className="text-sm font-medium opacity-60">Set your final target value</p>
            <div className="flex items-end gap-3">
              <input 
                autoFocus
                type="number" 
                value={target || ''} 
                onChange={e => setTarget(Number(e.target.value))}
                placeholder="0.00"
                className={`flex-1 bg-transparent border-b-2 border-zinc-500/20 py-2 text-3xl font-black focus:border-indigo-500 focus:outline-none transition-all ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              />
              <span className="text-xl font-black opacity-30 pb-3">{metric === 'currency' ? '$' : metric === 'percentage' ? '%' : 'trades'}</span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setStep(2)}
                className={`flex-1 py-3 border border-zinc-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-500/5 transition-all`}
              >
                Back
              </button>
              <button 
                onClick={handleCreate}
                disabled={isSubmitting || !target}
                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={14} />}
                {isSubmitting ? 'Architecting...' : 'Deploy Goal'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  widgetKeys?: string[];
  chartSymbols?: Record<string, string>;
  sections?: Record<string, string>;
  mermaidData?: Record<string, { type: string, code: string }>;
  checklistData?: Record<string, { title: string, items: { text: string, checked: boolean }[] }>;
}

interface AIChatProps {
  isDarkMode: boolean;
  trades: Trade[];
  userProfile: UserProfile | null;
  goals?: Goal[];
  dailyBias?: DailyBias[];
  eaSession?: EASession | null;
  onAddNote?: (note: any) => Promise<any>;
  onAddGoal?: (goal: any) => Promise<any>;
}

const AIChat: React.FC<AIChatProps> = ({
  isDarkMode,
  trades: rawTrades = [],
  userProfile,
  goals = [],
  dailyBias = [],
  eaSession = null,
  onAddNote,
  onAddGoal
}) => {
  const trades = useMemo(() => {
    return [...rawTrades].sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`);
      const dateTimeB = new Date(`${b.date}T${b.time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });
  }, [rawTrades]);

  const [persistedMessages, setPersistedMessages] = useLocalStorage<Message[]>('jfx_ai_chat_history', []);
  const [selectedModel, setSelectedModel] = useLocalStorage<string>('jfx_ai_selected_model', 'gemini-1.5-flash');
  const [communicationStyle, setCommunicationStyle] = useLocalStorage<string>('jfx_ai_communication_style', 'Professional');
  const [autoRevealCharts, setAutoRevealCharts] = useLocalStorage<boolean>('jfx_ai_auto_reveal', true);
  const [recallMemory, setRecallMemory] = useLocalStorage<boolean>('jfx_ai_recall_memory', true);
  const [isPlanMode, setIsPlanMode] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { addToast } = useToast();

  const [messages, setMessages] = useState<Message[]>(() => {
    if (persistedMessages.length > 0) {
      return persistedMessages.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
    }
    return [
      {
        id: '1',
        role: 'assistant',
        content: `Hello ${userProfile?.name?.split(' ')[0] || 'Trader'}! I'm your JFX Assistant. How can I help you analyze your trading performance today?`,
        timestamp: new Date(),
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const analysisSteps = [
    "Fetching trading history...",
    "Analyzing equity curve...",
    "Evaluating win rate...",
    "Processing psychology...",
    "Generating growth goals..."
  ];

  const stepColors = [
    'text-zinc-400',
    'text-blue-400',
    'text-emerald-400',
    'text-purple-400',
    'text-amber-400'
  ];

  const stepBgColors = [
    'bg-zinc-400',
    'bg-blue-400',
    'bg-emerald-400',
    'bg-purple-400',
    'bg-amber-400'
  ];

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionMenuFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [expandedWidgets, setExpandedWidgets] = useState<Record<string, boolean>>({});
  const [isListening, setIsListening] = useState(false);

  const availableMentions = useMemo(() => {
    const widgets = [
      { label: 'Equity Growth', value: 'equitycurve', icon: <TrendingUp size={14} />, type: 'widget' },
      { label: 'Win Rate', value: 'winrate', icon: <PieChart size={14} />, type: 'widget' },
      { label: 'Psychology Radar', value: 'mindset', icon: <Brain size={14} />, type: 'widget' },
      { label: 'Session Analysis', value: 'sessions', icon: <Clock size={14} />, type: 'widget' },
      { label: 'Trade Momentum', value: 'momentum', icon: <Activity size={14} />, type: 'widget' },
      { label: 'Trade Exits', value: 'exit', icon: <PieChart size={14} />, type: 'widget' },
      { label: 'Currency Strength', value: 'currency', icon: <Coins size={14} />, type: 'widget' },
      { label: 'Monthly Growth', value: 'monthly', icon: <TrendingUp size={14} />, type: 'widget' },
      { label: 'Plan Adherence', value: 'adherence', icon: <CheckCircle2 size={14} />, type: 'widget' },
      { label: 'Mindset P/L', value: 'mindset_pl', icon: <Brain size={14} />, type: 'widget' },
      { label: 'Create Goal', value: 'create_goal', icon: <Target size={14} />, type: 'widget' },
      { label: 'Pair Breakdown', value: 'pairs', icon: <List size={14} />, type: 'widget' },
      { label: 'Drawdown Map', value: 'drawdown', icon: <TrendingUp size={14} />, type: 'widget' },
      { label: 'Trade History', value: 'history', icon: <List size={14} />, type: 'widget' },
      { label: 'Strategy Efficiency', value: 'strategy', icon: <Wand2 size={14} />, type: 'widget' },
      { label: 'Symbol Performance', value: 'symbol', icon: <PieChart size={14} />, type: 'widget' },
    ];

    const uniqueSymbols = Array.from(new Set(trades.map(t => t.pair.toUpperCase())))
      .sort()
      .map(symbol => ({
        label: `${symbol} Live Chart`,
        value: symbol,
        icon: <TrendingUp size={14} className="text-emerald-500" />,
        type: 'symbol'
      }));

    return [...widgets, ...uniqueSymbols];
  }, [trades]);

  const renderWithMentions = (content: React.ReactNode): React.ReactNode => {
    if (typeof content !== 'string') return content;

    // Create a dynamic regex from available labels and values to handle multi-word mentions
    const mentionTerms = availableMentions.flatMap(m => [m.label, m.value]);
    // Sort by length descending to match longest phrases first (e.g. "Trade Momentum" before "Trade")
    const sortedTerms = Array.from(new Set(mentionTerms)).sort((a, b) => b.length - a.length);
    const escapedTerms = sortedTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const mentionRegex = new RegExp(`(@(?:${escapedTerms.join('|')}))`, 'gi');

    const parts = content.split(mentionRegex);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20 inline-block">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const filteredMentions = useMemo(() => {
    if (!mentionFilter) return [];
    return availableMentions.filter(m =>
      m.label.toLowerCase().includes(mentionFilter.toLowerCase()) ||
      m.value.toLowerCase().includes(mentionFilter.toLowerCase())
    );
  }, [availableMentions, mentionFilter]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setPersistedMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const scrollToMessage = (id: string) => {
    const element = messageRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsHistoryOpen(false);
    }
  };

  const toggleWidget = (id: string) => {
    setExpandedWidgets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const tagToLabel: Record<string, string> = {
    'pnl': 'Equity Growth Analysis',
    'winrate': 'Win Rate Distribution',
    'mindset': 'Psychology Footprint',
    'sessions': 'Session Performance',
    'pair': 'Currency Pair breakdown',
    'drawdown': 'Risk & Drawdown Map',
    'momentum': 'Trade Momentum & Streaks',
    'exit': 'Trade Exit Analysis',
    'currency': 'Currency Strength Meter',
    'monthly': 'Monthly Performance vs Drawdown',
    'adherence': 'P/L by Plan Adherence',
    'mindset_pl': 'P/L by Mindset Breakdown',
    'table': 'Recent Trade History',
    'chart': 'Live Market Chart',
    'strategy': 'Strategy Efficiency',
    'symbol': 'Symbol Performance',
    'create_goal': 'Goal Architect',
    'mermaid': 'Strategic Diagram',
    'checklist': 'Interactive Plan Checklist'
  };

  const handleSaveToNotebook = async (title: string, content: string) => {
    if (!onAddNote) return;
    try {
      // For Mermaid diagrams, we wrap them in a special div that our notebook will recognize
      const formattedContent = content.startsWith('```mermaid')
        ? `<div class="mermaid-diagram-note">${content}</div>`
        : content;

      await onAddNote({
        title: title,
        content: formattedContent,
        category: 'Strategy',
        tags: ['AI Generated', 'Plan Mode'],
        id: '',
        date: new Date().toISOString(),
        isPinned: false,
        color: 'gray'
      });
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const handleExportStrategy = () => {
    // Collect all strategy artifacts from the chat
    let exportContent = `# Trading Strategy: ${userProfile?.name || 'Trader'}'s Plan\n`;
    exportContent += `Exported on: ${new Date().toLocaleString()}\n\n`;

    messages.forEach(msg => {
      if (msg.role === 'assistant') {
        // Add text content
        if (msg.content && !msg.content.includes('Hello')) {
          exportContent += `${msg.content}\n\n`;
        }

        // Add Checklists
        if (msg.checklistData) {
          Object.values(msg.checklistData).forEach((checklist: any) => {
            exportContent += `## ${checklist.title}\n`;
            checklist.items.forEach((item: any) => {
              exportContent += `- [${item.checked ? 'x' : ' '}] ${item.text}\n`;
            });
            exportContent += `\n`;
          });
        }

        // Add Mermaid Diagrams
        if (msg.mermaidData) {
          Object.values(msg.mermaidData).forEach((diagram: any) => {
            exportContent += `### ${diagram.type} Diagram\n`;
            exportContent += `\`\`\`mermaid\n${diagram.code}\n\`\`\`\n\n`;
          });
        }
      }
    });

    // Create a blob and download it
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JFX-Strategy-Plan-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFixMermaid = async (type: string, code: string) => {
    const fixPrompt = `The Mermaid ${type} diagram you generated has a syntax error. Please fix the following code and return ONLY the corrected [WIDGET:MERMAID:${type}]CODE[/WIDGET:MERMAID] block:

\`\`\`mermaid
${code}
\`\`\``;

    // Directly send the fix request instead of using setTimeout
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: fixPrompt, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setErrorMessage(null);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const fullResponse = await geminiService.generateResponse(fixPrompt, trades, userProfile, goals, dailyBias, false, history, selectedModel, isPlanMode, communicationStyle);
      const aiMessageId = (Date.now() + 1).toString();
      processResponse(fullResponse, aiMessageId);
    } catch (error) {
      console.error("Fix Mermaid Error:", error);
      setErrorMessage("Failed to fix the diagram. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const renderWidget = (key: string, messageId: string, message: Message, index?: number, children?: React.ReactNode) => {
    const isExpanded = expandedWidgets[`${messageId}-${key}${index !== undefined ? `-${index}` : ''}`];
    const currencySymbol = userProfile?.currencySymbol || '$';

    if (key === 'create_goal') {
      return (
        <GoalCreationWidget 
          isDarkMode={isDarkMode} 
          onAddGoal={onAddGoal || (async () => {})} 
        />
      );
    }

    const getWidgetContent = () => {
      switch (key) {
        case 'pnl': {
          const isPro = userProfile?.plan === APP_CONSTANTS.PLANS.HOBBY; // PRO TIER
          const isPremium = userProfile?.plan === APP_CONSTANTS.PLANS.STANDARD; // PREMIUM
          
          let effectiveInitialBalance = userProfile?.initialBalance || 0;
          
          if ((isPro || isPremium) && eaSession?.data?.account?.balance !== undefined) {
               const totalPnL = (trades || []).reduce((acc, t) => acc + t.pnl, 0);
               effectiveInitialBalance = eaSession.data.account.balance - totalPnL;
          }

          let cumulative = effectiveInitialBalance;
          const equityData = [cumulative];
          trades.forEach(t => {
            cumulative += t.pnl;
            equityData.push(cumulative);
          });
          
          const currentBalance = eaSession?.data?.account?.equity !== undefined
            ? eaSession.data.account.equity
            : (equityData?.length > 0 ? equityData[equityData.length - 1] : 0);

          return (
            <div className="p-0 sm:p-2 w-full h-full">
              <EquityCurveWidget 
                trades={trades} 
                equityData={equityData} 
                isDarkMode={isDarkMode} 
                currencySymbol={currencySymbol} 
                currentBalanceOverride={currentBalance}
              />
            </div>
          );
        }
        case 'winrate':
          return <div className="p-0 sm:p-2 w-full h-full"><OutcomeDistributionWidget trades={trades} isDarkMode={isDarkMode} /></div>;
        case 'pair':
          return <div className="p-0 sm:p-2 w-full h-full"><PerformanceByPairWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} /></div>;
        case 'mindset':
          return <div className="p-0 sm:p-2 w-full h-full"><PerformanceRadarWidget trades={trades} isDarkMode={isDarkMode} /></div>;
        case 'sessions':
          return <div className="p-0 sm:p-2 w-full h-full"><PerformanceBySession trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} /></div>;
        case 'drawdown':
          return <div className="p-0 sm:p-2 w-full h-full"><DrawdownOverTimeWidget trades={trades} isDarkMode={isDarkMode} userProfile={userProfile!} /></div>;
        case 'momentum':
          return <div className="p-0 sm:p-2 w-full h-full"><MomentumStreakWidget trades={trades} isDarkMode={isDarkMode} /></div>;
        case 'exit':
          return <div className="p-0 sm:p-2 w-full h-full"><TradeExitAnalysisWidget trades={trades} isDarkMode={isDarkMode} /></div>;
        case 'currency':
          return <div className="p-0 sm:p-2 w-full h-full"><CurrencyStrengthMeter trades={trades} isDarkMode={isDarkMode} /></div>;
        case 'monthly':
          return <div className="p-0 sm:p-2 w-full h-full"><MonthlyPerformanceWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} /></div>;
        case 'adherence':
          return <div className="p-0 sm:p-2 w-full h-full"><PLByPlanAdherenceWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} /></div>;
        case 'mindset_pl':
          return <div className="p-0 sm:p-2 w-full h-full"><PLByMindsetWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} /></div>;
        case 'table':
          return <div className="p-0 sm:p-2 w-full h-full overflow-x-auto"><ExecutionPerformanceTable trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} initialBalance={userProfile?.initialBalance || 0} /></div>;
        case 'strategy':
          return <div className="p-0 sm:p-2 w-full h-full"><StrategyPerformanceBubbleChart trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} /></div>;
        case 'symbol':
          return <div className="p-0 sm:p-2 w-full h-full"><SymbolPerformanceWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} /></div>;
        case 'chart': {
          const chartKey = index !== undefined ? `${messageId}-chart-${index}` : `${messageId}-chart`;
          const symbol = message.chartSymbols?.[chartKey] || "FX:EURUSD";
          return (
            <div className="p-0 sm:p-2 w-full h-[250px] sm:h-[350px]">
              <TradingViewWidget
                symbol={symbol}
                theme={isDarkMode ? 'dark' : 'light'}
                chartId={chartKey}
                showToolbar={false}
              />
            </div>
          );
        }
        case 'mermaid': {
          const mermaidKey = index !== undefined ? `${messageId}-mermaid-${index}` : `${messageId}-mermaid`;
          const mData = message.mermaidData?.[mermaidKey];
          if (!mData) return null;
          return (
            <div className="p-0 sm:p-2 w-full h-full">
              <MermaidWidget
                code={mData.code}
                type={mData.type}
                isDarkMode={isDarkMode}
                onSave={() => handleSaveToNotebook(`Strategy Map: ${mData.type}`, `\`\`\`mermaid\n${mData.code}\n\`\`\``)}
                onFix={() => handleFixMermaid(mData.type, mData.code)}
              />
            </div>
          );
        }
        case 'checklist': {
          const checklistKey = index !== undefined ? `${messageId}-checklist-${index}` : `${messageId}-checklist`;
          const cData = message.checklistData?.[checklistKey];
          if (!cData) return null;
          return (
            <div className="p-0 sm:p-2 w-full h-full">
              <ChecklistWidget title={cData.title} items={cData.items} isDarkMode={isDarkMode} />
            </div>
          );
        }
        default: return null;
      }
    };

    const isSmallWidget = ['sessions', 'strategy', 'table', 'exit', 'currency'].includes(key);

    return (
      <div key={`${key}-${index ?? 0}`} className={`rounded-2xl sm:rounded-[20px] border transition-all duration-500 overflow-hidden w-full ${isDarkMode
        ? 'bg-gradient-to-br from-[#121218] to-[#0a0a0c] border-white/8 shadow-lg shadow-black/20'
        : 'bg-gradient-to-br from-white to-slate-50 border-slate-200/60 shadow-md'
        } ${isExpanded ? 'ring-1 ring-indigo-500/30' : ''} group/widget`}>
        <button
          onClick={() => toggleWidget(`${messageId}-${key}${index !== undefined ? `-${index}` : ''}`)}
          className={`w-full flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 transition-all ${isExpanded
            ? (isDarkMode ? 'bg-indigo-500/[0.05] text-indigo-400' : 'bg-indigo-50/80 text-indigo-600')
            : (isDarkMode ? 'hover:bg-white/[0.03] text-zinc-400' : 'hover:bg-slate-50/80 text-slate-500')
            }`}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`p-2 sm:p-2.5 rounded-xl transition-all duration-500 ${isExpanded ? 'bg-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10' : 'bg-zinc-500/5 group-hover/widget:bg-zinc-500/10'}`}>
              {key === 'mermaid' ? <Workflow size={16} /> :
                key === 'checklist' ? <List size={16} /> :
                  <TrendingUp size={16} />}
            </div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em]">
              {tagToLabel[key] || 'Data Widget'}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'text-indigo-500 bg-indigo-500/10' : 'text-zinc-500/40'}`}
          >
            <ChevronDown size={16} />
          </motion.div>
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/5"
            >
              <div className="p-4 sm:p-6 flex flex-col gap-6">
                <div className="w-full">
                  {getWidgetContent()}
                </div>
                {children && (
                  <div className={`p-6 rounded-2xl border leading-relaxed text-[13px] relative overflow-hidden ${isDarkMode ? 'bg-white/[0.02] border-white/5 text-zinc-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/30" />
                    <div className="relative z-10 font-medium">
                      {children}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Mention detection
    const lastAtPos = value.lastIndexOf('@');
    if (lastAtPos !== -1 && (lastAtPos === 0 || value[lastAtPos - 1] === ' ')) {
      const query = value.substring(lastAtPos + 1);
      if (!query.includes(' ')) {
        setMentionMenuFilter(query);
        // Trigger only when at least 1 character is added after @
        setShowMentionMenu(query.length >= 1);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentionMenu(false);
  };

  const insertMention = (mention: string) => {
    const lastAtPos = input.lastIndexOf('@');
    const newValue = input.substring(0, lastAtPos) + '@' + mention + ' ';
    setInput(newValue);
    setShowMentionMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMentions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredMentions[mentionIndex]) {
          insertMention(filteredMentions[mentionIndex].value);
        }
      } else if (e.key === 'Escape') {
        setShowMentionMenu(false);
      }
    } else if (e.key === 'Enter') {
      handleSend();
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMessage("Voice input is not supported in this browser.");
      return;
    }

    setIsListening(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setErrorMessage("Microphone access denied.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    setErrorMessage(null);

    try {
      const history = recallMemory ? messages.map(m => ({ role: m.role, content: m.content })) : [];
      const fullResponse = await geminiService.generateResponse(currentInput, trades, userProfile, goals, dailyBias, false, history, selectedModel, isPlanMode, communicationStyle);
      const aiMessageId = (Date.now() + 1).toString();
      processResponse(fullResponse, aiMessageId);

      // Auto-expand widgets if autoRevealCharts is enabled
      if (autoRevealCharts) {
        // Will be handled in processResponse
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      const errorMsg = error?.message || "I'm experiencing a connection issue. Please check your internet and try again.";
      setErrorMessage(errorMsg);

      // Add error message to chat
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Connection Issue**\n\nI couldn't process your request. ${errorMsg}\n\n> Try again in a moment, or rephrase your question.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpecialAnalysis = async () => {
    if (trades.length < 5 && !isPlanMode) {
      addToast({
        type: 'info',
        title: 'Insufficient Data',
        message: `You need at least 5 logged trades for a deep performance analysis. You currently have ${trades.length}.`,
        duration: 5000
      });
      return;
    }

    setIsTyping(true);
    setAnalysisStatus('analyzing');
    setCurrentStepIndex(0);

    // Cycle through steps
    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prev => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
    }, 1500);

    const analysisId = Date.now().toString();
    const analysisRequest: Message = {
      id: analysisId,
      role: 'user',
      content: isPlanMode ? "Start New Strategy Planning Session" : "Deep Performance Analysis & Goal Suggestion",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, analysisRequest]);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const fullResponse = await geminiService.generateResponse(isPlanMode ? "Let's start building a new strategy." : "", trades, userProfile, goals, dailyBias, !isPlanMode, history, selectedModel, isPlanMode, communicationStyle);
      clearInterval(stepInterval);
      setCurrentStepIndex(analysisSteps.length - 1);
      const aiMessageId = (Date.now() + 1).toString();
      setAnalysisStatus('success');
      processResponse(fullResponse, aiMessageId);

      // Keep success state for 1.5 seconds before resetting
      setTimeout(() => {
        setAnalysisStatus('idle');
        setCurrentStepIndex(0);
      }, 1500);
    } catch (error) {
      clearInterval(stepInterval);
      console.error("Analysis Error:", error);
      setAnalysisStatus('error');
      setTimeout(() => setAnalysisStatus('idle'), 2000);
    } finally {
      setIsTyping(false);
    }
  };

  const processResponse = (fullResponse: string, messageId: string) => {
    let cleanContent = fullResponse;
    const foundKeys: string[] = [];
    const chartSymbols: Record<string, string> = {};
    const sections: Record<string, string> = {};
    const mermaidData: Record<string, { type: string, code: string }> = {};

    // Parse Sections
    const sectionNames = ['LACKS', 'RECOMMENDATIONS', 'GOALS'];
    sectionNames.forEach(name => {
      const tag = `[SECTION:${name}]`;
      if (cleanContent.includes(tag)) {
        const parts = cleanContent.split(tag);
        let sectionContent = parts[1];
        sectionNames.forEach(otherName => {
          const otherTag = `[SECTION:${otherName}]`;
          if (sectionContent.includes(otherTag)) {
            sectionContent = sectionContent.split(otherTag)[0];
          }
        });
        
        // Track widgets found in section for history/expansion
        const tagMap: Record<string, string> = {
          '[WIDGET:PNL]': 'pnl', '[WIDGET:WINRATE]': 'winrate', '[WIDGET:MINDSET]': 'mindset',
          '[WIDGET:SESSIONS]': 'sessions', '[WIDGET:PAIR]': 'pair', '[WIDGET:DRAWDOWN]': 'drawdown', 
          '[WIDGET:MOMENTUM]': 'momentum', '[WIDGET:EXIT]': 'exit', '[WIDGET:CURRENCY]': 'currency',
          '[WIDGET:MONTHLY]': 'monthly', '[WIDGET:ADHERENCE]': 'adherence', '[WIDGET:MINDSET_PL]': 'mindset_pl',
          '[WIDGET:CREATE_GOAL]': 'create_goal',
          '[WIDGET:TABLE]': 'table', '[WIDGET:STRATEGY_EFFICIENCY]': 'strategy', '[WIDGET:SYMBOL]': 'symbol'
        };
        for (const [t, key] of Object.entries(tagMap)) {
          if (sectionContent.includes(t)) foundKeys.push(key);
        }

        // KEEP widget tags in section content
        sections[name] = sectionContent.trim();
        cleanContent = cleanContent.replace(tag, '').replace(sectionContent, '');
      }
    });

    const tagMap: Record<string, string> = {
      '[WIDGET:PNL]': 'pnl', '[WIDGET:WINRATE]': 'winrate', '[WIDGET:MINDSET]': 'mindset',
      '[WIDGET:SESSIONS]': 'sessions', '[WIDGET:PAIR]': 'pair', '[WIDGET:DRAWDOWN]': 'drawdown', 
      '[WIDGET:MOMENTUM]': 'momentum', '[WIDGET:EXIT]': 'exit', '[WIDGET:CURRENCY]': 'currency',
      '[WIDGET:MONTHLY]': 'monthly', '[WIDGET:ADHERENCE]': 'adherence', '[WIDGET:MINDSET_PL]': 'mindset_pl',
      '[WIDGET:CREATE_GOAL]': 'create_goal',
      '[WIDGET:TABLE]': 'table', '[WIDGET:STRATEGY_EFFICIENCY]': 'strategy', '[WIDGET:SYMBOL]': 'symbol'
    };

    for (const [tag, key] of Object.entries(tagMap)) {
      if (fullResponse.includes(tag)) {
        // Keep tag in content for inline rendering, but track it for history
        foundKeys.push(key);
      }
    }

    let chartIdx = 0;
    const chartRegex = /\[WIDGET:CHART:([A-Z0-9]+)\]/g;
    let match;
    while ((match = chartRegex.exec(fullResponse)) !== null) {
      const symbol = match[1];
      const tag = match[0];
      foundKeys.push('chart');
      chartSymbols[`${messageId}-chart-${chartIdx}`] = symbol;
      // Replace only this occurrence with an indexed tag
      cleanContent = cleanContent.replace(tag, `[WIDGET:CHART_INDEXED:${chartIdx}]`);
      chartIdx++;
    }

    // Mermaid Parsing [WIDGET:MERMAID:TYPE]CODE[/WIDGET:MERMAID]
    let mermaidIdx = 0;
    const mermaidRegex = /\[WIDGET:MERMAID:([A-Z]+)\]([\s\S]+?)\[\/WIDGET:MERMAID\]/g;
    let mermaidMatch;
    while ((mermaidMatch = mermaidRegex.exec(fullResponse)) !== null) {
      const type = mermaidMatch[1];
      const tag = mermaidMatch[0];
      let code = mermaidMatch[2].trim().replace(/\\n/g, '\n');
      code = code.replace(/```mermaid/g, '').replace(/```/g, '').trim();
      
      foundKeys.push('mermaid');
      mermaidData[`${messageId}-mermaid-${mermaidIdx}`] = { type, code };
      cleanContent = cleanContent.replace(tag, `[WIDGET:MERMAID_INDEXED:${mermaidIdx}]`);
      mermaidIdx++;
    }

    // Checklist Parsing [WIDGET:CHECKLIST:TITLE]ITEM1|ITEM2|...[/WIDGET:CHECKLIST]
    let checklistIdx = 0;
    const checklistRegex = /\[WIDGET:CHECKLIST:([^\]]+)\]([\s\S]+?)\[\/WIDGET:CHECKLIST\]/g;
    let checklistMatch;
    const checklistData: Record<string, { title: string, items: { text: string, checked: boolean }[] }> = {};
    while ((checklistMatch = checklistRegex.exec(fullResponse)) !== null) {
      const title = checklistMatch[1];
      const tag = checklistMatch[0];
      const items = checklistMatch[2].split('|').map(item => ({ text: item.trim(), checked: false }));
      foundKeys.push('checklist');
      checklistData[`${messageId}-checklist-${checklistIdx}`] = { title, items };
      cleanContent = cleanContent.replace(tag, `[WIDGET:CHECKLIST_INDEXED:${checklistIdx}]`);
      checklistIdx++;
    }

    const aiMessage: Message = {
      id: messageId,
      role: 'assistant',
      content: cleanContent.trim(),
      timestamp: new Date(),
      widgetKeys: foundKeys.length > 0 ? foundKeys : undefined,
      chartSymbols: Object.keys(chartSymbols).length > 0 ? chartSymbols : undefined,
      sections: Object.keys(sections).length > 0 ? sections : undefined,
      mermaidData: Object.keys(mermaidData).length > 0 ? mermaidData : undefined,
      checklistData: Object.keys(checklistData).length > 0 ? checklistData : undefined,
    };
    setMessages(prev => [...prev, aiMessage]);

    // Auto-expand widgets if autoRevealCharts is enabled
    if (autoRevealCharts && foundKeys.length > 0) {
      const newExpandedWidgets: Record<string, boolean> = {};
      foundKeys.forEach((key, i) => { newExpandedWidgets[`${messageId}-${key}-${i}`] = true;
      });
      setExpandedWidgets(prev => ({ ...prev, ...newExpandedWidgets }));
    }
  };

  const renderContentBlocks = (text: string, message: Message) => {
    const blocks: React.ReactNode[] = [];
    
    // 1. Identify all items
    const parts = text.split(/(\[WIDGET:(?:PNL|WINRATE|MINDSET|SESSIONS|PAIR|DRAWDOWN|MOMENTUM|EXIT|CURRENCY|MONTHLY|ADHERENCE|MINDSET_PL|CREATE_GOAL|TABLE|STRATEGY_EFFICIENCY|SYMBOL|CHART_INDEXED:\d+|MERMAID_INDEXED:\d+|CHECKLIST_INDEXED:\d+)\])/g);
    
    parts.forEach((part, idx) => {
      if (!part) return;
      const match = part.match(/\[WIDGET:(PNL|WINRATE|MINDSET|SESSIONS|PAIR|DRAWDOWN|MOMENTUM|EXIT|CURRENCY|MONTHLY|ADHERENCE|MINDSET_PL|CREATE_GOAL|TABLE|STRATEGY_EFFICIENCY|SYMBOL|CHART_INDEXED|MERMAID_INDEXED|CHECKLIST_INDEXED)(?::(\d+))?\]/);
      
      if (match) {
        const type = match[1];
        const index = match[2] ? parseInt(match[2]) : undefined;
        let actualKey = type.toLowerCase();
        if (type === 'STRATEGY_EFFICIENCY') actualKey = 'strategy';
        if (type.includes('_INDEXED')) actualKey = type.replace('_INDEXED', '').toLowerCase();
        
        const isSmallWidget = ['sessions', 'strategy', 'table', 'exit', 'currency'].includes(actualKey);
        
        blocks.push(
          <div key={`widget-${idx}`} className={`my-4 ${isSmallWidget ? 'w-fit max-w-full' : 'w-full'}`}>
            {renderWidget(actualKey, message.id, message, index)}
          </div>
        );
      } else {
        blocks.push(
          <div key={`text-${idx}`} className={`mb-4 last:mb-0 text-[13px] sm:text-[14px] leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'} prose prose-sm max-w-none dark:prose-invert`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{renderWithMentions(children)}</p>,
              ul: ({ children }) => <ul className="list-disc ml-4 mb-4 space-y-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 mb-4 space-y-2">{children}</ol>,
              li: ({ children }) => <li className="marker:text-indigo-500 pl-1">{renderWithMentions(children)}</li>,
              strong: ({ children }) => <strong className={`font-black tracking-tight ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{renderWithMentions(children)}</strong>,
            }}>
              {part}
            </ReactMarkdown>
          </div>
        );
      }
    });

    return <div className="space-y-2 w-fit max-w-full">{blocks}</div>;
  };

  const renderMessageContent = (message: Message) => {
    return renderContentBlocks(message.content, message);
  };

  const renderSectionCards = (sections: Record<string, string>, message: Message) => {
    const config: Record<string, { title: string, icon: any, color: string, bg: string, border: string, dot: string, glow: string }> = {
      'LACKS': {
        title: 'Performance Leaks',
        icon: <Trash2 size={18} />,
        color: 'text-rose-500',
        bg: isDarkMode ? 'bg-rose-500/[0.03]' : 'bg-rose-50/50',
        border: isDarkMode ? 'border-rose-500/10' : 'border-rose-200/50',
        dot: 'bg-rose-500',
        glow: 'group-hover:shadow-rose-500/5'
      },
      'RECOMMENDATIONS': {
        title: 'Strategic Fixes',
        icon: <Wand2 size={18} />,
        color: 'text-amber-500',
        bg: isDarkMode ? 'bg-amber-500/[0.03]' : 'bg-amber-50/50',
        border: isDarkMode ? 'border-amber-500/10' : 'border-amber-200/50',
        dot: 'bg-amber-500',
        glow: 'group-hover:shadow-amber-500/5'
      },
      'GOALS': {
        title: '30-Day Roadmap',
        icon: <TrendingUp size={18} />,
        color: 'text-emerald-500',
        bg: isDarkMode ? 'bg-emerald-500/[0.03]' : 'bg-emerald-50/50',
        border: isDarkMode ? 'border-emerald-500/10' : 'border-emerald-200/50',
        dot: 'bg-emerald-500',
        glow: 'group-hover:shadow-emerald-500/5'
      }
    };

    const Card = ({ id, className }: { id: string, className?: string }) => {
      const content = sections[id];
      if (!content) return null;
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-[32px] border ${config[id].bg} ${config[id].border} flex flex-col gap-6 relative overflow-hidden group hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-all duration-700 shadow-2xl ${config[id].glow} ${className}`}
        >
          {/* Subtle Accent Background Glow */}
          <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${config[id].dot.replace('bg-', 'bg-')}`} />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-white/5 backdrop-blur-md ${config[id].color} shadow-lg border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                {config[id].icon}
              </div>
              <div className="flex flex-col">
                <h4 className={`text-[11px] font-black uppercase tracking-[0.25em] ${config[id].color}`}>
                  {config[id].title}
                </h4>
                <div className="flex items-center gap-1 mt-1">
                  <div className={`w-1 h-1 rounded-full ${config[id].dot}`} />
                  <span className="text-[8px] font-bold opacity-30 uppercase tracking-widest">Active Analysis</span>
                </div>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${config[id].dot} animate-pulse shadow-[0_0_12px] ${config[id].dot.replace('bg-', 'shadow-')}`} />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-start w-full">
            {renderContentBlocks(content, message)}
          </div>
        </motion.div>
      );
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 items-stretch">
        <Card id="LACKS" className="lg:col-span-12" />
        <Card id="RECOMMENDATIONS" className="lg:col-span-6" />
        <Card id="GOALS" className="lg:col-span-6" />
      </div>
    );
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: `Chat cleared. How can I help you now, ${userProfile?.name?.split(' ')[0] || 'Trader'}?`,
      timestamp: new Date(),
    }]);
  };

  const deleteMessage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const analysisHistory = useMemo(() => {
    return messages.filter(m => m.widgetKeys && m.widgetKeys.length > 0);
  }, [messages]);

  return (
    <div className={`flex flex-col h-full transition-all duration-500 overflow-hidden ${isDarkMode ? 'bg-[#050505] text-zinc-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}>
      {/* Header */}
      <div className={`px-4 sm:px-6 py-4 flex items-center justify-between border-b transition-all duration-500 z-30 sticky top-0 ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-white/60'
        } backdrop-blur-2xl`}>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-500 group-hover:scale-105 ${isPlanMode
              ? 'bg-gradient-to-br from-[#FF4F01] to-[#FF8F01] shadow-[#FF4F01]/20'
              : 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-500/20'
              }`}>
              {isPlanMode ? <Workflow size={24} className="sm:size-7" /> : <Bot size={24} className="sm:size-7" />}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#050505] shadow-lg" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-widest">
                {isPlanMode ? 'Strategy Architect' : 'JFX AI Assistant'}
              </h2>
              {!isPlanMode && (
                <div className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase tracking-widest border border-indigo-500/20">
                  v3.0
                </div>
              )}
              {isPlanMode && (
                <div className="px-2 py-0.5 rounded-full bg-[#FF4F01]/10 text-[#FF4F01] text-[8px] font-black uppercase tracking-widest border border-[#FF4F01]/20 animate-pulse">
                  Active Plan
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`w-1 h-1 rounded-full bg-emerald-500/40 ${isTyping ? 'animate-bounce' : ''}`} style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{isTyping ? 'Thinking...' : 'System Ready'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPlanMode && (
            <button
              onClick={handleExportStrategy}
              className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${isDarkMode
                ? 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm'
                }`}
            >
              <Download size={15} />
              Export Plan
            </button>
          )}
          <div className={`h-8 w-px mx-1 hidden sm:block ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'}`} />
          <div className="flex items-center bg-zinc-500/5 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className={`p-2 sm:p-2.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-white text-slate-500 shadow-sm'
                }`}
              title="Analysis History"
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 sm:p-2.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-white text-slate-500 shadow-sm'
                }`}
              title="Settings"
            >
              <SettingsIcon size={18} />
            </button>
            <button
              onClick={clearChat}
              className={`p-2 sm:p-2.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-indigo-500/10 text-zinc-400 hover:text-indigo-400' : 'hover:bg-indigo-50 text-slate-500 hover:text-indigo-600'
                }`}
              title="Reset Conversation"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-10 custom-scrollbar scroll-smooth relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03] dark:opacity-[0.05]">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[120px]" />
        </div>

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              ref={el => { messageRefs.current[message.id] = el; }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full relative z-10`}
            >
              <div className={`flex gap-4 sm:gap-5 w-full ${message.role === 'user' ? 'sm:max-w-[75%] lg:max-w-[60%] flex-row-reverse' : 'sm:max-w-[85%] lg:max-w-[80%]'} group/msg`}>
                {/* Avatar */}
                <div className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border transition-all duration-500 ${message.role === 'user'
                  ? (isDarkMode ? 'bg-zinc-900 border-white/5 shadow-lg shadow-black/20' : 'bg-white border-slate-200 shadow-sm')
                  : (isDarkMode ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20')
                  } group-hover/msg:scale-105`}>
                  {message.role === 'user'
                    ? (userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} alt="User" className="w-full h-full object-cover" /> : <User size={18} className={isDarkMode ? 'text-zinc-500' : 'text-slate-400'} />)
                    : <Bot size={20} className="sm:size-6" />
                  }
                </div>

                <div className={`flex flex-col gap-2 min-w-0 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Message Bubble */}
                  <div className={`w-fit max-w-full overflow-hidden transition-all duration-500 relative group/bubble ${message.role === 'user'
                    ? (isDarkMode ? 'bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-white/5 rounded-[24px] rounded-tr-none shadow-lg shadow-black/20' : 'bg-gradient-to-br from-white to-slate-50 border border-slate-200/80 shadow-md rounded-[24px] rounded-tr-none')
                    : (isDarkMode ? 'bg-gradient-to-br from-[#121218] to-[#0a0a0c] border border-white/8 rounded-[28px] rounded-tl-none backdrop-blur-xl shadow-2xl shadow-black/30' : 'bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 shadow-lg rounded-[28px] rounded-tl-none')
                    }`}>
                    
                    {/* Animated gradient accent for AI messages */}
                    {message.role === 'assistant' && (
                      <>
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 via-violet-500 to-purple-600 rounded-l-[28px]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-500 rounded-[28px]" />
                      </>
                    )}

                    <div className="p-5 sm:p-7">
                      {renderMessageContent(message)}
                    </div>

                    {/* Bento Analysis Grid */}
                    {(message.sections || (message.widgetKeys && message.widgetKeys.length > 0)) && (
                      <div className={`p-6 sm:p-8 pt-0 space-y-8 ${message.role === 'assistant' ? 'mt-0' : ''}`}>
                        {message.sections && (
                          <div className="pt-8 border-t border-white/5">
                            {renderSectionCards(message.sections, message)}
                          </div>
                        )}
                        
                        {/* Render footer widgets ONLY if they were not placed inline in the content or sections */}
                        <div className="grid grid-cols-1 gap-6">
                          {message.widgetKeys?.filter(key => {
                            const tagPart = key === 'strategy' ? 'STRATEGY_EFFICIENCY' : key.toUpperCase();
                            const inContent = message.content.includes(`[WIDGET:${tagPart}`) || 
                                             message.content.includes(`[WIDGET:${tagPart}_INDEXED`);
                            const inSections = message.sections && Object.values(message.sections).some((s: any) => 
                                             s.includes(`[WIDGET:${tagPart}`) || 
                                             s.includes(`[WIDGET:${tagPart}_INDEXED`));
                            return !inContent && !inSections;
                          }).map((key, i) => (
                            <div key={`footer-widget-${i}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                              {renderWidget(key, message.id, message, i)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className={`px-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] opacity-30 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="w-1 h-1 rounded-full bg-current" />
                    <span>{message.role === 'user' ? 'Sent' : 'Assistant'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start relative z-10 pl-1">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 shrink-0">
                <Brain size={20} className="animate-pulse" />
              </div>
              <div className={`flex flex-col gap-3 p-4 rounded-3xl rounded-tl-none border ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -5, 0], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                    />
                  ))}
                </div>
                {analysisStatus === 'analyzing' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-col gap-3 border-t border-indigo-500/10 pt-3 min-w-[220px]"
                  >
                    <div className="flex justify-between items-center px-1">
                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors duration-500 ${stepColors[currentStepIndex]}`}>
                          {analysisSteps[currentStepIndex]}
                        </span>
                        <span className="text-[10px] font-mono font-bold opacity-40">
                            {Math.round(((currentStepIndex + 1) / analysisSteps.length) * 100)}%
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 w-full bg-zinc-500/10 rounded-full overflow-hidden">
                        <motion.div 
                            className={`h-full transition-colors duration-500 ${stepBgColors[currentStepIndex]}`}
                            animate={{ width: `${((currentStepIndex + 1) / analysisSteps.length) * 100}%` }}
                        />
                    </div>

                    {/* Step History */}
                    <div className="space-y-1.5 mt-1">
                        {analysisSteps.map((step, i) => (
                            <div 
                                key={i} 
                                className={`flex items-center gap-2 text-[8px] font-bold uppercase tracking-wider transition-all duration-500 ${
                                    i < currentStepIndex ? 'text-emerald-500 opacity-60' : 
                                    i === currentStepIndex ? 'text-indigo-400' : 'opacity-20'
                                }`}
                            >
                                {i < currentStepIndex ? (
                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                ) : (
                                    <div className={`w-1 h-1 rounded-full ${i === currentStepIndex ? 'bg-indigo-400 animate-pulse' : 'bg-current'}`} />
                                )}
                                {step.replace('...', '')}
                            </div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 sm:p-6 pt-2 relative z-20">
        <div className={`relative max-w-4xl mx-auto rounded-[24px] sm:rounded-[32px] border transition-all duration-500 backdrop-blur-3xl shadow-2xl ${
          input.includes('@')
            ? (isDarkMode ? 'bg-indigo-500/10 border-indigo-500/40 shadow-indigo-500/20' : 'bg-indigo-50/80 border-indigo-300 shadow-indigo-100')
            : (isDarkMode ? 'bg-zinc-900/40 border-white/10 hover:border-white/20 shadow-black/40' : 'bg-white/80 border-slate-200/60 hover:border-slate-300 shadow-slate-200/40')
          }`}>
          <div className="flex items-center gap-2 p-2 px-4 sm:px-6">
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={handleSpecialAnalysis}
                  disabled={isTyping}
                  className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-all group border relative overflow-hidden ${isDarkMode
                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'
                    : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'
                    }`}
                  title={isPlanMode ? 'Strategy Architect' : 'Performance Analysis'}
                >
                  <Brain size={14} className="group-hover:scale-110 transition-transform" />
                  {analysisStatus !== 'idle' && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 flex gap-0.5">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        className="h-full bg-indigo-500"
                      />
                    </div>
                  )}
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                  className={`w-8 h-8 shrink-0 flex items-center justify-center border rounded-lg transition-all ${isDarkMode ? 'bg-zinc-500/5 border-white/5 text-zinc-400 hover:bg-white/5' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'
                    }`}
                >
                  {isPlanMode ? <Workflow size={14} className="text-[#FF4F01]" /> : <Activity size={14} className="text-indigo-500" />}
                </button>

                <AnimatePresence>
                  {showModeDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className={`absolute bottom-full left-0 mb-2 w-44 rounded-xl border shadow-2xl overflow-hidden z-[100] ${isDarkMode ? 'bg-[#0d1117] border-white/10' : 'bg-white border-slate-200'
                        }`}
                    >
                      <div className="p-1.5 space-y-1">
                        <button
                          onClick={() => { setIsPlanMode(false); setShowModeDropdown(false); }}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left group ${!isPlanMode ? 'bg-indigo-600 text-white' : (isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-50 text-slate-600')}`}
                        >
                          <Brain size={14} />
                          <span className="text-[10px] font-black uppercase">Analysis</span>
                        </button>
                        <button
                          onClick={() => { setIsPlanMode(true); setShowModeDropdown(false); }}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left group ${isPlanMode ? 'bg-[#FF4F01] text-white' : (isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-50 text-slate-600')}`}
                        >
                          <Workflow size={14} />
                          <span className="text-[10px] font-black uppercase">Strategy</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className={`w-px h-3.5 mx-0.5 ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'}`} />

              <button
                onClick={() => {
                  const inputEl = document.getElementById('ai-chat-input') as HTMLInputElement;
                  if (inputEl) {
                    const newValue = input.endsWith(' ') || input === '' ? input + '@' : input + ' @';
                    setInput(newValue);
                    setMentionMenuFilter('');
                    setShowMentionMenu(true);
                    inputEl.focus();
                  }
                }}
                className={`w-8 h-8 shrink-0 flex items-center justify-center border rounded-lg transition-all group ${isDarkMode ? 'bg-zinc-500/5 border-white/5 text-zinc-500 hover:text-amber-500 hover:border-amber-500/30' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-300'
                  }`}
                title="Quick Mention"
              >
                <motion.span 
                  whileTap={{ scale: 0.7, rotate: -15 }}
                  whileHover={{ scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="text-[14px] font-black leading-none"
                >
                  @
                </motion.span>
              </button>
            </div>

            <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

            <div className="flex-1 relative">
              <AnimatePresence>
                {showMentionMenu && filteredMentions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: -10 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute bottom-full left-0 w-56 sm:w-64 mb-3 rounded-[24px] border shadow-2xl overflow-hidden transition-colors duration-500 z-[100] ${isDarkMode ? 'bg-[#0d1117] border-white/10' : 'bg-white border-slate-200'
                      }`}
                  >
                    <div className="p-3 border-b border-white/5 bg-white/[0.01]">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Mentions</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                      {filteredMentions.map((m, i) => (
                        <button
                          key={m.value}
                          onClick={() => insertMention(m.value)}
                          onMouseEnter={() => setMentionIndex(i)}
                          aria-label={`Mention ${m.label}`}
                          className={`w-full flex items-center gap-3 p-3 rounded-[16px] transition-all text-left group ${mentionIndex === i
                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                            : (isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-50 text-slate-600')
                            }`}
                        >
                          <div className={`p-1.5 rounded-lg ${mentionIndex === i ? 'bg-white/20' : (isDarkMode ? 'bg-white/5' : 'bg-slate-100')}`}>
                            {React.cloneElement(m.icon as React.ReactElement<{ size?: number }>, { size: 14 })}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wide truncate">{m.label}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                id="ai-chat-input"
                name="chat-message"
                aria-label="Ask your AI assistant a question"
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask your assistant anything..."
                className={`w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[13px] sm:text-[14px] font-medium py-1.5 placeholder:opacity-30 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`p-2 rounded-[10px] transition-all shadow-xl group ${input.trim()
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/30 active:scale-95'
                : (isDarkMode ? 'bg-white/5 text-zinc-700 cursor-not-allowed' : 'bg-slate-100 text-slate-300 cursor-not-allowed')
                }`}
            >
              <Send className={`w-3.5 h-3.5 transition-transform ${input.trim() ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Analysis History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full max-w-lg rounded-[40px] border overflow-hidden shadow-2xl transition-colors duration-500 ${isDarkMode ? 'bg-[#0d1117] border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500"><History size={24} /></div>
                    <div><h3 className="text-xl font-black uppercase tracking-tight">Analysis History</h3><p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Jump back to key insights</p></div>
                  </div>
                  <button onClick={() => setIsHistoryOpen(false)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-zinc-500' : 'hover:bg-black/5 text-slate-400'}`}><X size={20} /></button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                  {analysisHistory.length === 0 ? (
                    <div className="py-12 text-center opacity-30 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-zinc-500/5 flex items-center justify-center">
                        <History size={40} strokeWidth={1} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-widest">No History</p>
                        <p className="text-[10px] font-medium leading-relaxed max-w-[200px]">
                          Your AI-generated charts and widgets will appear here for quick access.
                        </p>
                      </div>
                    </div>
                  ) : (
                    analysisHistory.map((msg) => (
                      <div key={msg.id} className="relative group/item">
                        <button
                          onClick={() => scrollToMessage(msg.id)}
                          className={`w-full p-4 pr-12 rounded-2xl border text-left transition-all flex flex-col gap-2 group ${isDarkMode ? 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-indigo-500/30' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-300 shadow-sm'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {msg.widgetKeys?.map(key => (
                                <span key={key} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase tracking-wider">{tagToLabel[key].split(' ')[0]}</span>
                              ))}
                            </div>
                            <span className="text-[8px] font-bold opacity-30 uppercase">{new Date(msg.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs font-medium line-clamp-2 opacity-60 group-hover:opacity-100 transition-opacity">"{msg.content}"</p>
                        </button>
                        <button
                          onClick={(e) => deleteMessage(msg.id, e)}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl opacity-0 group-hover/item:opacity-100 transition-all ${isDarkMode ? 'hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500'
                            }`}
                          title="Delete Analysis"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <button onClick={() => setIsHistoryOpen(false)} className="w-full mt-8 py-4 border border-zinc-800 rounded-2xl font-black text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 transition-all">Close History</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AISettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        communicationStyle={communicationStyle}
        setCommunicationStyle={setCommunicationStyle}
        autoRevealCharts={autoRevealCharts}
        setAutoRevealCharts={setAutoRevealCharts}
        recallMemory={recallMemory}
        setRecallMemory={setRecallMemory}
      />
    </div>
  );
};

export default AIChat;
