-- Create Backtest Sessions table
CREATE TABLE IF NOT EXISTS public.backtest_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    data JSONB NOT NULL,
    drawings JSONB DEFAULT '[]',
    trades JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.backtest_sessions ENABLE ROW LEVEL SECURITY;

-- Create Policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'backtest_sessions' AND policyname = 'Users can manage their own backtest sessions'
    ) THEN
        CREATE POLICY "Users can manage their own backtest sessions" ON public.backtest_sessions
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;
