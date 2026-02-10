import OpenAI from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";
import { env } from '../../config/index';
import { logger } from '../../infrastructure/logging/index';
import { IntentExtractionSchema, IntentExtractionResult } from './schema';
import { BrandContext, buildContextBlock } from './context';

export class IntentExtractionService {
    private client: OpenAI;

    constructor() {
        if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY required');
        this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }

    /**
     * Extract structured intent from a raw user query using Industry Context
     */
    async extract(query: string, context: BrandContext): Promise<IntentExtractionResult> {
        const systemPrompt = `You are an expert AI Intent Classifier for a ${context.industryName} brand.
Your goal is to normalize noisy user input into structured data.

${buildContextBlock(context)}

RULES:
1. Analyze the query first in '_thinking_process'.
2. Be strict with JSON format.
3. If the query is just noise (boilerplate, footer text), mark as LOW confidence and UNKNOWN intent.
`;

        logger.debug('Starting Intent Extraction', { query, industry: context.industryName });

        try {
            const completion = await this.client.beta.chat.completions.parse({
                model: "gpt-4o-2024-08-06", // Structured Outputs supported model
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query },
                ],
                response_format: zodResponseFormat(IntentExtractionSchema, "intent_extraction"),
            });

            const result = completion.choices[0]?.message?.parsed;

            if (!result) {
                throw new Error("Failed to parse intent extraction result");
            }

            logger.info('Intent Extracted', {
                query,
                intent: result.primary_intent,
                confidence: result.confidence_level
            });

            return result;

        } catch (error) {
            logger.error('Intent Extraction Failed', { error });
            throw error;
        }
    }
}
