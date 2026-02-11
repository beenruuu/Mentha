import { Hono } from 'hono';
import { createSupabaseAdmin } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const app = new Hono()
    .get('/', async (c) => {
        const project_id = c.req.query('project_id');
        const limit = c.req.query('limit') || '20';

        if (!project_id) {
            return c.json({ error: 'project_id is required' }, 400);
        }

        const supabase = createSupabaseAdmin();

        const { data: results, error } = await supabase
            .from('scan_results')
            .select(`
                id,
                brand_visibility,
                sentiment_score,
                recommendation_type,
                raw_response,
                analysis_json,
                created_at,
                scan_jobs!inner(
                    engine,
                    keywords!inner(project_id, query)
                )
            `)
            .eq('scan_jobs.keywords.project_id', project_id)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit, 10));

        if (error) {
            logger.error('Failed to list scan results', { error: error.message });
            return c.json({ error: 'Failed to list scan results' }, 500);
        }

        return c.json({
            data: results || []
        });
    })
    .get('/:id', async (c) => {
        const id = c.req.param('id');
        const supabase = createSupabaseAdmin();

        const { data, error } = await supabase
            .from('scan_results')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return c.json({ error: 'Scan result not found' }, 404);
        }

        return c.json({ data });
    });

export default app;
export type ScansAppType = typeof app;
