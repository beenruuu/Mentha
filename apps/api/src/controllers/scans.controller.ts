import { Router, Request, Response } from 'express';
import { createSupabaseAdmin } from '../infrastructure/database/index.js';
import { logger } from '../infrastructure/logging/index.js';

const router = Router();

/**
 * GET /api/v1/scans
 * List scan results for a project (Detailed Logs)
 */
router.get('/', async (req: Request, res: Response) => {
    const { project_id, limit = '20' } = req.query;

    if (!project_id) {
        res.status(400).json({ error: 'project_id is required' });
        return;
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
        .limit(parseInt(limit as string, 10));

    if (error) {
        logger.error('Failed to list scan results', { error: error.message });
        res.status(500).json({ error: 'Failed to list scan results' });
        return;
    }

    res.json({
        data: results ?? []
    });
});

/**
 * GET /api/v1/scans/:id
 * Get scan job status and results
 */
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
        .from('scan_results')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        res.status(404).json({ error: 'Scan result not found' });
        return;
    }

    res.json({ data });
});

export { router as scansRouter };
