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
    keyword_intent: z
        .enum(['informational', 'transactional', 'navigational', 'commercial'])
        .optional(),
    detected_entities: z
        .array(
            z.object({
                name: z.string(),
                type: z.string(),
                description: z.string(),
            }),
        )
        .optional(),
    extracted_claims: z
        .array(
            z.object({
                text: z.string(),
                type: z.string(),
                importance: z.number(),
            }),
        )
        .optional(),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export interface EvaluationRequest {
    rawResponse: string;
    brandName: string;
    brandDescription?: string;
    competitors: string[];
    competitorContexts?: Record<string, string>;
    query?: string;
}

export class EvaluationService {
    private readonly client: OpenAI | null;
    private readonly model = 'openai/gpt-4o-mini';

    constructor() {
        const apiKey = env.OPENROUTER_API_KEY;

        if (apiKey) {
            this.client = new OpenAI({
                apiKey,
                baseURL: 'https://openrouter.ai/api/v1',
                dangerouslyAllowBrowser: true,
            });
            logger.info('Evaluation service initialized using OpenRouter');
        } else {
            this.client = null;
            logger.warn('OPENROUTER_API_KEY not configured - evaluation service unavailable');
        }
    }

    async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
        if (!this.client) {
            return this.heuristicEvaluate(request);
        }

        const systemPrompt = this.buildSystemPrompt();
        const userPrompt = this.buildUserPrompt(request);

        logger.debug(
            {
                brandName: request.brandName,
                competitors: request.competitors.length,
                responseLength: request.rawResponse.length,
            },
            'Starting LLM-as-a-Judge evaluation',
        );

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
                logger.error({ content }, 'Failed to parse evaluation response as JSON');
                throw new Error('Invalid JSON response from evaluator');
            }

            const result = EvaluationResultSchema.safeParse(parsed);

            if (!result.success) {
                logger.warn(
                    {
                        errors: result.error.flatten(),
                    },
                    'Evaluation result validation failed, attempting auto-correction',
                );

                return await this.autoCorrect(content, result.error);
            }

            logger.info(
                {
                    sentiment: result.data.sentiment_score,
                    visibility: result.data.brand_visibility,
                    recommendation: result.data.recommendation_type,
                },
                'Evaluation completed',
            );

            return result.data;
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'Evaluation failed');
            throw error;
        }
    }

    private heuristicEvaluate(request: EvaluationRequest): EvaluationResult {
        const lowerResponse = request.rawResponse.toLowerCase();
        const lowerBrand = request.brandName.toLowerCase();
        const brandVisible = lowerResponse.includes(lowerBrand);

        // Sentiment: count positive vs negative keywords
        const positiveWords = ['great', 'excellent', 'amazing', 'good', 'best', 'recommend', 'love', 'perfect', 'innovative', 'powerful', 'reliable', 'easy'];
        const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'poor', 'expensive', 'difficult', 'slow', 'buggy', 'scam', 'problem'];
        let sentiment = 0;
        if (brandVisible) {
            const posCount = positiveWords.filter((w) => lowerResponse.includes(w)).length;
            const negCount = negativeWords.filter((w) => lowerResponse.includes(w)).length;
            const total = posCount + negCount || 1;
            sentiment = Math.max(-1, Math.min(1, (posCount - negCount) / total));
        }

        // Recommendation type
        let recommendation: EvaluationResult['recommendation_type'] = 'absent';
        if (brandVisible) {
            const recommendPhrases = ['recommend', 'best choice', 'top pick', 'leading', 'suggestion'];
            const neutralPhrases = ['alternative', 'compare', 'versus', 'options', 'also consider'];
            const negativePhrases = ['not recommended', 'avoid', 'issues', 'problems', 'concern'];

            if (recommendPhrases.some((p) => lowerResponse.includes(p)) && sentiment >= 0) {
                recommendation = 'direct_recommendation';
            } else if (negativePhrases.some((p) => lowerResponse.includes(p)) || sentiment < -0.3) {
                recommendation = 'negative_mention';
            } else if (neutralPhrases.some((p) => lowerResponse.includes(p))) {
                recommendation = 'neutral_comparison';
            } else {
                recommendation = 'direct_recommendation';
            }
        }

        const keyPhrases: string[] = [];
        if (brandVisible) {
            const sentences = request.rawResponse.split(/[.!?]+/);
            for (const sentence of sentences) {
                if (sentence.toLowerCase().includes(lowerBrand) && sentence.length > 10) {
                    keyPhrases.push(sentence.trim());
                    if (keyPhrases.length >= 3) break;
                }
            }
        }

        const competitorMentions: Record<string, boolean> = {};
        for (const comp of request.competitors) {
            competitorMentions[comp] = lowerResponse.includes(comp.toLowerCase());
        }

        const detectedEntities = [
            {
                name: request.brandName,
                type: 'Organization',
                description: request.brandDescription || 'Brand mentioned in scraped AI response',
            },
        ];

        const extractedClaims = brandVisible
            ? [{ text: `${request.brandName} is mentioned in AI response.`, type: 'fact' as const, importance: 5 }]
            : [];

        logger.info(
            { brand: request.brandName, visible: brandVisible, sentiment, recommendation },
            'Heuristic evaluation completed (no API key)',
        );

        return {
            sentiment_score: sentiment,
            brand_visibility: brandVisible,
            share_of_voice_rank: brandVisible ? 1 : null,
            recommendation_type: recommendation,
            key_phrases: keyPhrases,
            competitor_mentions: competitorMentions,
            hallucination_flag: false,
            compliance_warning: null,
            reasoning: `Heuristic evaluation: brand ${brandVisible ? 'visible' : 'not visible'}, sentiment ${sentiment.toFixed(2)}, type ${recommendation}`,
            keyword_intent: 'informational',
            detected_entities: detectedEntities,
            extracted_claims: extractedClaims,
        };
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
- You will receive a "Brand Description". Use this to determine if the text refers to the ACTUAL brand or a generic concept.
- For example, if the brand is "Acme Corp" and the description says "Manufacturing", do NOT count "acme of perfection" as a mention.
- You MUST distinguish between the BRAND and common nouns/adjectives.
- If a "Disambiguation Context" is provided for competitors, use it similarly.
- If the text mentions the name but NOT the specific entity described, set visibility to FALSE.

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

BRAND DESCRIPTION:
${request.brandDescription || 'Not provided'}

COMPETITORS TO TRACK:
- ${competitorList || 'None specified'}

${request.query ? `ORIGINAL QUERY: "${request.query}"` : ''}

RESPONSE TO ANALYZE:
---
${request.rawResponse}
---

Provide your evaluation as JSON. Remember the Entity Resolution rules: do NOT count false positives if the context doesn't match the Brand Description.`;
    }

    private async autoCorrect(
        originalResponse: string,
        validationError: z.ZodError,
    ): Promise<EvaluationResult> {
        if (!this.client) {
            throw new Error('OPENROUTER_API_KEY is required for auto-correction');
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

        try {
            const parsed = JSON.parse(content);
            const result = EvaluationResultSchema.parse(parsed);
            logger.info('Auto-correction successful');
            return result;
        } catch (parseError) {
            logger.error(
                { error: (parseError as Error).message, content },
                'Auto-correction parsing failed',
            );
            throw new Error('Failed to parse auto-corrected evaluation response');
        }
    }
}

let evaluationService: EvaluationService | null = null;

export function getEvaluationService(): EvaluationService {
    if (!evaluationService) {
        evaluationService = new EvaluationService();
    }
    return evaluationService;
}
