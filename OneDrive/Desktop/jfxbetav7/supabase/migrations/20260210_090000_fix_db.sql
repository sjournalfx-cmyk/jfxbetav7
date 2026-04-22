
-- Run this in your Supabase SQL Editor to fix the "record new has no field updated_at" error

-- 1. Add the missing updated_at column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Add the missing sync_key and ea_connected columns if they don't exist yet
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sync_key TEXT,
ADD COLUMN IF NOT EXISTS ea_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'default';

-- 3. (Optional) Verify the trigger exists (this is likely what was causing the error)
-- If you want to disable the auto-update of updated_at, you can drop the trigger:
-- DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
