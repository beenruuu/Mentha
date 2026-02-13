-- =====================================================
-- MIGRATION: Add Technical AEO Tables
-- Description: Tables for storing technical GEO/AEO audit data
-- Date: 2025-11-23
-- =====================================================

-- =====================================================
-- TECHNICAL AEO AUDIT TABLE
-- Stores AI crawler permissions, structured data, and technical signals
-- =====================================================
CREATE TABLE IF NOT EXISTS public.technical_aeo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  
  -- AI Crawler Permissions (JSONB format: {"GPTBot": "allowed", "CCBot": "blocked", ...})
  ai_crawler_permissions JSONB,
  
  -- Structured Data
  schema_types TEXT[], -- Array of schema types found (e.g., ['FAQPage', 'Article'])
  schema_completeness DECIMAL(5,2), -- 0-100 score for schema quality
  total_schemas INTEGER DEFAULT 0,
  has_faq BOOLEAN DEFAULT FALSE,
  has_howto BOOLEAN DEFAULT FALSE,
  has_article BOOLEAN DEFAULT FALSE,
  
  -- Technical Signals
  has_rss BOOLEAN DEFAULT FALSE,
  has_api BOOLEAN DEFAULT FALSE,
  mobile_responsive BOOLEAN DEFAULT FALSE,
  https_enabled BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER,
  
  --Overall Score
  aeo_readiness_score DECIMAL(5,2), -- 0-100 overall AEO readiness
  
  -- Recommendations (JSONB array)
  recommendations JSONB,
  
  -- Timestamps
  last_audit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.technical_aeo ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view technical AEO data of own brands"
  ON public.technical_aeo FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert technical AEO data for own brands"
  ON public.technical_aeo FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update technical AEO data of own brands"
  ON public.technical_aeo FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- CONTENT CITABILITY TABLE
-- Stores content analysis for AI citability
-- =====================================================
CREATE TABLE IF NOT EXISTS public.content_citability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  
  -- Content Structure
  faq_count INTEGER DEFAULT 0,
  qa_pairs_count INTEGER DEFAULT 0,
  structured_content_pct DECIMAL(5,2), -- Percentage of structured content
  
  -- Readability
  readability_score DECIMAL(5,2), -- Flesch-Kincaid or similar
  word_count INTEGER,
  
  -- Entities & Topics
  entity_count INTEGER DEFAULT 0,
  detected_patterns JSONB, -- FAQ patterns, lists, tables, etc.
  
  -- Overall Citability
  citability_score DECIMAL(5,2), -- 0-100 how citable this content is
  
  -- Timestamps
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.content_citability ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view citability data of own brands"
  ON public.content_citability FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert citability data for own brands"
  ON public.content_citability FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- WEB SEARCH RESULTS TABLE
-- Stores real web search data gathered for analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS public.web_search_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.aeo_analyses(id) ON DELETE CASCADE,
  
  -- Search context
  search_type TEXT NOT NULL CHECK (search_type IN ('keyword', 'competitor', 'mention', 'industry')),
  query TEXT NOT NULL,
  
  -- Results (JSONB array of search results)
  results JSONB,
  total_results INTEGER DEFAULT 0,
  
  -- Timestamps
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.web_search_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view search results of own brands"
  ON public.web_search_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert search results for own brands"
  ON public.web_search_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- QUERIES TABLE (for brand queries/prompts tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  
  -- Query details
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  
  -- Prompt volume estimation
  estimated_volume INTEGER,
  
  -- AI models where this appears
  ai_models TEXT[], -- e.g., ['chatgpt', 'claude']
  
  -- Tracking
  tracked BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own queries"
  ON public.queries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queries"
  ON public.queries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queries"
  ON public.queries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own queries"
  ON public.queries FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX idx_technical_aeo_user_id ON public.technical_aeo(user_id);
CREATE INDEX idx_technical_aeo_brand_id ON public.technical_aeo(brand_id);
CREATE INDEX idx_content_citability_user_id ON public.content_citability(user_id);
CREATE INDEX idx_content_citability_brand_id ON public.content_citability(brand_id);
CREATE INDEX idx_web_search_results_user_id ON public.web_search_results(user_id);
CREATE INDEX idx_web_search_results_brand_id ON public.web_search_results(brand_id);
CREATE INDEX idx_web_search_results_analysis_id ON public.web_search_results(analysis_id);
CREATE INDEX idx_queries_user_id ON public.queries(user_id);
CREATE INDEX idx_queries_brand_id ON public.queries(brand_id);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================
CREATE TRIGGER update_queries_updated_at BEFORE UPDATE ON public.queries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
