-- Add voice_readiness_score column to technical_aeo table
ALTER TABLE technical_aeo 
ADD COLUMN IF NOT EXISTS voice_readiness_score FLOAT DEFAULT 0.0;
