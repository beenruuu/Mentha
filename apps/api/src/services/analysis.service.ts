import { eq } from 'drizzle-orm';

import { keywords, projects, scanJobs, scanResults } from '@/db/schema/core';
import { createLogger } from '../core/logger';
import { db } from '../db';
import { getEntityService } from './entity.service';
import { getEvaluationService } from './evaluation.service';

export interface AnalysisJobData {
    scanJobId: string;
    rawResponse: string;
    brand: string;
    competitors: string[];
}

export interface EvaluationResult {
    sentiment_score: number;
    brand_visibility: boolean;
    share_of_voice_rank: number | null;
    recommendation_type:
        | 'direct_recommendation'
        | 'neutral_comparison'
        | 'negative_mention'
        | 'absent';
    key_phrases: string[];
    competitor_mentions: Record<string, boolean>;
    detected_entities?: Array<{
        name: string;
        type: string;
        description: string;
    }>;
    extracted_claims?: Array<{
        text: string;
        type: string;
        importance: number;
    }>;
    keyword_intent?: 'informational' | 'transactional' | 'navigational' | 'commercial';
}

export interface AnalysisServiceResult {
    success: boolean;
    evaluation: EvaluationResult;
}

export class AnalysisService {
    async analyzeResult(data: AnalysisJobData): Promise<AnalysisServiceResult> {
        const log = createLogger({ scanJobId: data.scanJobId });

        log.info('Starting analysis');

        try {
            // Fetch project description for better entity resolution
            const [projectInfo] = await db
                .select({ description: projects.description })
                .from(projects)
                .innerJoin(keywords, eq(keywords.project_id, projects.id))
                .innerJoin(scanJobs, eq(scanJobs.keyword_id, keywords.id))
                .innerJoin(scanResults, eq(scanResults.job_id, scanJobs.id))
                .where(eq(scanResults.id, data.scanJobId))
                .limit(1);

            const evaluationSvc = getEvaluationService();
            const evaluation = await evaluationSvc.evaluate({
                rawResponse: data.rawResponse,
                brandName: data.brand,
                brandDescription: projectInfo?.description || undefined,
                competitors: data.competitors,
            });

            // Use the structured evaluation result

            // Save analysis result
            await db
                .update(scanResults)
                .set({
                    analysis_json: evaluation as unknown as Record<string, unknown>,
                    sentiment_score: evaluation.sentiment_score,
                    brand_visibility: evaluation.brand_visibility,
                    share_of_voice_rank: evaluation.share_of_voice_rank,
                    recommendation_type: evaluation.recommendation_type,
                })
                .where(eq(scanResults.id, data.scanJobId));

            // Update keyword intent if detected
            if (evaluation.keyword_intent) {
                try {
                    const [job] = await db
                        .select({ keyword_id: scanJobs.keyword_id })
                        .from(scanJobs)
                        .innerJoin(scanResults, eq(scanResults.job_id, scanJobs.id))
                        .where(eq(scanResults.id, data.scanJobId))
                        .limit(1);

                    if (job?.keyword_id) {
                        await db
                            .update(keywords)
                            .set({ intent: evaluation.keyword_intent })
                            .where(eq(keywords.id, job.keyword_id));
                        log.info(
                            { keywordId: job.keyword_id, intent: evaluation.keyword_intent },
                            'Updated keyword intent',
                        );
                    }
                } catch (err) {
                    log.warn({ err: (err as Error).message }, 'Failed to update keyword intent');
                }
            }

            // Populate Knowledge Graph if entities/claims found
            if (evaluation.detected_entities || evaluation.extracted_claims) {
                try {
                    const entitySvc = getEntityService();
                    if (evaluation.detected_entities) {
                        for (const ent of evaluation.detected_entities) {
                            try {
                                await entitySvc.create({
                                    name: ent.name,
                                    entity_type: ent.type,
                                    description: ent.description,
                                    slug: ent.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                                    is_primary: ent.name.toLowerCase() === data.brand.toLowerCase(),
                                });
                            } catch {
                                // Ignore duplicates or errors
                            }
                        }
                    }
                } catch (err) {
                    log.warn({ err: (err as Error).message }, 'Failed to populate Knowledge Graph');
                }
            }

            log.info(
                {
                    sentiment: evaluation.sentiment_score,
                    visibility: evaluation.brand_visibility,
                },
                'Analysis completed',
            );

            return { success: true, evaluation };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            log.error({ error: errorMessage }, 'Analysis failed');
            throw error;
        }
    }
}
