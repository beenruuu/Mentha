import { z } from 'zod';

export const scanQueryParamsSchema = z.object({
    project_id: z.string().uuid('Invalid project ID'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
});

export const scanIdSchema = z.object({
    id: z.string().uuid('Invalid scan ID'),
});

export const createScanJobSchema = z.object({
    keyword_id: z.string().uuid('Invalid keyword ID'),
    engine: z.enum(['perplexity', 'openai', 'gemini']),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

export const updateScanJobSchema = z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
    error_message: z.string().optional(),
    latency_ms: z.number().int().positive().optional(),
});

export const createScanResultSchema = z.object({
    job_id: z.string().uuid('Invalid job ID'),
    raw_response: z.string().optional(),
    analysis_json: z.record(z.unknown()).optional(),
    sentiment_score: z.number().min(-1).max(1).optional(),
    brand_visibility: z.boolean().optional(),
    share_of_voice_rank: z.number().int().positive().optional(),
    recommendation_type: z.enum(['direct_recommendation', 'neutral_comparison', 'negative_mention', 'absent']).optional(),
    token_count: z.number().int().positive().optional(),
});

export type ScanQueryParams = z.infer<typeof scanQueryParamsSchema>;
export type ScanIdInput = z.infer<typeof scanIdSchema>;
export type CreateScanJobInput = z.infer<typeof createScanJobSchema>;
export type UpdateScanJobInput = z.infer<typeof updateScanJobSchema>;
export type CreateScanResultInput = z.infer<typeof createScanResultSchema>;
