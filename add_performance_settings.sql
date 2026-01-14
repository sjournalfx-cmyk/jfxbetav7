-- SQL Migration to add performance settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS keep_charts_alive BOOLEAN DEFAULT TRUE;
