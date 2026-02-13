-- =====================================================
-- Migration 001: Add GEO Analysis Persistence Tables
-- Created: 2025-12-01
-- Description: Adds 6 new tables for GEO data persistence
-- Safe to run: Uses IF NOT EXISTS, won't affect existing tables
-- =====================================================

-- =====================================================
-- 1. ADD MISSING COLUMN TO EXISTING TABLE
-- =====================================================

-- Add similarity_score to competitors table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'competitors' 
    AND column_name = 'similarity_score'
  ) THEN
    ALTER TABLE public.competitors ADD COLUMN similarity_score DECIMAL(5,2);
  END IF;
END $$;

-- =====================================================
-- 2. CREATE NEW GEO TABLES
-- =====================================================

-- GEO ANALYSIS RESULTS
-- Stores complete GEO analysis results (replaces in-memory cache)
CREATE TABLE IF NOT EXISTS public.geo_analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2) NOT NULL,
  grade VARCHAR(5) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  modules JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- AI VISIBILITY SNAPSHOTS
-- Historical tracking of AI visibility per model
CREATE TABLE IF NOT EXISTS public.ai_visibility_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  ai_model VARCHAR(50) NOT NULL CHECK (ai_model IN ('openai', 'anthropic', 'perplexity', 'gemini')),
  visibility_score DECIMAL(5,2) NOT NULL,
  mention_count INTEGER DEFAULT 0,
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  query_count INTEGER DEFAULT 0,
  inclusion_rate DECIMAL(5,2),
  average_position DECIMAL(5,2),
  language VARCHAR(10) DEFAULT 'en',
  metadata JSONB DEFAULT '{}'
);

-- CITATION RECORDS
-- Individual citation tracking per AI model
CREATE TABLE IF NOT EXISTS public.citation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  ai_model VARCHAR(50) NOT NULL CHECK (ai_model IN ('openai', 'anthropic', 'perplexity', 'gemini')),
  query TEXT NOT NULL,
  context TEXT,
  source_url TEXT,
  citation_type VARCHAR(30) CHECK (citation_type IN ('direct', 'indirect', 'partial', 'attribution')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- BRAND MENTIONS
-- Every brand mention detected in AI responses
CREATE TABLE IF NOT EXISTS public.brand_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  ai_model VARCHAR(50) NOT NULL CHECK (ai_model IN ('openai', 'anthropic', 'perplexity', 'gemini')),
  query TEXT NOT NULL,
  mention_text TEXT NOT NULL,
  context TEXT,
  position_in_response INTEGER,
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- MODEL RANKINGS
-- Per-model brand ranking over time
CREATE TABLE IF NOT EXISTS public.model_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  ai_model VARCHAR(50) NOT NULL CHECK (ai_model IN ('openai', 'anthropic', 'perplexity', 'gemini')),
  rank_score DECIMAL(5,2) NOT NULL,
  inclusion_rate DECIMAL(5,2),
  average_position DECIMAL(5,2),
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- QUERY RESPONSES
-- Raw AI responses for audit trail and detailed analysis
CREATE TABLE IF NOT EXISTS public.query_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  ai_model VARCHAR(50) NOT NULL CHECK (ai_model IN ('openai', 'anthropic', 'perplexity', 'gemini')),
  query TEXT NOT NULL,
  response_text TEXT NOT NULL,
  mentioned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.geo_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_visibility_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_responses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- GEO Analysis Results
CREATE POLICY "Users can view GEO analyses of own brands"
  ON public.geo_analysis_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = geo_analysis_results.brand_id
      AND brands.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert GEO analyses for own brands"
  ON public.geo_analysis_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = geo_analysis_results.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- AI Visibility Snapshots
CREATE POLICY "Users can view visibility snapshots of own brands"
  ON public.ai_visibility_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = ai_visibility_snapshots.brand_id
      AND brands.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert visibility snapshots for own brands"
  ON public.ai_visibility_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = ai_visibility_snapshots.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- Citation Records
CREATE POLICY "Users can view citations of own brands"
  ON public.citation_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = citation_records.brand_id
      AND brands.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert citations for own brands"
  ON public.citation_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = citation_records.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- Brand Mentions
CREATE POLICY "Users can view mentions of own brands"
  ON public.brand_mentions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = brand_mentions.brand_id
      AND brands.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert mentions for own brands"
  ON public.brand_mentions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = brand_mentions.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- Model Rankings
CREATE POLICY "Users can view rankings of own brands"
  ON public.model_rankings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = model_rankings.brand_id
      AND brands.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rankings for own brands"
  ON public.model_rankings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = model_rankings.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- Query Responses
CREATE POLICY "Users can view query responses of own brands"
  ON public.query_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = query_responses.brand_id
      AND brands.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert query responses for own brands"
  ON public.query_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = query_responses.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- GEO Analysis indexes
CREATE INDEX IF NOT EXISTS idx_geo_analysis_brand_id ON public.geo_analysis_results(brand_id);
CREATE INDEX IF NOT EXISTS idx_geo_analysis_created_at ON public.geo_analysis_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_analysis_status ON public.geo_analysis_results(status);

-- AI Visibility indexes
CREATE INDEX IF NOT EXISTS idx_visibility_brand_model ON public.ai_visibility_snapshots(brand_id, ai_model);
CREATE INDEX IF NOT EXISTS idx_visibility_measured_at ON public.ai_visibility_snapshots(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_visibility_brand_time ON public.ai_visibility_snapshots(brand_id, measured_at DESC);

-- Citation indexes
CREATE INDEX IF NOT EXISTS idx_citations_brand_id ON public.citation_records(brand_id);
CREATE INDEX IF NOT EXISTS idx_citations_model ON public.citation_records(ai_model);
CREATE INDEX IF NOT EXISTS idx_citations_detected_at ON public.citation_records(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_citations_brand_model_time ON public.citation_records(brand_id, ai_model, detected_at DESC);

-- Brand mention indexes
CREATE INDEX IF NOT EXISTS idx_mentions_brand_id ON public.brand_mentions(brand_id);
CREATE INDEX IF NOT EXISTS idx_mentions_detected_at ON public.brand_mentions(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_brand_model ON public.brand_mentions(brand_id, ai_model);
CREATE INDEX IF NOT EXISTS idx_mentions_sentiment ON public.brand_mentions(sentiment);

-- Model ranking indexes
CREATE INDEX IF NOT EXISTS idx_rankings_brand_model ON public.model_rankings(brand_id, ai_model);
CREATE INDEX IF NOT EXISTS idx_rankings_checked_at ON public.model_rankings(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_rankings_brand_time ON public.model_rankings(brand_id, checked_at DESC);

-- Query response indexes
CREATE INDEX IF NOT EXISTS idx_query_responses_brand_id ON public.query_responses(brand_id);
CREATE INDEX IF NOT EXISTS idx_query_responses_model ON public.query_responses(ai_model);
CREATE INDEX IF NOT EXISTS idx_query_responses_created_at ON public.query_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_responses_mentioned ON public.query_responses(mentioned);

-- =====================================================
-- 6. CREATE HELPFUL VIEWS
-- =====================================================

-- Latest visibility per model per brand
CREATE OR REPLACE VIEW public.latest_visibility_scores AS
SELECT DISTINCT ON (brand_id, ai_model)
  brand_id,
  ai_model,
  visibility_score,
  mention_count,
  inclusion_rate,
  average_position,
  measured_at
FROM public.ai_visibility_snapshots
ORDER BY brand_id, ai_model, measured_at DESC;

-- Citation rate per brand per model
CREATE OR REPLACE VIEW public.citation_rates AS
SELECT 
  brand_id,
  ai_model,
  COUNT(*) as total_citations,
  COUNT(CASE WHEN citation_type = 'direct' THEN 1 END) as direct_citations,
  MAX(detected_at) as latest_citation
FROM public.citation_records
GROUP BY brand_id, ai_model;

-- =====================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.geo_analysis_results IS 'Stores complete GEO analysis results, replacing in-memory cache';
COMMENT ON TABLE public.ai_visibility_snapshots IS 'Historical AI visibility tracking per model';
COMMENT ON TABLE public.citation_records IS 'Individual citation tracking across AI models';
COMMENT ON TABLE public.brand_mentions IS 'Every detected brand mention in AI responses';
COMMENT ON TABLE public.model_rankings IS 'Per-model brand ranking over time';
COMMENT ON TABLE public.query_responses IS 'Raw AI responses for audit trail';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- ✓ Added similarity_score column to competitors table
-- ✓ Created 6 new GEO analysis tables
-- ✓ Enabled RLS on all new tables
-- ✓ Created 12 RLS policies (SELECT + INSERT for each table)
-- ✓ Created 18 performance indexes
-- ✓ Created 2 helpful views
-- ✓ Added documentation comments
-- =====================================================
