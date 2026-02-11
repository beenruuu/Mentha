import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../infrastructure/queue/index';
import { QUEUE_NAMES, ScanJobData, addAnalysisJob } from '../infrastructure/queue/index';
import { eq } from 'drizzle-orm';
import { db, scanJobs, scanResults } from '../infrastructure/database/index';
import { logger, createLogger } from '../infrastructure/logging/index';

/**
 * Scan worker - processes search requests to LLM providers
 * Implements the first stage of the AEO pipeline
 */
export function createScanWorker() {
    const worker = new Worker<ScanJobData>(
        QUEUE_NAMES.SCRAPERS,
        async (job: Job<ScanJobData>) => {
            const log = createLogger({ jobId: job.id, keywordId: job.data.keywordId });
            const startTime = Date.now();

            log.info('Starting scan job', { engine: job.data.engine, query: job.data.query });

            try {
                // Update job status to processing
                await db
                    .update(scanJobs)
                    .set({
                        status: 'processing',
                        started_at: new Date()
                    })
                    .where(eq(scanJobs.id, job.data.keywordId)); // Note: This should be the scan_job id, not keyword

                // TODO: Call the appropriate search provider based on engine
                // const provider = SearchProviderFactory.create(job.data.engine);
                // const result = await provider.search(job.data.query);

                // Placeholder for now - will be implemented with provider integrations
                const rawResponse = `Placeholder response for "${job.data.query}" from ${job.data.engine}`;

                const latencyMs = Date.now() - startTime;

                // Store raw result immediately (checkpoint)
                const scanResult = await db
                    .insert(scanResults)
                    .values({
                        job_id: job.data.keywordId, // This should be scan_job id
                        raw_response: rawResponse,
                    })
                    .returning();

                if (!scanResult[0]) {
                    throw new Error('Failed to store scan result');
                }

                log.info('Scan completed, queueing analysis', { latencyMs });

                // Queue the analysis job
                await addAnalysisJob({
                    scanJobId: scanResult[0].id,
                    rawResponse,
                    brand: job.data.brand,
                    competitors: job.data.competitors,
                });

                // Update job status
                await db
                    .update(scanJobs)
                    .set({
                        status: 'completed',
                        latency_ms: latencyMs,
                        completed_at: new Date(),
                    })
                    .where(eq(scanJobs.id, job.data.keywordId));

                return { success: true, resultId: scanResult[0].id, latencyMs };

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                log.error('Scan job failed', { error: errorMessage });

                // Update job as failed
                await db
                    .update(scanJobs)
                    .set({
                        status: 'failed',
                        error_message: errorMessage,
                        completed_at: new Date(),
                    })
                    .where(eq(scanJobs.id, job.data.keywordId));

                throw error;
            }
        },
        {
            connection: getRedisConnection(),
            concurrency: 5,
            limiter: {
                max: 10,
                duration: 1000, // Max 10 jobs per second
            },
        }
    );

    worker.on('completed', (job) => {
        logger.debug('Scan job completed', { jobId: job.id });
    });

    worker.on('failed', (job, err) => {
        logger.error('Scan job failed', { jobId: job?.id, error: err.message });
    });

    return worker;
}
