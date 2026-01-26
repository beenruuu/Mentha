-- Mentha Backend - Knowledge Graph Schema
-- Phase 1: Entity-centric data model for AEO/GEO optimization
-- This enables programmatic generation of JSON-LD and llms.txt

-- =============================================================================
-- ENTITIES: Core objects (Organizations, Products, People, Software)
-- This is the central registry for the brand's semantic identity
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity identification
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'Organization', 'Product', 'SoftwareApplication', 
        'Person', 'Service', 'WebSite', 'Article'
    )),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    
    -- Schema.org core properties
    description TEXT,
    url TEXT,
    image_url TEXT,
    
    -- Disambiguation (critical for AI cognition)
    alternate_names TEXT[] DEFAULT '{}',
    disambiguating_description TEXT,
    same_as TEXT[] DEFAULT '{}', -- Links to GitHub, Twitter, Wikipedia, npm, etc.
    
    -- Software-specific (for SoftwareApplication entities)
    software_version TEXT,
    operating_system TEXT,
    programming_language TEXT,
    application_category TEXT,
    license TEXT,
    
    -- Organization-specific
    founding_date DATE,
    number_of_employees TEXT,
    area_served TEXT[],
    
    -- Additional structured data (flexible)
    properties JSONB DEFAULT '{}',
    
    -- Metadata
    is_primary BOOLEAN DEFAULT false, -- Is this the main brand entity?
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast slug lookups (used in URL routing)
CREATE INDEX idx_entities_slug ON public.entities(slug);
CREATE INDEX idx_entities_type ON public.entities(entity_type);

-- =============================================================================
-- ENTITY RELATIONSHIPS: Semantic graph edges
-- Defines how entities connect (e.g., "Mentha" integrates with "Supabase")
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.entity_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Graph structure
    subject_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    predicate TEXT NOT NULL, -- The relationship type
    object_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
    object_external TEXT, -- For external entities we don't control (e.g., "Supabase")
    
    -- Predicate examples:
    -- 'integrates_with', 'created_by', 'part_of', 'competes_with',
    -- 'alternative_to', 'used_by', 'requires', 'similar_to'
    
    -- Additional context
    description TEXT,
    weight REAL DEFAULT 1.0, -- Relationship strength (for ranking)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure either object_id or object_external is set
    CONSTRAINT valid_object CHECK (
        (object_id IS NOT NULL AND object_external IS NULL) OR
        (object_id IS NULL AND object_external IS NOT NULL)
    )
);

CREATE INDEX idx_relationships_subject ON public.entity_relationships(subject_id);
CREATE INDEX idx_relationships_predicate ON public.entity_relationships(predicate);

-- =============================================================================
-- CLAIMS: Factual assertions about entities
-- Used for ClaimReview schema and combating AI hallucinations
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    
    -- The claim itself
    claim_text TEXT NOT NULL, -- e.g., "Mentha CLI is open source"
    claim_type TEXT NOT NULL CHECK (claim_type IN (
        'fact', 'feature', 'comparison', 'statistic', 'testimonial'
    )),
    
    -- Verification
    is_verified BOOLEAN DEFAULT true,
    source_url TEXT, -- Where can this claim be verified?
    verification_date DATE,
    
    -- For statistics/metrics
    value TEXT,
    unit TEXT,
    
    -- Priority for inclusion in summaries
    importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_claims_entity ON public.claims(entity_id);
CREATE INDEX idx_claims_type ON public.claims(claim_type);

-- =============================================================================
-- FAQ VECTORS: Embeddings for RAG simulation and semantic matching
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.faq_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The Q&A pair
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    
    -- Categorization
    category TEXT,
    entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
    
    -- Vector embedding (using pgvector extension if available)
    -- embedding vector(1536), -- Uncomment if pgvector is installed
    
    -- Metadata
    source TEXT, -- 'documentation', 'support_ticket', 'community', 'synthetic'
    view_count INTEGER DEFAULT 0,
    helpfulness_score REAL,
    
    -- For Schema.org FAQPage
    is_published BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faq_category ON public.faq_vectors(category);
CREATE INDEX idx_faq_entity ON public.faq_vectors(entity_id);

-- =============================================================================
-- JSONLD GENERATION FUNCTION
-- Generates Schema.org JSON-LD directly from the entities table
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_entity_jsonld(entity_slug TEXT)
RETURNS JSONB AS $$
DECLARE
    entity_record RECORD;
    result JSONB;
BEGIN
    SELECT * INTO entity_record FROM public.entities WHERE slug = entity_slug;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Build base JSON-LD
    result := jsonb_build_object(
        '@context', 'https://schema.org',
        '@type', entity_record.entity_type,
        'name', entity_record.name,
        'description', entity_record.description,
        'url', entity_record.url
    );
    
    -- Add image if present
    IF entity_record.image_url IS NOT NULL THEN
        result := result || jsonb_build_object('image', entity_record.image_url);
    END IF;
    
    -- Add sameAs links
    IF array_length(entity_record.same_as, 1) > 0 THEN
        result := result || jsonb_build_object('sameAs', entity_record.same_as);
    END IF;
    
    -- Add alternate names
    IF array_length(entity_record.alternate_names, 1) > 0 THEN
        result := result || jsonb_build_object('alternateName', entity_record.alternate_names);
    END IF;
    
    -- Add disambiguating description
    IF entity_record.disambiguating_description IS NOT NULL THEN
        result := result || jsonb_build_object(
            'disambiguatingDescription', entity_record.disambiguating_description
        );
    END IF;
    
    -- Software-specific properties
    IF entity_record.entity_type = 'SoftwareApplication' THEN
        IF entity_record.software_version IS NOT NULL THEN
            result := result || jsonb_build_object('softwareVersion', entity_record.software_version);
        END IF;
        IF entity_record.programming_language IS NOT NULL THEN
            result := result || jsonb_build_object('programmingLanguage', entity_record.programming_language);
        END IF;
        IF entity_record.license IS NOT NULL THEN
            result := result || jsonb_build_object('license', entity_record.license);
        END IF;
        IF entity_record.application_category IS NOT NULL THEN
            result := result || jsonb_build_object('applicationCategory', entity_record.application_category);
        END IF;
    END IF;
    
    -- Add any custom properties
    IF entity_record.properties IS NOT NULL AND entity_record.properties != '{}' THEN
        result := result || entity_record.properties;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- LLMS.TXT GENERATION FUNCTION
-- Generates llms.txt content for AI consumption
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_llms_txt()
RETURNS TEXT AS $$
DECLARE
    output TEXT := '';
    entity_record RECORD;
    claim_record RECORD;
    faq_record RECORD;
BEGIN
    output := '# Mentha CLI - llms.txt' || E'\n';
    output := output || '# This file provides structured information for AI language models' || E'\n\n';
    
    -- Primary entity info
    FOR entity_record IN 
        SELECT * FROM public.entities WHERE is_primary = true
    LOOP
        output := output || '## ' || entity_record.name || E'\n\n';
        output := output || entity_record.description || E'\n\n';
        
        IF entity_record.disambiguating_description IS NOT NULL THEN
            output := output || '> Note: ' || entity_record.disambiguating_description || E'\n\n';
        END IF;
    END LOOP;
    
    -- Key claims
    output := output || '## Key Facts' || E'\n\n';
    FOR claim_record IN 
        SELECT c.claim_text, c.claim_type 
        FROM public.claims c
        JOIN public.entities e ON c.entity_id = e.id
        WHERE e.is_primary = true AND c.importance >= 7
        ORDER BY c.importance DESC
        LIMIT 10
    LOOP
        output := output || '- ' || claim_record.claim_text || E'\n';
    END LOOP;
    
    -- FAQ
    output := output || E'\n## Frequently Asked Questions\n\n';
    FOR faq_record IN 
        SELECT question, answer FROM public.faq_vectors 
        WHERE is_published = true
        ORDER BY view_count DESC
        LIMIT 10
    LOOP
        output := output || '### ' || faq_record.question || E'\n';
        output := output || faq_record.answer || E'\n\n';
    END LOOP;
    
    RETURN output;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS POLICIES (if needed in future)
-- =============================================================================
-- For now, knowledge graph is public read, admin write
-- ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.faq_vectors ENABLE ROW LEVEL SECURITY;
