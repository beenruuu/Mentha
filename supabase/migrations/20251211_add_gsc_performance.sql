-- =============================================================================
-- Google Search Console Performance Data
-- Migration: 20251211_add_gsc_performance.sql
-- =============================================================================

-- GSC Performance table - stores synced data from Google Search Console
CREATE TABLE IF NOT EXISTS public.gsc_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL, -- The verified site URL in GSC
  query TEXT NOT NULL, -- Search query
  page TEXT, -- The page URL
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,4), -- Click-through rate (0.0000 to 1.0000)
  position DECIMAL(5,2), -- Average position in search results
  date DATE NOT NULL, -- Date of the data
  country TEXT, -- Country code (e.g., 'ESP', 'USA')
  device TEXT CHECK (device IN ('DESKTOP', 'MOBILE', 'TABLET')), -- Device type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gsc_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view GSC data for their own brands
CREATE POLICY "Users can view GSC data of own brands"
  ON public.gsc_performance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = gsc_performance.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- RLS Policy: Service role can insert (for sync tasks)
CREATE POLICY "Service can insert GSC data"
  ON public.gsc_performance FOR INSERT
  WITH CHECK (true);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_gsc_brand_date ON public.gsc_performance(brand_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_query ON public.gsc_performance(query);
CREATE INDEX IF NOT EXISTS idx_gsc_brand_query_date ON public.gsc_performance(brand_id, query, date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_site_url ON public.gsc_performance(site_url);

-- =============================================================================
-- GSC Connection Status (track connected sites per brand)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gsc_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL, -- The verified site URL in GSC
  permission_level TEXT, -- 'siteOwner', 'siteFullUser', 'siteRestrictedUser'
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, site_url)
);

-- Enable RLS
ALTER TABLE public.gsc_sites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own GSC sites
CREATE POLICY "Users can view own GSC sites"
  ON public.gsc_sites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own GSC sites"
  ON public.gsc_sites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own GSC sites"
  ON public.gsc_sites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own GSC sites"
  ON public.gsc_sites FOR DELETE
  USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_gsc_sites_brand ON public.gsc_sites(brand_id);
CREATE INDEX IF NOT EXISTS idx_gsc_sites_user ON public.gsc_sites(user_id);

-- =============================================================================
-- Helpful Views for GSC Data
-- =============================================================================

-- View: Top queries per brand (last 30 days)
CREATE OR REPLACE VIEW public.gsc_top_queries AS
SELECT 
  brand_id,
  query,
  SUM(clicks) as total_clicks,
  SUM(impressions) as total_impressions,
  ROUND(AVG(position)::numeric, 2) as avg_position,
  ROUND((SUM(clicks)::numeric / NULLIF(SUM(impressions), 0))::numeric, 4) as avg_ctr,
  MAX(date) as latest_date
FROM public.gsc_performance
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY brand_id, query
ORDER BY total_clicks DESC;

-- View: GSC vs AI Visibility comparison (for dashboard correlation)
CREATE OR REPLACE VIEW public.gsc_ai_comparison AS
SELECT 
  gsc.brand_id,
  gsc.query,
  gsc.total_clicks as gsc_clicks,
  gsc.total_impressions as gsc_impressions,
  gsc.avg_position as gsc_position,
  vis.visibility_score as ai_visibility_score,
  vis.ai_model,
  vis.measured_at as ai_measured_at
FROM public.gsc_top_queries gsc
LEFT JOIN LATERAL (
  SELECT visibility_score, ai_model, measured_at
  FROM public.ai_visibility_snapshots
  WHERE brand_id = gsc.brand_id
  ORDER BY measured_at DESC
  LIMIT 1
) vis ON true;

-- =============================================================================
-- Update brands table to track GSC connection status
-- =============================================================================

ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS gsc_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gsc_site_url TEXT,
ADD COLUMN IF NOT EXISTS gsc_last_sync TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON TABLE public.gsc_performance IS 'Stores Google Search Console performance data synced from GSC API';
COMMENT ON TABLE public.gsc_sites IS 'Tracks connected GSC sites per brand';
COMMENT ON VIEW public.gsc_top_queries IS 'Aggregated top queries from GSC data (last 30 days)';
COMMENT ON VIEW public.gsc_ai_comparison IS 'Comparison of GSC performance vs AI visibility scores';
