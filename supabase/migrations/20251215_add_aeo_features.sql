  -- =====================================================
  -- Mentha Platform - AEO Features Migration
  -- Date: 2025-12-15
  -- Features: Prompt Tracking, Topical Authority, User Intent, Enhanced Sentiment
  -- =====================================================

  -- =====================================================
  -- PROMPT TRACKING TABLES
  -- =====================================================

  -- Tracked Prompts - User-defined prompts to monitor
  CREATE TABLE IF NOT EXISTS public.tracked_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    check_frequency VARCHAR(20) DEFAULT 'daily' CHECK (check_frequency IN ('hourly', 'daily', 'weekly')),
    last_checked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  ALTER TABLE public.tracked_prompts ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view tracked prompts of own brands"
    ON public.tracked_prompts FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.brands
        WHERE brands.id = tracked_prompts.brand_id
        AND brands.user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can create tracked prompts for own brands"
    ON public.tracked_prompts FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.brands
        WHERE brands.id = tracked_prompts.brand_id
        AND brands.user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can update tracked prompts of own brands"
    ON public.tracked_prompts FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.brands
        WHERE brands.id = tracked_prompts.brand_id
        AND brands.user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can delete tracked prompts of own brands"
    ON public.tracked_prompts FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.brands
        WHERE brands.id = tracked_prompts.brand_id
        AND brands.user_id = auth.uid()
      )
    );

  -- Prompt Check Results - Historical results of prompt checks
  CREATE TABLE IF NOT EXISTS public.prompt_check_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES public.tracked_prompts(id) ON DELETE CASCADE,
    ai_model VARCHAR(50) NOT NULL CHECK (ai_model IN ('openai', 'anthropic', 'perplexity', 'gemini')),
    brand_mentioned BOOLEAN DEFAULT false,
    position INTEGER, -- Position of brand in response (1 = first mentioned)
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    sentiment_score DECIMAL(5,2), -- 0-100 score
    response_snippet TEXT,
    full_response TEXT,
    competitor_mentions JSONB DEFAULT '[]',
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
  );

  ALTER TABLE public.prompt_check_results ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view prompt results of own brands"
    ON public.prompt_check_results FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.tracked_prompts tp
        JOIN public.brands b ON b.id = tp.brand_id
        WHERE tp.id = prompt_check_results.prompt_id
        AND b.user_id = auth.uid()
      )
    );

  -- =====================================================
  -- TOPICAL AUTHORITY TABLES
  -- =====================================================

  -- Topical Authority Scores - Authority per topic/category
  CREATE TABLE IF NOT EXISTS public.topical_authority (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    authority_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    mention_count INTEGER DEFAULT 0,
    avg_position DECIMAL(5,2),
    competitor_scores JSONB DEFAULT '{}', -- {competitor_name: score}
    ai_models_breakdown JSONB DEFAULT '{}', -- {model: score}
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
  );

  ALTER TABLE public.topical_authority ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view topical authority of own brands"
    ON public.topical_authority FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.brands
        WHERE brands.id = topical_authority.brand_id
        AND brands.user_id = auth.uid()
      )
    );

  -- =====================================================
  -- USER INTENT TABLES
  -- =====================================================

  -- User Intent Queries - Queries classified by intent type
  CREATE TABLE IF NOT EXISTS public.user_intent_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    intent_type VARCHAR(50) NOT NULL CHECK (intent_type IN ('informational', 'transactional', 'navigational', 'commercial', 'local')),
    relevance_score DECIMAL(5,2) DEFAULT 0,
    conversion_potential VARCHAR(20) CHECK (conversion_potential IN ('low', 'medium', 'high', 'very_high')),
    is_high_intent BOOLEAN DEFAULT false,
    brand_visibility DECIMAL(5,2), -- Current visibility for this query
    suggested_action TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
  );

  ALTER TABLE public.user_intent_queries ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view intent queries of own brands"
    ON public.user_intent_queries FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.brands
        WHERE brands.id = user_intent_queries.brand_id
        AND brands.user_id = auth.uid()
      )
    );

  -- =====================================================
  -- ENHANCED SENTIMENT TABLES
  -- =====================================================

  -- Sentiment Analysis Results - Detailed sentiment tracking
  CREATE TABLE IF NOT EXISTS public.sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    ai_model VARCHAR(50) NOT NULL CHECK (ai_model IN ('openai', 'anthropic', 'perplexity', 'gemini')),
    overall_sentiment VARCHAR(20) CHECK (overall_sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    sentiment_score DECIMAL(5,2) NOT NULL, -- 0-100 numeric score
    positive_aspects JSONB DEFAULT '[]', -- ["fast support", "good pricing"]
    negative_aspects JSONB DEFAULT '[]', -- ["slow delivery", "complex UI"]
    neutral_aspects JSONB DEFAULT '[]',
    sample_snippets JSONB DEFAULT '[]', -- Context snippets
    trend VARCHAR(20) CHECK (trend IN ('improving', 'stable', 'declining')),
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
  );

  ALTER TABLE public.sentiment_analysis ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view sentiment of own brands"
    ON public.sentiment_analysis FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.brands
        WHERE brands.id = sentiment_analysis.brand_id
        AND brands.user_id = auth.uid()
      )
    );

  -- =====================================================
  -- GROWTH FORECAST TABLES
  -- =====================================================

  -- Growth Forecasts - Visibility predictions
  CREATE TABLE IF NOT EXISTS public.growth_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    forecast_period VARCHAR(20) NOT NULL CHECK (forecast_period IN ('30_days', '60_days', '90_days')),
    current_visibility DECIMAL(5,2) NOT NULL,
    predicted_visibility DECIMAL(5,2) NOT NULL,
    confidence_interval_low DECIMAL(5,2),
    confidence_interval_high DECIMAL(5,2),
    growth_rate DECIMAL(5,2), -- Percentage change
    key_factors JSONB DEFAULT '[]', -- Factors influencing prediction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
  );

  ALTER TABLE public.growth_forecasts ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view forecasts of own brands"
    ON public.growth_forecasts FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.brands
        WHERE brands.id = growth_forecasts.brand_id
        AND brands.user_id = auth.uid()
      )
    );

  -- =====================================================
  -- INDEXES FOR PERFORMANCE
  -- =====================================================

  -- Prompt tracking indexes
  CREATE INDEX IF NOT EXISTS idx_tracked_prompts_brand_id ON public.tracked_prompts(brand_id);
  CREATE INDEX IF NOT EXISTS idx_tracked_prompts_active ON public.tracked_prompts(brand_id, is_active);
  CREATE INDEX IF NOT EXISTS idx_prompt_results_prompt_id ON public.prompt_check_results(prompt_id);
  CREATE INDEX IF NOT EXISTS idx_prompt_results_checked_at ON public.prompt_check_results(checked_at DESC);
  CREATE INDEX IF NOT EXISTS idx_prompt_results_model ON public.prompt_check_results(ai_model);

  -- Topical authority indexes
  CREATE INDEX IF NOT EXISTS idx_topical_authority_brand ON public.topical_authority(brand_id);
  CREATE INDEX IF NOT EXISTS idx_topical_authority_topic ON public.topical_authority(brand_id, topic);
  CREATE INDEX IF NOT EXISTS idx_topical_authority_measured ON public.topical_authority(measured_at DESC);

  -- User intent indexes
  CREATE INDEX IF NOT EXISTS idx_user_intent_brand ON public.user_intent_queries(brand_id);
  CREATE INDEX IF NOT EXISTS idx_user_intent_type ON public.user_intent_queries(intent_type);
  CREATE INDEX IF NOT EXISTS idx_user_intent_high ON public.user_intent_queries(brand_id, is_high_intent);

  -- Sentiment indexes
  CREATE INDEX IF NOT EXISTS idx_sentiment_brand ON public.sentiment_analysis(brand_id);
  CREATE INDEX IF NOT EXISTS idx_sentiment_model ON public.sentiment_analysis(ai_model);
  CREATE INDEX IF NOT EXISTS idx_sentiment_analyzed ON public.sentiment_analysis(analyzed_at DESC);
  CREATE INDEX IF NOT EXISTS idx_sentiment_brand_model ON public.sentiment_analysis(brand_id, ai_model);

  -- Growth forecast indexes
  CREATE INDEX IF NOT EXISTS idx_forecast_brand ON public.growth_forecasts(brand_id);
  CREATE INDEX IF NOT EXISTS idx_forecast_period ON public.growth_forecasts(forecast_period);
  CREATE INDEX IF NOT EXISTS idx_forecast_created ON public.growth_forecasts(created_at DESC);

  -- =====================================================
  -- TRIGGERS
  -- =====================================================

  CREATE TRIGGER update_tracked_prompts_updated_at 
    BEFORE UPDATE ON public.tracked_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- =====================================================
  -- VIEWS
  -- =====================================================

  -- Latest sentiment per brand per model
  CREATE OR REPLACE VIEW public.latest_sentiment AS
  SELECT DISTINCT ON (brand_id, ai_model)
    brand_id,
    ai_model,
    overall_sentiment,
    sentiment_score,
    trend,
    analyzed_at
  FROM public.sentiment_analysis
  ORDER BY brand_id, ai_model, analyzed_at DESC;

  -- Latest topical authority per brand per topic
  CREATE OR REPLACE VIEW public.latest_topical_authority AS
  SELECT DISTINCT ON (brand_id, topic)
    brand_id,
    topic,
    authority_score,
    mention_count,
    competitor_scores,
    measured_at
  FROM public.topical_authority
  ORDER BY brand_id, topic, measured_at DESC;

  -- High intent queries view
  CREATE OR REPLACE VIEW public.high_intent_queries AS
  SELECT *
  FROM public.user_intent_queries
  WHERE is_high_intent = true
  ORDER BY relevance_score DESC;

  -- =====================================================
  -- COMMENTS
  -- =====================================================

  COMMENT ON TABLE public.tracked_prompts IS 'User-defined prompts to monitor for brand visibility (like Peec.ai prompt tracking)';
  COMMENT ON TABLE public.prompt_check_results IS 'Historical results of checking tracked prompts across AI models';
  COMMENT ON TABLE public.topical_authority IS 'Brand authority scores per topic/category';
  COMMENT ON TABLE public.user_intent_queries IS 'Queries classified by user intent type';
  COMMENT ON TABLE public.sentiment_analysis IS 'Detailed sentiment analysis with numeric scores and aspects';
  COMMENT ON TABLE public.growth_forecasts IS 'Visibility growth predictions based on historical data';
