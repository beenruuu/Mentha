-- =====================================================
-- Migration: Add entity_type column to brands table
-- Date: 2025-12-03
-- Description: Adds entity_type column to track the type of entity
--              (business, media, institution, blog, other)
-- =====================================================

-- Add entity_type column to brands table
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS entity_type TEXT 
CHECK (entity_type IN ('business', 'media', 'institution', 'blog', 'other'));

-- Set default value for existing rows
UPDATE public.brands 
SET entity_type = 'business' 
WHERE entity_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.brands.entity_type IS 'Type of entity: business, media, institution, blog, or other';

-- Create index for filtering by entity_type
CREATE INDEX IF NOT EXISTS idx_brands_entity_type ON public.brands(entity_type);
