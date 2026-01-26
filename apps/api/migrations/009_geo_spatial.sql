-- Mentha Backend - Geo-Spatial Architecture Migration
-- Adds location context to Projects for "Depende del Pais" functionality

-- =============================================================================
-- PROJECTS: Add Geo-Spatial Context
-- =============================================================================

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'ES' CHECK (char_length(country_code) = 2), -- ISO 3166-1 alpha-2
ADD COLUMN IF NOT EXISTS location_city TEXT, -- "Madrid", "Sevilla", "Global"
ADD COLUMN IF NOT EXISTS uule_secret TEXT; -- Simplified UULE/Geo param

-- Default existing projects to Spain/Global as fallback
UPDATE public.projects 
SET country_code = 'ES', location_city = 'Global' 
WHERE country_code IS NULL;

-- =============================================================================
-- COMPETITORS: Add Disambiguation Context (Preparation for Phase 2)
-- =============================================================================

-- We need to store structured competitor data, not just an array of strings in 'projects'.
-- Ideally we would have a separate 'competitors' table, but for now we might handle this 
-- via the JSONB column in projects or a new table. 
-- The user report explicitly mentioned "Competitor Table". Let's create it properly now
-- to support the "Action" disambiguation requirement.

CREATE TABLE IF NOT EXISTS public.competitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    disambiguation_context TEXT, -- "Dutch discount retailer, non-food"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitors_project_id ON public.competitors(project_id);

-- Migrate existing competitors from projects.competitors JSONB to new table
-- logic: extraction query would be complex here, usually done via application code backfill. 
-- For now we set up the structure.

COMMENT ON COLUMN public.projects.country_code IS 'ISO 3166-1 alpha-2 country code (e.g., ES, FR)';
COMMENT ON COLUMN public.competitors.disambiguation_context IS 'Context to help AI distinguish brand from common nouns (e.g. "Action" verb vs brand)';
