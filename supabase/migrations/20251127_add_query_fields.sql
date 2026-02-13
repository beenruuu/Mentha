-- =====================================================
-- MIGRATION: Add missing query fields
-- Description: Add category, priority, frequency fields to queries table
-- Date: 2025-11-27
-- =====================================================

-- Add missing columns to queries table if they don't exist
DO $$
BEGIN
    -- Add category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'queries' 
                   AND column_name = 'category') THEN
        ALTER TABLE public.queries ADD COLUMN category TEXT DEFAULT 'general';
    END IF;

    -- Add priority column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'queries' 
                   AND column_name = 'priority') THEN
        ALTER TABLE public.queries ADD COLUMN priority TEXT DEFAULT 'medium' 
            CHECK (priority IN ('low', 'medium', 'high'));
    END IF;

    -- Add frequency column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'queries' 
                   AND column_name = 'frequency') THEN
        ALTER TABLE public.queries ADD COLUMN frequency TEXT DEFAULT 'monthly'
            CHECK (frequency IN ('daily', 'weekly', 'monthly'));
    END IF;

    -- Add analysis_id column for tracking which analysis generated the query
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'queries' 
                   AND column_name = 'analysis_id') THEN
        ALTER TABLE public.queries ADD COLUMN analysis_id UUID REFERENCES public.aeo_analyses(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add index for analysis_id if not exists
CREATE INDEX IF NOT EXISTS idx_queries_analysis_id ON public.queries(analysis_id);
