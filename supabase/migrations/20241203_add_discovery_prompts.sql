-- Add discovery_prompts column to brands table
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS discovery_prompts JSONB DEFAULT '[]'::jsonb;
