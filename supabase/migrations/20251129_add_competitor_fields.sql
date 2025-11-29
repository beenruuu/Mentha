-- Migration: Add favicon and insight fields to competitors table
-- Date: 2024-11-29
-- Description: Add favicon URL and insight text for competitors

-- Add favicon column to competitors table
ALTER TABLE public.competitors 
ADD COLUMN IF NOT EXISTS favicon TEXT;

-- Add insight column to competitors table
ALTER TABLE public.competitors 
ADD COLUMN IF NOT EXISTS insight TEXT;

-- Add index for faster lookups by brand_id
CREATE INDEX IF NOT EXISTS idx_competitors_brand_id 
ON public.competitors(brand_id);

-- Add comment explaining the fields
COMMENT ON COLUMN public.competitors.favicon IS 'URL to competitor favicon/logo image';
COMMENT ON COLUMN public.competitors.insight IS 'AI-generated insight about this competitor';
