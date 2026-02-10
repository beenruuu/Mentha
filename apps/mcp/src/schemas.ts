import { z } from "zod";

export const analyzeBrandVisibilitySchema = z.object({
    brand_name: z.string().describe('The brand name to analyze (e.g., "Mentha CLI")'),
    query: z.string().describe('The search query to test (e.g., "best AEO tools")'),
    engine: z.enum(['openai', 'perplexity', 'gemini']).optional().describe('Which AI engine to query. Default: openai'),
    competitors: z.array(z.string()).optional().describe('List of competitor brand names to track'),
});

export const getShareOfModelSchema = z.object({
    project_id: z.string().describe('The Mentha project UUID to analyze'),
    days: z.number().optional().describe('Number of days to analyze. Default: 30'),
});

export const createBrandEntitySchema = z.object({
    name: z.string().describe('Brand or organization name'),
    description: z.string().describe('Detailed description of the brand (2-3 sentences)'),
    url: z.string().optional().describe('Official website URL'),
    disambiguating_description: z.string().optional().describe('What the brand is NOT (to prevent AI confusion)'),
    same_as: z.array(z.string()).optional().describe('Official links: GitHub, LinkedIn, Twitter, Wikipedia'),
});

export const addBrandClaimSchema = z.object({
    entity_slug: z.string().describe('The slug of the entity (e.g., "mentha-cli")'),
    claim: z.string().describe('The factual claim (e.g., "Mentha CLI is open source")'),
    claim_type: z.enum(['fact', 'feature', 'comparison', 'statistic', 'testimonial']).optional().describe('Type of claim'),
    importance: z.number().optional().describe('Priority 1-10 (10 = most important)'),
});

export const generateLlmsTxtSchema = z.object({});

export const listProjectsSchema = z.object({});
