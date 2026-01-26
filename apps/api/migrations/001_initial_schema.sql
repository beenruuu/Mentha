-- Mentha Backend - Initial Schema Migration
-- Creates the core tables for AEO/GEO intelligence tracking

-- =============================================================================
-- PROFILES (synced from auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    daily_quota INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PROJECTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) >= 3),
    domain TEXT NOT NULL,
    description TEXT,
    competitors JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);

-- =============================================================================
-- KEYWORDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    query TEXT NOT NULL CHECK (char_length(query) >= 2),
    intent TEXT DEFAULT 'informational' CHECK (intent IN ('informational', 'transactional', 'navigational', 'commercial')),
    scan_frequency TEXT DEFAULT 'weekly' CHECK (scan_frequency IN ('daily', 'weekly', 'manual')),
    engines JSONB DEFAULT '["perplexity"]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_keywords_project_id ON public.keywords(project_id);
CREATE INDEX idx_keywords_active_frequency ON public.keywords(is_active, scan_frequency) WHERE is_active = true;

-- =============================================================================
-- SCAN JOBS (audit log of scan attempts)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.scan_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
    engine TEXT NOT NULL CHECK (engine IN ('perplexity', 'openai', 'gemini')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    error_message TEXT,
    latency_ms INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scan_jobs_keyword_id ON public.scan_jobs(keyword_id);
CREATE INDEX idx_scan_jobs_status ON public.scan_jobs(status) WHERE status IN ('pending', 'processing');

-- =============================================================================
-- SCAN RESULTS (LLM responses + analysis)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.scan_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.scan_jobs(id) ON DELETE CASCADE,
    raw_response TEXT,
    analysis_json JSONB,
    sentiment_score FLOAT CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    brand_visibility BOOLEAN,
    share_of_voice_rank INTEGER,
    recommendation_type TEXT CHECK (recommendation_type IN ('direct_recommendation', 'neutral_comparison', 'negative_mention', 'absent')),
    token_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scan_results_job_id ON public.scan_results(job_id);
CREATE INDEX idx_scan_results_analysis ON public.scan_results USING GIN (analysis_json);

-- =============================================================================
-- CITATIONS (normalized sources)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.citations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    result_id UUID NOT NULL REFERENCES public.scan_results(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    domain TEXT,
    title TEXT,
    position INTEGER,
    is_brand_domain BOOLEAN DEFAULT false,
    is_competitor_domain BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_citations_result_id ON public.citations(result_id);
CREATE INDEX idx_citations_domain ON public.citations(domain);

-- =============================================================================
-- HELPER FUNCTION: Extract domain from URL
-- =============================================================================
CREATE OR REPLACE FUNCTION extract_domain(url TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN regexp_replace(
        regexp_replace(url, '^https?://(www\.)?', ''),
        '/.*$', ''
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- TRIGGER: Auto-extract domain on citation insert
-- =============================================================================
CREATE OR REPLACE FUNCTION set_citation_domain()
RETURNS TRIGGER AS $$
BEGIN
    NEW.domain := extract_domain(NEW.url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_citation_domain
    BEFORE INSERT ON public.citations
    FOR EACH ROW
    EXECUTE FUNCTION set_citation_domain();

-- =============================================================================
-- TRIGGER: Update timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_keywords_updated_at
    BEFORE UPDATE ON public.keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
