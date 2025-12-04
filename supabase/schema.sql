-- =====================================================
-- Mentha Platform - Consolidated Database Schema
-- Updated: 2025-12-01
-- Includes: Core tables + GEO Analysis Persistence
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired')),
  plan_name TEXT NOT NULL CHECK (plan_name IN ('starter', 'pro', 'enterprise')),
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  industry TEXT,
  entity_type TEXT CHECK (entity_type IN ('business', 'media', 'institution', 'blog', 'other')),
  ai_providers JSONB DEFAULT '[]'::jsonb,
  discovery_prompts JSONB DEFAULT '[]'::jsonb,
  services JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brands"
  ON public.brands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own brands"
  ON public.brands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brands"
  ON public.brands FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brands"
  ON public.brands FOR DELETE
  USING (auth.uid() = user_id);

-- AEO ANALYSES TABLE
CREATE TABLE IF NOT EXISTS public.aeo_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('domain', 'content', 'keyword', 'competitor')),
  input_data JSONB NOT NULL,
  results JSONB,
  score DECIMAL(5,2),
  ai_model TEXT CHECK (ai_model IN ('chatgpt', 'claude', 'perplexity', 'gemini')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.aeo_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON public.aeo_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses"
  ON public.aeo_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- KEYWORDS TABLE
CREATE TABLE IF NOT EXISTS public.keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  difficulty DECIMAL(5,2),
  ai_visibility_score DECIMAL(5,2),
  tracked BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keywords"
  ON public.keywords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own keywords"
  ON public.keywords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keywords"
  ON public.keywords FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own keywords"
  ON public.keywords FOR DELETE
  USING (auth.uid() = user_id);

-- KEYWORD RANKINGS TABLE
CREATE TABLE IF NOT EXISTS public.keyword_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  ai_model TEXT NOT NULL CHECK (ai_model IN ('chatgpt', 'claude', 'perplexity', 'gemini')),
  position INTEGER,
  mentioned BOOLEAN DEFAULT FALSE,
  context TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.keyword_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rankings of own keywords"
  ON public.keyword_rankings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.keywords
      WHERE keywords.id = keyword_rankings.keyword_id
      AND keywords.user_id = auth.uid()
    )
  );

-- COMPETITORS TABLE
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  favicon TEXT,
  source VARCHAR(50) DEFAULT 'manual',
  confidence VARCHAR(20) DEFAULT 'medium',
  visibility_score DECIMAL(5,2),
  similarity_score DECIMAL(5,2),
  tracked BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitors"
  ON public.competitors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own competitors"
  ON public.competitors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own competitors"
  ON public.competitors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own competitors"
  ON public.competitors FOR DELETE
  USING (auth.uid() = user_id);

-- RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.aeo_analyses(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL CHECK (category IN ('content', 'technical', 'keywords', 'competitors', 'visibility')),
  implementation_effort TEXT CHECK (implementation_effort IN ('low', 'medium', 'high')),
  expected_impact TEXT CHECK (expected_impact IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON public.recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON public.recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- CRAWLER LOGS TABLE
CREATE TABLE IF NOT EXISTS public.crawler_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  crawler_name TEXT NOT NULL,
  user_agent TEXT,
  pages_crawled INTEGER DEFAULT 0,
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.crawler_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs of own brands"
  ON public.crawler_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = crawler_logs.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('analysis_complete', 'analysis_failed', 'system', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- GEO ANALYSIS PERSISTENCE TABLES (NEW)
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

ALTER TABLE public.geo_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view GEO analyses of own brands"
  ON public.geo_analysis_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = geo_analysis_results.brand_id
      AND brands.user_id = auth.uid()
    )
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

ALTER TABLE public.ai_visibility_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view visibility snapshots of own brands"
  ON public.ai_visibility_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = ai_visibility_snapshots.brand_id
      AND brands.user_id = auth.uid()
    )
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

ALTER TABLE public.citation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view citations of own brands"
  ON public.citation_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = citation_records.brand_id
      AND brands.user_id = auth.uid()
    )
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

ALTER TABLE public.brand_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mentions of own brands"
  ON public.brand_mentions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = brand_mentions.brand_id
      AND brands.user_id = auth.uid()
    )
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

ALTER TABLE public.model_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rankings of own brands"
  ON public.model_rankings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = model_rankings.brand_id
      AND brands.user_id = auth.uid()
    )
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

ALTER TABLE public.query_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view query responses of own brands"
  ON public.query_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = query_responses.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON public.keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON public.competitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON public.recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);
CREATE INDEX IF NOT EXISTS idx_aeo_analyses_user_id ON public.aeo_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_aeo_analyses_brand_id ON public.aeo_analyses(brand_id);
CREATE INDEX IF NOT EXISTS idx_keywords_user_id ON public.keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_keywords_brand_id ON public.keywords(brand_id);
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_keyword_id ON public.keyword_rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON public.competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_brand_id ON public.competitors(brand_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_analysis_id ON public.recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_crawler_logs_brand_id ON public.crawler_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_brand_id ON public.notifications(brand_id);

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
-- HELPFUL VIEWS
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
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.geo_analysis_results IS 'Stores complete GEO analysis results, replacing in-memory cache';
COMMENT ON TABLE public.ai_visibility_snapshots IS 'Historical AI visibility tracking per model';
COMMENT ON TABLE public.citation_records IS 'Individual citation tracking across AI models';
COMMENT ON TABLE public.brand_mentions IS 'Every detected brand mention in AI responses';
COMMENT ON TABLE public.model_rankings IS 'Per-model brand ranking over time';
COMMENT ON TABLE public.query_responses IS 'Raw AI responses for audit trail';
