-- =====================================================
-- Admin Panel Database Migration
-- Created: 2024-12-04
-- Purpose: Tables for admin dashboard functionality
-- =====================================================

-- =====================================================
-- ADMIN USERS TABLE
-- Stores admin users and their permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_users table (via service role)
CREATE POLICY "Service role can manage admin_users"
  ON public.admin_users
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- ONBOARDING DATA TABLE
-- Enhanced onboarding tracking for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS public.onboarding_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step_completed INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 7,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  -- Step-specific data
  about_you_data JSONB DEFAULT '{}'::jsonb,
  company_data JSONB DEFAULT '{}'::jsonb,
  brand_profile_data JSONB DEFAULT '{}'::jsonb,
  competitors_data JSONB DEFAULT '{}'::jsonb,
  research_prompts_data JSONB DEFAULT '{}'::jsonb,
  schedule_data JSONB DEFAULT '{}'::jsonb,
  -- Timing analytics
  step_timestamps JSONB DEFAULT '[]'::jsonb,
  time_per_step JSONB DEFAULT '{}'::jsonb,
  -- Drop-off tracking
  dropped_at_step INTEGER,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id)
);

ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding data"
  ON public.onboarding_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding data"
  ON public.onboarding_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding data"
  ON public.onboarding_data FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- USER ACTIVITY TABLE
-- Track user activity for retention analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  page_path TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CATEGORIES TABLE (from TODO.md)
-- Dynamic categories management
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- =====================================================
-- PLATFORM METRICS TABLE
-- Store aggregated platform metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS public.platform_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  churned_users INTEGER DEFAULT 0,
  total_brands INTEGER DEFAULT 0,
  total_analyses INTEGER DEFAULT 0,
  total_keywords INTEGER DEFAULT 0,
  -- Subscription metrics
  free_users INTEGER DEFAULT 0,
  starter_users INTEGER DEFAULT 0,
  pro_users INTEGER DEFAULT 0,
  enterprise_users INTEGER DEFAULT 0,
  mrr DECIMAL(12,2) DEFAULT 0,
  -- Feature usage
  feature_usage JSONB DEFAULT '{}'::jsonb,
  -- Onboarding metrics
  onboarding_started INTEGER DEFAULT 0,
  onboarding_completed INTEGER DEFAULT 0,
  onboarding_drop_rate DECIMAL(5,2),
  -- Calculated at insertion
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADMIN AUDIT LOG
-- Track admin actions for security
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- UPDATE PROFILES TABLE
-- Add admin-relevant fields
-- =====================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS role VARCHAR(100),
ADD COLUMN IF NOT EXISTS discovery_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON public.onboarding_data(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_completed_at ON public.onboarding_data(completed_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_dropped_step ON public.onboarding_data(dropped_at_step);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_date ON public.platform_metrics(metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON public.admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON public.profiles(industry);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for onboarding_data updated_at
CREATE TRIGGER update_onboarding_data_updated_at 
  BEFORE UPDATE ON public.onboarding_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for categories updated_at
CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for admin_users updated_at
CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DEFAULT CATEGORIES
-- =====================================================
INSERT INTO public.categories (name, slug, description, icon, color, sort_order) VALUES
  ('Technology', 'technology', 'Tech companies, SaaS, software', 'laptop', '#3B82F6', 1),
  ('E-commerce', 'ecommerce', 'Online retail and marketplaces', 'shopping-cart', '#10B981', 2),
  ('Finance', 'finance', 'Banking, fintech, insurance', 'dollar-sign', '#F59E0B', 3),
  ('Healthcare', 'healthcare', 'Medical, pharma, health tech', 'heart', '#EF4444', 4),
  ('Education', 'education', 'EdTech, schools, courses', 'book-open', '#8B5CF6', 5),
  ('Marketing', 'marketing', 'Agencies, tools, services', 'megaphone', '#EC4899', 6),
  ('Real Estate', 'real-estate', 'Property, proptech', 'home', '#06B6D4', 7),
  ('Media & Entertainment', 'media-entertainment', 'News, streaming, content', 'play', '#F97316', 8),
  ('Travel & Hospitality', 'travel-hospitality', 'Hotels, airlines, booking', 'plane', '#84CC16', 9),
  ('Other', 'other', 'Other industries', 'more-horizontal', '#6B7280', 100)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- HELPFUL VIEWS FOR ADMIN
-- =====================================================

-- User growth by day
CREATE OR REPLACE VIEW public.admin_user_growth AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as cumulative_users
FROM public.profiles
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Subscription distribution
CREATE OR REPLACE VIEW public.admin_subscription_distribution AS
SELECT 
  COALESCE(s.plan_name, 'free') as plan,
  s.status,
  COUNT(DISTINCT p.id) as user_count
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id
GROUP BY COALESCE(s.plan_name, 'free'), s.status;

-- Onboarding funnel
CREATE OR REPLACE VIEW public.admin_onboarding_funnel AS
SELECT 
  step_completed,
  COUNT(*) as users_at_step,
  COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed,
  COUNT(CASE WHEN dropped_at_step = step_completed THEN 1 END) as dropped
FROM public.onboarding_data
GROUP BY step_completed
ORDER BY step_completed;

-- User geography distribution
CREATE OR REPLACE VIEW public.admin_user_geography AS
SELECT 
  country,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.profiles
WHERE country IS NOT NULL
GROUP BY country
ORDER BY user_count DESC;

-- Industry distribution
CREATE OR REPLACE VIEW public.admin_industry_distribution AS
SELECT 
  industry,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.profiles
WHERE industry IS NOT NULL
GROUP BY industry
ORDER BY user_count DESC;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.admin_users IS 'Admin user management with role-based permissions';
COMMENT ON TABLE public.onboarding_data IS 'Detailed onboarding progress and analytics';
COMMENT ON TABLE public.user_activity IS 'User activity tracking for retention analysis';
COMMENT ON TABLE public.categories IS 'Dynamic categories for brand classification';
COMMENT ON TABLE public.platform_metrics IS 'Daily aggregated platform metrics';
COMMENT ON TABLE public.admin_audit_log IS 'Audit trail of admin actions';
