-- Migration: Add real keyword metrics fields
-- Date: 2025-11-28
-- Description: Add fields to store real metrics from Google Trends, SerpAPI, etc.

-- Add new columns to keywords table for real metrics data
ALTER TABLE public.keywords 
ADD COLUMN IF NOT EXISTS trend_score INTEGER,
ADD COLUMN IF NOT EXISTS trend_direction TEXT CHECK (trend_direction IN ('rising', 'stable', 'falling')),
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'llm_estimated' CHECK (data_source IN ('google_trends', 'serpapi', 'estimated', 'llm_estimated', 'manual'));

-- Add comment for documentation
COMMENT ON COLUMN public.keywords.trend_score IS 'Google Trends interest score (0-100)';
COMMENT ON COLUMN public.keywords.trend_direction IS 'Trend direction: rising, stable, or falling';
COMMENT ON COLUMN public.keywords.data_source IS 'Source of the keyword metrics data';

-- Create index for filtering by data source
CREATE INDEX IF NOT EXISTS idx_keywords_data_source ON public.keywords(data_source);

-- Create web_search_results table if not exists (to store raw search results)
CREATE TABLE IF NOT EXISTS public.web_search_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.aeo_analyses(id) ON DELETE CASCADE,
  search_type TEXT NOT NULL CHECK (search_type IN ('keyword', 'competitor', 'mention', 'industry', 'brand')),
  query TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '[]',
  total_results INTEGER DEFAULT 0,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for web_search_results
ALTER TABLE public.web_search_results ENABLE ROW LEVEL SECURITY;

-- Policies for web_search_results
CREATE POLICY "Users can view own search results"
  ON public.web_search_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search results"
  ON public.web_search_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search results"
  ON public.web_search_results FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for web_search_results
CREATE INDEX IF NOT EXISTS idx_web_search_results_user_id ON public.web_search_results(user_id);
CREATE INDEX IF NOT EXISTS idx_web_search_results_brand_id ON public.web_search_results(brand_id);
CREATE INDEX IF NOT EXISTS idx_web_search_results_analysis_id ON public.web_search_results(analysis_id);
CREATE INDEX IF NOT EXISTS idx_web_search_results_search_type ON public.web_search_results(search_type);
