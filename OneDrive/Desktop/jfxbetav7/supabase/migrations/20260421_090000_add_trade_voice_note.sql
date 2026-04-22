ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS voice_note TEXT;
