
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  Grid, Square, Layout, Rows, Search, RefreshCw, 
  Maximize2, Minimize2, Sidebar as SidebarIcon, X, 
  Clock, MousePointer2, Link2, Link2Off, List, Star,
  ZoomIn, ZoomOut, SlidersHorizontal, ArrowLeftRight, ArrowUpDown,
  Lock, ChevronDown, Plus, Check
} from 'lucide-react';
import TradingViewWidget from './TradingViewWidget';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UserProfile } from '../types';
import { useToast } from './ui/Toast';
import { APP_CONSTANTS, PLAN_FEATURES } from '../lib/constants';

interface ChartGridProps {
  isDarkMode: boolean;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => Promise<void>;
}

const WATCHLISTS = {
  'Forex': [
    'FX:EURUSD', 'FX:GBPUSD', 'FX:USDJPY', 'FX:AUDUSD', 'FX:USDCAD', 'FX:USDCHF', 'FX:NZDUSD',
    'FX:EURGBP', 'FX:EURJPY', 'FX:GBPJPY', 'FX:CADJPY', 'FX:AUDJPY', 'FX:CHFJPY',
    'FX:EURAUD', 'FX:GBPAUD', 'FX:EURCAD', 'FX:GBPCAD', 'FX:AUDNZD', 'FX:NZDJPY'
  ],
  'Crypto': [
    'BINANCE:BTCUSD', 'BINANCE:ETHUSD', 'BINANCE:SOLUSD', 'BINANCE:XRPUSD', 'BINANCE:BNBUSD', 
    'BINANCE:ADAUSD', 'BINANCE:DOGEUSD', 'BINANCE:AVAXUSD', 'BINANCE:DOTUSD', 
    'BINANCE:MATICUSD', 'BINANCE:LINKUSD', 'BINANCE:LTCUSD', 'BINANCE:SHIBUSD', 'BINANCE:UNIUSD'
  ],
  'Indices': [
    'OANDA:SPX500USD', 'OANDA:NAS100USD', 'TVC:US30', 'TVC:RUT',
    'TVC:DE40', 'TVC:UK100', 'TVC:FR40', 'TVC:EU50',
    'TVC:JP225', 'TVC:HSI', 'OANDA:AU200AUD', 'TVC:CN50'
  ],
  'Commodities': [
    'OANDA:XAUUSD', 'OANDA:XAGUSD', 'TVC:PLATINUM', 'TVC:PALLADIUM',
    'TVC:USOIL', 'TVC:UKOIL', 'TVC:NG1!',
    'TVC:HG1!', 'TVC:ZC1!', 'TVC:ZW1!'
  ]
};

const INTERVALS = ['1', '3', '5', '15', '30', '45', '60', '120', '180', '240', 'D', 'W', 'M'];

interface LayoutSettings {
    splitRatio: number;
    isScrollable: boolean;
    minHeight: number;
}

const ChartGrid: React.FC<ChartGridProps> = ({ isDarkMode, isFocusMode = false, onToggleFocus, userProfile, onUpdateProfile }) => {
  const currentPlan = userProfile?.plan || APP_CONSTANTS.PLANS.FREE;
  const features = PLAN_FEATURES[currentPlan];
  const canUseMultiChart = features.multiChartLayouts;

  const { addToast } = useToast();

  const [layout, setLayout] = useLocalStorage<'single' | 'split-v' | 'split-h' | 'quad' | 'focus-main'>('jfx_chart_layout', userProfile?.chartConfig?.layout || 'single');
  
  // Force single layout for non-premium users
  useEffect(() => {
    if (!canUseMultiChart && layout !== 'single') {
        setLayout('single');
    }
  }, [canUseMultiChart, layout, setLayout]);

  const handleLayoutChange = (newLayout: typeof layout) => {
      if (canUseMultiChart) {
          setLayout(newLayout);
      } else {
          addToast({
              type: 'warning',
              title: 'Feature Locked',
              message: 'Multi-chart layouts are available on higher tier plans. Upgrade to unlock.',
              duration: 4000
          });
      }
  };

  const [charts, setCharts] = useLocalStorage('jfx_chart_config', userProfile?.chartConfig?.charts || [
      { id: 1, symbol: "FX:EURUSD", interval: "15" },  
      { id: 2, symbol: "FX:EURUSD", interval: "60" },  
      { id: 3, symbol: "OANDA:XAUUSD", interval: "240" }, 
      { id: 4, symbol: "BITSTAMP:BTCUSD", interval: "D" }, 
  ]);

  const [layoutSettings, setLayoutSettings] = useLocalStorage<LayoutSettings>('jfx_chart_layout_settings', userProfile?.chartConfig?.layoutSettings || {
      splitRatio: 50,
      isScrollable: false,
      minHeight: 500
  });

  const [isSaving, setIsSaving] = useState(false);

  // Auto-save debounced effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Don't auto-save on first mount if config matches userProfile
      const currentConfig = JSON.stringify({ layout, charts, layoutSettings });
      const savedConfig = JSON.stringify(userProfile.chartConfig);
      
      if (currentConfig === savedConfig) return;

      try {
          setIsSaving(true);
          await onUpdateProfile({
              ...userProfile,
              chartConfig: { layout, charts, layoutSettings }
          });
      } catch (error) {
          console.error("Auto-save failed:", error);
      } finally {
          setIsSaving(false);
      }
    }, 3000); // 3 second debounce

    return () => clearTimeout(timer);
  }, [layout, charts, layoutSettings, onUpdateProfile, userProfile]);

  const handleSaveConfig = async () => {
      try {
          setIsSaving(true);
          await onUpdateProfile({
              ...userProfile,
              chartConfig: {
                  layout,
                  charts,
                  layoutSettings
              }
          });
          addToast({
              type: 'success',
              title: 'Layout Saved',
              message: 'Your chart configuration has been saved to your profile.',
              duration: 3000
          });
      } catch (error) {
          addToast({
              type: 'error',
              title: 'Save Failed',
              message: 'Failed to save chart configuration.',
              duration: 4000
          });
      } finally {
          setIsSaving(false);
      }
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [activeChartId, setActiveChartId] = useState(1);
  const [isSynced, setIsSynced] = useLocalStorage('jfx_chart_sync', true);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [symbolInput, setSymbolInput] = useState('FX:EURUSD');
  const [watchlistCategory, setWatchlistCategory] = useState<keyof typeof WATCHLISTS>('Forex');
  
  const [starredSymbols, setStarredSymbols] = useLocalStorage<string[]>('jfx_starred_symbols', []);

  // Multiple Layouts State (Premium Only)
  const [savedLayouts, setSavedLayouts] = useLocalStorage<any[]>('jfx_saved_layouts', []);
  const [currentLayoutName, setCurrentLayoutName] = useState('Default Layout');
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
              setIsSettingsOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(timer);
  }, [layout, isWatchlistOpen, isFocusMode, layoutSettings]);

  const handleChartClick = (id: number) => {
      setActiveChartId(id);
      const chart = charts.find(c => c.id === id);
      if (chart) setSymbolInput(chart.symbol);
  };

  const handleSymbolChange = (newSymbol: string) => {
      const formatted = newSymbol.toUpperCase();
      setSymbolInput(formatted);

      if (isSynced) {
          setCharts(prev => prev.map(chart => ({ ...chart, symbol: formatted })));
      } else {
          setCharts(prev => prev.map(chart => 
             chart.id === activeChartId ? { ...chart, symbol: formatted } : chart
          ));
      }
  };

  const toggleStar = (symbol: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setStarredSymbols(prev => 
          prev.includes(symbol) 
          ? prev.filter(s => s !== symbol) 
          : [...prev, symbol]
      );
  };

  const applyTimeframePreset = (type: 'Scalp' | 'Swing' | 'Intraday') => {
      let intervals = ['15', '60', '240', 'D'];
      if (type === 'Scalp') intervals = ['1', '5', '15', '60'];
      if (type === 'Swing') intervals = ['60', '240', 'D', 'W'];
      if (type === 'Intraday') intervals = ['5', '15', '60', '240'];

      setCharts(prev => prev.map((chart, idx) => ({
          ...chart,
          interval: intervals[idx] || intervals[0]
      })));
  };

  const handleZoom = (direction: 'in' | 'out') => {
      const getNextInterval = (current: string) => {
          const idx = INTERVALS.indexOf(current);
          if (idx === -1) return '60'; 
          
          if (direction === 'in') {
              return idx > 0 ? INTERVALS[idx - 1] : INTERVALS[0];
          } else {
              return idx < INTERVALS.length - 1 ? INTERVALS[idx + 1] : INTERVALS[INTERVALS.length - 1];
          }
      };

      if (isSynced) {
          setCharts(prev => prev.map(c => ({ ...c, interval: getNextInterval(c.interval) })));
      } else {
          setCharts(prev => prev.map(c => c.id === activeChartId ? { ...c, interval: getNextInterval(c.interval) } : c));
      }
  };

  const isVisible = (id: number) => {
      if (layout === 'single') return id === 1;
      if (layout === 'split-v' || layout === 'split-h') return id <= 2;
      return true;
  };

  const getGridClass = () => {
      switch(layout) {
          case 'single': return 'grid-cols-1 grid-rows-1';
          case 'split-v': return 'grid-rows-1'; 
          case 'split-h': return 'grid-cols-1'; 
          case 'quad': return 'grid-cols-2 grid-rows-2';
          case 'focus-main': return 'grid-rows-3'; 
          default: return 'grid-cols-2';
      }
  };

  const getGridStyle = (): React.CSSProperties => {
      const { splitRatio } = layoutSettings;
      const styles: React.CSSProperties = {
          height: layoutSettings.isScrollable ? 'auto' : '100%',
          minHeight: '100%',
          display: 'grid', // Ensure grid is always active
      };

      if (layout === 'split-v') {
          styles.gridTemplateColumns = `${splitRatio}% 1fr`;
      } else if (layout === 'split-h') {
          styles.gridTemplateRows = `${splitRatio}% 1fr`;
      } else if (layout === 'focus-main') {
          styles.gridTemplateColumns = `${splitRatio}% 1fr`;
      }
      // 'single' and 'quad' rely on Tailwind classes grid-cols-1/2 and grid-rows-1/2
      
      return styles;
  };

  const getItemStyle = (id: number): React.CSSProperties => {
      const styles: React.CSSProperties = {};
      if (layoutSettings.isScrollable) {
          styles.minHeight = `${layoutSettings.minHeight}px`;
      }
      if (layout === 'focus-main') {
          if (id === 1) {
              styles.gridRow = '1 / span 3';
              styles.gridColumn = '1 / span 1';
          } else {
              styles.gridColumn = '2 / span 1';
          }
      }
      return styles;
  };

  const sortedWatchlist = useMemo(() => {
      const list = WATCHLISTS[watchlistCategory];
      return [...list].sort((a, b) => {
          const isAStarred = starredSymbols.includes(a);
          const isBStarred = starredSymbols.includes(b);
          if (isAStarred && !isBStarred) return -1;
          if (!isAStarred && isBStarred) return 1;
          return 0;
      });
  }, [watchlistCategory, starredSymbols]);

  return (
    <div className={`w-full h-full flex flex-col relative ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-slate-100 text-slate-900'}`}>
        <div className="flex flex-1 min-h-0 relative">
            <div className="flex-1 flex flex-col min-w-0">
                <div className={`h-14 shrink-0 flex items-center px-4 justify-between border-b relative z-30 ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center px-3 py-1.5 rounded-lg border transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                            <Search size={14} className="opacity-50 mr-2" />
                            <input 
                                value={symbolInput}
                                onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && handleSymbolChange(symbolInput)}
                                placeholder="Symbol"
                                className="bg-transparent outline-none text-sm font-bold w-24 sm:w-32 placeholder:font-normal"
                            />
                        </div>
                        <button 
                            onClick={() => handleSymbolChange(symbolInput)}
                            title="Load Symbol"
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                        >
                            <RefreshCw size={12} /> Load
                        </button>
                        
                        {layout !== 'single' && (
                            <>
                                <div className={`w-px h-6 mx-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                                <button 
                                    onClick={() => setIsSynced(!isSynced)}
                                    title={isSynced ? "Disable Symbol Sync" : "Enable Symbol Sync"}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                        isSynced 
                                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                                        : isDarkMode ? 'text-zinc-500 border-transparent hover:bg-zinc-800' : 'text-slate-500 border-transparent hover:bg-slate-100'
                                    }`}
                                >
                                    {isSynced ? <Link2 size={14} /> : <Link2Off size={14} />}
                                    <span className="hidden xl:inline">{isSynced ? 'Synced' : 'Independent'}</span>
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className={`hidden xl:flex items-center gap-1 mr-4 p-1 rounded-lg border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'}`}>
                            <div className="px-2 opacity-30 border-r border-zinc-700/50 mr-1">
                                <Clock size={14} />
                            </div>
                            <button onClick={() => applyTimeframePreset('Scalp')} title="Scalp Preset (1m, 5m, 15m, 1h)" className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-500'}`}>Scalp</button>
                            <button onClick={() => applyTimeframePreset('Intraday')} title="Day Trading Preset (5m, 15m, 1h, 4h)" className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-500'}`}>Day</button>
                            <button onClick={() => applyTimeframePreset('Swing')} title="Swing Trading Preset (1h, 4h, D, W)" className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-500'}`}>Swing</button>
                            <div className={`w-px h-4 mx-1 ${isDarkMode ? 'bg-zinc-700' : 'bg-slate-300'}`} />
                            <button onClick={() => handleZoom('out')} title="Zoom Out Timeframe" className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}><ZoomOut size={14} /></button>
                            <button onClick={() => handleZoom('in')} title="Zoom In Timeframe" className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}><ZoomIn size={14} /></button>
                        </div>

                        <div className={`flex items-center p-1 rounded-lg border ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                            <button 
                                onClick={() => setLayout('single')} 
                                title="Single Chart Layout" 
                                className={`p-1.5 rounded ${layout === 'single' ? 'bg-indigo-500 text-white shadow' : 'text-zinc-500'}`}
                            >
                                <Square size={16}/>
                            </button>
                            
                            {/* Premium Only Layouts */}
                            {[
                                { id: 'split-v', icon: Layout, title: 'Vertical Split', extraClass: 'rotate-90' },
                                { id: 'split-h', icon: Rows, title: 'Horizontal Split' },
                                { id: 'quad', icon: Grid, title: 'Quad Grid' },
                                { id: 'focus-main', icon: SidebarIcon, title: 'Main Focus', extraClass: 'rotate-180' }
                            ].map((l) => (
                                <button 
                                    key={l.id}
                                    onClick={() => handleLayoutChange(l.id as any)} 
                                    title={canUseMultiChart ? `${l.title} Layout` : `${l.title} (Locked)`}
                                    className={`p-1.5 rounded relative transition-all ${
                                        layout === l.id 
                                        ? 'bg-indigo-500 text-white shadow' 
                                        : !canUseMultiChart ? 'text-zinc-500/40 opacity-60' : 'text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <l.icon size={16} className={l.extraClass}/>
                                    {!canUseMultiChart && (
                                        <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 shadow-sm scale-75">
                                            <Lock size={8} fill="white" className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="relative" ref={settingsRef}>
                            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} title="Layout Dimensions & Split Settings" className={`p-2 rounded-lg transition-colors ${isSettingsOpen ? 'bg-indigo-500 text-white' : isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}><SlidersHorizontal size={20} /></button>
                            {isSettingsOpen && (
                                <div className={`absolute top-full right-0 mt-2 w-64 p-4 rounded-xl border shadow-2xl z-50 animate-in fade-in zoom-in-95 origin-top-right ${isDarkMode ? 'bg-[#121215] border-[#27272a]' : 'bg-white border-slate-200'}`}>
                                    <h4 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3">Dimensions</h4>
                                    <div className={`flex p-1 rounded-lg border mb-4 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <button onClick={() => setLayoutSettings({...layoutSettings, isScrollable: false})} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${!layoutSettings.isScrollable ? 'bg-indigo-600 text-white shadow' : 'opacity-50'}`}>Fit Screen</button>
                                        <button onClick={() => setLayoutSettings({...layoutSettings, isScrollable: true})} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${layoutSettings.isScrollable ? 'bg-indigo-600 text-white shadow' : 'opacity-50'}`}>Scrollable</button>
                                    </div>
                                    {layoutSettings.isScrollable && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs font-bold mb-1.5"><span className="opacity-50">Chart Height</span><span>{layoutSettings.minHeight}px</span></div>
                                            <input type="range" min="300" max="1000" step="50" value={layoutSettings.minHeight} onChange={(e) => setLayoutSettings({...layoutSettings, minHeight: parseInt(e.target.value)})} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                        </div>
                                    )}
                                    {layout !== 'single' && layout !== 'quad' && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 pt-3 border-t border-dashed border-gray-500/20">Split Ratio</h4>
                                            <div className="flex justify-between text-xs font-bold mb-1.5"><span className="flex items-center gap-1 opacity-50">{layout === 'split-v' ? <ArrowLeftRight size={12}/> : <ArrowUpDown size={12}/>}{layout === 'split-v' ? 'Width' : 'Height'}</span><span>{layoutSettings.splitRatio}%</span></div>
                                            <input type="range" min="20" max="80" step="5" value={layoutSettings.splitRatio} onChange={(e) => setLayoutSettings({...layoutSettings, splitRatio: parseInt(e.target.value)})} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={`w-px h-6 mx-2 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                        <button 
                            onClick={handleSaveConfig} 
                            disabled={isSaving}
                            title="Save Current Layout to Profile" 
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 ${isSaving ? 'opacity-50' : isDarkMode ? 'hover:bg-zinc-800 text-teal-500' : 'hover:bg-slate-100 text-teal-600'}`}
                        >
                            {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Plus size={20} />}
                            <span className="text-xs font-bold hidden md:inline">Save Config</span>
                        </button>
                        <button onClick={onToggleFocus} title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"} className={`p-2 rounded-lg transition-colors ${isFocusMode ? 'bg-indigo-500 text-white' : isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}><Minimize2 size={20} /></button>
                        <button onClick={() => setIsWatchlistOpen(!isWatchlistOpen)} title="Toggle Watchlist Sidebar" className={`p-2 rounded-lg transition-colors ${isWatchlistOpen ? 'bg-zinc-800 text-white' : isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}><List size={20} /></button>
                    </div>
                </div>

                <div className={`flex-1 overflow-auto relative p-1 ${isDarkMode ? 'bg-[#09090b]' : 'bg-slate-100'}`}>
                    <div className={`w-full h-full gap-1 transition-all duration-300 grid ${getGridClass()}`} style={getGridStyle()}>
                        {charts.map((chart) => {
                            if (!isVisible(chart.id)) return null;
                            const isActive = activeChartId === chart.id;
                            return (
                                <div key={chart.id} onClick={() => handleChartClick(chart.id)} className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${isActive ? 'border-indigo-500 shadow-lg z-10' : isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`} style={getItemStyle(chart.id)}>
                                    <div className="absolute top-2 left-2 z-20 opacity-0 hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-md rounded-lg p-1 flex gap-2"><span className="text-xs font-bold text-white px-2 py-1">{chart.symbol}</span><span className="text-xs font-mono text-zinc-300 px-2 py-1 bg-white/10 rounded">{chart.interval}</span></div>
                                    <TradingViewWidget symbol={chart.symbol} theme={isDarkMode ? 'dark' : 'light'} interval={chart.interval} autosize={true} />
                                    {isActive && <div className="absolute top-0 right-0 p-1 bg-indigo-500 rounded-bl-lg z-20"><MousePointer2 size={12} className="text-white" /></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className={`${isWatchlistOpen ? 'w-72 translate-x-0' : 'w-0 translate-x-full'} shrink-0 border-l transition-all duration-300 ease-spring flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#121215] border-[#27272a]' : 'bg-white border-slate-200'}`}>
                <div className="p-4 border-b shrink-0 flex items-center justify-between"><h3 className="font-bold text-sm">Watchlist</h3><button onClick={() => setIsWatchlistOpen(false)} className="opacity-50 hover:opacity-100"><X size={16}/></button></div>
                <div className="flex p-2 gap-1 overflow-x-auto border-b no-scrollbar">
                    {(Object.keys(WATCHLISTS) as Array<keyof typeof WATCHLISTS>).map(cat => (
                        <button key={cat} onClick={() => setWatchlistCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${watchlistCategory === cat ? 'bg-indigo-600 text-white' : isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'}`}>{cat}</button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {sortedWatchlist.map(symbol => {
                        const isStarred = starredSymbols.includes(symbol);
                        const displaySymbol = symbol.split(':')[1] || symbol;
                        return (
                            <button key={symbol} onClick={() => handleSymbolChange(symbol)} className={`w-full flex items-center justify-between p-3 rounded-lg text-left group transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-50 text-slate-700'}`}><span className="font-bold text-sm">{displaySymbol}</span><div onClick={(e) => toggleStar(symbol, e)} className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${isStarred ? 'opacity-100 text-amber-400' : 'text-zinc-500'}`}><Star size={14} fill={isStarred ? "currentColor" : "none"} /></div></button>
                        )
                    })}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ChartGrid;
