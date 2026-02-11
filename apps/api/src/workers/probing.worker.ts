import { Worker, Job } from 'bullmq';
import { getRedisConnection, QUEUE_NAMES, addScanJob } from '../infrastructure/queue/index';
import { eq } from 'drizzle-orm';
import { db, projects } from '../infrastructure/database/index';
import { logger, createLogger } from '../infrastructure/logging/index';
import { createProvider } from '../infrastructure/search/index';

/**
 * Probing job data - for automated Share of Model checks
 */
export interface ProbeJobData {
    projectId: string;
    brandName: string;
    domain: string;
    goldenQueries: string[];
}

/**
 * Probe a single query against an LLM
 */
async function probeQuery(
    query: string,
    engine: 'openai' | 'perplexity' | 'gemini',
    brandName: string,
    domain: string
): Promise<{
    query: string;
    engine: string;
    visible: boolean;
    domainCited: boolean;
    sentiment: 'positive' | 'neutral' | 'negative' | 'absent';
    latencyMs: number;
}> {
    const provider = createProvider(engine);
    const result = await provider.search(query);

    const brandLower = brandName.toLowerCase();
    const domainClean = domain.replace('https://', '').replace('http://', '').replace('www.', '').toLowerCase();
    const contentLower = result.content.toLowerCase();

    const visible = contentLower.includes(brandLower);
    const domainCited = result.citations.some(c => c.domain?.includes(domainClean)) ||
        contentLower.includes(domainClean);

    // Simple sentiment detection
    let sentiment: 'positive' | 'neutral' | 'negative' | 'absent' = 'absent';
    if (visible) {
        // Basic heuristic - could be replaced with LLM-as-a-Judge
        if (contentLower.includes('recomend') || contentLower.includes('mejor') || contentLower.includes('líder')) {
            sentiment = 'positive';
        } else if (contentLower.includes('problema') || contentLower.includes('negativ') || contentLower.includes('malo')) {
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

/**
 * Probing Worker - runs automated Share of Model checks
 * Executes golden queries against multiple LLMs and aggregates visibility metrics
 */
export function createProbingWorker() {
    const worker = new Worker<ProbeJobData>(
        QUEUE_NAMES.SCHEDULED,
        async (job: Job<ProbeJobData>) => {
            const log = createLogger({ jobId: job.id, projectId: job.data.projectId });
            const { projectId, brandName, domain, goldenQueries } = job.data;

            log.info('Starting probing run', {
                brand: brandName,
                queriesCount: goldenQueries.length
            });

            const engines: Array<'openai' | 'perplexity' | 'gemini'> = ['openai', 'perplexity'];
            const results: Array<{
                query: string;
                engine: string;
                visible: boolean;
                domainCited: boolean;
                sentiment: string;
                latencyMs: number;
            }> = [];

            // Probe each query against each engine
            for (const query of goldenQueries) {
                for (const engine of engines) {
                    try {
                        const result = await probeQuery(query, engine, brandName, domain);
                        results.push(result);

                        log.debug('Query probed', {
                            query: query.substring(0, 50),
                            engine,
                            visible: result.visible
                        });

                        // Small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1000));

                    } catch (err) {
                        log.warn('Probe failed', {
                            query,
                            engine,
                            error: (err as Error).message
                        });
                    }
                }
            }

            // Calculate aggregated metrics (Share of Model)
            const totalProbes = results.length;
            const visibleCount = results.filter(r => r.visible).length;
            const citedCount = results.filter(r => r.domainCited).length;
            const positiveCount = results.filter(r => r.sentiment === 'positive').length;
            const negativeCount = results.filter(r => r.sentiment === 'negative').length;

            const visibilityRate = totalProbes > 0 ? visibleCount / totalProbes : 0;
            const citationRate = totalProbes > 0 ? citedCount / totalProbes : 0;
            const sentimentScore = totalProbes > 0
                ? (positiveCount - negativeCount) / totalProbes
                : 0;

            const metrics = {
                projectId,
                date: new Date().toISOString().split('T')[0],
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

            // Store in project settings or a dedicated metrics table
            // For now, log and return

            return metrics;
        },
        {
            connection: getRedisConnection(),
            concurrency: 1, // Sequential to avoid rate limits
        }
    );

    worker.on('completed', (job) => {
        logger.info('Probing job completed', { jobId: job.id });
    });

    worker.on('failed', (job, err) => {
        logger.error('Probing job failed', { jobId: job?.id, error: err.message });
    });

    return worker;
}

/**
 * Schedule a daily probing run for a project
 */
export async function scheduleDailyProbing(
    projectId: string,
    goldenQueries: string[]
): Promise<void> {
    // Get project info
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

    const project = projectData[0]!;

    // Import queue dynamically to avoid circular deps
    const { getQueue } = await import('../infrastructure/queue/index.js');
    const queue = getQueue(QUEUE_NAMES.SCHEDULED);

    // Schedule daily at 3 AM with some jitter
    const jitterMinutes = Math.floor(Math.random() * 60);

    await queue.add(
        'daily-probe',
        {
            projectId,
            brandName: project.name,
            domain: project.domain,
            goldenQueries,
        } as ProbeJobData,
        {
            repeat: {
                pattern: `${jitterMinutes} 3 * * *`, // Daily at 3:XX AM
            },
            jobId: `probe-${projectId}`,
        }
    );

    logger.info('Daily probing scheduled', {
        projectId,
        queriesCount: goldenQueries.length
    });
}
