import { z } from 'zod';

export const createKeywordSchema = z.object({
    project_id: z.string().uuid('Invalid project ID'),
    query: z.string().min(2, 'Query must be at least 2 characters'),
    intent: z.enum(['informational', 'transactional', 'navigational', 'commercial']).default('informational'),
    scan_frequency: z.enum(['daily', 'weekly', 'manual']).default('weekly'),
    engines: z.array(z.enum(['perplexity', 'openai', 'gemini'])).default(['perplexity']),
});

export const updateKeywordSchema = createKeywordSchema.partial();

export const keywordIdSchema = z.object({
    id: z.string().uuid('Invalid keyword ID'),
});

export const keywordQueryParamsSchema = z.object({
    project_id: z.string().uuid('Invalid project ID').optional(),
});

export type CreateKeywordInput = z.infer<typeof createKeywordSchema>;
export type UpdateKeywordInput = z.infer<typeof updateKeywordSchema>;
export type KeywordIdInput = z.infer<typeof keywordIdSchema>;
export type KeywordQueryParams = z.infer<typeof keywordQueryParamsSchema>;
