-- Create table for storing prompt check history (chat messages)
CREATE TABLE IF NOT EXISTS prompt_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    providers JSONB DEFAULT '[]'::jsonb,
    results JSONB DEFAULT '[]'::jsonb,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_prompt_checks_brand_id ON prompt_checks(brand_id);
CREATE INDEX IF NOT EXISTS idx_prompt_checks_user_id ON prompt_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_checks_created_at ON prompt_checks(created_at);

-- Add RLS policies
ALTER TABLE prompt_checks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view checks for brands they own
CREATE POLICY "Users can view their own prompt checks"
    ON prompt_checks FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own checks
CREATE POLICY "Users can insert their own prompt checks"
    ON prompt_checks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own checks
CREATE POLICY "Users can delete their own prompt checks"
    ON prompt_checks FOR DELETE
    USING (auth.uid() = user_id);
