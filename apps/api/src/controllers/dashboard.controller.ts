import { Hono } from 'hono';
import { eq, gte, desc, and } from 'drizzle-orm';
import { db, scanResults, scanJobs, keywords, citations } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const app = new Hono()
    .get('/share-of-model', async (c) => {
        const project_id = c.req.query('project_id');
        const days = c.req.query('days') || '30';

        if (!project_id) {
            return c.json({ error: 'project_id is required' }, 400);
        }

        try {
            const daysNum = parseInt(days, 10);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysNum);

            const results = await db
                .select({
                    brand_visibility: scanResults.brand_visibility,
                    sentiment_score: scanResults.sentiment_score,
                    recommendation_type: scanResults.recommendation_type,
                    created_at: scanResults.created_at,
                    engine: scanJobs.engine,
                    project_id: keywords.project_id,
                    query: keywords.query,
                })
                .from(scanResults)
                .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
                .innerJoin(keywords, eq(scanJobs.keyword_id, keywords.id))
                .where(
                    and(
                        eq(keywords.project_id, project_id),
                        gte(scanResults.created_at, startDate)
                    )
                )
                .orderBy(desc(scanResults.created_at));

            const totalScans = results.length;
            const visibleCount = results.filter(r => r.brand_visibility === true).length;
            const visibilityRate = totalScans > 0 ? Math.round((visibleCount / totalScans) * 100) : 0;

            const byEngine: Record<string, { total: number; visible: number; rate: number }> = {};
            for (const r of results) {
                const engine = r.engine || 'unknown';
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

            const byType: Record<string, number> = {
                direct_recommendation: 0,
                neutral_comparison: 0,
                negative_mention: 0,
                absent: 0,
            };
            for (const r of results) {
                const type = r.recommendation_type || 'absent';
                if (type in byType) byType[type] = (byType[type] || 0) + 1;
            }

            const sentiments = results
                .filter(r => r.sentiment_score != null)
                .map(r => r.sentiment_score as number);
            const avgSentiment = sentiments.length > 0
                ? Math.round((sentiments.reduce((a, b) => a + b, 0) / sentiments.length) * 100) / 100
                : null;

            const timeline: Array<{ date: string; scans: number; visible: number; sentiment: number | null }> = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0]!;
                const dayResults = results.filter(r => {
                    const createdDate = r.created_at?.toISOString().split('T')[0];
                    return createdDate === dateStr;
                });
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

            return c.json({
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
        } catch (error) {
            logger.error('Failed to get dashboard data', { error: (error as Error).message });
            return c.json({ error: 'Failed to load dashboard' }, 500);
        }
    })
    .get('/keywords', async (c) => {
        const project_id = c.req.query('project_id');

        if (!project_id) {
            return c.json({ error: 'project_id is required' }, 400);
        }

        try {
            const keywordList = await db
                .select({
                    id: keywords.id,
                    query: keywords.query,
                    last_scanned_at: keywords.last_scanned_at,
                })
                .from(keywords)
                .where(
                    and(
                        eq(keywords.project_id, project_id),
                        eq(keywords.is_active, true)
                    )
                );

            const keywordStats = await Promise.all(
                keywordList.map(async (kw) => {
                    const results = await db
                        .select({
                            brand_visibility: scanResults.brand_visibility,
                            sentiment_score: scanResults.sentiment_score,
                            analysis_json: scanResults.analysis_json,
                            raw_response: scanResults.raw_response,
                            keyword_id: scanJobs.keyword_id,
                            engine: scanJobs.engine,
                        })
                        .from(scanResults)
                        .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
                        .where(eq(scanJobs.keyword_id, kw.id))
                        .orderBy(desc(scanResults.created_at))
                        .limit(10);

                    const total = results.length;
                    const visible = results.filter(r => r.brand_visibility).length;

                    return {
                        id: kw.id,
                        keyword: kw.query,
                        lastScanned: kw.last_scanned_at,
                        totalScans: total,
                        visibilityRate: total > 0 ? Math.round((visible / total) * 100) : 0,
                        latestResult: results[0] || null
                    };
                })
            );

            return c.json({ data: keywordStats });
        } catch (error) {
            logger.error('Failed to load keywords', { error: (error as Error).message });
            return c.json({ error: 'Failed to load keywords' }, 500);
        }
    })
    .get('/citations', async (c) => {
        const project_id = c.req.query('project_id');
        const limit = c.req.query('limit') || '20';

        if (!project_id) {
            return c.json({ error: 'project_id is required' }, 400);
        }

        try {
            const data = await db
                .select({
                    id: citations.id,
                    domain: citations.domain,
                    url: citations.url,
                    title: citations.title,
                    is_brand_domain: citations.is_brand_domain,
                    is_competitor_domain: citations.is_competitor_domain,
                })
                .from(citations)
                .limit(parseInt(limit, 10));

            const domains: Record<string, { count: number; isBrand: boolean; isCompetitor: boolean }> = {};
            for (const cit of data) {
                if (!cit.domain) continue;
                if (!domains[cit.domain]) {
                    domains[cit.domain] = { count: 0, isBrand: false, isCompetitor: false };
                }
                const domainEntry = domains[cit.domain]!;
                domainEntry.count++;
                if (cit.is_brand_domain) domainEntry.isBrand = true;
                if (cit.is_competitor_domain) domainEntry.isCompetitor = true;
            }

            const aggregated = Object.entries(domains)
                .map(([domain, stats]) => ({ domain, ...stats }))
                .sort((a, b) => b.count - a.count);

            return c.json({
                data: aggregated,
                raw: data
            });
        } catch (error) {
            logger.error('Failed to load citations', { error: (error as Error).message });
            return c.json({ error: 'Failed to load citations' }, 500);
        }
    });

export default app;
export type DashboardAppType = typeof app;
