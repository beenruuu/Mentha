-- Add AI visibility columns to keywords table
ALTER TABLE keywords 
ADD COLUMN IF NOT EXISTS ai_position INTEGER,
ADD COLUMN IF NOT EXISTS ai_models JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_improvement TEXT,
ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- Create index for last_checked_at
CREATE INDEX IF NOT EXISTS idx_keywords_last_checked ON keywords(last_checked_at);
