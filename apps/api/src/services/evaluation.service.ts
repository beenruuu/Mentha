import OpenAI from 'openai';
import { z } from 'zod';

import { env } from '../config/env';
import { logger } from '../core/logger';

export const EvaluationResultSchema = z.object({
    sentiment_score: z.number().min(-1).max(1),
    brand_visibility: z.boolean(),
    share_of_voice_rank: z.number().int().positive().nullable(),
    recommendation_type: z.enum([
        'direct_recommendation',
        'neutral_comparison',
        'negative_mention',
        'absent',
    ]),
    key_phrases: z.array(z.string()),
    competitor_mentions: z.record(z.string(), z.boolean()),
    hallucination_flag: z
        .boolean()
        .default(false)
        .describe('True if the text invents facts/products'),
    compliance_warning: z.string().nullable().describe('Warning for scams/legal issues'),
    reasoning: z.string().optional(),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export interface EvaluationRequest {
    rawResponse: string;
    brandName: string;
    competitors: string[];
    competitorContexts?: Record<string, string>;
    query?: string;
}

export class EvaluationService {
    private readonly client: OpenAI | null;
    private readonly model = 'gpt-4o-mini';

    constructor() {
        const apiKey = env.OPENAI_API_KEY;
        if (apiKey) {
            this.client = new OpenAI({ apiKey });
        } else {
            this.client = null;
            logger.warn('OPENAI_API_KEY not configured - evaluation service unavailable');
        }
    }

    async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
        if (!this.client) {
            throw new Error('OPENAI_API_KEY is required for evaluation');
        }

        const systemPrompt = this.buildSystemPrompt();
        const userPrompt = this.buildUserPrompt(request);

        logger.debug('Starting LLM-as-a-Judge evaluation', {
            brandName: request.brandName,
            competitors: request.competitors.length,
            responseLength: request.rawResponse.length,
        });

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
                max_tokens: 1000,
            });

            const content = response.choices[0]?.message?.content ?? '{}';

            let parsed: unknown;
            try {
                parsed = JSON.parse(content);
            } catch {
                logger.error('Failed to parse evaluation response as JSON', { content });
                throw new Error('Invalid JSON response from evaluator');
            }

            const result = EvaluationResultSchema.safeParse(parsed);

            if (!result.success) {
                logger.warn('Evaluation result validation failed, attempting auto-correction', {
                    errors: result.error.flatten(),
                });

                return await this.autoCorrect(content, result.error);
            }

            logger.info('Evaluation completed', {
                sentiment: result.data.sentiment_score,
                visibility: result.data.brand_visibility,
                recommendation: result.data.recommendation_type,
            });

            return result.data;
        } catch (error) {
            logger.error('Evaluation failed', { error: (error as Error).message });
            throw error;
        }
    }

    private buildSystemPrompt(): string {
        return `You are an expert brand reputation analyst. Your task is to evaluate AI-generated responses for brand visibility, sentiment, and positioning.

You MUST respond with valid JSON matching this exact schema:
{
  "sentiment_score": <number from -1.0 to 1.0>,
  "brand_visibility": <boolean>,
  "share_of_voice_rank": <number or null>,
  "recommendation_type": <"direct_recommendation" | "neutral_comparison" | "negative_mention" | "absent">,
  "key_phrases": [<strings of relevant quotes>],
  "competitor_mentions": {<competitor_name: boolean>},
  "hallucination_flag": <boolean>,
  "compliance_warning": <string or null>,
  "reasoning": <brief explanation of your evaluation>
}

CRITICAL - ENTITY RESOLUTION AND DISAMBIGUATION:
- You will receive a list of "Competitors" and potentially their "Disambiguation Context".
- You MUST distinguishing between the BRAND and common nouns (e.g. "Action" the store vs "action" the verb).
- If a "Disambiguation Context" is provided, use it as a NEGATIVE CONSTRAINT.
  - Example: If Context for "Action" is "Retail chain, IGNORE verbs", you must NOT count phrases like "take action" or "class action lawsuit" as a mention.
- If the text mentions the word but NOT the specific entity described in the context, set "competitor_mentions" to FALSE for that entity.

CRITICAL - QA & HALLUCINATION CHECK:
- HALLUCINATION: Does the content claim the brand sells products they clearly don't (based on Industry)? Or invent specific prices (e.g. "9.99€") without source? Mark "hallucination_flag": true.
- COMPLIANCE: Does the content mention "scams", "lawsuits", "danger", or "illegal"? If so, put a brief warning in "compliance_warning".

Scoring Guidelines:
- sentiment_score: -1.0 = very negative, 0 = neutral, 1.0 = very positive
- brand_visibility: true if the brand is mentioned by name
- share_of_voice_rank: position in any explicit ranking/list, null if not applicable
- recommendation_type:
  - "direct_recommendation": Brand is explicitly recommended or highlighted positively
  - "neutral_comparison": Brand is mentioned alongside competitors without clear preference
  - "negative_mention": Brand is mentioned with criticism or concerns
  - "absent": Brand is not mentioned at all`;
    }

    private buildUserPrompt(request: EvaluationRequest): string {
        const competitorList = request.competitors
            .map((c) => {
                const context = request.competitorContexts?.[c];
                return context ? `"${c}" (Context: ${context})` : `"${c}"`;
            })
            .join('\n- ');

        return `Evaluate the following AI-generated response for the brand "${request.brandName}".

COMPETITORS TO TRACK:
- ${competitorList || 'None specified'}

${request.query ? `ORIGINAL QUERY: "${request.query}"` : ''}

RESPONSE TO ANALYZE:
---
${request.rawResponse}
---

Provide your evaluation as JSON. Remember the Entity Resolution rules: do NOT count false positives if the context doesn't match.`;
    }

    private async autoCorrect(
        originalResponse: string,
        validationError: z.ZodError,
    ): Promise<EvaluationResult> {
        if (!this.client) {
            throw new Error('OPENAI_API_KEY is required');
        }

        logger.info('Attempting auto-correction of evaluation response');

        const correctionPrompt = `The following JSON response has validation errors. Fix the errors and return valid JSON.

ORIGINAL RESPONSE:
${originalResponse}

VALIDATION ERRORS:
${JSON.stringify(validationError.flatten())}

Return ONLY the corrected JSON, nothing else.`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a JSON correction assistant. Fix the JSON to match the required schema.',
                },
                { role: 'user', content: correctionPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0,
            max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content ?? '{}';
        const parsed = JSON.parse(content);
        const result = EvaluationResultSchema.parse(parsed);

        logger.info('Auto-correction successful');
        return result;
    }
}

let evaluationService: EvaluationService | null = null;

export function getEvaluationService(): EvaluationService {
    if (!evaluationService) {
        evaluationService = new EvaluationService();
    }
    return evaluationService;
}
