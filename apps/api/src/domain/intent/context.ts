import { IntentType } from './schema';

export interface MeaningMap {
    // Top funnel
    signup: IntentType; // "Sign up", "Join"

    // Bottom funnel
    buy: IntentType; // "Buy", "Order"

    // Info
    price: IntentType; // "How much"
}

export interface BrandContext {
    industryName: string; // e.g., "Retail", "SaaS"
    description: string; // "Selling physical goods to consumers"
    verbMap: MeaningMap;
}

/**
 * Industry-specific Context Presets
 * These act as the "Lens" through which the AI interprets the query.
 */
export const INDUSTRY_PRESETS: Record<string, BrandContext> = {

    // RETAIL / E-COMMERCE (e.g., MGI, Zara)
    'retail': {
        industryName: 'Retail & E-commerce',
        description: 'Selling physical products to end consumers (B2C).',
        verbMap: {
            signup: IntentType.ACCOUNT_REGISTRATION, // "Sign up" -> Create account (Loyalty), NOT a sale
            buy: IntentType.PRODUCT_PURCHASE,        // "Buy" -> Actual transaction
            price: IntentType.COMMERCIAL_INVESTIGATION // "Price" -> Window shopping
        }
    },

    // SAAS / SOFTWARE (e.g., Salesforce, Slack)
    'saas': {
        industryName: 'SaaS (Software as a Service)',
        description: 'Selling digital subscriptions to businesses (B2B).',
        verbMap: {
            signup: IntentType.TRIAL_INITIATION,     // "Sign up" -> Start Trial / Lead (High value)
            buy: IntentType.TRIAL_INITIATION,        // "Buy" usually means "Start Trial" or "Contact Sales" first
            price: IntentType.PRICE_CHECK            // "Price" -> Advanced evaluation
        }
    },

    // LOCAL SERVICES (e.g., Plumbers, Dentists)
    'local': {
        industryName: 'Local Services',
        description: 'Providing physical services at a location or home.',
        verbMap: {
            signup: IntentType.SERVICE_BOOKING, // "Sign up" -> Book appointment
            buy: IntentType.SERVICE_BOOKING,    // "Buy" -> Book appointment
            price: IntentType.PRICE_CHECK       // "Price" -> Get quote
        }
    }
};

/**
 * Helper to build the System Prompt context block
 */
export function buildContextBlock(context: BrandContext): string {
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
