-- Consolidated Schema Sync for JournalFX v1.0.0-beta.1
-- Run this in your Supabase SQL Editor to ensure all tables and columns are perfectly aligned.

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure Profiles Table has all required columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS keep_charts_alive BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS feedback_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS chart_config JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_journal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Ensure Strategy Diagrams Table exists
CREATE TABLE IF NOT EXISTS public.strategy_diagrams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on Strategy Diagrams if not already enabled
ALTER TABLE public.strategy_diagrams ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy for Strategy Diagrams (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'strategy_diagrams' AND policyname = 'Users can manage their own diagrams'
    ) THEN
        CREATE POLICY "Users can manage their own diagrams" ON public.strategy_diagrams
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 5. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'audit_logs' AND policyname = 'Users can view their own logs'
    ) THEN
        CREATE POLICY "Users can view their own logs" ON public.audit_logs
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 6. Add Duration and Screenshot columns to Trades if missing
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS open_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS close_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS before_screenshot TEXT,
ADD COLUMN IF NOT EXISTS after_screenshot TEXT,
ADD COLUMN IF NOT EXISTS exit_comment TEXT,
ADD COLUMN IF NOT EXISTS setup_id TEXT,
ADD COLUMN IF NOT EXISTS setup_name TEXT;

-- 6. Ensure Goals Table has all columns
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS auto_track_rule JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS manual_entries JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS current_value NUMERIC DEFAULT 0;

-- 7. Add Is Pinned to Notes
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
