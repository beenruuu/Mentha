import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createSupabaseAdmin } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateKeywordSchema = z.object({
    project_id: z.string().uuid('Invalid project ID'),
    query: z.string().min(2, 'Query must be at least 2 characters'),
    intent: z.enum(['informational', 'transactional', 'navigational', 'commercial']).default('informational'),
    scan_frequency: z.enum(['daily', 'weekly', 'manual']).default('weekly'),
    engines: z.array(z.enum(['perplexity', 'openai', 'gemini'])).default(['perplexity']),
});

// =============================================================================
// MIDDLEWARE
// =============================================================================

function validate<T>(schema: z.Schema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                error: 'Validation Error',
                details: result.error.flatten().fieldErrors,
            });
            return;
        }
        req.body = result.data;
        next();
    };
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /api/v1/keywords
 */
router.get('/', async (req: Request, res: Response) => {
    const { project_id } = req.query;
    const supabase = createSupabaseAdmin();

    let query = supabase.from('keywords').select('*');

    if (project_id) {
        query = query.eq('project_id', project_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        logger.error('Failed to list keywords', { error: error.message });
        res.status(500).json({ error: 'Failed to list keywords' });
        return;
    }

    res.json({
        data: data ?? [],
        pagination: { total: data?.length ?? 0, page: 1, limit: 50 },
    });
});

/**
 * POST /api/v1/keywords
 */
router.post('/', validate(CreateKeywordSchema), async (req: Request, res: Response) => {
    const { project_id, query, intent, scan_frequency, engines } = req.body;
    const supabase = createSupabaseAdmin();

    logger.info('Creating keyword', { project_id, query, intent });

    const { data, error } = await supabase
        .from('keywords')
        .insert({
            project_id,
            query,
            intent,
            scan_frequency,
            engines,
        })
        .select()
        .single();

    if (error) {
        logger.error('Failed to create keyword', { error: error.message });
        res.status(500).json({ error: 'Failed to create keyword', message: error.message });
        return;
    }

    res.status(201).json({ data });
});

/**
 * DELETE /api/v1/keywords/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const supabase = createSupabaseAdmin();

    const { error } = await supabase
        .from('keywords')
        .delete()
        .eq('id', id);

    if (error) {
        res.status(500).json({ error: 'Failed to delete keyword' });
        return;
    }

    res.status(204).send();
});

export { router as keywordsRouter };
