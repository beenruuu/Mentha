import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createSupabaseAdmin } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateProjectSchema = z.object({
    name: z.string().min(3, 'Project name must be at least 3 characters'),
    domain: z.string().url('Domain must be a valid URL'),
    competitors: z.array(z.string().url()).max(5, 'Maximum 5 competitors allowed').default([]),
    description: z.string().optional(),
});

const UpdateProjectSchema = CreateProjectSchema.partial();

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
 * GET /api/v1/projects
 * List all projects
 */
router.get('/', async (_req: Request, res: Response) => {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('Failed to list projects', { error: error.message });
        res.status(500).json({ error: 'Failed to list projects' });
        return;
    }

    res.json({
        data: data ?? [],
        pagination: { total: data?.length ?? 0, page: 1, limit: 20 },
    });
});

/**
 * POST /api/v1/projects
 * Create a new project
 */
router.post('/', validate(CreateProjectSchema), async (req: Request, res: Response) => {
    const { name, domain, competitors, description } = req.body;
    const supabase = createSupabaseAdmin();

    logger.info('Creating project', { name, domain });

    const { data, error } = await supabase
        .from('projects')
        .insert({
            name,
            domain,
            competitors,
            description,
        })
        .select()
        .single();

    if (error) {
        logger.error('Failed to create project', { error: error.message });
        res.status(500).json({ error: 'Failed to create project', message: error.message });
        return;
    }

    res.status(201).json({ data });
});

/**
 * GET /api/v1/projects/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        res.status(404).json({ error: 'Project not found' });
        return;
    }

    res.json({ data });
});

/**
 * PATCH /api/v1/projects/:id
 */
router.patch('/:id', validate(UpdateProjectSchema), async (req: Request, res: Response) => {
    const { id } = req.params;
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
        .from('projects')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        res.status(500).json({ error: 'Failed to update project' });
        return;
    }

    res.json({ data });
});

/**
 * DELETE /api/v1/projects/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const supabase = createSupabaseAdmin();

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) {
        res.status(500).json({ error: 'Failed to delete project' });
        return;
    }

    res.status(204).send();
});

export { router as projectsRouter };
