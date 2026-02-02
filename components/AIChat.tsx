import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade, UserProfile, Goal, DailyBias } from '../types';
import { geminiService } from '../services/geminiService';
import { PerformanceByPairWidget } from './analytics/PerformanceByPairWidget';
import { OutcomeDistributionWidget } from './analytics/OutcomeDistributionWidget';
import { PerformanceRadarWidget } from './analytics/PerformanceRadarWidget';
import { PerformanceBySession } from './analytics/PerformanceBySession';
import { EquityCurveWidget } from './analytics/EquityCurveWidget';
import { ExecutionPerformanceTable } from './analytics/ExecutionPerformanceTable';
import { DrawdownOverTimeWidget } from './analytics/DrawdownOverTimeWidget';
import { StrategyPerformanceBubbleChart } from './analytics/StrategyPerformanceBubbleChart';
import { SymbolPerformanceWidget } from './analytics/SymbolPerformanceWidget';
import TradingViewWidget from './TradingViewWidget';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TrendingUp, PieChart, Brain, Clock, Wand2, Send, Bot, User, Trash2, Coins, ChevronDown, List, Settings as SettingsIcon, X, History, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  widgetKeys?: string[];
  chartSymbols?: Record<string, string>;
  sections?: Record<string, string>;
}

interface AIChatProps {
  isDarkMode: boolean;
  trades: Trade[];
  userProfile: UserProfile | null;
  goals?: Goal[];
  dailyBias?: DailyBias[];
}

const AIChat: React.FC<AIChatProps> = ({ 
  isDarkMode, 
  trades, 
  userProfile, 
  goals = [], 
  dailyBias = [] 
}) => {
  const [persistedMessages, setPersistedMessages] = useLocalStorage<Message[]>('jfx_ai_chat_history', []);
  const [selectedModel, setSelectedModel] = useLocalStorage<string>('jfx_ai_selected_model', 'gemini-1.5-flash');
  
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionMenuFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [expandedWidgets, setExpandedWidgets] = useState<Record<string, boolean>>({});

  const availableMentions = useMemo(() => {
    const widgets = [
      { label: 'Equity Growth', value: 'equitycurve', icon: <TrendingUp size={14} />, type: 'widget' },
      { label: 'Win Rate', value: 'winrate', icon: <PieChart size={14} />, type: 'widget' },
      { label: 'Psychology', value: 'mindset', icon: <Brain size={14} />, type: 'widget' },
      { label: 'Sessions', value: 'sessions', icon: <Clock size={14} />, type: 'widget' },
      { label: 'Pair breakdown', value: 'pairs', icon: <List size={14} />, type: 'widget' },
      { label: 'Drawdown Map', value: 'drawdown', icon: <TrendingUp size={14} />, type: 'widget' },
      { label: 'Trade History', value: 'history', icon: <List size={14} />, type: 'widget' },
      { label: 'Strategy Efficiency', value: 'strategy', icon: <Wand2 size={14} />, type: 'widget' },
      { label: 'Symbol Performance', value: 'components/analytics/SymbolPerformanceWidget.tsx', icon: <PieChart size={14} />, type: 'widget' },
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
    
    const parts = content.split(/(@[a-zA-Z0-9_/.:-]+)/g);
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
    'table': 'Recent Trade History',
    'chart': 'Live Market Chart',
    'strategy': 'Strategy Efficiency',
    'symbol': 'Symbol Performance'
  };

  const renderWidget = (key: string, messageId: string, message: Message) => {
    const isExpanded = expandedWidgets[`${messageId}-${key}`];
    const currencySymbol = userProfile?.currencySymbol || '$';

    const getWidgetContent = () => {
      switch (key) {
        case 'pnl': {
          let cumulative = userProfile?.initialBalance || 0;
          const equityData = [cumulative];
          [...trades]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .forEach(t => {
              cumulative += t.pnl;
              equityData.push(cumulative);
            });
          return (
            <div className="p-2 sm:p-4 w-full h-full">
              <EquityCurveWidget trades={trades} equityData={equityData} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />
            </div>
          );
        }
        case 'winrate':
          return <div className="p-2 sm:p-4 w-full h-full"><OutcomeDistributionWidget trades={trades} isDarkMode={isDarkMode} /></div>;
        case 'pair':
          return <div className="p-2 sm:p-4 w-full h-full"><PerformanceByPairWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} /></div>;
        case 'mindset':
          return <div className="p-2 sm:p-4 w-full h-full"><PerformanceRadarWidget trades={trades} isDarkMode={isDarkMode} /></div>;
        case 'sessions':
          return <div className="p-2 sm:p-4 w-full h-full"><PerformanceBySession trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} /></div>;
        case 'drawdown':
          return <div className="p-2 sm:p-4 w-full h-full"><DrawdownOverTimeWidget trades={trades} isDarkMode={isDarkMode} userProfile={userProfile!} /></div>;
        case 'table':
          return <div className="p-2 sm:p-4 w-full h-full overflow-x-auto"><ExecutionPerformanceTable trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} initialBalance={userProfile?.initialBalance || 0} /></div>;
        case 'strategy':
          return <div className="p-2 sm:p-4 w-full h-full"><StrategyPerformanceBubbleChart trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} /></div>;
        case 'symbol':
          return <div className="p-2 sm:p-4 w-full h-full"><SymbolPerformanceWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} /></div>;
        case 'chart': {
          const symbol = message.chartSymbols?.[`${messageId}-chart`] || "FX:EURUSD";
          return (
            <div className="p-2 sm:p-4 w-full h-[300px] sm:h-[450px]">
              <TradingViewWidget 
                symbol={symbol} 
                theme={isDarkMode ? 'dark' : 'light'} 
                chartId={`${messageId}-chart`}
                showToolbar={false}
              />
            </div>
          );
        }
        default: return null;
      }
    };

    return (
      <div key={key} className={`mt-4 rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden w-full ${
        isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <button 
          onClick={() => toggleWidget(`${messageId}-${key}`)}
          className={`w-full flex items-center justify-between p-2.5 sm:p-3 px-3 sm:px-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors ${
            isExpanded ? 'bg-indigo-500/10 text-indigo-500 border-b border-indigo-500/10' : 'hover:bg-white/5 text-zinc-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <Brain size={12} className={isExpanded ? 'text-indigo-500' : 'text-zinc-600'} />
            {isExpanded ? `Hide ${tagToLabel[key]}` : `View ${tagToLabel[key]}`}
          </div>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown size={14} />
          </motion.div>
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
              {getWidgetContent()}
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

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const fullResponse = await geminiService.generateResponse(currentInput, trades, userProfile, goals, dailyBias, false, history, selectedModel);
      const aiMessageId = (Date.now() + 1).toString();
      processResponse(fullResponse, aiMessageId);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpecialAnalysis = async () => {
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
      content: "Deep Performance Analysis & Goal Suggestion", 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, analysisRequest]);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const fullResponse = await geminiService.generateResponse("", trades, userProfile, goals, dailyBias, true, history, selectedModel);
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

    // Parse Sections
    const sectionNames = ['LACKS', 'RECOMMENDATIONS', 'GOALS'];
    sectionNames.forEach(name => {
      const tag = `[SECTION:${name}]`;
      if (cleanContent.includes(tag)) {
        const parts = cleanContent.split(tag);
        // The content for this section is between this tag and the next tag or end of string
        let sectionContent = parts[1];
        sectionNames.forEach(otherName => {
          const otherTag = `[SECTION:${otherName}]`;
          if (sectionContent.includes(otherTag)) {
            sectionContent = sectionContent.split(otherTag)[0];
          }
        });
        // Also strip widgets from section content
        sectionContent = sectionContent.replace(/\[WIDGET:[A-Z_:]+\]/g, '').trim();
        sections[name] = sectionContent;
        // Remove from main content to avoid double display if we choose
        cleanContent = cleanContent.replace(tag, '').replace(sectionContent, '');
      }
    });

    const tagMap: Record<string, string> = {
      '[WIDGET:PNL]': 'pnl', '[WIDGET:WINRATE]': 'winrate', '[WIDGET:MINDSET]': 'mindset',
      '[WIDGET:SESSIONS]': 'sessions', '[WIDGET:PAIR]': 'pair', '[WIDGET:DRAWDOWN]': 'drawdown', '[WIDGET:TABLE]': 'table',
      '[WIDGET:STRATEGY_EFFICIENCY]': 'strategy', '[WIDGET:SYMBOL]': 'symbol'
    };

    for (const [tag, key] of Object.entries(tagMap)) {
      if (fullResponse.includes(tag)) {
        cleanContent = cleanContent.replace(tag, '');
        foundKeys.push(key);
      }
    }

    const chartRegex = /\[WIDGET:CHART:([A-Z0-9]+)\]/g;
    let match;
    while ((match = chartRegex.exec(fullResponse)) !== null) {
      const symbol = match[1];
      cleanContent = cleanContent.replace(match[0], '');
      foundKeys.push('chart');
      chartSymbols[`${messageId}-chart`] = symbol;
    }

    const aiMessage: Message = {
      id: messageId, 
      role: 'assistant', 
      content: cleanContent.trim(),
      timestamp: new Date(), 
      widgetKeys: foundKeys.length > 0 ? foundKeys : undefined,
      chartSymbols: Object.keys(chartSymbols).length > 0 ? chartSymbols : undefined,
      sections: Object.keys(sections).length > 0 ? sections : undefined,
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  const renderSectionCards = (sections: Record<string, string>) => {
    const config: Record<string, { title: string, icon: any, color: string, bg: string, border: string }> = {
      'LACKS': { 
        title: 'Performance Leaks', 
        icon: <Trash2 size={16} />, 
        color: 'text-rose-500', 
        bg: isDarkMode ? 'bg-rose-500/10' : 'bg-rose-50',
        border: isDarkMode ? 'border-rose-500/20' : 'border-rose-100'
      },
      'RECOMMENDATIONS': { 
        title: 'Strategic Fixes', 
        icon: <Wand2 size={16} />, 
        color: 'text-amber-500', 
        bg: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50',
        border: isDarkMode ? 'border-amber-500/20' : 'border-amber-100'
      },
      'GOALS': { 
        title: '30-Day Roadmap', 
        icon: <TrendingUp size={16} />, 
        color: 'text-emerald-500', 
        bg: isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50',
        border: isDarkMode ? 'border-emerald-500/20' : 'border-emerald-100'
      }
    };

    const Card = ({ id }: { id: string }) => {
      const content = sections[id];
      if (!content) return null;
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] border ${config[id].bg} ${config[id].border} flex flex-col gap-3 sm:gap-4 relative overflow-hidden group hover:shadow-xl transition-all duration-500 h-fit`}
        >
          {/* Background Decorative Icon */}
          <div className={`absolute -right-8 -bottom-8 opacity-[0.04] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 ${config[id].color}`}>
            {React.cloneElement(config[id].icon as React.ReactElement<{ size: number }>, { size: 120 })}
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md ${config[id].color} shadow-sm`}>
                {config[id].icon}
              </div>
              <h4 className={`text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] ${config[id].color}`}>
                {config[id].title}
              </h4>
            </div>
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${config[id].color.replace('text', 'bg')} animate-pulse`} />
          </div>
          
          <div className={`text-[12px] sm:text-[13px] leading-relaxed opacity-90 relative z-10 prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''} 
            prose-strong:font-black
          `}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                strong: ({ children }) => <strong className={`font-black ${config[id].color}`}>{children}</strong>,
                li: ({ children }) => <li className={`marker:${config[id].color} ml-[-1rem]`}>{children}</li>
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        </motion.div>
      );
    };

    return (
      <div className="flex flex-col gap-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <Card id="LACKS" />
           <Card id="RECOMMENDATIONS" />
           <Card id="GOALS" />
        </div>
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
    <div className={`flex flex-col h-full transition-all duration-500 ${
      isDarkMode ? 'bg-[#050505] text-zinc-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* Header */}
      <div className={`px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b transition-all duration-500 ${
        isDarkMode ? 'border-white/5 bg-black/20' : 'border-slate-200 bg-white/50'
      } backdrop-blur-xl z-20 sticky top-0`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 rotate-3 transition-transform hover:rotate-0 duration-300">
              <Bot size={24} className="sm:size-7" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-current shadow-lg" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-widest transition-colors">JFX Assistant</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] sm:text-[10px] font-bold opacity-40 uppercase tracking-widest">Always Learning</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className={`p-2 sm:p-2.5 rounded-xl transition-all ${
              isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-black/5 text-slate-500'
            }`}
            title="Analysis History"
          >
            <History size={18} />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 sm:p-2.5 rounded-xl transition-all ${
              isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-black/5 text-slate-500'
            }`}
            title="Settings"
          >
            <SettingsIcon size={18} />
          </button>
          <button 
            onClick={clearChat}
            className={`p-2 sm:p-2.5 rounded-xl transition-all ${
              isDarkMode ? 'hover:bg-indigo-500/10 text-zinc-400 hover:text-indigo-500' : 'hover:bg-indigo-50 text-slate-500 hover:text-indigo-600'
            }`}
            title="New Chat"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar scroll-smooth relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/10 rounded-full blur-[80px] sm:blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-[80px] sm:blur-[120px]" />
        </div>

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div key={message.id} ref={el => { messageRefs.current[message.id] = el; }} initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}>
              <div className={`flex gap-3 sm:gap-4 max-w-[95%] sm:max-w-[90%] lg:max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border overflow-hidden transition-all duration-500 ${
                  message.role === 'user' ? (isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-200 shadow-sm')
                    : 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-500/20'
                }`}>
                  {message.role === 'user' ? (userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} alt="User" className="w-full h-full object-cover" /> : <User size={20} className={isDarkMode ? 'text-zinc-400' : 'text-slate-500'} />) : <Brain size={20} className="sm:size-6" />}
                </div>
                <div className="space-y-2 flex-1 relative min-w-0">
                  <div className={`p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] relative transition-all duration-500 ${
                    message.role === 'user' ? (isDarkMode ? 'bg-zinc-900/40 border border-white/5 backdrop-blur-md' : 'bg-white border border-slate-200 shadow-sm')
                      : (isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md' : 'bg-indigo-50 border border-indigo-100 shadow-sm')
                  }`}>
                    <div className={`text-[12.5px] sm:text-[13.5px] leading-relaxed ${message.role === 'user' ? 'font-medium' : 'font-normal'} prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{renderWithMentions(children)}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="marker:text-indigo-500">{renderWithMentions(children)}</li>,
                          strong: ({ children }) => <strong className={`font-black ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{renderWithMentions(children)}</strong>,
                          code: ({ children }) => <code className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] sm:text-[12px] ${isDarkMode ? 'bg-white/10 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>{children}</code>,
                          blockquote: ({ children }) => <blockquote className={`border-l-4 border-indigo-500/50 pl-4 py-1 my-2 italic ${isDarkMode ? 'bg-white/5' : 'bg-indigo-50/50'}`}>{children}</blockquote>,
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-4 rounded-xl border border-zinc-500/20">
                              <table className="w-full text-left border-collapse">{children}</table>
                            </div>
                          ),
                          th: ({ children }) => <th className={`p-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-b border-zinc-500/20 ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>{children}</th>,
                          td: ({ children }) => <td className="p-2 border-b border-zinc-500/10 text-[11px] sm:text-[12px]">{children}</td>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    {message.sections && renderSectionCards(message.sections)}
                    {message.widgetKeys && message.widgetKeys.map(key => renderWidget(key, message.id, message))}
                  </div>
                  <div className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] opacity-30 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start relative z-10">
            <div className={`flex gap-3 sm:gap-4 items-center`}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20"><Brain size={20} className="animate-pulse" /></div>
              <div className="flex gap-1.5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                {[0, 1, 2].map((i) => (<motion.div key={i} animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 sm:p-6 pt-2 relative z-20">
        <div className={`relative max-w-4xl mx-auto rounded-[24px] sm:rounded-[32px] border transition-all duration-500 backdrop-blur-2xl ${
          isDarkMode ? 'bg-white/[0.03] border-white/10 hover:border-white/20 shadow-2xl shadow-black/40' 
            : 'bg-white/80 border-slate-200/60 hover:border-slate-300 shadow-xl shadow-slate-200/40'
        }`}>
          <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 px-3 sm:px-4">
            <div className="relative">
              <AnimatePresence>
                {analysisStatus === 'analyzing' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, x: '-50%' }}
                    animate={{ opacity: 1, y: -45, x: '-50%' }}
                    exit={{ opacity: 0, y: 10, x: '-50%' }}
                    className={`absolute left-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-widest z-50 shadow-xl border ${
                      isDarkMode ? 'bg-zinc-900 border-white/10 text-indigo-400' : 'bg-white border-slate-200 text-indigo-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      {analysisSteps[currentStepIndex]}
                    </div>
                    {/* Tooltip Arrow */}
                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-b border-r ${
                      isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'
                    }`} />
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={handleSpecialAnalysis}
                disabled={isTyping}
                className={`p-2 sm:p-2.5 rounded-lg sm:rounded-2xl transition-all group flex items-center gap-2 border relative overflow-hidden ${
                  isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20' 
                    : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'
                }`}
                title="Deep Performance Analysis"
              >
                <Brain size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest hidden sm:inline">Analyze & Suggest</span>
                
                {analysisStatus !== 'idle' && (
                  <div className="absolute bottom-0 left-0 w-full h-1 flex gap-0.5 px-0.5">
                    {analysisSteps.map((_, i) => (
                      <div key={i} className={`flex-1 h-full overflow-hidden rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                        <motion.div 
                          initial={{ width: "0%" }}
                          animate={{ 
                            width: i <= currentStepIndex ? "100%" : "0%",
                            backgroundColor: analysisStatus === 'success' ? "#10b981" : "#6366f1"
                          }}
                          transition={{ 
                            width: { duration: 0.5, ease: "easeInOut" },
                            backgroundColor: { duration: 0.3 }
                          }}
                          className="h-full"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </button>
            </div>
            <div className={`w-px h-6 sm:h-8 mx-0.5 sm:mx-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
            
            <div className="flex-1 relative">
              <AnimatePresence>
                {showMentionMenu && filteredMentions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: -10 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute bottom-full left-0 w-56 sm:w-64 mb-4 rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden transition-colors duration-500 z-[100] ${
                      isDarkMode ? 'bg-[#0d1117] border-white/10' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="p-2 sm:p-3 border-b border-white/5 bg-white/[0.02]">
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">Quick Mentions</span>
                    </div>
                    <div className="max-h-48 sm:max-h-64 overflow-y-auto custom-scrollbar p-1.5 sm:p-2">
                      {filteredMentions.map((m, i) => (
                        <button
                          key={m.value}
                          onClick={() => insertMention(m.value)}
                          onMouseEnter={() => setMentionIndex(i)}
                          className={`w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all text-left group ${
                            mentionIndex === i 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                              : (isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-50 text-slate-600')
                          }`}
                        >
                          <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${mentionIndex === i ? 'bg-white/20' : (isDarkMode ? 'bg-white/5' : 'bg-slate-100')}`}>
                            {React.cloneElement(m.icon as React.ReactElement, { size: 14 })}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wide truncate">{m.label}</p>
                            <p className={`text-[7px] sm:text-[8px] font-bold opacity-40 uppercase tracking-tight truncate ${mentionIndex === i ? 'text-indigo-100' : ''}`}>@{m.value.split('/').pop()}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <input 
                type="text" 
                value={input} 
                onChange={handleInputChange} 
                onKeyDown={handleKeyDown}
                placeholder="Ask assistant..." 
                className={`w-full bg-transparent border-none focus:ring-0 text-[12.5px] sm:text-[13.5px] py-3.5 sm:py-4 placeholder:opacity-40 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} 
              />
            </div>

            <button onClick={handleSend} disabled={!input.trim() || isTyping} className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all shadow-lg ${input.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-600 shadow-indigo-500/30 active:scale-95' : (isDarkMode ? 'bg-white/5 text-zinc-600 cursor-not-allowed' : 'bg-slate-100 text-slate-300 cursor-not-allowed')}`}>
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
        <p className="text-center mt-3 sm:mt-4 text-[8px] font-black uppercase tracking-[0.2em] opacity-20 transition-opacity">JournalFX AI Beta</p>
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
                    <div className="py-12 text-center opacity-30"><History size={40} className="mx-auto mb-4" /><p className="text-sm font-bold">No widgets generated yet</p></div>
                  ) : (
                    analysisHistory.map((msg) => (
                      <div key={msg.id} className="relative group/item">
                        <button
                          onClick={() => scrollToMessage(msg.id)}
                          className={`w-full p-4 pr-12 rounded-2xl border text-left transition-all flex flex-col gap-2 group ${
                            isDarkMode ? 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-indigo-500/30' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-300 shadow-sm'
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
                          className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl opacity-0 group-hover/item:opacity-100 transition-all ${
                            isDarkMode ? 'hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500'
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

      {/* Settings Drawer */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[300] flex justify-end">
            <div 
              onClick={() => setIsSettingsOpen(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <div 
              className={`relative w-full max-w-sm h-full shadow-2xl flex flex-col transition-colors duration-500 ${
                isDarkMode ? 'bg-[#0a0a0c] border-l border-white/5' : 'bg-white border-l border-slate-200'
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
                      onClick={() => setIsSettingsOpen(false)} 
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
                          className={`w-full p-5 rounded-3xl border text-left transition-all relative overflow-hidden group ${
                            selectedModel === model.id 
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
                          className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            tone === 'Professional' 
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
                    {[
                      { title: 'Auto-Reveal Charts', desc: 'Bypass accordion triggers', active: false },
                      { title: 'Recall Memory', desc: 'Cross-session storage', active: true },
                    ].map((pref, i) => (
                      <div 
                        key={i} 
                        className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
                          isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div>
                          <h4 className="text-[11px] font-black uppercase tracking-wide">{pref.title}</h4>
                          <p className="text-[9px] opacity-40 font-bold uppercase mt-1">{pref.desc}</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors ${
                          pref.active ? 'bg-indigo-600' : 'bg-zinc-800'
                        }`}>
                          <div className={`w-3 h-3 bg-white rounded-full shadow-md transition-transform ${
                            pref.active ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className={`p-8 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                  <button 
                    onClick={() => setIsSettingsOpen(false)} 
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/30 active:scale-95"
                  >
                    Apply Config
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIChat;