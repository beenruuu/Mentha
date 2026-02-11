import { Worker, Job } from 'bullmq';
import { getRedisConnection, QUEUE_NAMES, AnalysisJobData, addNotificationJob } from '../infrastructure/queue/index';
import { eq } from 'drizzle-orm';
import { db, scanResults } from '../infrastructure/database/index';
import { logger, createLogger } from '../infrastructure/logging/index';

/**
 * LLM-as-a-Judge evaluation schema
 */
interface EvaluationResult {
    sentiment_score: number;
    brand_visibility: boolean;
    share_of_voice_rank: number | null;
    recommendation_type: 'direct_recommendation' | 'neutral_comparison' | 'negative_mention' | 'absent';
    key_phrases: string[];
    competitor_mentions: Record<string, boolean>;
}

/**
 * Analysis worker - implements LLM-as-a-Judge pipeline
 * Evaluates raw LLM responses for brand metrics
 */
export function createAnalysisWorker() {
    const worker = new Worker<AnalysisJobData>(
        QUEUE_NAMES.ANALYSIS,
        async (job: Job<AnalysisJobData>) => {
            const log = createLogger({ jobId: job.id, scanJobId: job.data.scanJobId });

            log.info('Starting analysis job');

            try {
                // Build evaluation prompt
                const evaluationPrompt = buildEvaluationPrompt(
                    job.data.rawResponse,
                    job.data.brand,
                    job.data.competitors
                );

                // TODO: Call LLM-as-a-Judge (GPT-4o-mini or Gemini Flash)
                // const evaluation = await evaluateLLM(evaluationPrompt);

                // Placeholder evaluation result
                const evaluation: EvaluationResult = {
                    sentiment_score: 0.5,
                    brand_visibility: true,
                    share_of_voice_rank: 2,
                    recommendation_type: 'neutral_comparison',
                    key_phrases: ['placeholder analysis'],
                    competitor_mentions: {},
                };

                // Update scan_results with analysis
                await db
                    .update(scanResults)
                    .set({
                        analysis_json: evaluation as unknown as Record<string, unknown>,
                        sentiment_score: evaluation.sentiment_score,
                        brand_visibility: evaluation.brand_visibility,
                        share_of_voice_rank: evaluation.share_of_voice_rank,
                        recommendation_type: evaluation.recommendation_type,
                    })
                    .where(eq(scanResults.id, job.data.scanJobId));

                log.info('Analysis completed', {
                    sentiment: evaluation.sentiment_score,
                    visibility: evaluation.brand_visibility,
                });

                return { success: true, evaluation };

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                log.error('Analysis job failed', { error: errorMessage });
                throw error;
            }
        },
        {
            connection: getRedisConnection(),
            concurrency: 10, // Higher concurrency as analysis is less rate-limited
        }
    );

    worker.on('completed', (job) => {
        logger.debug('Analysis job completed', { jobId: job.id });
    });

    worker.on('failed', (job, err) => {
        logger.error('Analysis job failed', { jobId: job?.id, error: err.message });
    });

    return worker;
}

/**
 * Build the evaluation prompt for LLM-as-a-Judge
 */
function buildEvaluationPrompt(
    rawResponse: string,
    brand: string,
    competitors: string[]
): string {
    return `You are an expert brand reputation analyst. Evaluate the following AI-generated response for brand visibility and sentiment.

TARGET BRAND: ${brand}
COMPETITORS: ${competitors.join(', ') || 'None specified'}

RESPONSE TO ANALYZE:
${rawResponse}

Provide your analysis in the following JSON format:
{
  "sentiment_score": <float -1.0 to 1.0>,
  "brand_visibility": <boolean>,
  "share_of_voice_rank": <integer or null>,
  "recommendation_type": <"direct_recommendation" | "neutral_comparison" | "negative_mention" | "absent">,
  "key_phrases": [<relevant quotes mentioning the brand>],
  "competitor_mentions": {<competitor: boolean>}
}

Rules:
- sentiment_score: -1.0 = very negative, 0 = neutral, 1.0 = very positive
- brand_visibility: true if the brand is mentioned at all
- share_of_voice_rank: position in any ranking/list, or null if not applicable
- recommendation_type: how the brand is positioned in the response`;
}
