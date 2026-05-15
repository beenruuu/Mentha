import { Worker } from 'bullmq';
import { and, eq } from 'drizzle-orm';

import { env } from '../config/env';
import { logger } from '../core/logger';
import { getRedisConnection, QUEUE_NAMES, type ScanJobData } from '../core/queue';
import { runCamoufoxUiCapture } from '../core/ui-capture/camoufox-provider';
import type { UiCaptureProvider } from '../core/ui-capture/types';
import { db } from '../db';
import { citations, keywords, projects, scanJobs, scanResults } from '../db/schema/core';
import { AnalysisService } from '../services/analysis.service';

const ENGINE_TO_UI_PROVIDER: Record<string, UiCaptureProvider> = {
    perplexity: 'perplexity',
    openai: 'chatgpt',
    gemini: 'gemini',
    claude: 'claude',
};

function getUiProvider(engine: string): UiCaptureProvider {
    const provider = ENGINE_TO_UI_PROVIDER[engine];
    if (!provider) throw new Error(`No UI provider mapping for engine: ${engine}`);
    return provider;
}

type FinalJobStatus =
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'auth_required'
    | 'captcha_required'
    | 'blocked';

const FINAL_JOB_STATUSES = new Set<string>([
    'completed',
    'failed',
    'cancelled',
    'auth_required',
    'captcha_required',
    'blocked',
]);

function classifyErrorStatus(message: string): FinalJobStatus {
    const lower = message.toLowerCase();
    if (lower.includes('captcha') || lower.includes('verify you are human')) {
        return 'captcha_required';
    }
    if (lower.includes('log in') || lower.includes('sign in') || lower.includes('auth')) {
        return 'auth_required';
    }
    if (lower.includes('blocked') || lower.includes('access denied') || lower.includes('bot')) {
        return 'blocked';
    }
    return 'failed';
}

async function updateRunProgress(runId: string) {
    const { scanRuns } = await import('../db/schema/core');

    const jobs = await db
        .select({ status: scanJobs.status })
        .from(scanJobs)
        .where(eq(scanJobs.run_id, runId));
    const finalJobs = jobs.filter((item) => FINAL_JOB_STATUSES.has(item.status || ''));
    const completedCount = jobs.filter((item) => item.status === 'completed').length;
    const visibleCount = await db
        .select({ id: scanResults.id })
        .from(scanResults)
        .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
        .where(and(eq(scanJobs.run_id, runId), eq(scanResults.brand_visibility, true)));

    const nextStatus =
        jobs.length > 0 && finalJobs.length >= jobs.length
            ? finalJobs.length === completedCount
                ? 'completed'
                : completedCount > 0
                  ? 'ready_partial'
                  : 'failed'
            : 'processing';

    await db
        .update(scanRuns)
        .set({
            completed_jobs: finalJobs.length,
            visible_count: visibleCount.length,
            status: nextStatus,
            completed_at: nextStatus === 'processing' ? null : new Date(),
        })
        .where(eq(scanRuns.id, runId));
}

export const scraperWorker = new Worker<ScanJobData>(
    QUEUE_NAMES.SCRAPERS,
    async (job) => {
        logger.info(
            { jobId: job.id, engine: job.data.engine, query: job.data.query },
            '🔍 Starting scraper job',
        );

        try {
            const { engine, query, brand, projectId, competitors, userId } = job.data;
            const jobId = job.id?.toString();
            if (!jobId) {
                throw new Error('Scan job is missing an id');
            }

            await db
                .update(scanJobs)
                .set({
                    status: 'processing',
                    started_at: new Date(),
                    error_message: null,
                })
                .where(eq(scanJobs.id, jobId));

            const results = [];
            const engineName = engine;
            logger.debug({ engine: engineName }, 'Scraping with Camoufox');

            const provider = getUiProvider(engineName);
            logger.info(
                { provider, query: query.slice(0, 80) },
                'Starting Camoufox scrape for scan',
            );
            const captureResult = await runCamoufoxUiCapture({
                provider,
                prompt: query,
                userId,
            });
            const content = captureResult.responseMarkdown || '';
            const brandMentioned = content.toLowerCase().includes(brand.toLowerCase()) || false;
            const finalStatus: FinalJobStatus =
                captureResult.status === 'success' || captureResult.status === 'partial'
                    ? 'completed'
                    : captureResult.status;

            const [scanResult] = await db
                .insert(scanResults)
                .values({
                    job_id: job.id as string,
                    raw_response: content,
                    brand_visibility: brandMentioned,
                    sentiment_score: null,
                    token_count: 0,
                    analysis_json: {
                        content,
                        sources: captureResult.sources,
                        latencyMs: captureResult.latencyMs,
                        engine: engineName,
                        scrapeStatus: captureResult.status,
                        failureReason: captureResult.failureReason,
                    } as Record<string, unknown>,
                })
                .returning();

            if (!scanResult) throw new Error('Failed to save scan result');

            try {
                const projectRow = await db
                    .select()
                    .from(projects)
                    .where(eq(projects.id, projectId))
                    .limit(1);
                const projectDomain = projectRow[0]?.domain || '';
                const normalizedProjectDomain = projectDomain
                    .replace(/^https?:\/\//, '')
                    .replace(/^www\./, '')
                    .toLowerCase();

                const captureSources = captureResult.sources || [];
                if (captureSources.length > 0) {
                    const citationInserts = captureSources.map((c) => {
                        let domain = null;
                        try {
                            const u = new URL(c.url);
                            domain = u.hostname.replace(/^www\./, '').toLowerCase();
                        } catch {
                            domain = null;
                        }

                        const isBrand =
                            domain &&
                            normalizedProjectDomain &&
                            domain.includes(normalizedProjectDomain);
                        const isCompetitor =
                            Array.isArray(competitors) && competitors.length > 0 && domain
                                ? competitors.some((comp) =>
                                      domain.includes(
                                          comp
                                              .toLowerCase()
                                              .replace(/^https?:\/\//, '')
                                              .replace(/^www\./, ''),
                                      ),
                                  )
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

                try {
                    const analysisSvc = new AnalysisService();
                    await analysisSvc.analyzeResult({
                        scanJobId: scanResult.id,
                        rawResponse: content,
                        brand,
                        competitors: competitors || [],
                    });
                } catch (err) {
                    logger.warn({ err: (err as Error).message }, 'Analysis job failed');
                }

                results.push({
                    success: true,
                    engine: engineName,
                    query,
                    contentLength: content.length,
                });
            } catch (err) {
                logger.error(
                    { err: (err as Error).message },
                    'Failed to persist citations or trigger analysis',
                );
            }

            // 1. Mark job as terminal. Auth/captcha/block are expected provider outcomes.
            await db
                .update(scanJobs)
                .set({
                    status: finalStatus,
                    error_message:
                        finalStatus === 'completed'
                            ? null
                            : captureResult.failureReason || finalStatus,
                    completed_at: new Date(),
                })
                .where(eq(scanJobs.id, jobId));

            // 2. Update progress in scan_runs.
            const jobRecord = await db
                .select()
                .from(scanJobs)
                .where(eq(scanJobs.id, jobId))
                .limit(1);
            const runId = jobRecord[0]?.run_id;

            if (runId) {
                await updateRunProgress(runId);
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
                '✅ Scan job reached terminal state',
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
                const jobId = job.id?.toString();
                if (!jobId) {
                    throw new Error('Scraper job is missing an id');
                }

                const status = classifyErrorStatus(errorMsg);
                await db
                    .update(scanJobs)
                    .set({
                        status,
                        error_message: errorMsg,
                        completed_at: new Date(),
                    })
                    .where(eq(scanJobs.id, jobId));

                const jobRecord = await db
                    .select({ runId: scanJobs.run_id })
                    .from(scanJobs)
                    .where(eq(scanJobs.id, jobId))
                    .limit(1);
                if (jobRecord[0]?.runId) await updateRunProgress(jobRecord[0].runId);

                logger.info({ jobId: job.id, status }, 'Successfully updated terminal job status');
            } catch (updateError) {
                logger.error(
                    {
                        jobId: job.id,
                        error: updateError instanceof Error ? updateError.message : 'Unknown error',
                    },
                    'Failed to update job status to failed in database',
                );
            }

            return {
                success: false,
                error: errorMsg,
            };
        }
    },
    {
        connection: getRedisConnection(),
        concurrency: Math.max(1, env.MENTHA_BROWSER_CONCURRENCY),
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
