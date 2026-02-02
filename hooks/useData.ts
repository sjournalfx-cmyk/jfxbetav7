
import { useState, useEffect } from 'react';
import { Trade, Note, DailyBias, Goal, UserProfile, EASession } from '../types';
import { dataService, mapTradeFromDB, mapGoalFromDB } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import { getSASTDateTime } from '../lib/timeUtils';
import { APP_CONSTANTS, PLAN_FEATURES } from '../lib/constants';

export const useData = (userId: string | null, userProfile: UserProfile | null) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [dailyBias, setDailyBias] = useState<DailyBias[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [eaSession, setEASession] = useState<EASession | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const { addToast } = useToast();

  const loadInitialData = async (currentUserId: string, currentUserProfile: UserProfile | null) => {
    setIsDataLoading(true);
    try {
      const [fetchedTrades, fetchedNotes, fetchedBias, fetchedGoals] = await Promise.all([
        dataService.getTrades(currentUserId),
        dataService.getNotes(currentUserId),
        dataService.getDailyBias(currentUserId),
        dataService.getGoals(currentUserId)
      ]);

      setTrades(fetchedTrades);
      setNotes(fetchedNotes);
      setDailyBias(fetchedBias);
      setGoals(fetchedGoals);
      
      if (currentUserProfile && currentUserProfile.eaConnected && currentUserProfile.syncKey) {
        const session = await dataService.getEASession(currentUserProfile.syncKey);
        if (session) {
          setEASession(session);
        }
      }

      if (fetchedTrades.length > 0) {
        const lastTradeDate = new Date(fetchedTrades[0].date); // First is newest
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastTradeDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 3) {
          setTimeout(() => {
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

  useEffect(() => {
    if (userId) {
      loadInitialData(userId, userProfile);
    }
  }, [userId, userProfile]);

  useEffect(() => {
    if (userId && userProfile?.syncKey) {
      const sessionChannel = supabase
        .channel('ea_session_global_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ea_sessions', filter: `sync_key=eq.${userProfile.syncKey}` }, (payload) => {
          if (payload.new) setEASession(payload.new as EASession);
        })
        .subscribe();

      const tradesChannel = supabase
        .channel('trades_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.deleted_at) return; // Skip if inserted as deleted
            const newTrade = mapTradeFromDB(payload.new as any);
            setTrades(prev => {
              // Prevent duplicate insertion if the trade already exists in state
              if (prev.some(t => t.id === newTrade.id)) return prev;
              return [newTrade, ...prev];
            });
          }
          else if (payload.eventType === 'UPDATE') {
            if (payload.new.deleted_at) {
              // If marked as deleted, remove from local state
              setTrades(prev => prev.filter(t => t.id !== payload.new.id));
            } else {
              setTrades(prev => prev.map(t => t.id === payload.new.id ? mapTradeFromDB(payload.new as any) : t));
            }
          }
          else if (payload.eventType === 'DELETE') setTrades(prev => prev.filter(t => t.id !== (payload.old as any).id));
        })
        .subscribe();

      const notesChannel = supabase
        .channel('notes_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') setNotes(prev => [{ ...payload.new, isPinned: (payload.new as any).is_pinned } as Note, ...prev]);
          else if (payload.eventType === 'UPDATE') setNotes(prev => prev.map(n => n.id === payload.new.id ? { ...payload.new, isPinned: (payload.new as any).is_pinned } as Note : n));
          else if (payload.eventType === 'DELETE') setNotes(prev => prev.filter(n => n.id !== (payload.old as any).id));
        }).subscribe();

      const biasChannel = supabase
        .channel('bias_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_bias', filter: `user_id=eq.${userId}` }, (payload) => {
            if (payload.eventType === 'INSERT') {
                setDailyBias(prev => {
                  if (prev.some(b => b.date === payload.new.date)) return prev;
                  return [...prev, { ...payload.new, actualOutcome: (payload.new as any).actual_outcome } as DailyBias];
                });
              }
              else if (payload.eventType === 'UPDATE') setDailyBias(prev => prev.map(b => b.date === payload.new.date ? { ...payload.new, actualOutcome: (payload.new as any).actual_outcome } as DailyBias : b));
        }).subscribe();

      const goalsChannel = supabase
        .channel('goals_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') setGoals(prev => [mapGoalFromDB(payload.new as any), ...prev]);
          else if (payload.eventType === 'UPDATE') setGoals(prev => prev.map(g => g.id === payload.new.id ? mapGoalFromDB(payload.new as any) : g));
          else if (payload.eventType === 'DELETE') setGoals(prev => prev.filter(g => g.id !== (payload.old as any).id));
        }).subscribe();

      return () => {
        supabase.removeChannel(sessionChannel);
        supabase.removeChannel(tradesChannel);
        supabase.removeChannel(notesChannel);
        supabase.removeChannel(biasChannel);
        supabase.removeChannel(goalsChannel);
      };
    }
  }, [userId, userProfile?.syncKey]);

  const handleUpdateGoal = async (goal: Goal) => {
    try {
      await dataService.updateGoal(goal);
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  return {
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
    setEditingTrade,
    handleUpdateGoal
  };
};
