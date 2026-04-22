import React, { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import LogTrade from './components/LogTrade';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Auth from './components/Auth';
import { PartyPopper, MessageSquare, Activity, CheckCircle2, Loader2 } from 'lucide-react';
import { Trade, Note, DailyBias } from './types';
import Onboarding from './components/Onboarding';
import Settings from './components/Settings';
import EASetup from './components/EASetup';
import BrokerConnect from './components/BrokerConnect';
import ConfirmationModal from './components/ConfirmationModal';
import QuickLogModal from './components/QuickLogModal';
import ErrorBoundary from './components/ErrorBoundary';
import { APP_CONSTANTS, PLAN_FEATURES } from './lib/constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getSASTDateTime } from './lib/timeUtils';
import { dataService } from './services/dataService';
import { ToastProvider, useToast } from './components/ui/Toast';
import { BrandedLoader } from './components/ui/BrandedLoader';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { authService } from './services/authService';
import { Agentation, type Annotation } from "agentation";
import { getSafePnL } from './lib/trade-normalization';
import { normalizeThemePreference } from './lib/theme';
import { isSupabaseConfigured } from './lib/supabase';

// Lazy load heavy components for performance
const Analytics = lazy(() => import('./components/Analytics'));
const AIChat = lazy(() => import('./components/AIChat'));
const BacktestLab = lazy(() => import('./components/BacktestLab'));
const ChartGrid = lazy(() => import('./components/ChartGrid'));
const Notes = lazy(() => import('./components/Notes'));

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [settingsTab, setSettingsTab] = useState<'profile' | 'account' | 'appearance' | 'billing' | 'security' | 'help'>('profile');
  const { addToast } = useToast();
  
  // Mock for current migration version - In a real app, this would be fetched from the backend.
  const [currentMigrationVersion] = useState('v20260221.1-mock');
  
  const {
    userId,
    userProfile,
    userEmail,
    isAuthenticated,
    isInitialLoading,
    handleLogout,
    handleOnboardingComplete,
    handleUpdateProfile,
    loadUserData,
    setIsAuthenticated,
    setIsInitialLoading,
    setUserId,
    setUserEmail
  } = useAuth();

const {
    trades,
    notes,
    dailyBias,
    cashTransactions,
    eaSession,
    editingTrade,
    isDataLoading,
    setTrades,
    setNotes,
    setDailyBias,
    setEASession,
    setEditingTrade,
    offlineQueue,
    addToOfflineQueue
  } = useData(userId, userProfile);


  // Obsidian-only UI; the app no longer switches to light mode.
  const isDarkMode = true;
  
  // UI State
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [hasSeenBetaAnnouncement, setHasSeenBetaAnnouncement] = useLocalStorage<boolean>('jfx_beta_announcement_shown', false);
  const [showBetaAnnouncement, setShowBetaAnnouncement] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black text-zinc-100 px-6">
        <div className="max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-3xl font-black tracking-tight">Supabase setup required</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-300">
            The app is deployed, but it cannot connect to Supabase until the Vercel environment variables are added.
            Set the following in the Vercel project settings, then redeploy:
          </p>
          <ul className="mt-5 space-y-2 text-sm text-zinc-200">
            <li><code>VITE_SUPABASE_URL</code></li>
            <li><code>VITE_SUPABASE_ANON_KEY</code></li>
            <li><code>VITE_GEMINI_API_KEY</code> if AI features are needed</li>
            <li><code>VITE_NVIDIA_API_KEY</code> if NVIDIA features are needed</li>
          </ul>
          <p className="mt-5 text-xs uppercase tracking-[0.25em] text-zinc-500">
            Without these values the app can load, but auth and synced data will be disabled.
          </p>
        </div>
      </div>
    );
  }

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
  
  const handleAddTrade = async (trade: Trade) => {
    try {
      if (editingTrade && editingTrade.id) {
        const savedTrade = await dataService.updateTrade(trade);
        setTrades(prev => prev.map(t => t.id === savedTrade.id ? savedTrade : t));
        setEditingTrade(null);
      } else {
        const sastNow = getSASTDateTime();
        const [year, month] = sastNow.date.split('-').map(Number);
        
        const currentPlan = userProfile?.plan || APP_CONSTANTS.PLANS.FREE;
        const features = PLAN_FEATURES[currentPlan] || PLAN_FEATURES[APP_CONSTANTS.PLANS.FREE];

        if (userId && features.maxTradesPerMonth !== Infinity) {
          const dbTradesThisMonth = await dataService.getMonthlyTradeCount(userId, year, month);
          
          if (dbTradesThisMonth >= features.maxTradesPerMonth) {
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
        }

        const newTrade = await dataService.addTrade(trade);
        setTrades(prev => [newTrade, ...prev.filter(t => t.id !== newTrade.id)]);
        dataService.logActivity('ADD_TRADE', { pair: newTrade.pair, pnl: newTrade.pnl });
      }
      setCurrentView('history');
    } catch (error) {
      console.error("Error saving trade:", error);
      if (editingTrade && editingTrade.id) {
        const previousTrade = trades.find(t => t.id === trade.id);
        if (previousTrade) {
          setTrades(prev => prev.map(t => t.id === trade.id ? previousTrade : t));
        }
      }
      
      // Check if it's a network/connectivity error
      const isNetworkError = !navigator.onLine || 
        error instanceof TypeError || 
        (error as any).code === 'FETCH_ERROR' ||
        (error as any).message?.includes('Failed to fetch');

      if (isNetworkError && !editingTrade) {
        addToOfflineQueue(trade);
        setCurrentView('history');
        return;
      }

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
    const previousTrade = trades.find(t => t.id === updatedTrade.id);
    try {
      const savedTrade = await dataService.updateTrade(updatedTrade);
      setTrades(prev => prev.map(t => t.id === savedTrade.id ? savedTrade : t));
    } catch (error) {
      console.error("Error updating trade:", error);
      if (previousTrade) {
        setTrades(prev => prev.map(t => t.id === updatedTrade.id ? previousTrade : t));
      }
    }
  };

  const handleBatchUpdateTrades = async (updatedTrades: Trade[]) => {
    const previousTrades = trades.filter(t => updatedTrades.some(updated => updated.id === t.id));
    const updatesById = new Map(updatedTrades.map(trade => [trade.id, trade]));
    setTrades(prev => prev.map(trade => updatesById.get(trade.id) || trade));
    try {
      await dataService.batchUpdateTrades(updatedTrades);
      return true;
    } catch (error) {
      console.error("Error batch updating trades:", error);
      const rollbackById = new Map(previousTrades.map(trade => [trade.id, trade]));
      setTrades(prev => prev.map(trade => rollbackById.get(trade.id) || trade));
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not link trades. Please try again.'
      });
      return false;
    }
  };

  const handleDeleteTrades = async (tradeIds: string[]) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Trades',
      description: `Are you sure you want to delete ${tradeIds.length} trade(s)? This action can be undone for 30 days.`,
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await dataService.deleteTrades(tradeIds);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          dataService.logActivity('DELETE_TRADES', { count: tradeIds.length, ids: tradeIds });

          addToast({
            type: 'success',
            title: 'Trades Deleted',
            message: `${tradeIds.length} trade(s) moved to trash.`,
            duration: 8000,
            action: {
              label: 'Undo',
              onClick: async () => {
                try {
                  await dataService.restoreTrades(tradeIds);
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

  const handleDeduplicate = async () => {
    try {
      const removedCount = await dataService.deduplicateManualTrades();
      if (removedCount > 0) {
        addToast({
          type: 'success',
          title: 'De-duplication Complete',
          message: `Successfully removed ${removedCount} duplicate manual entries.`,
          duration: 5000
        });
      } else {
        addToast({
          type: 'info',
          title: 'No Duplicates Found',
          message: 'Your manual trade history is already clean.',
          duration: 4000
        });
      }
    } catch (error) {
      console.error("Deduplication failed:", error);
      addToast({
        type: 'error',
        title: 'Task Failed',
        message: 'Could not complete de-duplication. Please try again later.'
      });
    }
  };

  const handleUpdateBias = async (bias: DailyBias) => {
    // Optimistic update
    setDailyBias(prev => {
      const exists = prev.some(b => b.date === bias.date);
      if (exists) {
        return prev.map(b => b.date === bias.date ? bias : b);
      }
      return [bias, ...prev];
    });

    try {
      await dataService.updateBias(bias);
    } catch (error) {
      console.error("Error updating bias:", error);
    }
  };

  const handleAddNote = async (note: Note) => {
    // Optimistic update with temp ID
    const tempId = `temp-${Date.now()}`;
    const optimisticNote = { ...note, id: tempId };
    setNotes(prev => [optimisticNote, ...prev]);

    try {
      const newNote = await dataService.addNote(note);
      // Replace temp note with real one
      setNotes(prev => prev.map(n => n.id === tempId ? newNote : n));
      return newNote;
    } catch (error) {
      console.error("Error adding note:", error);
      // Rollback
      setNotes(prev => prev.filter(n => n.id !== tempId));
      throw error;
    }
  };

  const handleUpdateNote = async (note: Note) => {
    // Optimistic update
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, ...note } : n));
    try {
      await dataService.updateNote(note);
    } catch (error) {
      console.error("Error updating note:", error);
      // Rollback would be nice but typically Realtime sync handles it
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    if (noteToDelete.isTrashed) {
      handleDeleteNoteForever(noteId);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete Note',
      description: 'Are you sure you want to delete this note? It will be moved to trash.',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          // Optimistic update
          setNotes(prev => prev.filter(n => n.id !== noteId));
          const updatedNote = { ...noteToDelete, isTrashed: true };
          await dataService.updateNote(updatedNote);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          addToast({
            type: 'success',
            title: 'Note Deleted',
            message: 'Note has been moved to trash.',
            duration: 5000
          });
        } catch (error) {
          console.error("Error deleting note:", error);
          addToast({
            type: 'error',
            title: 'Delete Failed',
            message: 'An error occurred while deleting the note.'
          });
        }
      }
    });
  };

  const handleRestoreNote = async (noteId: string) => {
    const noteToRestore = notes.find(n => n.id === noteId);
    if (!noteToRestore) return;

    try {
      // Optimistic update
      const updatedNote = { ...noteToRestore, isTrashed: false };
      setNotes(prev => prev.map(n => n.id === noteId ? (updatedNote as Note) : n));
      await dataService.updateNote(updatedNote as Note);
      addToast({
        type: 'success',
        title: 'Note Restored',
        message: 'Note has been restored to your library.',
        duration: 3000
      });
    } catch (error) {
      console.error("Error restoring note:", error);
    }
  };

  const handleDeleteNoteForever = async (noteId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Forever',
      description: 'Are you sure you want to permanently delete this note? This action cannot be undone.',
      confirmText: 'Delete Forever',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await dataService.deleteNote(noteId);
          setNotes(prev => prev.filter(n => n.id !== noteId));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          addToast({
            type: 'success',
            title: 'Note Deleted Permanently',
            message: 'Note has been removed forever.',
            duration: 5000
          });
        } catch (error) {
          console.error("Error deleting note forever:", error);
          addToast({
            type: 'error',
            title: 'Delete Failed',
            message: 'An error occurred while deleting the note.'
          });
        }
      }
    });
  };

const onLogout = async () => {
  setConfirmModal({
    isOpen: true,
    title: 'Log Out',
    description: 'Are you sure you want to log out of your account?',
    confirmText: 'Log Out',
    variant: 'danger',
    onConfirm: async () => {
      await handleLogout();
      setTrades([]);
      setNotes([]);
      setDailyBias([]);
      setEASession(null);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  });
};

  useEffect(() => {
    const themeClasses = ['theme-obsidian', 'theme-cosmic'];
    document.documentElement.classList.remove(...themeClasses);
    document.body.classList.remove(...themeClasses);

    document.documentElement.classList.add('dark');
    const activeTheme = normalizeThemePreference(userProfile?.themePreference);
    const themeClass = `theme-${activeTheme}`;
    document.documentElement.classList.add(themeClass);
    document.body.classList.add(themeClass);
    document.body.style.background = activeTheme === 'cosmic'
      ? 'linear-gradient(135deg,#09090b 0%,#18181b 50%,#030712 100%)'
      : 'linear-gradient(135deg,#000000 0%,#050505 55%,#0a0a0a 100%)';
  }, [isDarkMode, userProfile?.themePreference]);

  useEffect(() => {
    if (currentView !== 'charts') {
      setIsFocusMode(false);
    }
  }, [currentView]);

  if (isInitialLoading) {
    return <BrandedLoader />;
  }

  if (!isAuthenticated) {
    return (
      <Auth
        isDarkMode={isDarkMode}
        onLogin={async () => {
          setIsInitialLoading(true);
          try {
            const user = await authService.getCurrentUser();
            if (user) {
              setUserId(user.id);
              setUserEmail(user.email || '');
              await loadUserData(user.id);
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error("Login data load failed:", error);
          } finally {
            setIsInitialLoading(false);
          }
        }}
        onRegister={async () => {
          setIsInitialLoading(true);
          try {
            const user = await authService.getCurrentUser();
            if (user) {
              setUserId(user.id);
              setUserEmail(user.email || '');
              await loadUserData(user.id);
              setIsAuthenticated(true);
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
    return <Onboarding isDarkMode={isDarkMode} onComplete={async (profile) => {
      await handleOnboardingComplete(profile);
      setCurrentView(profile.syncMethod === 'EA_CONNECT' ? 'ea-setup' : 'dashboard');
      setTrades([]);
    }} />;
  }

  const totalPnL = trades.reduce((acc, t) => acc + getSafePnL(t.pnl), 0);
  const currentBalance = (userProfile?.syncMethod === 'EA_CONNECT' && eaSession?.data?.account?.balance !== undefined)
    ? eaSession.data.account.balance
    : (userProfile.initialBalance + totalPnL);

  const { date: sastDate } = getSASTDateTime();
  const [year, month] = sastDate.split('-').map(Number);
  
  const tradesThisMonth = trades.filter(t => {
    const [tYear, tMonth] = t.date.split('-').map(Number);
    return tMonth === month && tYear === year;
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
      <div className={`flex h-screen w-full transition-colors duration-300 ${isDarkMode ? 'text-zinc-100' : 'bg-slate-50 text-slate-900'}`} style={isDarkMode ? { background: 'linear-gradient(135deg,#000000 0%,#050510 60%,#000000 100%)' } : {}}>

        {!isFocusMode && (
            <Sidebar
              currentView={currentView}
              onViewChange={setCurrentView}
              onSettingsTabChange={setSettingsTab}
              isDarkMode={isDarkMode}
              onOpenQuickLog={() => setIsQuickLogOpen(true)}
              onLogout={onLogout}
              userProfile={userProfile}
              trades={trades}
              eaSession={eaSession}
              offlineQueueCount={offlineQueue.length}
            />
        )}

        <main className="flex-1 h-full overflow-hidden relative">
          <Suspense fallback={<BrandedLoader />}>
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
                offlineQueue={offlineQueue}
              />
            )}
            {currentView === 'ai-chat' && (
              <AIChat
                isDarkMode={isDarkMode}
                trades={trades}
                userProfile={userProfile}
                dailyBias={dailyBias}
                onAddNote={handleAddNote}
                onUpdateTrade={handleUpdateTrade}
                eaSession={eaSession}
                onOpenSettings={() => setCurrentView('settings')}
              />
            )}
            {currentView === 'log-trade' && userProfile && (
              <LogTrade
                key={editingTrade?.id || 'new-trade'}
                isDarkMode={isDarkMode}
                onSave={handleAddTrade}
                onCancel={() => setCurrentView('dashboard')}
                initialTrade={editingTrade}
                currencySymbol={userProfile.currencySymbol}
                trades={trades}
                userProfile={userProfile}
              />
            )}
            {currentView === 'backtest-lab' && userProfile && (
              <BacktestLab isDarkMode={isDarkMode} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} />
            )}
            {currentView === 'history' && (
              <Journal
                isDarkMode={isDarkMode}
                trades={trades}
                onUpdateTrade={handleUpdateTrade}
                onBatchUpdateTrades={handleBatchUpdateTrades}
                onDeleteTrades={handleDeleteTrades}
                onEditTrade={handleEditTrade}
                userProfile={userProfile}
                offlineQueue={offlineQueue}
              />
            )}
{currentView === 'analytics' && userProfile && (
          <Analytics
            isDarkMode={isDarkMode}
            trades={trades}
            userProfile={userProfile}
            eaSession={eaSession}
            onViewChange={setCurrentView}
            cashTransactions={cashTransactions}
          />
        )}
            {currentView === 'notes' && (
              <Notes
                isDarkMode={isDarkMode}
                notes={notes}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                onRestoreNote={handleRestoreNote}
                userProfile={userProfile}
                onViewChange={setCurrentView}
              />
            )}

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

            {currentView === 'ea-setup' && userProfile && userId && (
              <EASetup
                isDarkMode={isDarkMode}
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                eaSession={eaSession}
                onTradeAdded={(newTrade) => {
                  setTrades(prev => [newTrade, ...prev]);
                }}
                onEditTrade={handleEditTrade}
                onAddOffline={addToOfflineQueue}
                trades={trades}
                userId={userId}
              />
            )}
            {currentView === 'broker' && userProfile && (
              <BrokerConnect
                isDarkMode={isDarkMode}
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
              />
            )}
            {currentView === 'settings' && userProfile && (
              <Settings
                isDarkMode={isDarkMode}
                userProfile={userProfile}
                userEmail={userEmail}
                onUpdateProfile={handleUpdateProfile}
                onLogout={onLogout}
                tradesThisMonth={tradesThisMonth}
                totalNotes={totalNotes}
                totalImages={totalImages}
                tradesCount={trades.length}
                onDeduplicate={handleDeduplicate}
                initialTab={settingsTab}
                migrationVersion={currentMigrationVersion}
              />
            )}
          </Suspense>
        </main>

        <QuickLogModal
          isOpen={isQuickLogOpen}
          onClose={() => setIsQuickLogOpen(false)}
          onSave={handleAddTrade}
          isDarkMode={isDarkMode}
          currencySymbol={userProfile?.currencySymbol || '$'}
        />

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
        {showBetaAnnouncement && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div
              className={`w-full max-w-lg rounded-[32px] p-10 shadow-2xl relative overflow-hidden ${isDarkMode ? 'bg-[#0f111a] text-white border border-zinc-800' : 'bg-white text-gray-900 border border-gray-100'
                } transform transition-all animate-in zoom-in-95 duration-300`}
            >
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
  const handleAnnotationAdd = (annotation: Annotation) => {
    console.group(`🎯 UI Annotation: ${annotation.element}`);
    console.log(`💬 Comment: ${annotation.comment}`);
    console.log(`📍 Path: ${annotation.elementPath}`);
    console.log(`⏰ Time: ${new Date(annotation.timestamp).toLocaleString()}`);
    if (annotation.selectedText) console.log(`🔍 Selected: "${annotation.selectedText}"`);
    console.groupEnd();
  };

  return (
    <ToastProvider>
      <AppContent />
      {import.meta.env.DEV && (
        <Agentation 
          onAnnotationAdd={handleAnnotationAdd}
          onAnnotationUpdate={(a) => console.log("📝 Annotation updated:", a.id)}
          onAnnotationDelete={(a) => console.log("🗑️ Annotation removed:", a.id)}
        />
      )}
    </ToastProvider>
  );
};

export default App;
