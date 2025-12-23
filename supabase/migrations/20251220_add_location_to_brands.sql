-- Migration: Add location column to brands table
-- This stores the country code (e.g. ES, US) for the brand's primary market

ALTER TABLE brands ADD COLUMN IF NOT EXISTS location TEXT;

COMMENT ON COLUMN brands.location IS 'Country code (ISO 3166-1 alpha-2) for brand primary market, e.g. ES, US, MX';
