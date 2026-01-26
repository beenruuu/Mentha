-- Mentha Backend - Semantic Probes Migration
-- Evolves keywords into "Semantic Probes" with specific intent categories
-- Supports Golden Query generation for AEO

-- =============================================================================
-- KEYWORDS: Add semantic intent categories
-- =============================================================================

-- Add new column for semantic intent
ALTER TABLE public.keywords 
ADD COLUMN IF NOT EXISTS intent_category TEXT;

-- Drop old CHECK constraint if exists (safe approach)
ALTER TABLE public.keywords DROP CONSTRAINT IF EXISTS keywords_intent_check;

-- Add new constraint matching the Semantic Probes matrix
ALTER TABLE public.keywords 
ADD CONSTRAINT keywords_intent_category_check 
CHECK (intent_category IN (
    'discovery',   -- Category Dominance
    'comparison',  -- Share of Model
    'authority',   -- Entity Understanding
    'transactional', -- Actionability
    'safety',      -- Adversarial/Red Team
    'custom'       -- User defined
));

-- Backfill existing data: Map old intents to new categories (Best Effort)
UPDATE public.keywords 
SET intent_category = CASE 
    WHEN intent = 'informational' THEN 'authority'
    WHEN intent = 'transactional' THEN 'transactional'
    WHEN intent = 'commercial' THEN 'comparison'
    WHEN intent = 'navigational' THEN 'discovery'
    ELSE 'custom'
END
WHERE intent_category IS NULL;

-- =============================================================================
-- SCAN RESULTS: Denormalize intent for fast dashboarding
-- =============================================================================

ALTER TABLE public.scan_results
ADD COLUMN IF NOT EXISTS intent_category TEXT;

-- Index for filtering dashboard by intent (e.g., "Show me Discovery performance")
CREATE INDEX IF NOT EXISTS idx_scan_results_intent ON public.scan_results(intent_category);

-- =============================================================================
-- ENTITY PROFILES: Add fields needed for Golden Query generation
-- =============================================================================

-- Enhancing Projects table to serve as Entity Profile
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS industry TEXT,             -- e.g., "Retail"
ADD COLUMN IF NOT EXISTS core_category TEXT,        -- e.g., "Juguetes baratos"
ADD COLUMN IF NOT EXISTS target_audience TEXT,      -- e.g., "Familias en España"
ADD COLUMN IF NOT EXISTS key_problem TEXT;          -- e.g., "ahorrar en regalos"

-- =============================================================================
-- RE-ENABLE RLS FOR NEW COLUMNS
-- =============================================================================
-- (Existing policies generally cover * rows, but good to verify ownership)

COMMENT ON COLUMN public.keywords.intent_category IS 'Semantic Probe Category: discovery, comparison, authority, transactional, safety';
