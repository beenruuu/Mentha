-- Migration to add missing tables and policies safely
-- This script checks for existence before creating to avoid errors

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
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

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications (Drop first to avoid duplicates if they exist)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_brand_id ON public.notifications(brand_id);

-- =====================================================
-- RECOMMENDATIONS TABLE (Just in case)
-- =====================================================
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

DROP POLICY IF EXISTS "Users can view own recommendations" ON public.recommendations;
CREATE POLICY "Users can view own recommendations"
  ON public.recommendations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recommendations" ON public.recommendations;
CREATE POLICY "Users can update own recommendations"
  ON public.recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_analysis_id ON public.recommendations(analysis_id);

-- =====================================================
-- CRAWLER LOGS TABLE (Just in case)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crawler_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  crawler_name TEXT NOT NULL,
  user_agent TEXT,
  pages_crawled INTEGER DEFAULT 0,
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.crawler_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view logs of own brands" ON public.crawler_logs;
CREATE POLICY "Users can view logs of own brands"
  ON public.crawler_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = crawler_logs.brand_id
      AND brands.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_crawler_logs_brand_id ON public.crawler_logs(brand_id);
