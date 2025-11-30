-- Add ai_providers column to brands table
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS ai_providers JSONB DEFAULT '[]'::jsonb;

-- Add services column as well since it was also excluded
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;
