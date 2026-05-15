import { and, desc, eq, gte } from 'drizzle-orm';

import { logger } from '../core/logger';
import { db } from '../db';
import { citations, keywords, projects, scanJobs, scanResults, scanRuns } from '../db/schema/core';

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
    perplexity: number;
    openai: number;
    gemini: number;
    claude: number;
}

export interface KeywordMetrics {
    keyword_id: string;
    query: string;
    intent: string | null;
    total_scans: number;
    avg_sentiment: number | null;
    visibility_rate: number;
    last_scanned_at: Date | null;
    trend: number[];
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

export interface ReportStatus {
    status: 'empty' | 'collecting' | 'needs_connection' | 'ready_partial' | 'ready' | 'failed';
    runId: string | null;
    totalJobs: number;
    finishedJobs: number;
    completedJobs: number;
    blockedJobs: number;
    authRequiredJobs: number;
    captchaRequiredJobs: number;
    failedJobs: number;
    visibleCount: number;
    createdAt: Date | null;
    completedAt: Date | null;
    etaHours: number;
}

export class DashboardService {
    async getReportStatus(projectId: string): Promise<ReportStatus> {
        const latestRun = await db
            .select()
            .from(scanRuns)
            .where(eq(scanRuns.project_id, projectId))
            .orderBy(desc(scanRuns.created_at))
            .limit(1);

        const run = latestRun[0];
        if (!run) {
            return {
                status: 'empty',
                runId: null,
                totalJobs: 0,
                finishedJobs: 0,
                completedJobs: 0,
                blockedJobs: 0,
                authRequiredJobs: 0,
                captchaRequiredJobs: 0,
                failedJobs: 0,
                visibleCount: 0,
                createdAt: null,
                completedAt: null,
                etaHours: 24,
            };
        }

        const jobs = await db
            .select({ status: scanJobs.status })
            .from(scanJobs)
            .where(eq(scanJobs.run_id, run.id));

        const count = (status: string) => jobs.filter((job) => job.status === status).length;
        const completedJobs = count('completed');
        const authRequiredJobs = count('auth_required');
        const captchaRequiredJobs = count('captcha_required');
        const blockedJobs = count('blocked');
        const failedJobs = count('failed');
        const finishedJobs =
            completedJobs +
            authRequiredJobs +
            captchaRequiredJobs +
            blockedJobs +
            failedJobs +
            count('cancelled');

        const status =
            run.status === 'processing' || run.status === 'pending'
                ? 'collecting'
                : completedJobs > 0 &&
                    (authRequiredJobs > 0 ||
                        captchaRequiredJobs > 0 ||
                        blockedJobs > 0 ||
                        failedJobs > 0)
                  ? 'ready_partial'
                  : completedJobs > 0
                    ? 'ready'
                    : authRequiredJobs > 0 || captchaRequiredJobs > 0
                      ? 'needs_connection'
                      : 'failed';

        return {
            status,
            runId: run.id,
            totalJobs: run.total_jobs ?? jobs.length,
            finishedJobs,
            completedJobs,
            blockedJobs,
            authRequiredJobs,
            captchaRequiredJobs,
            failedJobs,
            visibleCount: run.visible_count ?? 0,
            createdAt: run.created_at,
            completedAt: run.completed_at,
            etaHours: 24,
        };
    }

    async getShareOfModel(projectId: string, days: number = 30): Promise<ShareOfModelMetrics> {
        logger.debug({ projectId, days }, 'Calculating Share of Model metrics');

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
            .where(and(eq(keywords.project_id, projectId), gte(scanResults.created_at, startDate)))
            .orderBy(desc(scanResults.created_at));

        const totalScans = results.length;
        const visibleCount = results.filter((r) => r.brand_visibility === true).length;
        const visibilityRate = totalScans > 0 ? Math.round((visibleCount / totalScans) * 100) : 0;

        const byEngine: Record<string, EngineMetrics> = {};
        for (const r of results) {
            const engine = r.engine || 'unknown';
            const metrics = byEngine[engine] ?? { total: 0, visible: 0, rate: 0 };
            metrics.total++;
            byEngine[engine] = metrics;
        }

        for (const engine of Object.keys(byEngine)) {
            const e = byEngine[engine];
            if (!e) continue;
            const visible = results.filter(
                (r) => (r.engine || 'unknown') === engine && r.brand_visibility === true,
            ).length;
            e.visible = visible;
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
            .filter((r) => r.sentiment_score != null)
            .map((r) => r.sentiment_score as number);
        const avgSentiment =
            sentiments.length > 0
                ? Math.round((sentiments.reduce((a, b) => a + b, 0) / sentiments.length) * 100) /
                  100
                : null;

        const timeline: TimelineEntry[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            if (!dateStr) continue;
            const dayResults = results.filter((r) => {
                const createdDate = r.created_at?.toISOString().split('T')[0];
                return createdDate === dateStr;
            });
            const daySentiments = dayResults
                .filter((r) => r.sentiment_score != null)
                .map((r) => r.sentiment_score as number);

            const pResults = dayResults.filter((r) => r.engine === 'perplexity');
            const oResults = dayResults.filter((r) => r.engine === 'openai');
            const gResults = dayResults.filter((r) => r.engine === 'gemini');
            const cResults = dayResults.filter((r) => r.engine === 'claude');

            timeline.push({
                date: dateStr,
                scans: dayResults.length,
                visible: dayResults.filter((r) => r.brand_visibility).length,
                sentiment:
                    daySentiments.length > 0
                        ? Math.round(
                              (daySentiments.reduce((a, b) => a + b, 0) / daySentiments.length) *
                                  100,
                          ) / 100
                        : null,
                perplexity:
                    pResults.length > 0
                        ? Math.round(
                              (pResults.filter((r) => r.brand_visibility).length /
                                  pResults.length) *
                                  100,
                          )
                        : 0,
                openai:
                    oResults.length > 0
                        ? Math.round(
                              (oResults.filter((r) => r.brand_visibility).length /
                                  oResults.length) *
                                  100,
                          )
                        : 0,
                gemini:
                    gResults.length > 0
                        ? Math.round(
                              (gResults.filter((r) => r.brand_visibility).length /
                                  gResults.length) *
                                  100,
                          )
                        : 0,
                claude:
                    cResults.length > 0
                        ? Math.round(
                              (cResults.filter((r) => r.brand_visibility).length /
                                  cResults.length) *
                                  100,
                          )
                        : 0,
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
        logger.debug({ projectId, limit }, 'Getting keyword performance');

        const keywordData = await db
            .select({
                keyword_id: keywords.id,
                query: keywords.query,
                intent: keywords.intent,
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
                    created_at: scanResults.created_at,
                })
                .from(scanResults)
                .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
                .where(eq(scanJobs.keyword_id, kw.keyword_id))
                .orderBy(desc(scanResults.created_at))
                .limit(10); // Last 10 results for trend

            const totalScans = results.length;
            const visibleScans = results.filter((r) => r.brand_visibility === true).length;
            const visibilityRate =
                totalScans > 0 ? Math.round((visibleScans / totalScans) * 100) : 0;

            const sentiments = results
                .filter((r) => r.sentiment_score != null)
                .map((r) => r.sentiment_score as number);
            const avgSentiment =
                sentiments.length > 0
                    ? Math.round(
                          (sentiments.reduce((a, b) => a + b, 0) / sentiments.length) * 100,
                      ) / 100
                    : null;

            const trend = results
                .reverse() // Oldest first for chart
                .map((r) => (r.brand_visibility ? 100 : 0));

            metrics.push({
                keyword_id: kw.keyword_id,
                query: kw.query,
                intent: kw.intent,
                total_scans: totalScans,
                avg_sentiment: avgSentiment,
                visibility_rate: visibilityRate,
                last_scanned_at: kw.last_scanned_at,
                trend,
            });
        }

        return metrics;
    }

    async getCitationAnalysis(projectId: string, limit: number = 100): Promise<CitationAnalysis> {
        logger.debug({ projectId, limit }, 'Analyzing citations');

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
        const uniqueDomains = new Set(data.map((c) => c.domain).filter(Boolean)).size;

        const domainCounts: Record<
            string,
            { count: number; is_brand: boolean; is_competitor: boolean }
        > = {};
        for (const citation of data) {
            const domain = citation.domain || 'unknown';
            if (!domainCounts[domain]) {
                domainCounts[domain] = {
                    count: 0,
                    is_brand: citation.is_brand_domain ?? false,
                    is_competitor: citation.is_competitor_domain ?? false,
                };
            }
            const stats = domainCounts[domain];
            if (stats) {
                stats.count++;
            }
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

    async getTopBrands(
        projectId: string,
        limit: number = 10,
    ): Promise<{ name: string; domain?: string; shareOfVoice: number; totalMentions: number }[]> {
        logger.debug({ projectId, limit }, 'Calculating Top Brands (Aggregated SOV)');

        const scans = await db
            .select({
                analysis_json: scanResults.analysis_json,
            })
            .from(scanResults)
            .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
            .innerJoin(keywords, eq(scanJobs.keyword_id, keywords.id))
            .where(eq(keywords.project_id, projectId));

        // Fetch project name and domain for the main brand key
        const [project] = await db
            .select({ name: projects.name, domain: projects.domain })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);
        const mainBrandName = project?.name || 'Your Brand';
        const mainBrandDomain = project?.domain || '';

        let totalMentions = 0;
        const brandCounts: Record<string, { count: number; domain?: string }> = {};

        for (const scan of scans) {
            const analysis = scan.analysis_json as {
                brand_visibility?: boolean;
                competitor_mentions?: Record<string, unknown>;
            } | null;
            if (!analysis) continue;

            // 1. Count main brand
            if (analysis.brand_visibility === true) {
                if (!brandCounts[mainBrandName]) {
                    brandCounts[mainBrandName] = { count: 0, domain: mainBrandDomain };
                }
                brandCounts[mainBrandName].count++;
                totalMentions++;
            }

            // 2. Count competitors from mentions map
            if (analysis.competitor_mentions && typeof analysis.competitor_mentions === 'object') {
                for (const [comp, mentioned] of Object.entries(analysis.competitor_mentions)) {
                    if (mentioned === true) {
                        const brand = comp.trim();
                        if (!brandCounts[brand]) {
                            // Basic heuristic: if it contains a dot, assume it's a domain
                            const domain = brand.includes('.') ? brand : undefined;
                            brandCounts[brand] = { count: 0, domain };
                        }
                        brandCounts[brand].count++;
                        totalMentions++;
                    }
                }
            }
        }

        const topBrands = Object.entries(brandCounts)
            .map(([name, data]) => ({
                name,
                domain: data.domain,
                totalMentions: data.count,
                shareOfVoice:
                    totalMentions > 0 ? Math.round((data.count / totalMentions) * 100) : 0,
            }))
            .sort((a, b) => b.totalMentions - a.totalMentions)
            .slice(0, limit);

        return topBrands;
    }
}

let dashboardService: DashboardService | null = null;

export function getDashboardService(): DashboardService {
    if (!dashboardService) {
        dashboardService = new DashboardService();
    }
    return dashboardService;
}
