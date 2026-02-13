-- Migration: Add business_scope and city columns to brands table
-- Date: 2025-12-10
-- Purpose: Enable scope-aware competitor discovery

-- Add business_scope column to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS business_scope TEXT DEFAULT 'national';

-- Add city column to brands table  
ALTER TABLE brands ADD COLUMN IF NOT EXISTS city TEXT;

-- Add comment for documentation
COMMENT ON COLUMN brands.business_scope IS 'Business geographic scope: local, regional, national, or international';
COMMENT ON COLUMN brands.city IS 'Main city/area for local or regional businesses';
