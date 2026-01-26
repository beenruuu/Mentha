import { z } from 'zod';

/**
 * Universal Intent Taxonomy
 * Maps ambiguous verbs to industry-specific Schema.org actions
 */
export enum IntentType {
    // Top of Funnel / Service
    ACCOUNT_REGISTRATION = 'ACCOUNT_REGISTRATION', // "Sign up", "Join", "Create account"
    NEWSLETTER_SUBSCRIPTION = 'NEWSLETTER_SUBSCRIPTION', // "Subscribe to newsletter"

    // Bottom of Funnel / Transaction
    PRODUCT_PURCHASE = 'PRODUCT_PURCHASE', // "Buy", "Order", "Checkout"
    TRIAL_INITIATION = 'TRIAL_INITIATION', // "Start trial", "Try for free" (SaaS)
    LEAD_GENERATION = 'LEAD_GENERATION', // "Contact sales", "Request demo" (B2B)
    SERVICE_BOOKING = 'SERVICE_BOOKING', // "Book appointment", "Reserve table" (Local)

    // Investigation
    COMMERCIAL_INVESTIGATION = 'COMMERCIAL_INVESTIGATION', // "Best X", "Compare A vs B"
    PRICE_CHECK = 'PRICE_CHECK', // "How much is X", "Cost of Y"

    // Support / Retention
    CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT', // "Return item", "Help with order", "Cancel"

    // Navigational
    LOCATION_FINDER = 'LOCATION_FINDER', // "Where is near me", "Store locator"

    UNKNOWN = 'UNKNOWN'
}

/**
 * Normalized Entity Schema
 */
export const EntitySchema = z.object({
    brand_name: z.string().optional().describe("Name of the brand if explicitly mentioned"),
    product_category: z.string().optional().describe("Broad category (e.g., 'shoes', 'CRM software')"),
    specific_product: z.string().optional().describe("Specific item or model (e.g., 'Air Jordan 1', 'Salesforce Sales Cloud')"),
    quantity: z.number().optional().describe("Number of items if specified"),
    date_context: z.string().date().optional().describe("Any date mentioned, normalized to YYYY-MM-DD")
});

/**
 * Main Extraction Schema with Chain-of-Thought
 */
export const IntentExtractionSchema = z.object({
    // Step 1: Chain of Thought (Reasoning)
    _thinking_process: z.string().describe(
        "Analyze the user query step-by-step. Identify verbs, entities, and apply the INDUSTRY CONTEXT rules. E.g., 'User says sign up. Context is Retail. In Retail, sign up means Registration. Therefore, Intent is ACCOUNT_REGISTRATION'."
    ),

    // Step 2: Classification
    primary_intent: z.nativeEnum(IntentType).describe(
        "The canonical intent category based on the industry context map."
    ),

    // Step 3: Entity Extraction
    entities: EntitySchema,

    // Step 4: Confidence
    confidence_level: z.enum(['HIGH', 'MEDIUM', 'LOW']).describe(
        "Confidence in the extraction. Mark LOW if query is ambiguous or noisy."
    )
});

export type IntentExtractionResult = z.infer<typeof IntentExtractionSchema>;
