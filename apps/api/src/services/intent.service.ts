import OpenAI from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from 'zod';
import { env } from '../config/env';
import { logger } from '../core/logger';

export enum IntentType {
    ACCOUNT_REGISTRATION = 'ACCOUNT_REGISTRATION',
    NEWSLETTER_SUBSCRIPTION = 'NEWSLETTER_SUBSCRIPTION',
    PRODUCT_PURCHASE = 'PRODUCT_PURCHASE',
    TRIAL_INITIATION = 'TRIAL_INITIATION',
    LEAD_GENERATION = 'LEAD_GENERATION',
    SERVICE_BOOKING = 'SERVICE_BOOKING',
    COMMERCIAL_INVESTIGATION = 'COMMERCIAL_INVESTIGATION',
    PRICE_CHECK = 'PRICE_CHECK',
    CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
    LOCATION_FINDER = 'LOCATION_FINDER',
    UNKNOWN = 'UNKNOWN'
}

export const EntitySchema = z.object({
    brand_name: z.string().optional().describe("Name of the brand if explicitly mentioned"),
    product_category: z.string().optional().describe("Broad category (e.g., 'shoes', 'CRM software')"),
    specific_product: z.string().optional().describe("Specific item or model (e.g., 'Air Jordan 1', 'Salesforce Sales Cloud')"),
    quantity: z.number().optional().describe("Number of items if specified"),
    date_context: z.string().date().optional().describe("Any date mentioned, normalized to YYYY-MM-DD")
});

export const IntentExtractionSchema = z.object({
    _thinking_process: z.string().describe(
        "Analyze the user query step-by-step. Identify verbs, entities, and apply the INDUSTRY CONTEXT rules. E.g., 'User says sign up. Context is Retail. In Retail, sign up means Registration. Therefore, Intent is ACCOUNT_REGISTRATION'."
    ),
    primary_intent: z.nativeEnum(IntentType).describe(
        "The canonical intent category based on the industry context map."
    ),
    entities: EntitySchema,
    confidence_level: z.enum(['HIGH', 'MEDIUM', 'LOW']).describe(
        "Confidence in the extraction. Mark LOW if query is ambiguous or noisy."
    )
});

export type IntentExtractionResult = z.infer<typeof IntentExtractionSchema>;

export interface MeaningMap {
    signup: IntentType;
    buy: IntentType;
    price: IntentType;
}

export interface BrandContext {
    industryName: string;
    description: string;
    verbMap: MeaningMap;
}

export const INDUSTRY_PRESETS: Record<string, BrandContext> = {
    'retail': {
        industryName: 'Retail & E-commerce',
        description: 'Selling physical products to end consumers (B2C).',
        verbMap: {
            signup: IntentType.ACCOUNT_REGISTRATION,
            buy: IntentType.PRODUCT_PURCHASE,
            price: IntentType.COMMERCIAL_INVESTIGATION
        }
    },
    'saas': {
        industryName: 'SaaS (Software as a Service)',
        description: 'Selling digital subscriptions to businesses (B2B).',
        verbMap: {
            signup: IntentType.TRIAL_INITIATION,
            buy: IntentType.TRIAL_INITIATION,
            price: IntentType.PRICE_CHECK
        }
    },
    'local': {
        industryName: 'Local Services',
        description: 'Providing physical services at a location or home.',
        verbMap: {
            signup: IntentType.SERVICE_BOOKING,
            buy: IntentType.SERVICE_BOOKING,
            price: IntentType.PRICE_CHECK
        }
    }
};

function buildContextBlock(context: BrandContext): string {
    return `
INDUSTRY CONTEXT: ${context.industryName}
${context.description}

VERB INTERPRETATION RULES FOR THIS INDUSTRY:
- "Sign up" / "Join" implies: ${context.verbMap.signup}
- "Buy" / "Purchase" implies: ${context.verbMap.buy}
- "How much" / "Price" implies: ${context.verbMap.price}

Use these rules to override general assumptions. For example, if user say 'sign up' and context is Retail, classify as ACCOUNT_REGISTRATION.
`;
}

export class IntentExtractionService {
    private client: OpenAI;

    constructor() {
        if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY required');
        this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }

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
                model: "gpt-4o-2024-08-06",
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
