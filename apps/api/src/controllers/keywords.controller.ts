import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createSupabaseAdmin } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const CreateKeywordSchema = z.object({
    project_id: z.string().uuid('Invalid project ID'),
    query: z.string().min(2, 'Query must be at least 2 characters'),
    intent: z.enum(['informational', 'transactional', 'navigational', 'commercial']).default('informational'),
    scan_frequency: z.enum(['daily', 'weekly', 'manual']).default('weekly'),
    engines: z.array(z.enum(['perplexity', 'openai', 'gemini'])).default(['perplexity']),
});

const app = new Hono()
    .get('/', async (c) => {
        const project_id = c.req.query('project_id');
        const supabase = createSupabaseAdmin();

        let query = supabase.from('keywords').select('*');

        if (project_id) {
            query = query.eq('project_id', project_id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            logger.error('Failed to list keywords', { error: error.message });
            return c.json({ error: 'Failed to list keywords' }, 500);
        }

        return c.json({
            data: data || [],
            pagination: { total: data?.length || 0, page: 1, limit: 50 },
        });
    })
    .post('/', zValidator('json', CreateKeywordSchema), async (c) => {
        const { project_id, query, intent, scan_frequency, engines } = c.req.valid('json');
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
            return c.json({ error: 'Failed to create keyword', message: error.message }, 500);
        }

        return c.json({ data }, 201);
    })
    .delete('/:id', async (c) => {
        const id = c.req.param('id');
        const supabase = createSupabaseAdmin();

        const { error } = await supabase
            .from('keywords')
            .delete()
            .eq('id', id);

        if (error) {
            return c.json({ error: 'Failed to delete keyword' }, 500);
        }

        return c.body(null, 204);
    });

export default app;
export type KeywordsAppType = typeof app;
