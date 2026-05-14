import { Worker } from 'bullmq';
import { eq, sql } from 'drizzle-orm';

import { logger } from '../core/logger';
import { getRedisConnection, QUEUE_NAMES, type ScanJobData } from '../core/queue';
import { createProvider } from '../core/search/factory';
import { db } from '../db';
import { keywords, scanJobs, scanResults, citations, projects } from '../db/schema/core';
import { AnalysisService } from '../services/analysis.service';

export const scraperWorker = new Worker<ScanJobData>(
    QUEUE_NAMES.SCRAPERS,
    async (job) => {
        logger.info(
            { jobId: job.id, engine: job.data.engine, query: job.data.query },
            '🔍 Starting scraper job',
        );

        try {
            const { engine, query, brand, projectId, competitors } = job.data;
            
            const results = [];
            const engineName = engine;
            const provider = createProvider(engineName as any);
            logger.debug({ engine: engineName }, 'Fetching from provider');
            
            const result = await provider.search(query, {
                purpose: 'search',
                systemPrompt: `You are a helpful AI assistant. Provide a detailed, objective, and accurate answer to the user's query. Focus on providing relevant information and citing sources where possible.`,
            });

            // Check if brand is mentioned in response
            const brandMentioned = result.content
                ?.toLowerCase()
                .includes(brand.toLowerCase()) || false;

            // Save result to database
            const [scanResult] = await db
                .insert(scanResults)
                .values({
                    job_id: job.id as string,
                    raw_response: result.content || '',
                    brand_visibility: brandMentioned,
                    sentiment_score: null,
                    token_count: result.usage?.totalTokens || 0,
                    analysis_json: {
                        content: result.content,
                        citations: result.citations,
                        latencyMs: result.latencyMs,
                        engine: engineName,
                    } as Record<string, unknown>,
                })
                .returning();

            if (!scanResult) throw new Error('Failed to save scan result');

            // Persist citations if present and link to scan result
            try {
                const projectRow = await db
                    .select()
                    .from(projects)
                    .where(eq(projects.id, projectId))
                    .limit(1);
                const projectDomain = projectRow[0]?.domain || '';
                const normalizedProjectDomain = projectDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();

                if (Array.isArray(result.citations) && result.citations.length > 0) {
                    const citationInserts = result.citations.map((c: any) => {
                        let domain = null;
                        try {
                            const u = new URL(c.url);
                            domain = u.hostname.replace(/^www\./, '').toLowerCase();
                        } catch {
                            domain = null;
                        }

                        const isBrand = domain && normalizedProjectDomain && domain.includes(normalizedProjectDomain);
                        const isCompetitor = Array.isArray(competitors) && competitors.length > 0 && domain
                            ? competitors.some((comp) => domain.includes(comp.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')))
                            : false;

                        return {
                            result_id: scanResult.id,
                            url: c.url,
                            domain,
                            title: c.title || null,
                            position: c.position ?? null,
                            is_brand_domain: Boolean(isBrand),
                            is_competitor_domain: Boolean(isCompetitor),
                        };
                    });

                    await db.insert(citations).values(citationInserts).returning();
                }

                // Run analysis job immediately
                try {
                    const analysisSvc = new AnalysisService();
                    await analysisSvc.analyzeResult({
                        scanJobId: scanResult.id,
                        rawResponse: result.content || '',
                        brand: brand,
                        competitors: competitors || [],
                    });
                } catch (err) {
                    logger.warn({ err: (err as Error).message }, 'Analysis job failed');
                }

                results.push({
                    success: true,
                    engine: engineName,
                    query,
                    contentLength: result.content?.length || 0,
                });
            } catch (err) {
                logger.error({ err: (err as Error).message }, 'Failed to persist citations or trigger analysis');
            }

            // 1. Mark job as completed
            await db
                .update(scanJobs)
                .set({
                    status: 'completed',
                    completed_at: new Date(),
                })
                .where(eq(scanJobs.id, job.id!));

            // 2. Update progress in scan_runs with atomic operation
            const jobRecord = await db.select().from(scanJobs).where(eq(scanJobs.id, job.id!)).limit(1);
            const runId = jobRecord[0]?.run_id;

            if (runId) {
                const { scanRuns } = await import('../db/schema/core');

                // Increment completed jobs atomically
                await db.execute(sql`
                    UPDATE scan_runs
                    SET completed_jobs = completed_jobs + 1
                    WHERE id = ${runId}
                `);

                // Check if all jobs are done (atomic check)
                const [run] = await db
                    .select()
                    .from(scanRuns)
                    .where(eq(scanRuns.id, runId))
                    .limit(1);

                if (run && run.completed_jobs >= (run.total_jobs || 0)) {
                    const updateResult = await db
                        .update(scanRuns)
                        .set({ status: 'completed', completed_at: new Date() })
                        .where(
                            and(
                                eq(scanRuns.id, runId),
                                // Only update if status is still processing to prevent race condition
                                eq(scanRuns.status, 'processing')
                            )
                        )
                        .returning();

                    if (updateResult.length > 0) {
                        logger.info({ runId }, '🎊 Scan run completed!');
                    }
                }
            }

            // 3. Update last_scanned_at in keywords
            await db
                .update(keywords)
                .set({
                    last_scanned_at: new Date(),
                })
                .where(eq(keywords.id, job.data.keywordId));

            logger.info(
                {
                    jobId: job.id,
                    resultsCount: results.length,
                },
                '✅ Scan job completed',
            );

            return {
                success: true,
                results,
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';

            logger.error(
                {
                    jobId: job.id,
                    error: errorMsg,
                    attempt: job.attemptsMade,
                },
                '❌ Scraper job failed',
            );

            try {
                // Mark job as failed
                await db
                    .update(scanJobs)
                    .set({
                        status: 'failed',
                        error_message: errorMsg,
                        completed_at: new Date(),
                    })
                    .where(eq(scanJobs.id, job.id as any));
                
                logger.info({ jobId: job.id }, 'Successfully updated job status to failed');
            } catch (updateError) {
                logger.error(
                    {
                        jobId: job.id,
                        error: updateError instanceof Error ? updateError.message : 'Unknown error',
                    },
                    'Failed to update job status to failed in database',
                );
            }

            throw error; // Will trigger retry based on backoff config
        }
    },
    {
        connection: getRedisConnection(),
        concurrency: 3, // Process 3 scans in parallel
        autorun: false,
    },
);

// Event listeners
scraperWorker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Scraper job completed');
});

scraperWorker.on('failed', (job, err) => {
    logger.error(
        {
            jobId: job?.id,
            error: err.message,
        },
        'Scraper job permanently failed',
    );
});

export default scraperWorker;
