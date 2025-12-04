-- Add source, confidence, and favicon columns to competitors table
-- source: indicates where the competitor was discovered (llm_knowledge, web_search, manual, analysis)
-- confidence: indicates how confident we are in the competitor (high, medium, low)
-- favicon: URL to the competitor's favicon/logo

ALTER TABLE competitors 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

ALTER TABLE competitors 
ADD COLUMN IF NOT EXISTS confidence VARCHAR(20) DEFAULT 'medium';

ALTER TABLE competitors 
ADD COLUMN IF NOT EXISTS favicon TEXT;

-- Add index for filtering by source
CREATE INDEX IF NOT EXISTS idx_competitors_source ON competitors(source);

COMMENT ON COLUMN competitors.source IS 'Discovery source: llm_knowledge, web_search, manual, analysis';
COMMENT ON COLUMN competitors.confidence IS 'Confidence level: high, medium, low';
COMMENT ON COLUMN competitors.favicon IS 'URL to competitor favicon or logo';
