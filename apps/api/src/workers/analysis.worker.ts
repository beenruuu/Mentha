import { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';

import { logger } from '../core/logger';
import { type AnalysisJobData, getRedisConnection, QUEUE_NAMES } from '../core/queue';
import { db } from '../db';
import { scanResults } from '../db/schema/core';
import { getEvaluationService } from '../services/evaluation.service';

const evaluationService = getEvaluationService();

export const analysisWorker = new Worker<AnalysisJobData>(
    QUEUE_NAMES.ANALYSIS,
    async (job) => {
        logger.info({ jobId: job.id, scanJobId: job.data.scanJobId }, '🧠 Starting analysis job');

        try {
            const { scanJobId, rawResponse, brand, competitors } = job.data;

            logger.debug({ scanJobId }, 'Running evaluation');

            const evaluation = await evaluationService.evaluate({
                rawResponse,
                brandName: brand,
                competitors,
            });

            logger.info(
                {
                    jobId: job.id,
                    sentiment: evaluation.sentiment_score,
                    visibility: evaluation.brand_visibility,
                },
                '✅ Evaluation completed',
            );

            // Save analysis result
            await db
                .update(scanResults)
                .set({
                    analysis_json: evaluation as unknown as Record<string, unknown>,
                    sentiment_score: evaluation.sentiment_score,
                    brand_visibility: evaluation.brand_visibility,
                    recommendation_type: evaluation.recommendation_type,
                })
                .where(eq(scanResults.id, scanJobId));

            return {
                success: true,
                scanJobId,
                sentiment: evaluation.sentiment_score,
                visibility: evaluation.brand_visibility,
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';

            logger.error(
                {
                    jobId: job.id,
                    error: errorMsg,
                    attempt: job.attemptsMade,
                },
                '❌ Analysis job failed',
            );
            throw error;
        }
    },
    {
        connection: getRedisConnection(),
        concurrency: 2, // Process 2 analyses in parallel
        autorun: false,
    },
);

analysisWorker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Analysis job completed');
});

analysisWorker.on('failed', (job, err) => {
    logger.error(
        {
            jobId: job?.id,
            error: err.message,
        },
        'Analysis job permanently failed',
    );
});

export default analysisWorker;
