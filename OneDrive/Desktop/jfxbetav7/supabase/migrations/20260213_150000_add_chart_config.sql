-- SQL Migration to add chart_config column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS chart_config JSONB DEFAULT NULL;
