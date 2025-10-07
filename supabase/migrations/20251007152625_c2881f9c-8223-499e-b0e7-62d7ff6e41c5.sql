-- Fix monthly_incomes table constraints to properly isolate personal and family contexts

-- First, drop the existing unique constraint if it exists
ALTER TABLE public.monthly_incomes DROP CONSTRAINT IF EXISTS monthly_incomes_user_id_month_year_key;

-- Add a partial unique constraint for personal income records (where family_id is NULL)
-- This ensures a user can only have one personal income per month
CREATE UNIQUE INDEX IF NOT EXISTS monthly_incomes_personal_unique 
ON public.monthly_incomes (user_id, month_year) 
WHERE family_id IS NULL;

-- Add a unique constraint for family income records
-- This ensures a family can only have one income record per month
CREATE UNIQUE INDEX IF NOT EXISTS monthly_incomes_family_unique 
ON public.monthly_incomes (family_id, month_year) 
WHERE family_id IS NOT NULL;