
-- Add open_time and close_time columns to the trades table to support duration tracking
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS open_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS close_time TIMESTAMP WITH TIME ZONE;

-- Comment for clarity
COMMENT ON COLUMN public.trades.open_time IS 'The exact opening time of the position';
COMMENT ON COLUMN public.trades.close_time IS 'The exact closing time of the position (completion deal)';
