-- Migration: Add cash_transactions table for JournalFX
-- Date: 2026-04-19
-- Description: Creates the cash_transactions table to track deposits, withdrawals, fees, interest, etc.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create cash_transactions table
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Deposit', 'Withdrawal', 'Interest', 'Fee', 'Tax', 'Promotion', 'Transfer')),
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.cash_transactions IS 'Stores cash flow transactions including deposits, withdrawals, fees, interest, etc.';
COMMENT ON COLUMN public.cash_transactions.type IS 'Type of transaction: Deposit, Withdrawal, Interest, Fee, Tax, Promotion, Transfer';
COMMENT ON COLUMN public.cash_transactions.amount IS 'Transaction amount (positive for deposits, negative for withdrawals/fees)';

-- Enable Row Level Security
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own transactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'cash_transactions' AND policyname = 'Users can manage their own cash transactions'
    ) THEN
        CREATE POLICY "Users can manage their own cash transactions" ON public.cash_transactions
        FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cash_transactions_user_id ON public.cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON public.cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON public.cash_transactions(type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_user_date ON public.cash_transactions(user_id, date DESC);
