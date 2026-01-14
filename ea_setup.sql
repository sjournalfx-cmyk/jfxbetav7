-- 1. Create the ea_sessions table to store real-time data from the EA
CREATE TABLE IF NOT EXISTS public.ea_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_key TEXT UNIQUE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security
ALTER TABLE public.ea_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for ea_sessions
-- Allow users to read their own session data by matching sync_key
CREATE POLICY "Users can view their own EA session" ON public.ea_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.sync_key = ea_sessions.sync_key
            AND profiles.id = auth.uid()
        )
    );

-- 4. Create a function to handle EA session updates and update profile status
CREATE OR REPLACE FUNCTION public.handle_ea_session_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the profiles table to mark EA as connected
    UPDATE public.profiles
    SET ea_connected = TRUE,
        updated_at = timezone('utc'::text, now())
    WHERE sync_key = NEW.sync_key;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the trigger
DROP TRIGGER IF EXISTS on_ea_session_update ON public.ea_sessions;
CREATE TRIGGER on_ea_session_update
    AFTER INSERT OR UPDATE ON public.ea_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_ea_session_update();

-- 6. Ensure profiles table has the necessary columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sync_key TEXT,
ADD COLUMN IF NOT EXISTS ea_connected BOOLEAN DEFAULT FALSE;