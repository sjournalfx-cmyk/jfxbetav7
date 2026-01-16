
-- Fix for "record new has no field updated_at" error on the goals table
-- This happens because a trigger is trying to update a column that doesn't exist.

-- 1. Add the missing updated_at and other columns to the goals table
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS auto_track_rule JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS manual_entries JSONB DEFAULT '[]'::jsonb;

-- 2. (Optional) It's good practice to ensure other tables have it too if you plan to use triggers
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.daily_bias 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Ensure the handle_updated_at function exists (standard Supabase pattern)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Apply the trigger to the goals table if it's not already there
-- We use a DO block to safely create the trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_goals') THEN
        CREATE TRIGGER handle_updated_at_goals
            BEFORE UPDATE ON public.goals
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;
