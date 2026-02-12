import { eq } from 'drizzle-orm';

import { createProvider } from '@/core/search/factory';
import { projects } from '@/db/schema/core';
import { createLogger } from '../core/logger';
import { db } from '../db';

export interface ProbeJobData {
    projectId: string;
    brandName: string;
    domain: string;
    goldenQueries: string[];
}

export interface ProbeResult {
    query: string;
    engine: string;
    visible: boolean;
    domainCited: boolean;
    sentiment: 'positive' | 'neutral' | 'negative' | 'absent';
    latencyMs: number;
}

export interface ProbeMetrics {
    projectId: string;
    date: string;
    totalProbes: number;
    visibleCount: number;
    citedCount: number;
    visibilityRate: number;
    citationRate: number;
    sentimentScore: number;
    engines: string;
    rawResults: ProbeResult[];
}

export class ProbingService {
    async probeQuery(
        query: string,
        engine: 'openai' | 'perplexity' | 'gemini',
        brandName: string,
        domain: string,
    ): Promise<ProbeResult> {
        const provider = createProvider(engine);
        const result = await provider.search(query);

        const brandLower = brandName.toLowerCase();
        const domainClean = domain
            .replace('https://', '')
            .replace('http://', '')
            .replace('www.', '')
            .toLowerCase();
        const contentLower = result.content.toLowerCase();

        const visible = contentLower.includes(brandLower);
        const domainCited =
            result.citations.some((c) => c.domain?.includes(domainClean)) ||
            contentLower.includes(domainClean);

        let sentiment: 'positive' | 'neutral' | 'negative' | 'absent' = 'absent';
        if (visible) {
            if (
                contentLower.includes('recomend') ||
                contentLower.includes('mejor') ||
                contentLower.includes('líder')
            ) {
                sentiment = 'positive';
            } else if (
                contentLower.includes('problema') ||
                contentLower.includes('negativ') ||
                contentLower.includes('malo')
            ) {
                sentiment = 'negative';
            } else {
                sentiment = 'neutral';
            }
        }

        return {
            query,
            engine,
            visible,
            domainCited,
            sentiment,
            latencyMs: result.latencyMs,
        };
    }

    async executeProbing(data: ProbeJobData): Promise<ProbeMetrics> {
        const log = createLogger({ projectId: data.projectId });
        const { projectId, brandName, domain, goldenQueries } = data;

        log.info('Starting probing run', {
            brand: brandName,
            queriesCount: goldenQueries.length,
        });

        const engines: Array<'openai' | 'perplexity' | 'gemini'> = ['openai', 'perplexity'];
        const results: ProbeResult[] = [];

        for (const query of goldenQueries) {
            for (const engine of engines) {
                try {
                    const result = await this.probeQuery(query, engine, brandName, domain);
                    results.push(result);

                    log.debug('Query probed', {
                        query: query.substring(0, 50),
                        engine,
                        visible: result.visible,
                    });

                    await new Promise((resolve) => setTimeout(resolve, 1000));
                } catch (err) {
                    log.warn('Probe failed', {
                        query,
                        engine,
                        error: (err as Error).message,
                    });
                }
            }
        }

        const totalProbes = results.length;
        const visibleCount = results.filter((r) => r.visible).length;
        const citedCount = results.filter((r) => r.domainCited).length;
        const positiveCount = results.filter((r) => r.sentiment === 'positive').length;
        const negativeCount = results.filter((r) => r.sentiment === 'negative').length;

        const visibilityRate = totalProbes > 0 ? visibleCount / totalProbes : 0;
        const citationRate = totalProbes > 0 ? citedCount / totalProbes : 0;
        const sentimentScore = totalProbes > 0 ? (positiveCount - negativeCount) / totalProbes : 0;

        const metrics: ProbeMetrics = {
            projectId,
            date: new Date().toISOString().split('T')[0]!,
            totalProbes,
            visibleCount,
            citedCount,
            visibilityRate: Math.round(visibilityRate * 100),
            citationRate: Math.round(citationRate * 100),
            sentimentScore: Math.round(sentimentScore * 100),
            engines: engines.join(','),
            rawResults: results,
        };

        log.info('Probing completed', {
            visibilityRate: `${metrics.visibilityRate}%`,
            citationRate: `${metrics.citationRate}%`,
            sentimentScore: metrics.sentimentScore,
        });

        return metrics;
    }

    async getProjectForProbing(projectId: string): Promise<{ name: string; domain: string }> {
        const projectData = await db
            .select({
                name: projects.name,
                domain: projects.domain,
            })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

        if (projectData.length === 0) {
            throw new Error('Project not found');
        }

        return projectData[0]!;
    }
}
