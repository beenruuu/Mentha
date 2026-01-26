-- Mentha Backend - QA & Hallucination Monitor Migration
-- Adds hallucination and compliance flags to Scan Results

-- =============================================================================
-- SCAN RESULTS: Add QA Flags
-- =============================================================================

ALTER TABLE public.scan_results
ADD COLUMN IF NOT EXISTS hallucination_flag BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS compliance_warning TEXT;

-- Comments for documentation
COMMENT ON COLUMN public.scan_results.hallucination_flag IS 'True if the LLM-as-a-Judge detected invented facts or products';
COMMENT ON COLUMN public.scan_results.compliance_warning IS 'Warning text if scams, legal issues, or safety concerns were detected';
