-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================
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

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- BRANDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Policies for brands
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

-- =====================================================
-- AEO ANALYSES TABLE
-- =====================================================
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

-- Enable RLS
ALTER TABLE public.aeo_analyses ENABLE ROW LEVEL SECURITY;

-- Policies for aeo_analyses
CREATE POLICY "Users can view own analyses"
  ON public.aeo_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses"
  ON public.aeo_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- KEYWORDS TABLE
-- =====================================================
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

-- Enable RLS
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

-- Policies for keywords
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

-- =====================================================
-- KEYWORD RANKINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.keyword_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  ai_model TEXT NOT NULL CHECK (ai_model IN ('chatgpt', 'claude', 'perplexity', 'gemini')),
  position INTEGER,
  mentioned BOOLEAN DEFAULT FALSE,
  context TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.keyword_rankings ENABLE ROW LEVEL SECURITY;

-- Policies for keyword_rankings (via keyword ownership)
CREATE POLICY "Users can view rankings of own keywords"
  ON public.keyword_rankings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.keywords
      WHERE keywords.id = keyword_rankings.keyword_id
      AND keywords.user_id = auth.uid()
    )
  );

-- =====================================================
-- COMPETITORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  visibility_score DECIMAL(5,2),
  tracked BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

-- Policies for competitors
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

-- =====================================================
-- RECOMMENDATIONS TABLE
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

-- Enable RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Policies for recommendations
CREATE POLICY "Users can view own recommendations"
  ON public.recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON public.recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- CRAWLER LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crawler_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  crawler_name TEXT NOT NULL,
  user_agent TEXT,
  pages_crawled INTEGER DEFAULT 0,
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.crawler_logs ENABLE ROW LEVEL SECURITY;

-- Policies for crawler_logs (via brand ownership)
CREATE POLICY "Users can view logs of own brands"
  ON public.crawler_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = crawler_logs.brand_id
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
-- INDEXES for performance
-- =====================================================
CREATE INDEX idx_brands_user_id ON public.brands(user_id);
CREATE INDEX idx_aeo_analyses_user_id ON public.aeo_analyses(user_id);
CREATE INDEX idx_aeo_analyses_brand_id ON public.aeo_analyses(brand_id);
CREATE INDEX idx_keywords_user_id ON public.keywords(user_id);
CREATE INDEX idx_keywords_brand_id ON public.keywords(brand_id);
CREATE INDEX idx_keyword_rankings_keyword_id ON public.keyword_rankings(keyword_id);
CREATE INDEX idx_competitors_user_id ON public.competitors(user_id);
CREATE INDEX idx_competitors_brand_id ON public.competitors(brand_id);
CREATE INDEX idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX idx_recommendations_analysis_id ON public.recommendations(analysis_id);
CREATE INDEX idx_crawler_logs_brand_id ON public.crawler_logs(brand_id);
