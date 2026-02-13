-- Migration: Add location column to ai_visibility_snapshots table
-- This stores the country code for the visibility measurement

ALTER TABLE ai_visibility_snapshots ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE ai_visibility_snapshots ADD COLUMN IF NOT EXISTS business_scope TEXT;

COMMENT ON COLUMN ai_visibility_snapshots.location IS 'Country code (ISO 3166-1 alpha-2) where visibility was measured';
COMMENT ON COLUMN ai_visibility_snapshots.business_scope IS 'Business scope at time of measurement: local, regional, national, international';
