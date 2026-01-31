
import { supabase } from '../lib/supabase';
import { Trade, Note, DailyBias, UserProfile, Goal, StrategyDiagram, DBTrade, DBGoal, BacktestSession } from '../types';
import { APP_CONSTANTS, PLAN_FEATURES } from '../lib/constants';

// Helper to map DB Trade to App Trade
export const mapTradeFromDB = (dbTrade: DBTrade): Trade => ({
  id: dbTrade.id,
  ticketId: dbTrade.ticket_id,
  pair: dbTrade.pair,
  assetType: dbTrade.asset_type,
  date: dbTrade.date,
  time: dbTrade.time,
  session: dbTrade.session,
  direction: dbTrade.direction,
  entryPrice: Number(dbTrade.entry_price || 0),
  exitPrice: dbTrade.exit_price ? Number(dbTrade.exit_price) : undefined,
  stopLoss: Number(dbTrade.stop_loss || 0),
  takeProfit: Number(dbTrade.take_profit || 0),
  lots: Number(dbTrade.lots || 0),
  result: dbTrade.result,
  pnl: Number(dbTrade.pnl || 0),
  rr: Number(dbTrade.rr || 0),
  rating: Number(dbTrade.rating || 0),
  tags: dbTrade.tags,
  notes: dbTrade.notes,
  emotions: dbTrade.emotions,
  planAdherence: dbTrade.plan_adherence,
  tradingMistake: dbTrade.trading_mistake,
  mindset: dbTrade.mindset,
  exitComment: dbTrade.exit_comment,
  openTime: dbTrade.open_time,
  closeTime: dbTrade.close_time,
  beforeScreenshot: dbTrade.before_screenshot,
  afterScreenshot: dbTrade.after_screenshot,
  setupId: dbTrade.setup_id,
});

// Helper to map App Trade to DB Trade
const mapTradeToDB = (trade: Trade, userId: string): Partial<DBTrade> => ({
  user_id: userId,
  ticket_id: trade.ticketId,
  pair: trade.pair,
  asset_type: trade.assetType,
  date: trade.date,
  time: trade.time,
  session: trade.session,
  direction: trade.direction,
  entry_price: trade.entryPrice,
  exit_price: trade.exitPrice,
  stop_loss: trade.stopLoss,
  take_profit: trade.takeProfit,
  lots: trade.lots,
  result: trade.result,
  pnl: trade.pnl,
  rr: trade.rr,
  rating: trade.rating,
  tags: trade.tags,
  notes: trade.notes,
  emotions: trade.emotions,
  plan_adherence: trade.planAdherence,
  trading_mistake: trade.tradingMistake,
  mindset: trade.mindset,
  exit_comment: trade.exitComment,
  open_time: trade.openTime,
  close_time: trade.closeTime,
  before_screenshot: trade.beforeScreenshot,
  after_screenshot: trade.afterScreenshot,
  setup_id: trade.setupId,
});

// Helper to map DB Goal to App Goal
export const mapGoalFromDB = (dbGoal: DBGoal): Goal => ({
  id: dbGoal.id,
  title: dbGoal.title,
  description: dbGoal.description,
  type: dbGoal.type,
  metric: dbGoal.metric,
  targetValue: Number(dbGoal.target_value || 0),
  startValue: Number(dbGoal.start_value || 0),
  startDate: dbGoal.start_date,
  endDate: dbGoal.end_date,
  status: dbGoal.status,
  createdAt: dbGoal.created_at,
  milestones: dbGoal.milestones || [],
  manualProgress: Number(dbGoal.current_value || 0),
  autoTrackRule: dbGoal.auto_track_rule,
  manualEntries: dbGoal.manual_entries || []
});

const uploadImage = async (userId: string, imageSource: string | undefined, type: 'before' | 'after'): Promise<string | undefined> => {
  if (!imageSource || imageSource.startsWith('http')) return imageSource;

  try {
    // Convert base64 to Blob
    const response = await fetch(imageSource);
    const blob = await response.blob();

    // 1MB Limit check for sanity
    if (blob.size > 1024 * 1024) {
      console.warn(`Image ${type} is too large (${(blob.size / 1024).toFixed(1)}KB). Consider compressing.`);
    }

    const fileExt = 'png'; 
    const fileName = `${userId}/${Date.now()}-${type}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('trade-images')
      .upload(fileName, blob, {
        contentType: blob.type,
        upsert: true
      });

    if (error) {
      if (error.message === 'The resource was not found') {
        throw new Error('Storage bucket "trade-images" not found. Please create it in Supabase.');
      }
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('trade-images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error(`Error uploading ${type} screenshot:`, err);
    // If it's a base64 string and upload failed, we only return it if it's small enough
    // to avoid DB payload errors (limit to ~100KB for inline storage)
    if (imageSource.length < 150000) {
      return imageSource; 
    }
    return undefined; // Drop it rather than crashing the DB save
  }
};

export const uploadNoteImage = async (file: File): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check user plan limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const currentPlan = profile?.plan || APP_CONSTANTS.PLANS.FREE;
    if (!PLAN_FEATURES[currentPlan]?.allowImageUploads) {
      alert('Image uploads are not available on your current plan. Please upgrade.');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `notes/${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('trade-images') // Reusing existing bucket
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('trade-images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error('Error uploading note image:', err);
    return null;
  }
};

const deleteImageFile = async (imageUrl: string | undefined) => {
  if (!imageUrl || !imageUrl.includes('trade-images')) return;

  try {
    // Extract path from public URL
    // URL format: .../storage/v1/object/public/trade-images/userId/filename.png
    const pathParts = imageUrl.split('trade-images/');
    if (pathParts.length < 2) return;

    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from('trade-images')
      .remove([filePath]);

    if (error) throw error;
  } catch (err) {
    console.error('Error deleting image file:', err);
  }
};

export const dataService = {
  // --- Audit Logs ---
  async logActivity(action: string, details: Record<string, any>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action,
        details,
        ip_address: 'client-side', // Placeholder
        user_agent: navigator.userAgent
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  },

  // --- Trades ---
  async getTrades(userId: string) {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapTradeFromDB);
  },

  async getMonthlyTradeCount(userId: string, year: number, month: number) {
    // Month is 1-indexed for the DB query (YYYY-MM-DD)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const { count, error } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    return count || 0;
  },

  async addTrade(trade: Trade) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Upload images if they are base64 (keep awaiting images as they are small and critical)
    const beforeUrl = await uploadImage(user.id, trade.beforeScreenshot, 'before');
    const afterUrl = await uploadImage(user.id, trade.afterScreenshot, 'after');

    const tradeToSave = {
      ...trade,
      beforeScreenshot: beforeUrl,
      afterScreenshot: afterUrl,
    };

    const { data, error } = await supabase
      .from('trades')
      .insert(mapTradeToDB(tradeToSave, user.id))
      .select()
      .single();

    if (error) throw error;
    return mapTradeFromDB(data);
  },

  async batchAddTrades(trades: Trade[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const tradesToSave = trades.map(t => mapTradeToDB(t, user.id));

    const { data, error } = await supabase
      .from('trades')
      .insert(tradesToSave)
      .select();

    if (error) throw error;
    return (data || []).map(mapTradeFromDB);
  },

  async updateTrade(trade: Trade) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current record to check for deleted files
    const { data: currentTrade } = await supabase
      .from('trades')
      .select('before_screenshot, after_screenshot')
      .eq('id', trade.id)
      .single();

    if (currentTrade) {
      // Handle images
      if (currentTrade.before_screenshot && (!trade.beforeScreenshot || trade.beforeScreenshot.startsWith('data:'))) {
        await deleteImageFile(currentTrade.before_screenshot);
      }
      if (currentTrade.after_screenshot && (!trade.afterScreenshot || trade.afterScreenshot.startsWith('data:'))) {
        await deleteImageFile(currentTrade.after_screenshot);
      }
    }

    // Upload images if they are base64
    const beforeUrl = await uploadImage(user.id, trade.beforeScreenshot, 'before');
    const afterUrl = await uploadImage(user.id, trade.afterScreenshot, 'after');

    const tradeToUpdate = {
      ...trade,
      beforeScreenshot: beforeUrl,
      afterScreenshot: afterUrl,
    };

    let updateData = mapTradeToDB(tradeToUpdate, user.id);
    
    // Recursive update function to handle missing columns
    const performUpdate = async (data: Partial<DBTrade>): Promise<void> => {
      const { error } = await supabase.from('trades').update(data).eq('id', trade.id);
      
      if (error) {
        if (error.code === '42703' || error.code === 'PGRST204' || ((error as any).status === 400 && error.message.includes('column'))) {
          const fieldMatch = error.message.match(/column "(.+)"/i) || error.message.match(/column (.+) of/i);
          if (fieldMatch && fieldMatch[1]) {
            const missingField = fieldMatch[1].replace(/"/g, '') as keyof DBTrade;
            console.warn(`Column ${missingField} missing. Retrying without it.`);
            const { [missingField]: _, ...safeData } = data;
            return performUpdate(safeData);
          }
        }
        throw error;
      }
    };

    await performUpdate(updateData);
  },

  async batchUpdateTrades(trades: Trade[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const performBatch = async (dataList: { id: string, data: Partial<DBTrade> }[]): Promise<void> => {
      const promises = dataList.map(item => 
        supabase.from('trades').update(item.data).eq('id', item.id)
      );

      const results = await Promise.all(promises);
      const failedResult = results.find(r => r.error);
      
      if (failedResult && failedResult.error) {
        const error = failedResult.error;
        if (error.code === '42703' || error.code === 'PGRST204' || ((error as any).status === 400 && error.message.includes('column'))) {
          const fieldMatch = error.message.match(/column "(.+)"/i) || error.message.match(/column (.+) of/i);
          if (fieldMatch && fieldMatch[1]) {
            const missingField = fieldMatch[1].replace(/"/g, '') as keyof DBTrade;
            console.warn(`Batch: Column ${missingField} missing. Stripping and retrying.`);
            
            const nextDataList = dataList.map(item => {
              const { [missingField]: _, ...safeData } = item.data;
              return { id: item.id, data: safeData };
            });
            return performBatch(nextDataList);
          }
        }
        throw error;
      }
    };

    const initialDataList = trades.map(t => ({
      id: t.id,
      data: mapTradeToDB(t, user.id)
    }));

    await performBatch(initialDataList);
  },

  async deleteTrades(tradeIds: string[]) {
    const { error } = await supabase
      .from('trades')
      .delete()
      .in('id', tradeIds);

    if (error) throw error;
  },

  // --- Notes ---
  async getNotes(userId: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((note: any) => ({
      ...note,
      isPinned: note.is_pinned
    }));
  },

  async addNote(note: Note) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: note.title,
        content: note.content,
        date: note.date,
        tags: note.tags,
        color: note.color,
        is_pinned: note.isPinned
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, isPinned: data.is_pinned };
  },

  async updateNote(note: Note) {
    const { error } = await supabase
      .from('notes')
      .update({
        title: note.title,
        content: note.content,
        tags: note.tags,
        color: note.color,
        is_pinned: note.isPinned
      })
      .eq('id', note.id);

    if (error) throw error;
  },

  async deleteNote(noteId: string) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },

  // --- Daily Bias ---
  async getDailyBias(userId: string) {
    const { data, error } = await supabase
      .from('daily_bias')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data.map((bias: any) => ({
      ...bias,
      actualOutcome: bias.actual_outcome
    }));
  },

  async updateBias(bias: DailyBias) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if exists
    const { data: existing } = await supabase
      .from('daily_bias')
      .select('id')
      .eq('date', bias.date)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('daily_bias')
        .update({
          bias: bias.bias,
          notes: bias.notes,
          actual_outcome: bias.actualOutcome
        })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('daily_bias')
        .insert({
          user_id: user.id,
          date: bias.date,
          bias: bias.bias,
          notes: bias.notes,
          actual_outcome: bias.actualOutcome
        });
      if (error) throw error;
    }
  },

  // --- Goals ---
  async getGoals(userId: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapGoalFromDB);
  },

  async addGoal(goal: Goal) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: goal.title,
        description: goal.description,
        type: goal.type,
        metric: goal.metric,
        target_value: goal.targetValue,
        start_value: goal.startValue,
        current_value: goal.manualProgress || 0,
        start_date: goal.startDate,
        end_date: goal.endDate,
        status: goal.status,
        milestones: goal.milestones,
        auto_track_rule: goal.autoTrackRule,
        manual_entries: goal.manualEntries
      })
      .select()
      .single();

    if (error) throw error;
    return mapGoalFromDB(data);
  },

  async updateGoal(goal: Goal) {
    const { error } = await supabase
      .from('goals')
      .update({
        title: goal.title,
        description: goal.description,
        type: goal.type,
        metric: goal.metric,
        target_value: goal.targetValue,
        start_value: goal.startValue,
        current_value: goal.manualProgress,
        start_date: goal.startDate,
        end_date: goal.endDate,
        status: goal.status,
        milestones: goal.milestones,
        auto_track_rule: goal.autoTrackRule,
        manual_entries: goal.manualEntries
      })
      .eq('id', goal.id);

    if (error) throw error;
  },

  async deleteGoal(goalId: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
  },

  // --- Profile ---
  async updateProfile(profile: Partial<UserProfile>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dbProfile: Record<string, any> = {};
    if (profile.name !== undefined) dbProfile.name = profile.name;
    if (profile.country !== undefined) dbProfile.country = profile.country;
    if (profile.accountName !== undefined) dbProfile.account_name = profile.accountName;
    if (profile.initialBalance !== undefined) dbProfile.initial_balance = Number(profile.initialBalance);
    if (profile.currency !== undefined) dbProfile.currency = profile.currency;
    if (profile.currencySymbol !== undefined) dbProfile.currency_symbol = profile.currencySymbol;
    if (profile.syncMethod !== undefined) dbProfile.sync_method = profile.syncMethod;
    if (profile.experienceLevel !== undefined) dbProfile.experience_level = profile.experienceLevel;
    if (profile.tradingStyle !== undefined) dbProfile.trading_style = profile.tradingStyle;
    if (profile.onboarded !== undefined) dbProfile.onboarded = profile.onboarded;
    if (profile.plan !== undefined) dbProfile.plan = profile.plan;
    if (profile.syncKey !== undefined) dbProfile.sync_key = profile.syncKey;
    if (profile.eaConnected !== undefined) dbProfile.ea_connected = profile.eaConnected;
    if (profile.autoJournal !== undefined) dbProfile.auto_journal = profile.autoJournal;
    if (profile.avatarUrl !== undefined) dbProfile.avatar_url = profile.avatarUrl;
    if (profile.themePreference !== undefined) dbProfile.theme_preference = profile.themePreference;
    if (profile.chartConfig !== undefined) dbProfile.chart_config = profile.chartConfig;
    if (profile.keepChartsAlive !== undefined) dbProfile.keep_charts_alive = profile.keepChartsAlive;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...dbProfile,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating profile:', error);
      // Fallback for missing columns (common in beta migrations)
      if ((error as any).code === '42703') {
        const fieldMatch = error.message.match(/column "(.+)" of relation "profiles" does not exist/);
        if (fieldMatch && fieldMatch[1]) {
          const missingField = fieldMatch[1];
          console.warn(`Column ${missingField} missing in profiles table. Retrying without it.`);
          const { [missingField]: _, ...safeProfile } = dbProfile;
          const { error: retryError } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...safeProfile });
          if (retryError) throw retryError;
          return;
        }
      }
      throw error;
    }
  },

  // --- EA Session ---
  async getEASession(syncKey: string) {
    const { data, error } = await supabase
      .from('ea_sessions')
      .select('*')
      .eq('sync_key', syncKey)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // --- Strategy Diagrams ---
  async getDiagrams(userId: string) {
    const { data, error } = await supabase
      .from('strategy_diagrams')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      category: d.category,
      description: d.description,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  },

  async saveDiagram(diagram: Partial<StrategyDiagram>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dbDiagram = {
      user_id: user.id,
      name: diagram.name,
      code: diagram.code,
      category: diagram.category,
      description: diagram.description,
      updated_at: new Date().toISOString()
    };

    if (diagram.id) {
      const { data, error } = await supabase
        .from('strategy_diagrams')
        .update(dbDiagram)
        .eq('id', diagram.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('strategy_diagrams')
        .insert(dbDiagram)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteDiagram(id: string) {
    const { error } = await supabase
      .from('strategy_diagrams')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- Backtest Sessions ---
  async saveBacktestSession(session: Omit<BacktestSession, 'id' | 'user_id' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('backtest_sessions')
      .upsert({
        user_id: user.id,
        symbol: session.symbol,
        timeframe: session.timeframe,
        data: session.data,
        drawings: session.drawings,
        trades: session.trades,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as BacktestSession;
  },

  async getBacktestSessions(): Promise<BacktestSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('backtest_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as BacktestSession[];
  },

  async deleteBacktestSession(id: string) {
    const { error } = await supabase
      .from('backtest_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

