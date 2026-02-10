import { Router, Request, Response } from 'express';
import { createSupabaseAdmin } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const router = Router();

/**
 * GET /api/v1/dashboard/share-of-model
 * Get Share of Model metrics for a project
 */
router.get('/share-of-model', async (req: Request, res: Response) => {
    const { project_id, days = '30' } = req.query;

    if (!project_id) {
        res.status(400).json({ error: 'project_id is required' });
        return;
    }

    const supabase = createSupabaseAdmin();
    const daysNum = parseInt(days as string, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get scan results with visibility metrics
    const { data: results, error } = await supabase
        .from('scan_results')
        .select(`
      brand_visibility,
      sentiment_score,
      recommendation_type,
      created_at,
      scan_jobs!inner(
        engine,
        keywords!inner(project_id, query)
      )
    `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('Failed to get dashboard data', { error: error.message });
        res.status(500).json({ error: 'Failed to load dashboard' });
        return;
    }

    // Filter by project
    const projectResults = (results ?? []).filter((r) => {
        const job = r.scan_jobs as unknown as { keywords: { project_id: string } };
        return job?.keywords?.project_id === project_id;
    });

    // Calculate metrics
    const totalScans = projectResults.length;
    const visibleCount = projectResults.filter(r => r.brand_visibility === true).length;
    const visibilityRate = totalScans > 0 ? Math.round((visibleCount / totalScans) * 100) : 0;

    // Breakdown by engine
    const byEngine: Record<string, { total: number; visible: number; rate: number }> = {};
    for (const r of projectResults) {
        const job = r.scan_jobs as unknown as { engine: string };
        const engine = job?.engine ?? 'unknown';
        if (!byEngine[engine]) {
            byEngine[engine] = { total: 0, visible: 0, rate: 0 };
        }
        byEngine[engine]!.total++;
        if (r.brand_visibility) byEngine[engine]!.visible++;
    }
    for (const engine of Object.keys(byEngine)) {
        const e = byEngine[engine]!;
        e.rate = e.total > 0 ? Math.round((e.visible / e.total) * 100) : 0;
    }

    // Breakdown by recommendation type
    const byType: Record<string, number> = {
        direct_recommendation: 0,
        neutral_comparison: 0,
        negative_mention: 0,
        absent: 0,
    };
    for (const r of projectResults) {
        const type = r.recommendation_type ?? 'absent';
        if (type in byType) byType[type] = (byType[type] ?? 0) + 1;
    }

    // Average sentiment
    const sentiments = projectResults
        .filter(r => r.sentiment_score != null)
        .map(r => r.sentiment_score as number);
    const avgSentiment = sentiments.length > 0
        ? Math.round((sentiments.reduce((a, b) => a + b, 0) / sentiments.length) * 100) / 100
        : null;

    // Timeline (last 7 days)
    const timeline: Array<{ date: string; scans: number; visible: number; sentiment: number | null }> = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0]!;
        const dayResults = projectResults.filter(r =>
            r.created_at?.startsWith(dateStr)
        );
        const daySentiments = dayResults
            .filter(r => r.sentiment_score != null)
            .map(r => r.sentiment_score as number);

        timeline.push({
            date: dateStr,
            scans: dayResults.length,
            visible: dayResults.filter(r => r.brand_visibility).length,
            sentiment: daySentiments.length > 0
                ? Math.round((daySentiments.reduce((a, b) => a + b, 0) / daySentiments.length) * 100) / 100
                : null
        });
    }

    res.json({
        data: {
            summary: {
                totalScans,
                visibleCount,
                visibilityRate,
                avgSentiment,
                period: `${daysNum} days`,
            },
            byEngine,
            byType,
            timeline,
        },
    });
});

/**
 * GET /api/v1/dashboard/keywords
 * Get keyword-level performance
 */
router.get('/keywords', async (req: Request, res: Response) => {
    const { project_id } = req.query;

    if (!project_id) {
        res.status(400).json({ error: 'project_id is required' });
        return;
    }

    const supabase = createSupabaseAdmin();

    const { data: keywords, error } = await supabase
        .from('keywords')
        .select('id, query, last_scanned_at')
        .eq('project_id', project_id)
        .eq('is_active', true);

    if (error) {
        res.status(500).json({ error: 'Failed to load keywords' });
        return;
    }

    // Get scan stats for each keyword
    const keywordStats = await Promise.all(
        (keywords ?? []).map(async (kw) => {
            const { data: results } = await supabase
                .from('scan_results')
                .select('brand_visibility, sentiment_score, analysis_json, raw_response, scan_jobs!inner(keyword_id, engine)')
                .eq('scan_jobs.keyword_id', kw.id)
                .order('created_at', { ascending: false })
                .limit(10);

            const total = results?.length ?? 0;
            const visible = results?.filter(r => r.brand_visibility).length ?? 0;

            return {
                id: kw.id,
                keyword: kw.query,
                lastScanned: kw.last_scanned_at,
                totalScans: total,
                visibilityRate: total > 0 ? Math.round((visible / total) * 100) : 0,
                latestResult: results?.[0] || null
            };
        })
    );

    res.json({ data: keywordStats });
});

/**
 * GET /api/v1/dashboard/citations
 * Get top citation sources
 */
router.get('/citations', async (req: Request, res: Response) => {
    const { project_id, limit = '20' } = req.query;

    if (!project_id) {
        res.status(400).json({ error: 'project_id is required' });
        return;
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
        .from('citations')
        .select('id, domain, url, title, snippet, is_brand_domain, is_competitor_domain')
        .limit(parseInt(limit as string, 10));

    if (error) {
        res.status(500).json({ error: 'Failed to load citations' });
        return;
    }

    // Aggregate by domain for summary
    const domains: Record<string, { count: number; isBrand: boolean; isCompetitor: boolean }> = {};
    for (const c of (data ?? [])) {
        if (!c.domain) continue;
        if (!domains[c.domain]) {
            domains[c.domain] = { count: 0, isBrand: false, isCompetitor: false };
        }
        const domainEntry = domains[c.domain]!;
        domainEntry.count++;
        if (c.is_brand_domain) domainEntry.isBrand = true;
        if (c.is_competitor_domain) domainEntry.isCompetitor = true;
    }

    const aggregated = Object.entries(domains)
        .map(([domain, stats]) => ({ domain, ...stats }))
        .sort((a, b) => b.count - a.count);

    res.json({
        data: aggregated,
        raw: data ?? []
    });
});

export { router as dashboardRouter };
