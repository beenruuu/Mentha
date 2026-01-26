-- Mentha Backend - Analytics Views
-- Materialized views for efficient dashboard queries

-- =============================================================================
-- CREATE ANALYTICS SCHEMA
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS analytics;

-- =============================================================================
-- DAILY BRAND METRICS (aggregated analytics)
-- =============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.daily_brand_metrics AS
SELECT
    p.id AS project_id,
    p.user_id,
    DATE_TRUNC('day', r.created_at) AS scan_date,
    j.engine,
    COUNT(*) AS total_scans,
    AVG(r.sentiment_score) FILTER (WHERE r.sentiment_score IS NOT NULL) AS avg_sentiment,
    COUNT(*) FILTER (WHERE r.brand_visibility = true) AS visibility_count,
    COUNT(*) FILTER (WHERE r.brand_visibility = false) AS invisibility_count,
    AVG(r.share_of_voice_rank) FILTER (WHERE r.share_of_voice_rank IS NOT NULL) AS avg_rank,
    COUNT(*) FILTER (WHERE r.recommendation_type = 'direct_recommendation') AS direct_recommendation_count,
    COUNT(*) FILTER (WHERE r.recommendation_type = 'neutral_comparison') AS neutral_comparison_count,
    COUNT(*) FILTER (WHERE r.recommendation_type = 'negative_mention') AS negative_mention_count,
    COUNT(*) FILTER (WHERE r.recommendation_type = 'absent') AS absent_count
FROM public.projects p
JOIN public.keywords k ON p.id = k.project_id
JOIN public.scan_jobs j ON k.id = j.keyword_id
JOIN public.scan_results r ON j.id = r.job_id
WHERE j.status = 'completed'
GROUP BY p.id, p.user_id, DATE_TRUNC('day', r.created_at), j.engine;

CREATE UNIQUE INDEX idx_daily_metrics_project_date_engine 
    ON analytics.daily_brand_metrics(project_id, scan_date, engine);

-- =============================================================================
-- TOP CITED DOMAINS (for source analysis)
-- =============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.top_cited_domains AS
SELECT
    p.id AS project_id,
    p.user_id,
    c.domain,
    COUNT(*) AS citation_count,
    COUNT(*) FILTER (WHERE c.is_brand_domain = true) AS brand_citations,
    COUNT(*) FILTER (WHERE c.is_competitor_domain = true) AS competitor_citations,
    AVG(c.position) AS avg_position
FROM public.projects p
JOIN public.keywords k ON p.id = k.project_id
JOIN public.scan_jobs j ON k.id = j.keyword_id
JOIN public.scan_results r ON j.id = r.job_id
JOIN public.citations c ON r.id = c.result_id
WHERE j.status = 'completed'
GROUP BY p.id, p.user_id, c.domain
ORDER BY citation_count DESC;

CREATE INDEX idx_top_domains_project 
    ON analytics.top_cited_domains(project_id);

-- =============================================================================
-- KEYWORD PERFORMANCE SUMMARY
-- =============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.keyword_performance AS
SELECT
    k.id AS keyword_id,
    k.project_id,
    k.query,
    COUNT(DISTINCT j.id) AS total_scans,
    MAX(r.created_at) AS last_scan_at,
    AVG(r.sentiment_score) AS avg_sentiment,
    MODE() WITHIN GROUP (ORDER BY r.recommendation_type) AS most_common_recommendation,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY r.share_of_voice_rank) AS median_rank
FROM public.keywords k
JOIN public.scan_jobs j ON k.id = j.keyword_id
JOIN public.scan_results r ON j.id = r.job_id
WHERE j.status = 'completed'
GROUP BY k.id, k.project_id, k.query;

CREATE UNIQUE INDEX idx_keyword_perf_keyword_id 
    ON analytics.keyword_performance(keyword_id);

-- =============================================================================
-- REFRESH FUNCTION (called by scheduler)
-- =============================================================================
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.daily_brand_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.top_cited_domains;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.keyword_performance;
END;
$$ LANGUAGE plpgsql;

-- Note: Create the analytics schema first if it doesn't exist
-- CREATE SCHEMA IF NOT EXISTS analytics;
