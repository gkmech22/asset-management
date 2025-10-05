-- Add asset_condition column to assets table
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS asset_condition text;

-- Update the log_asset_edit_history function to handle asset_condition
-- (The existing function will automatically handle the new column)