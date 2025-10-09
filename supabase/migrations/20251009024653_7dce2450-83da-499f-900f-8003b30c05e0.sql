-- Add far_code column to assets table (not mandatory)
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS far_code text;

-- Add asset_value_recovery column if it doesn't exist
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS asset_value_recovery numeric;