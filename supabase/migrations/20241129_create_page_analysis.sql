-- Create page_analysis table for storing comprehensive analysis results
CREATE TABLE IF NOT EXISTS page_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    
    -- Analysis Results stored as JSONB for flexibility
    metadata JSONB DEFAULT '{}'::jsonb,
    content_analysis JSONB DEFAULT '{}'::jsonb,
    seo_warnings TEXT[] DEFAULT '{}',
    headings JSONB DEFAULT '{}'::jsonb,
    additional_tags JSONB DEFAULT '{}'::jsonb,
    links JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    keywords JSONB DEFAULT '{}'::jsonb,
    bigrams JSONB DEFAULT '{}'::jsonb,
    trigrams JSONB DEFAULT '{}'::jsonb,
    aeo_signals JSONB DEFAULT '{}'::jsonb,
    llm_analysis JSONB DEFAULT '{}'::jsonb,
    
    content_hash TEXT,
    error TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_page_analysis_user_id ON page_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_page_analysis_brand_id ON page_analysis(brand_id);
CREATE INDEX IF NOT EXISTS idx_page_analysis_url ON page_analysis(url);
CREATE INDEX IF NOT EXISTS idx_page_analysis_created_at ON page_analysis(created_at DESC);

-- Enable RLS
ALTER TABLE page_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own analyses"
    ON page_analysis FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
    ON page_analysis FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
    ON page_analysis FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
    ON page_analysis FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_page_analysis_updated_at
    BEFORE UPDATE ON page_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
