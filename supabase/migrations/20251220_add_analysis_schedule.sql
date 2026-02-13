-- Migration: Add analysis_schedule column to brands table
-- This stores the days of the week when analysis should run

ALTER TABLE brands ADD COLUMN IF NOT EXISTS analysis_schedule JSONB DEFAULT '["L", "M", "X", "J", "V"]'::jsonb;

COMMENT ON COLUMN brands.analysis_schedule IS 'Days of week for scheduled analysis: L=Monday, M=Tuesday, X=Wednesday, J=Thursday, V=Friday, S=Saturday, D=Sunday';
