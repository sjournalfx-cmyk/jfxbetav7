
import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { APP_CONSTANTS, PLAN_FEATURES } from '../lib/constants';

export const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const loadUserData = async (userId: string) => {
    try {
      const { data: profile } = await authService.getProfile(userId);
      let mappedProfile: UserProfile | null = null;
      if (profile) {
        const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
        let avatarUrl = profile.avatar_url;
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          avatarUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${avatarUrl}`;
        }

        // Validate plan string against known plans
        const rawPlan = profile.plan || APP_CONSTANTS.PLANS.FREE;
        const validPlan = PLAN_FEATURES[rawPlan as keyof typeof PLAN_FEATURES]
          ? rawPlan
          : APP_CONSTANTS.PLANS.FREE;

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
          plan: validPlan,
          syncKey: profile.sync_key,
          eaConnected: profile.ea_connected || false,
          autoJournal: profile.auto_journal || false,
          avatarUrl: avatarUrl,
          themePreference: profile.theme_preference || 'default',
          chartConfig: profile.chart_config || null,
          keepChartsAlive: profile.keep_charts_alive ?? true,
        };
        setUserProfile(mappedProfile);
      }
      return mappedProfile;
    } catch (error) {
      console.error("Error loading user data:", error);
      return null;
    }
  };

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

  useEffect(() => {
    initApp();
  }, []);

  const handleLogout = async () => {
    await authService.signOut();
    setIsAuthenticated(false);
    setUserProfile(null);
    setUserId(null);
    setUserEmail('');
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    try {
      await dataService.updateProfile(profile);
    } catch (error) {
      console.error("Error saving profile:", error);
      throw error;
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

  return {
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
  };
};
