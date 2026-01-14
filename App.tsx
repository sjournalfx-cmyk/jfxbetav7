
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LogTrade from './components/LogTrade';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Analytics from './components/Analytics';
import Auth from './components/Auth';
import { PartyPopper, MessageSquare, AlertCircle, Trash2, LogOut, X, Wallet, Activity, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

import Goals from './components/Goals';
import Notes from './components/Notes';
import PositionSizeCalculator from './components/PositionSizeCalculator';
import ChartGrid from './components/ChartGrid';
import DiagramEditor from './components/DiagramEditor';
import Calculators from './components/Calculators';
import Onboarding from './components/Onboarding';
import Settings from './components/Settings';
import EASetup from './components/EASetup';
import BrokerConnect from './components/BrokerConnect';
import MobileBlocker from './components/MobileBlocker';
import ConfirmationModal from './components/ConfirmationModal';
import QuickLogModal from './components/QuickLogModal';
import ErrorBoundary from './components/ErrorBoundary';
import { APP_CONSTANTS, PLAN_FEATURES } from './lib/constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { authService } from './services/authService';
import { dataService, mapTradeFromDB } from './services/dataService';
import { supabase } from './lib/supabase';
import { ToastProvider, useToast } from './components/ui/Toast';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [settingsTab, setSettingsTab] = useState<'profile' | 'account' | 'appearance' | 'billing' | 'security' | 'help'>('profile');
  const { addToast } = useToast();

  // Mobile Detection (Enhanced with User-Agent check)
  const checkIfMobile = () => {
    const isSmallScreen = window.innerWidth < 1024;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isSmallScreen || isMobileUA;
  };

  const [isMobile, setIsMobile] = useState(checkIfMobile());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(checkIfMobile());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persistent State (Theme only)
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('jfx_theme_dark', true);

  const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // A6
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.error("Audio play failed", e);
    }
  };

  // App State
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [dailyBias, setDailyBias] = useState<DailyBias[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [eaSession, setEASession] = useState<any>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // Auth & Loading State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // UI State
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [hasSeenBetaAnnouncement, setHasSeenBetaAnnouncement] = useLocalStorage<boolean>('jfx_beta_announcement_shown', false);
  const [showBetaAnnouncement, setShowBetaAnnouncement] = useState(false);

  // Show announcement when onboarded but hasn't seen it yet
  useEffect(() => {
    if (userProfile?.onboarded && !hasSeenBetaAnnouncement) {
      const timer = setTimeout(() => {
        setShowBetaAnnouncement(true);
      }, 1500); // Small delay for better UX
      return () => clearTimeout(timer);
    }
  }, [userProfile?.onboarded, hasSeenBetaAnnouncement]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    showCancel?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { }
  });

  // Initial Data Fetch
  useEffect(() => {
    const initApp = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setUserId(user.id);
          setIsAuthenticated(true);
          setUserEmail(user.email || '');
          await loadUserData(user.id);
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initApp();
  }, []);

  // --- Realtime Profile & EA Session Sync ---
  useEffect(() => {
    if (isAuthenticated && userId && userProfile?.syncKey) {
      // 1. Subscribe to Session Data
      const sessionChannel = supabase
        .channel('ea_session_global_sync')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'ea_sessions',
          filter: `sync_key=eq.${userProfile.syncKey}`
        }, (payload) => {
          if (payload.new) {
            setEASession(payload.new);
          }
        })
        .subscribe();

      // 2. Subscribe to Profile changes (e.g. eaConnected status from DB trigger)
      const profileChannel = supabase
        .channel('profile_sync')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        }, (payload) => {
          if (payload.new) {
            const p = payload.new;
            setUserProfile(prev => prev ? ({
              ...prev,
              name: p.name,
              accountName: p.account_name,
              syncMethod: p.sync_method,
              plan: p.plan,
              eaConnected: p.ea_connected,
              avatarUrl: p.avatar_url,
              themePreference: p.theme_preference
            }) : null);
          }
        })
        .subscribe();

      // 3. Subscribe to Trades (Realtime sync for journal)
      const tradesChannel = supabase
        .channel('trades_sync')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setTrades(prev => [mapTradeFromDB(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTrades(prev => prev.map(t => t.id === payload.new.id ? mapTradeFromDB(payload.new) : t));
          } else if (payload.eventType === 'DELETE') {
            setTrades(prev => prev.filter(t => t.id !== payload.old.id));
          }
        })
        .subscribe();

      // 4. Subscribe to Notes
      const notesChannel = supabase
        .channel('notes_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') setNotes(prev => [{ ...payload.new, isPinned: (payload.new as any).is_pinned }, ...prev]);
          else if (payload.eventType === 'UPDATE') setNotes(prev => prev.map(n => n.id === payload.new.id ? { ...payload.new, isPinned: (payload.new as any).is_pinned } as Note : n));
          else if (payload.eventType === 'DELETE') setNotes(prev => prev.filter(n => n.id !== payload.old.id));
        }).subscribe();

      // 5. Subscribe to Daily Bias
      const biasChannel = supabase
        .channel('bias_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_bias', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') setDailyBias(prev => [...prev, { ...payload.new, actualOutcome: (payload.new as any).actual_outcome } as DailyBias]);
          else if (payload.eventType === 'UPDATE') setDailyBias(prev => prev.map(b => b.date === payload.new.date ? { ...payload.new, actualOutcome: (payload.new as any).actual_outcome } as DailyBias : b));
        }).subscribe();

      // 6. Subscribe to Goals
      const goalsChannel = supabase
        .channel('goals_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` }, (payload) => {
          // Re-using dataService mapping would be better but let's do a quick map here or refactor
          const mapGoal = (g: any): Goal => ({
            id: g.id, title: g.title, description: g.description, type: g.type, metric: g.metric,
            targetValue: g.target_value, startValue: g.start_value, startDate: g.start_date, endDate: g.end_date,
            status: g.status, createdAt: g.created_at, milestones: g.milestones || [], manualProgress: g.current_value
          });
          if (payload.eventType === 'INSERT') setGoals(prev => [mapGoal(payload.new), ...prev]);
          else if (payload.eventType === 'UPDATE') setGoals(prev => prev.map(g => g.id === payload.new.id ? mapGoal(payload.new) : g));
          else if (payload.eventType === 'DELETE') setGoals(prev => prev.filter(g => g.id !== payload.old.id));
        }).subscribe();

      return () => {
        supabase.removeChannel(sessionChannel);
        supabase.removeChannel(profileChannel);
        supabase.removeChannel(tradesChannel);
        supabase.removeChannel(notesChannel);
        supabase.removeChannel(biasChannel);
        supabase.removeChannel(goalsChannel);
      };
    } else {
      setEASession(null);
    }
  }, [isAuthenticated, userId, userProfile?.syncKey]);

  // ... (Realtime subscriptions omitted for brevity)
  const loadUserData = async (userId: string) => {
    setIsDataLoading(true);
    try {
      const { data: profile } = await authService.getProfile(userId);
      let mappedProfile: UserProfile | null = null;
      if (profile) {
        mappedProfile = {
          name: profile.name || '',
          country: profile.country || '',
          accountName: profile.account_name || 'Primary Account',
          initialBalance: profile.initial_balance || 0,
          currency: profile.currency || 'USD',
          currencySymbol: profile.currency_symbol || '$',
          syncMethod: profile.sync_method || 'Manual',
          experienceLevel: profile.experience_level || 'Beginner',
          tradingStyle: profile.trading_style || 'Day Trader',
          onboarded: profile.onboarded || false,
          plan: profile.plan || 'FREE TIER (JOURNALER)',
          syncKey: profile.sync_key,
          eaConnected: profile.ea_connected || false,
          autoJournal: profile.auto_journal || false,
          avatarUrl: profile.avatar_url,
          themePreference: profile.theme_preference || 'default',
          chartConfig: profile.chart_config || null,
          keepChartsAlive: profile.keep_charts_alive ?? true,
        };
        setUserProfile(mappedProfile);
      }

      const [fetchedTrades, fetchedNotes, fetchedBias, fetchedGoals] = await Promise.all([
        dataService.getTrades(),
        dataService.getNotes(),
        dataService.getDailyBias(),
        dataService.getGoals()
      ]);

      setTrades(fetchedTrades);
      setNotes(fetchedNotes);
      setDailyBias(fetchedBias);
      setGoals(fetchedGoals);

      // --- Fetch EA Session if connected ---
      if (mappedProfile && mappedProfile.eaConnected && mappedProfile.syncKey) {
        const session = await dataService.getEASession(mappedProfile.syncKey);
        if (session) {
          setEASession(session);
        }
      }

      // --- 3. Journal Inactivity Reminder ---
      if (fetchedTrades.length > 0) {
          const lastTradeDate = new Date(fetchedTrades[0].date); // First is newest
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - lastTradeDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

          if (diffDays > 3) {
              setTimeout(() => { // Slight delay to not overwhelm on load
                  addToast({
                      type: 'info',
                      title: 'Time to Journal?',
                      message: `It's been ${diffDays} days since your last logged trade. Consistency is key!`,
                      duration: 6000
                  });
              }, 2000);
          }
      }

    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  // --- Trade Handlers ---
  const handleAddTrade = async (trade: Trade) => {
    try {
      if (editingTrade) {
        await dataService.updateTrade(trade);
        setTrades(trades.map(t => t.id === trade.id ? trade : t));
        setEditingTrade(null);
      } else {
        // Enforce Plan Limits
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const tradesThisMonth = trades.filter(t => {
          const tradeDate = new Date(t.date);
          return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear;
        }).length;

        const currentPlan = userProfile?.plan || APP_CONSTANTS.PLANS.FREE;
        const features = PLAN_FEATURES[currentPlan] || PLAN_FEATURES[APP_CONSTANTS.PLANS.FREE];
        
        if (features.maxTradesPerMonth !== Infinity && tradesThisMonth >= features.maxTradesPerMonth) {
          setConfirmModal({
            isOpen: true,
            title: 'Monthly Limit Reached',
            description: `You have reached the limit of ${features.maxTradesPerMonth} trades per month for the ${currentPlan}. Upgrade your plan for more capacity.`,
            confirmText: 'Upgrade Plan',
            cancelText: 'Maybe Later',
            variant: 'warning',
            onConfirm: () => {
              setCurrentView('settings');
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
            },
          });
          return;
        }

        const newTrade = await dataService.addTrade(trade);
        setTrades([newTrade, ...trades]);
      }
      setCurrentView('history');
    } catch (error) {
      console.error("Error saving trade:", error);
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        description: 'Failed to save trade. Please try again.',
        confirmText: 'OK',
        variant: 'danger',
        showCancel: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
      });
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setCurrentView('log-trade');
  };

  const handleBatchAddTrades = async (newTrades: Trade[]) => {
    try {
      const addedTrades = await dataService.batchAddTrades(newTrades);
      setTrades(prev => [...addedTrades, ...prev].sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
          const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
          return dateB.getTime() - dateA.getTime();
      }));
      
      addToast({
        type: 'success',
        title: 'Import Successful',
        message: `Successfully imported ${addedTrades.length} trades from file.`,
        duration: 5000
      });
      
      setCurrentView('history');
    } catch (error) {
      console.error("Error batch adding trades:", error);
      addToast({
        type: 'error',
        title: 'Import Error',
        message: 'Failed to import trades. Please check the file format.',
        duration: 5000
      });
    }
  };

  const handleUpdateTrade = async (updatedTrade: Trade) => {
    try {
      await dataService.updateTrade(updatedTrade);
      setTrades(trades.map(t => t.id === updatedTrade.id ? updatedTrade : t));
    } catch (error) {
      console.error("Error updating trade:", error);
    }
  };

  const handleDeleteTrades = async (tradeIds: string[]) => {
    const tradesToDelete = trades.filter(t => tradeIds.includes(t.id));
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Trades',
      description: `Are you sure you want to delete ${tradeIds.length} trade(s)? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await dataService.deleteTrades(tradeIds);
          setTrades(prev => prev.filter(t => !tradeIds.includes(t.id)));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          
          addToast({
            type: 'success',
            title: 'Trades Deleted',
            message: `${tradeIds.length} trade(s) removed from your journal.`,
            duration: 8000,
            action: {
              label: 'Undo',
              onClick: async () => {
                try {
                  await dataService.batchAddTrades(tradesToDelete);
                  setTrades(prev => [...tradesToDelete, ...prev].sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
                    const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
                    return dateB.getTime() - dateA.getTime();
                  }));
                  addToast({
                    type: 'success',
                    title: 'Deletion Undone',
                    message: 'Your trades have been restored.'
                  });
                } catch (err) {
                  console.error("Failed to undo delete:", err);
                  addToast({
                    type: 'error',
                    title: 'Undo Failed',
                    message: 'Could not restore trades. Please refresh.'
                  });
                }
              }
            }
          });
        } catch (error) {
          console.error("Error deleting trades:", error);
          addToast({
            type: 'error',
            title: 'Delete Failed',
            message: 'An error occurred while deleting trades.'
          });
        }
      }
    });
  };

  // --- Bias Handlers ---
  const handleUpdateBias = async (bias: DailyBias) => {
    try {
      await dataService.updateBias(bias);
      const existing = dailyBias.findIndex(b => b.date === bias.date);
      if (existing > -1) {
        const updated = [...dailyBias];
        updated[existing] = bias;
        setDailyBias(updated);
      } else {
        setDailyBias([...dailyBias, bias]);
      }
    } catch (error) {
      console.error("Error updating bias:", error);
    }
  };

  // --- Note Handlers ---
  const handleAddNote = async (note: Note) => {
    try {
      const newNote = await dataService.addNote(note);
      setNotes([newNote, ...notes]);
      return newNote;
    } catch (error) {
      console.error("Error adding note:", error);
      throw error;
    }
  };

  const handleUpdateNote = async (note: Note) => {
    try {
      await dataService.updateNote(note);
      setNotes(notes.map(n => n.id === note.id ? note : n));
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await dataService.deleteNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // --- Goal Handlers ---
  const handleAddGoal = async (goal: Goal) => {
    try {
      const newGoal = await dataService.addGoal(goal);
      setGoals([newGoal, ...goals]);
    } catch (error) {
      console.error("Error adding goal:", error);
    }
  };

  const handleUpdateGoal = async (goal: Goal) => {
    try {
      await dataService.updateGoal(goal);
      setGoals(goals.map(g => g.id === goal.id ? goal : g));
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await dataService.deleteGoal(goalId);
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const handleUpdateProfile = async (profile: UserProfile) => {
    try {
      await dataService.updateProfile(profile);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    // Set state immediately for instant UI transition
    setUserProfile(profile);
    setCurrentView(profile.syncMethod === 'EA_CONNECT' ? 'ea-setup' : 'dashboard');
    setTrades([]);

    try {
      await dataService.updateProfile(profile);
    } catch (error) {
      console.error("Error saving profile:", error);
      setConfirmModal({
        isOpen: true,
        title: 'Profile Error',
        description: 'Failed to save profile. Please check your connection and try again.',
        confirmText: 'OK',
        variant: 'danger',
        showCancel: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleLogout = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Log Out',
      description: 'Are you sure you want to log out of your account?',
      confirmText: 'Log Out',
      variant: 'info',
      onConfirm: async () => {
        await authService.signOut();
        setIsAuthenticated(false);
        setUserProfile(null);
        setTrades([]);
        setNotes([]);
        setDailyBias([]);
        setGoals([]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Ensure body follows theme
  useEffect(() => {
    // Remove premium theme classes from both elements
    const themeClasses = ['theme-midnight'];
    document.documentElement.classList.remove(...themeClasses, 'theme-cosmic');
    document.body.classList.remove(...themeClasses, 'theme-cosmic');
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      
      const activeTheme = userProfile?.themePreference || 'default';
      
      // Apply premium themes if selected
      if (activeTheme === 'midnight') {
        const themeClass = 'theme-midnight';
        document.documentElement.classList.add(themeClass);
        document.body.classList.add(themeClass);
        document.body.style.backgroundColor = '#020617';
      } else {
        document.body.style.backgroundColor = '#050505'; // Default dark
      }
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC'; // Default light
    }
  }, [isDarkMode, userProfile?.themePreference]);

  // Ensure focus mode is disabled when leaving charts view
  useEffect(() => {
    if (currentView !== 'charts') {
      setIsFocusMode(false);
    }
    
    // Auto-refresh data when switching to critical views
    if (isAuthenticated && userId) {
      if (currentView === 'history') {
        dataService.getTrades().then(setTrades).catch(console.error);
      } else if (currentView === 'dashboard') {
        dataService.getTrades().then(setTrades).catch(console.error);
        dataService.getDailyBias().then(setDailyBias).catch(console.error);
      }
    }
  }, [currentView, isAuthenticated, userId]);

  if (isMobile) {
    return <MobileBlocker isDarkMode={isDarkMode} />;
  }

  if (isInitialLoading) {
    return (
      <div className={`flex h-screen w-full items-center justify-center ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4F01]"></div>
      </div>
    );
  }

  // Auth Flow
  if (!isAuthenticated) {
    return (
      <Auth
        isDarkMode={isDarkMode}
        onLogin={async () => {
          setIsInitialLoading(true);
          setIsAuthenticated(true);
          try {
            const user = await authService.getCurrentUser();
            if (user) {
              setUserId(user.id);
              setUserEmail(user.email || '');
              await loadUserData(user.id);
            }
          } catch (error) {
            console.error("Login data load failed:", error);
          } finally {
            setIsInitialLoading(false);
          }
        }}
        onRegister={async () => {
          setIsInitialLoading(true);
          setIsAuthenticated(true);
          try {
            const user = await authService.getCurrentUser();
            if (user) {
              setUserId(user.id);
              setUserEmail(user.email || '');
              await loadUserData(user.id);
            }
          } catch (error) {
            console.error("Registration data load failed:", error);
          } finally {
            setIsInitialLoading(false);
          }
        }}
      />
    );
  }

  if (!userProfile || !userProfile.onboarded) {
    return <Onboarding isDarkMode={isDarkMode} onComplete={handleOnboardingComplete} />;
  }

    const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
    const isPro = userProfile?.plan === 'PRO TIER (ANALYSTS)';
    // Centralized currentBalance logic: use bridge balance if connected, otherwise fallback to journal PnL
    // For PRO users, if not connected, balance is effectively 0 until sync
    const currentBalance = eaSession?.data?.account?.balance !== undefined 
      ? eaSession.data.account.balance 
      : (isPro ? 0 : (userProfile.initialBalance + totalPnL));
  
    // Calculate Usage Stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const tradesThisMonth = trades.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear;
    }).length;
    const totalNotes = notes.length;
    const totalImages = trades.reduce((acc, t) => {
      let count = 0;
      if (t.beforeScreenshot) count++;
      if (t.afterScreenshot) count++;
      return acc + count;
    }, 0);
  
    return (
      <ErrorBoundary isDarkMode={isDarkMode}>
        <div className={`flex h-screen w-full transition-colors duration-300 ${isDarkMode ? 'bg-[#050505] text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
  
          {isCalculatorOpen && (
            <PositionSizeCalculator
              isOpen={isCalculatorOpen}
              onClose={() => setIsCalculatorOpen(false)}
              isDarkMode={isDarkMode}
              initialBalance={currentBalance}
              currencySymbol={userProfile.currencySymbol}
            />
          )}
  
          {!isFocusMode && (
            <Sidebar
              currentView={currentView}
              onViewChange={setCurrentView}
              onSettingsTabChange={setSettingsTab}
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode(!isDarkMode)}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              onOpenQuickLog={() => setIsQuickLogOpen(true)}
              onLogout={handleLogout}
              userProfile={userProfile}
              trades={trades}
            />
          )}

          <main className="flex-1 h-full overflow-hidden relative">
            {currentView === 'dashboard' && (
              <Dashboard
                isDarkMode={isDarkMode}
                trades={trades}
                dailyBias={dailyBias}
                onUpdateBias={handleUpdateBias}
                userProfile={userProfile}
                onViewChange={setCurrentView}
                eaSession={eaSession}
                isLoading={isDataLoading}
              />
            )}
            {currentView === 'log-trade' && userProfile && (
              <LogTrade
                isDarkMode={isDarkMode}
                onSave={handleAddTrade}
                onBatchSave={handleBatchAddTrades}
                initialTrade={editingTrade || undefined}
                onCancel={() => { setEditingTrade(null); setCurrentView('history'); }}
                currencySymbol={userProfile.currencySymbol}
                userProfile={userProfile}
              />
            )}
            {currentView === 'history' && (
              <Journal
                isDarkMode={isDarkMode}
                trades={trades}
                onUpdateTrade={handleUpdateTrade}
                onDeleteTrades={handleDeleteTrades}
                onEditTrade={handleEditTrade}
                userProfile={userProfile}
              />
            )}
            {currentView === 'analytics' && userProfile && (
              <Analytics 
                isDarkMode={isDarkMode} 
                trades={trades} 
                userProfile={userProfile} 
                eaSession={eaSession} 
                onViewChange={setCurrentView}
              />
            )} 
  
            {currentView === 'goals' && userProfile && (
              <Goals
                isDarkMode={isDarkMode}
                trades={trades}
                goals={goals}
                onAddGoal={handleAddGoal}
                onUpdateGoal={handleUpdateGoal}
                onDeleteGoal={handleDeleteGoal}
                currencySymbol={userProfile.currencySymbol}
              />
            )}
            {currentView === 'notes' && (
              <Notes
                isDarkMode={isDarkMode}
                notes={notes}
                goals={goals}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                onUpdateGoal={handleUpdateGoal}
                userProfile={userProfile}
                onViewChange={setCurrentView}
              />
            )}
            
            {/* Persistent Chart View (Respects keepChartsAlive preference) */}
            {userProfile?.keepChartsAlive ? (
              <div className={currentView === 'charts' ? 'h-full w-full' : 'hidden'}>
                {userProfile && (
                  <ChartGrid
                    isDarkMode={isDarkMode}
                    isFocusMode={isFocusMode}
                    onToggleFocus={() => setIsFocusMode(!isFocusMode)}
                    userProfile={userProfile}
                    onUpdateProfile={handleUpdateProfile}
                  />
                )}
              </div>
            ) : (
              currentView === 'charts' && userProfile && (
                <ChartGrid
                  isDarkMode={isDarkMode}
                  isFocusMode={isFocusMode}
                  onToggleFocus={() => setIsFocusMode(!isFocusMode)}
                  userProfile={userProfile}
                  onUpdateProfile={handleUpdateProfile}
                />
              )
            )}

            {currentView === 'diagrams' && <DiagramEditor isDarkMode={isDarkMode} />}
            {currentView === 'ea-setup' && userProfile && (
              <EASetup 
                isDarkMode={isDarkMode} 
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                eaSession={eaSession}
                onTradeAdded={(newTrade) => setTrades(prev => [newTrade, ...prev])}
              />
            )}
            {currentView === 'broker' && userProfile && (
              <BrokerConnect
                isDarkMode={isDarkMode}
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
              />
            )}
            {currentView === 'calculators' && userProfile && (
              <Calculators
                isDarkMode={isDarkMode}
                currencySymbol={userProfile.currencySymbol}
              />
            )}
            {currentView === 'settings' && userProfile && (
              <Settings
                isDarkMode={isDarkMode}
                userProfile={userProfile}
                userEmail={userEmail}
                onUpdateProfile={handleUpdateProfile}
                onLogout={handleLogout}
                onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                tradesThisMonth={tradesThisMonth}
                totalNotes={totalNotes}
                totalImages={totalImages}
                tradesCount={trades.length}
                initialTab={settingsTab}
              />
            )}
          </main>
        
        <QuickLogModal
          isOpen={isQuickLogOpen}
          onClose={() => setIsQuickLogOpen(false)}
          onSave={handleAddTrade}
          isDarkMode={isDarkMode}
          currencySymbol={userProfile?.currencySymbol || '$'}
        />

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          variant={confirmModal.variant}
          showCancel={confirmModal.showCancel}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          isDarkMode={isDarkMode}
        />
        {/* Beta Announcement Modal */}
        {showBetaAnnouncement && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div 
              className={`w-full max-w-lg rounded-[32px] p-10 shadow-2xl relative overflow-hidden ${
                isDarkMode ? 'bg-[#0f111a] text-white border border-zinc-800' : 'bg-white text-gray-900 border border-gray-100'
              } transform transition-all animate-in zoom-in-95 duration-300`}
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-[#FF4F01]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF4F01] to-orange-600 rounded-[24px] flex items-center justify-center text-white mb-8 shadow-2xl rotate-3">
                  <PartyPopper size={40} />
                </div>
                
                <h2 className="text-4xl font-black mb-4 tracking-tight">Welcome to the Beta!</h2>
                <p className={`text-base mb-8 leading-relaxed px-4 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                  Thank you for joining the <span className="text-[#FF4F01] font-bold">JournalFX Beta Program</span>. 
                  As a beta tester, you have full access to all <span className="text-indigo-400 font-bold">Pro</span> and <span className="text-purple-400 font-bold">Premium</span> features for free.
                </p>

                <div className={`w-full p-6 rounded-2xl mb-8 text-left ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#FF4F01]/10 text-[#FF4F01] rounded-lg">
                      <MessageSquare size={18} />
                    </div>
                    <h4 className="font-bold text-sm">How to provide feedback:</h4>
                  </div>
                  <p className="text-xs opacity-60 leading-relaxed">
                    Found a bug or have a suggestion? Go to <span className="font-bold">Settings &gt; Help & Feedback</span> to send us a direct message. Your feedback directly shapes the future of JournalFX.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setShowBetaAnnouncement(false);
                    setHasSeenBetaAnnouncement(true);
                  }}
                  className="w-full py-5 bg-[#FF4F01] hover:bg-[#e64601] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#FF4F01]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  LET'S START TRADING
                </button>
                
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">
                  JournalFX v1.0.0-beta.1
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;