import type { Context } from 'hono';

import { logger } from '../core/logger';
import { BadRequestException, handleHttpException } from '../exceptions/http';
import { getDashboardService } from '../services/dashboard.service';

const dashboardService = getDashboardService();

export const DashboardController = {
    getShareOfModel: async (c: Context) => {
        const project_id = c.req.query('project_id');
        const days = c.req.query('days') || '30';

        if (!project_id) {
            throw new BadRequestException('project_id is required');
        }

        try {
            const daysNum = Math.max(1, Math.min(365, parseInt(days, 10) || 30));
            if (isNaN(daysNum)) {
                throw new BadRequestException('Invalid days parameter: must be a number');
            }

            const metrics = await dashboardService.getShareOfModel(project_id, daysNum);

            return c.json({
                data: {
                    summary: {
                        totalScans: metrics.totalScans,
                        visibleCount: metrics.visibleCount,
                        visibilityRate: metrics.visibilityRate,
                        avgSentiment: metrics.avgSentiment,
                        period: `${daysNum} days`,
                    },
                    byEngine: metrics.byEngine,
                    byType: metrics.byRecommendationType,
                    timeline: metrics.timeline,
                },
            });
        } catch (error) {
            logger.error(
                {
                    error: (error as Error).message,
                },
                'Failed to get dashboard data',
            );
            return handleHttpException(c, error);
        }
    },

    getKeywordPerformance: async (c: Context) => {
        const project_id = c.req.query('project_id');
        const limit = c.req.query('limit') || '20';

        if (!project_id) {
            throw new BadRequestException('project_id is required');
        }

        try {
            const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
            if (isNaN(limitNum)) {
                throw new BadRequestException('Invalid limit parameter: must be a number');
            }

            const metrics = await dashboardService.getKeywordPerformance(project_id, limitNum);

            const keywordStats = metrics.map((m) => ({
                id: m.keyword_id,
                keyword: m.query,
                intent: m.intent || 'unknown',
                lastScanned: m.last_scanned_at,
                totalScans: m.total_scans,
                visibilityRate: m.visibility_rate,
                avgSentiment: m.avg_sentiment,
                trend: m.trend || [],
            }));

            return c.json({ data: keywordStats });
        } catch (error) {
            logger.error(
                {
                    error: (error as Error).message,
                },
                'Failed to load keywords',
            );
            return handleHttpException(c, error);
        }
    },

    getCitationAnalysis: async (c: Context) => {
        const project_id = c.req.query('project_id');
        const limit = c.req.query('limit') || '100';

        if (!project_id) {
            throw new BadRequestException('project_id is required');
        }

        try {
            const limitNum = Math.max(1, Math.min(500, parseInt(limit, 10) || 100));
            if (isNaN(limitNum)) {
                throw new BadRequestException('Invalid limit parameter: must be a number');
            }

            const analysis = await dashboardService.getCitationAnalysis(project_id, limitNum);

            return c.json({
                data: analysis.topDomains,
                raw: analysis.raw,
                summary: {
                    totalCitations: analysis.totalCitations,
                    uniqueDomains: analysis.uniqueDomains,
                },
            });
        } catch (error) {
            logger.error(
                {
                    error: (error as Error).message,
                },
                'Citation analysis failed',
            );
            return handleHttpException(c, error);
        }
    },

    getTopBrands: async (c: Context) => {
        const project_id = c.req.query('project_id');
        const limit = c.req.query('limit') || '10';

        if (!project_id) {
            throw new BadRequestException('project_id is required');
        }

        try {
            const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
            if (isNaN(limitNum)) {
                throw new BadRequestException('Invalid limit parameter: must be a number');
            }

            const topBrands = await dashboardService.getTopBrands(project_id, limitNum);

            return c.json({ data: topBrands });
        } catch (error) {
            logger.error(
                {
                    error: (error as Error).message,
                },
                'Failed to load top brands',
            );
            return handleHttpException(c, error);
        }
    },
} as const;
