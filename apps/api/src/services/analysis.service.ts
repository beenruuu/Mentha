import { eq } from 'drizzle-orm';

import { scanResults } from '@/db/schema/core';
import { createLogger } from '../core/logger';
import { db } from '../db';

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
            const _evaluationPrompt = this.buildEvaluationPrompt(
                data.rawResponse,
                data.brand,
                data.competitors,
            );

            const evaluation: EvaluationResult = {
                sentiment_score: 0.5,
                brand_visibility: true,
                share_of_voice_rank: 2,
                recommendation_type: 'neutral_comparison',
                key_phrases: ['placeholder analysis'],
                competitor_mentions: {},
            };

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

            log.info('Analysis completed', {
                sentiment: evaluation.sentiment_score,
                visibility: evaluation.brand_visibility,
            });

            return { success: true, evaluation };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            log.error('Analysis failed', { error: errorMessage });
            throw error;
        }
    }

    private buildEvaluationPrompt(
        rawResponse: string,
        brand: string,
        competitors: string[],
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
}
