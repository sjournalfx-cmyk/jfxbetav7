-- Security Hardening: Enable RLS on core tables and set strict ownership policies
-- Generated on 2026-04-03

-- 1. Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Trades Table
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own trades" ON public.trades
    FOR ALL USING (auth.uid() = user_id);

-- 3. Notes Table
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes" ON public.notes
    FOR ALL USING (auth.uid() = user_id);

-- 4. Goals Table
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals" ON public.goals
    FOR ALL USING (auth.uid() = user_id);

-- 5. Daily Bias Table
ALTER TABLE public.daily_bias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own daily bias" ON public.daily_bias
    FOR ALL USING (auth.uid() = user_id);

-- 6. Strategy Diagrams Table (Safety check if not already handled)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'strategy_diagrams') THEN
        -- Table doesn't exist yet, skip
    ELSE
        ALTER TABLE public.strategy_diagrams ENABLE ROW LEVEL SECURITY;
        -- Policy might already exist from 20260205 migration, but we ensure it here
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategy_diagrams' AND policyname = 'Users can manage their own diagrams') THEN
            CREATE POLICY "Users can manage their own diagrams" ON public.strategy_diagrams
                FOR ALL USING (auth.uid() = user_id);
        END IF;
    END IF;
END
$$;
