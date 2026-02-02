import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LogTrade from './components/LogTrade';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Analytics from './components/Analytics';
import Auth from './components/Auth';
import { PartyPopper, MessageSquare, LogOut, X, Wallet, Activity, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserProfile, Trade, Note, DailyBias, Goal, EASession } from './types';

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
import AIChat from './components/AIChat';
import MobileApp from './components/MobileApp';
import ConfirmationModal from './components/ConfirmationModal';
import QuickLogModal from './components/QuickLogModal';
import ErrorBoundary from './components/ErrorBoundary';
import BacktestLab from './components/BacktestLab';
import { APP_CONSTANTS, PLAN_FEATURES } from './lib/constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getSASTDateTime } from './lib/timeUtils';
import { dataService } from './services/dataService';
import { ToastProvider, useToast } from './components/ui/Toast';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { authService } from './services/authService';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [settingsTab, setSettingsTab] = useState<'profile' | 'account' | 'appearance' | 'billing' | 'security' | 'help'>('profile');
  const { addToast } = useToast();
  
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
    setUserEmail,
    setUserProfile
  } = useAuth();

  const {
    trades,
    notes,
    dailyBias,
    goals,
    eaSession,
    editingTrade,
    isDataLoading,
    setTrades,
    setNotes,
    setDailyBias,
    setGoals,
    setEASession,
    setEditingTrade
  } = useData(userId, userProfile);


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
  
  const handleAddTrade = async (trade: Trade) => {
    try {
      if (editingTrade && editingTrade.id) {
        await dataService.updateTrade(trade);
        setTrades(trades.map(t => t.id === trade.id ? trade : t));
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
        dataService.logActivity('ADD_TRADE', { pair: newTrade.pair, pnl: newTrade.pnl });
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
    } catch (error) {
      console.error("Error updating trade:", error);
    }
  };

  const handleBatchUpdateTrades = async (updatedTrades: Trade[]) => {
    try {
      await dataService.batchUpdateTrades(updatedTrades);
    } catch (error) {
      console.error("Error batch updating trades:", error);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not link trades. Please try again.'
      });
    }
  };

  const handleDeleteTrades = async (tradeIds: string[]) => {
    const tradesToDelete = trades.filter(t => tradeIds.includes(t.id));

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
    try {
      await dataService.updateBias(bias);
    } catch (error) {
      console.error("Error updating bias:", error);
    }
  };

  const handleAddNote = async (note: Note) => {
    try {
      const newNote = await dataService.addNote(note);
      return newNote;
    } catch (error) {
      console.error("Error adding note:", error);
      throw error;
    }
  };

  const handleUpdateNote = async (note: Note) => {
    try {
      await dataService.updateNote(note);
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await dataService.deleteNote(noteId);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleAddGoal = async (goal: Goal) => {
    try {
      await dataService.addGoal(goal);
    } catch (error) {
      console.error("Error adding goal:", error);
    }
  };

  const handleUpdateGoal = async (goal: Goal) => {
    try {
      await dataService.updateGoal(goal);
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await dataService.deleteGoal(goalId);
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const onLogout = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Log Out',
      description: 'Are you sure you want to log out of your account?',
      confirmText: 'Log Out',
      variant: 'info',
      onConfirm: async () => {
        await handleLogout();
        setTrades([]);
        setNotes([]);
        setDailyBias([]);
        setGoals([]);
        setEASession(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  useEffect(() => {
    const themeClasses = ['theme-midnight'];
    document.documentElement.classList.remove(...themeClasses, 'theme-cosmic');
    document.body.classList.remove(...themeClasses, 'theme-cosmic');

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      const activeTheme = userProfile?.themePreference || 'default';
      if (activeTheme === 'midnight') {
        const themeClass = 'theme-midnight';
        document.documentElement.classList.add(themeClass);
        document.body.classList.add(themeClass);
        document.body.style.backgroundColor = '#020617';
      } else {
        document.body.style.backgroundColor = '#050505';
      }
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC';
    }
  }, [isDarkMode, userProfile?.themePreference]);

  useEffect(() => {
    if (currentView !== 'charts') {
      setIsFocusMode(false);
    }
  }, [currentView]);

  if (isInitialLoading) {
    return (
      <div className={`flex h-screen w-full items-center justify-center ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4F01]"></div>
      </div>
    );
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

  if (isMobile) {
    return (
      <MobileApp 
        isDarkMode={isDarkMode} 
        trades={trades} 
        userProfile={userProfile} 
        eaSession={eaSession}
        onLogout={onLogout}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        goals={goals}
        dailyBias={dailyBias}
      />
    );
  }

  const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
  const currentBalance = eaSession?.data?.account?.balance !== undefined
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
            onLogout={onLogout}
            userProfile={userProfile}
            trades={trades}
            eaSession={eaSession}
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
          {currentView === 'ai-chat' && (
            <AIChat
              isDarkMode={isDarkMode}
              trades={trades}
              userProfile={userProfile}
              goals={goals}
              dailyBias={dailyBias}
            />
          )}
          {currentView === 'log-trade' && userProfile && (
            <LogTrade
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

          {currentView === 'diagrams' && userId && <DiagramEditor isDarkMode={isDarkMode} userId={userId} />}
          {currentView === 'ea-setup' && userProfile && userId && (
            <EASetup
              isDarkMode={isDarkMode}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              eaSession={eaSession}
              onTradeAdded={(newTrade) => {}}
              onEditTrade={handleEditTrade}
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
              onLogout={onLogout}
              onToggleTheme={() => setIsDarkMode(!isDarkMode)}
              tradesThisMonth={tradesThisMonth}
              totalNotes={totalNotes}
              totalImages={totalImages}
              tradesCount={trades.length}
              onDeduplicate={handleDeduplicate}
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
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;