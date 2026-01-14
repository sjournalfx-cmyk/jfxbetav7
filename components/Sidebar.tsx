
import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, PlusCircle, History, BarChart2,
  Target, StickyNote, Calculator,
  Workflow, ChevronRight, CandlestickChart, LogOut,
  Settings, Sun, Moon, Link, Activity, Lock, Bell, X, CheckCircle2, AlertCircle, AlertTriangle, Info, Trash2, Globe, Medal
} from 'lucide-react';
import { 
  IconPower, 
  IconBell, 
  IconMoon, 
  IconSun,
  IconSettings,
  IconLayoutDashboard,
  IconPlus,
  IconNotebook,
  IconChartBar,
  IconFileText,
  IconWorld,
  IconLink,
  IconChartCandle,
  IconGitMerge,
  IconTargetArrow,
  IconCalculator,
  IconMessage
} from '@tabler/icons-react';
import { UserProfile, Trade } from '../types';
import { useToast } from './ui/Toast';
import { APP_CONSTANTS, PLAN_FEATURES } from '../lib/constants';
import { FloatingDock } from './ui/floating-dock';
import { AnimatePresence, motion } from 'motion/react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onSettingsTabChange?: (tab: 'profile' | 'account' | 'appearance' | 'billing' | 'security' | 'help') => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenCalculator: () => void;
  onOpenQuickLog: () => void;
  onLogout: () => void;
  userProfile?: UserProfile | null;
  trades?: Trade[];
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  onSettingsTabChange,
  isDarkMode,
  onToggleTheme,
  onOpenCalculator,
  onOpenQuickLog,
  onLogout,
  userProfile,
  trades = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const currentPlan = userProfile?.plan || APP_CONSTANTS.PLANS.FREE;
  const isBasicTier = !PLAN_FEATURES[currentPlan].advancedAnalytics;
  
  const { notifications, clearNotifications } = useToast();

  const tradeCount = trades.length;
  
  const getTesterRank = () => {
    if (tradeCount >= 30) return { label: 'Elite Tester', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
    if (tradeCount >= 15) return { label: 'Beta Specialist', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' };
    if (tradeCount >= 5) return { label: 'Active Tester', color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' };
    return { label: 'Beta Scout', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
  };

  const rank = getTesterRank();

  const TesterBadge = () => (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${rank.bg} ${rank.border} ${rank.color} animate-in fade-in slide-in-from-left-2 duration-500`}>
      <Medal size={10} className="shrink-0" />
      <span className="text-[9px] font-black uppercase tracking-wider whitespace-nowrap">{rank.label}</span>
    </div>
  );

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    };
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const menuItems = [
    { id: 'dashboard', icon: IconLayoutDashboard, label: 'Dashboard' },
    { id: 'log-trade', icon: IconPlus, label: 'Log Trade' },
    { id: 'history', icon: IconNotebook, label: 'Journal' },
    { id: 'analytics', icon: IconChartBar, label: 'Analytics' },
    { id: 'notes', icon: IconFileText, label: 'Notebook' },
    { id: 'broker', icon: IconWorld, label: 'Broker' },
    { id: 'ea-setup', icon: IconLink, label: 'Desktop Bridge', restricted: true },
    { id: 'charts', icon: IconChartCandle, label: 'Market Grid', restricted: true },
    { id: 'diagrams', icon: IconGitMerge, label: 'Strategy Maps', restricted: true },
    { id: 'goals', icon: IconTargetArrow, label: 'Goals', restricted: true },
    { id: 'calculators', icon: IconCalculator, label: 'Calculators', restricted: true },
  ];

  const systemItems = [
    { 
      id: 'notifications', 
      icon: IconBell, 
      label: 'Notifications', 
      onClick: () => setShowNotifications(!showNotifications), 
      badge: notifications.length > 0,
      isActive: showNotifications,
      secondaryAction: notifications.length > 0 ? {
        label: 'Clear All',
        onClick: clearNotifications
      } : undefined
    },
    { id: 'theme', icon: isDarkMode ? IconSun : IconMoon, label: isDarkMode ? 'Light Mode' : 'Dark Mode', onClick: onToggleTheme },
    { 
      id: 'settings', 
      icon: IconSettings, 
      label: 'Settings', 
      onClick: () => {
        onSettingsTabChange?.('profile');
        onViewChange('settings');
      }, 
      isActive: currentView === 'settings' 
    },
    { id: 'logout', icon: IconPower, label: 'Log Out', onClick: onLogout, variant: 'danger' },
  ];

  return (
    <div className={`h-full flex flex-col py-4 border-r z-[100] transition-all duration-300 relative ${isExpanded ? 'w-[240px]' : 'w-[72px] items-center'} ${isDarkMode
      ? 'bg-[#050505] border-zinc-800 shadow-[4px_0_24px_rgba(0,0,0,0.5)]'
      : 'bg-white border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)]'
      }`}>
      <style>{`
        @keyframes heartbeat {
            0% { transform: scale(1); opacity: 0.6; }
            15% { transform: scale(1.1); opacity: 1; }
            30% { transform: scale(1); opacity: 0.6; }
            45% { transform: scale(1.15); opacity: 1; }
            60% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(1); opacity: 0.6; }
        }
        @keyframes pulse-line {
            0% { stroke-dashoffset: 100; opacity: 0.4; }
            20% { stroke-dashoffset: 0; opacity: 1; }
            40% { stroke-dashoffset: -100; opacity: 0.4; }
            100% { stroke-dashoffset: -100; opacity: 0.4; }
        }
      `}</style>

      {/* Notification Menu */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            ref={notificationRef}
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            className={`absolute left-full ml-4 bottom-24 w-80 max-h-[500px] flex flex-col rounded-3xl border shadow-2xl z-[200] overflow-hidden ${isDarkMode ? 'bg-[#0d1117] border-zinc-800 shadow-black/50' : 'bg-white border-slate-200 shadow-slate-200/50'}`}
          >
            <div className={`p-5 border-b flex items-center justify-between ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Notifications</h3>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-0.5">{notifications.length} recent alerts</p>
              </div>
              {notifications.length > 0 && (
                <button 
                  onClick={clearNotifications}
                  className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 rounded-2xl border flex items-start gap-3 transition-all hover:scale-[1.02] ${
                      isDarkMode ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg ${
                      n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                      n.type === 'error' ? 'bg-rose-500/10 text-rose-500' :
                      n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-indigo-500/10 text-indigo-500'
                    }`}>
                      {n.type === 'success' && <CheckCircle2 size={14} />}
                      {n.type === 'error' && <AlertCircle size={14} />}
                      {n.type === 'warning' && <AlertTriangle size={14} />}
                      {n.type === 'info' && <Info size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold leading-tight">{n.title}</h4>
                      {n.message && <p className="text-[10px] opacity-60 mt-1 leading-relaxed">{n.message}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
                  <IconBell size={32} className="mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Inbox is empty</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`absolute -right-3 top-12 w-6 h-6 rounded-full border flex items-center justify-center transition-all z-50 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm'}`}
      >
        <ChevronRight size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Live Pulse Animation (Top Fixed) */}
      <div className={`flex items-center w-full mb-4 px-3 shrink-0 ${isExpanded ? 'justify-start' : 'justify-center'}`}>
        <div className={`w-9 h-9 rounded-full border flex items-center justify-center relative transition-colors duration-500 ${userProfile?.eaConnected ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
          {userProfile?.eaConnected ? (
            <div className="relative flex items-center justify-center" style={{ animation: 'heartbeat 2s infinite ease-in-out' }}>
              <svg width="20" height="12" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0 20H15L18 28L24 8L30 35L34 20H60"
                  stroke="#10b981"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: '100',
                    animation: 'pulse-line 2s infinite linear',
                    filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))'
                  }}
                />
              </svg>
            </div>
          ) : (
            <Activity size={16} className="text-rose-500" />
          )}
          
          {userProfile?.eaConnected ? (
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/60 animate-ping" />
          ) : (
            <div className="absolute inset-0 rounded-full border-4 border-rose-500/60" />
          )}
        </div>
        {isExpanded && (
          <div className="ml-2 flex flex-col gap-1 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex flex-col">
              <div className="text-[9px] font-black uppercase tracking-widest text-emerald-500 leading-none">Live Status</div>
              <div className="text-[11px] font-bold mt-0.5">{userProfile?.eaConnected ? 'Bridge' : 'Disconnected'}</div>
            </div>
            <TesterBadge />
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className={`flex-1 flex flex-col justify-center w-full overflow-y-visible ${!isExpanded ? 'items-center px-0' : 'px-3'}`}>
        <div className="w-full">
          <FloatingDock 
            items={menuItems.map(item => ({
              title: item.label,
              icon: (
                <div className="relative">
                  <item.icon size={18} />
                  {isBasicTier && item.restricted && (
                    <div className="absolute -top-1.5 -right-1.5 bg-[#FF4F01] rounded-full p-0.5 shadow-sm">
                      <Lock size={8} fill="white" className="text-white" />
                    </div>
                  )}
                  {item.id === 'ea-setup' && !isBasicTier && userProfile?.syncMethod === 'EA_CONNECT' && !userProfile?.eaConnected && (
                    <div className="absolute w-1.5 h-1.5 bg-rose-500 rounded-full border border-white dark:border-[#050505] animate-bounce -top-0.5 -right-0.5" />
                  )}
                </div>
              ),
              onClick: () => onViewChange(item.id),
              isActive: currentView === item.id,
              isLocked: isBasicTier && item.restricted,
              type: 'item' as const
            }))}
            desktopClassName="bg-transparent border-none px-0"
            showLabels={isExpanded}
          />
        </div>
      </nav>

      {/* System Actions (Bottom Fixed) */}
      <div className={`mt-auto w-full px-3 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800/50 ${!isExpanded ? 'flex flex-col items-center px-0' : ''}`}>
                  <FloatingDock 
                    items={systemItems.map(item => ({
                      title: item.label,
                      icon: <item.icon size={18} className={item.variant === 'danger' ? 'text-rose-500' : ''} />,
                      onClick: item.onClick,
                      isActive: item.isActive,
                      badge: item.badge,
                      secondaryAction: item.secondaryAction,
                      type: 'item' as const
                    }))}
                    desktopClassName="bg-transparent border-none px-0"
                    showLabels={isExpanded}
                  />
        
      </div>
    </div>
  );
};

export default Sidebar;
