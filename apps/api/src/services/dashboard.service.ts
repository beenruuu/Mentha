import { eq, gte, desc, and } from 'drizzle-orm';
import { db } from '../db';
import { scanResults, scanJobs, keywords, citations } from '../db/schema/core';
import { logger } from '../core/logger';

export interface ShareOfModelMetrics {
    totalScans: number;
    visibleCount: number;
    visibilityRate: number;
    byEngine: Record<string, EngineMetrics>;
    byRecommendationType: Record<string, number>;
    avgSentiment: number | null;
    timeline: TimelineEntry[];
}

export interface EngineMetrics {
    total: number;
    visible: number;
    rate: number;
}

export interface TimelineEntry {
    date: string;
    scans: number;
    visible: number;
    sentiment: number | null;
}

export interface KeywordMetrics {
    keyword_id: string;
    query: string;
    total_scans: number;
    avg_sentiment: number | null;
    visibility_rate: number;
    last_scanned_at: Date | null;
}

export interface CitationAnalysis {
    totalCitations: number;
    uniqueDomains: number;
    topDomains: Array<{ domain: string; count: number; is_brand: boolean; is_competitor: boolean }>;
    raw: Array<{
        id: string;
        url: string;
        domain: string | null;
        title: string | null;
        position: number | null;
        is_brand_domain: boolean | null;
        is_competitor_domain: boolean | null;
    }>;
}

export class DashboardService {
    async getShareOfModel(projectId: string, days: number = 30): Promise<ShareOfModelMetrics> {
        logger.debug('Calculating Share of Model metrics', { projectId, days });

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

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
                    eq(keywords.project_id, projectId),
                    gte(scanResults.created_at, startDate)
                )
            )
            .orderBy(desc(scanResults.created_at));

        const totalScans = results.length;
        const visibleCount = results.filter(r => r.brand_visibility === true).length;
        const visibilityRate = totalScans > 0 ? Math.round((visibleCount / totalScans) * 100) : 0;

        const byEngine: Record<string, EngineMetrics> = {};
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

        const timeline: TimelineEntry[] = [];
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

        return {
            totalScans,
            visibleCount,
            visibilityRate,
            byEngine,
            byRecommendationType: byType,
            avgSentiment,
            timeline,
        };
    }

    async getKeywordPerformance(projectId: string, limit: number = 20): Promise<KeywordMetrics[]> {
        logger.debug('Getting keyword performance', { projectId, limit });

        const keywordData = await db
            .select({
                keyword_id: keywords.id,
                query: keywords.query,
                last_scanned_at: keywords.last_scanned_at,
            })
            .from(keywords)
            .where(eq(keywords.project_id, projectId))
            .orderBy(desc(keywords.created_at))
            .limit(limit);

        const metrics: KeywordMetrics[] = [];

        for (const kw of keywordData) {
            const results = await db
                .select({
                    sentiment_score: scanResults.sentiment_score,
                    brand_visibility: scanResults.brand_visibility,
                })
                .from(scanResults)
                .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
                .where(eq(scanJobs.keyword_id, kw.keyword_id));

            const totalScans = results.length;
            const visibleScans = results.filter(r => r.brand_visibility === true).length;
            const visibilityRate = totalScans > 0 ? Math.round((visibleScans / totalScans) * 100) : 0;

            const sentiments = results
                .filter(r => r.sentiment_score != null)
                .map(r => r.sentiment_score as number);
            const avgSentiment = sentiments.length > 0
                ? Math.round((sentiments.reduce((a, b) => a + b, 0) / sentiments.length) * 100) / 100
                : null;

            metrics.push({
                keyword_id: kw.keyword_id,
                query: kw.query,
                total_scans: totalScans,
                avg_sentiment: avgSentiment,
                visibility_rate: visibilityRate,
                last_scanned_at: kw.last_scanned_at,
            });
        }

        return metrics;
    }

    async getCitationAnalysis(projectId: string, limit: number = 100): Promise<CitationAnalysis> {
        logger.debug('Analyzing citations', { projectId, limit });

        const data = await db
            .select({
                id: citations.id,
                url: citations.url,
                domain: citations.domain,
                title: citations.title,
                position: citations.position,
                is_brand_domain: citations.is_brand_domain,
                is_competitor_domain: citations.is_competitor_domain,
            })
            .from(citations)
            .innerJoin(scanResults, eq(citations.result_id, scanResults.id))
            .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
            .innerJoin(keywords, eq(scanJobs.keyword_id, keywords.id))
            .where(eq(keywords.project_id, projectId))
            .orderBy(desc(citations.id))
            .limit(limit);

        const totalCitations = data.length;
        const uniqueDomains = new Set(data.map(c => c.domain).filter(Boolean)).size;

        const domainCounts: Record<string, { count: number; is_brand: boolean; is_competitor: boolean }> = {};
        for (const citation of data) {
            const domain = citation.domain || 'unknown';
            if (!domainCounts[domain]) {
                domainCounts[domain] = {
                    count: 0,
                    is_brand: citation.is_brand_domain ?? false,
                    is_competitor: citation.is_competitor_domain ?? false,
                };
            }
            domainCounts[domain]!.count++;
        }

        const topDomains = Object.entries(domainCounts)
            .map(([domain, stats]) => ({ domain, ...stats }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalCitations,
            uniqueDomains,
            topDomains,
            raw: data,
        };
    }
}

let dashboardService: DashboardService | null = null;

export function getDashboardService(): DashboardService {
    if (!dashboardService) {
        dashboardService = new DashboardService();
    }
    return dashboardService;
}
