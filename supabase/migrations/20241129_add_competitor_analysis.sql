-- Add analysis_data column to competitors table for storing detailed comparison results
ALTER TABLE competitors 
ADD COLUMN IF NOT EXISTS analysis_data JSONB DEFAULT '{}'::jsonb;

-- Add last_analyzed_at timestamp
ALTER TABLE competitors 
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMPTZ;

-- Create index for analysis queries
CREATE INDEX IF NOT EXISTS idx_competitors_last_analyzed ON competitors(last_analyzed_at);
