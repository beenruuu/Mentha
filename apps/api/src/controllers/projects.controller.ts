import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createSupabaseAdmin } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const CreateProjectSchema = z.object({
    name: z.string().min(3, 'Project name must be at least 3 characters'),
    domain: z.string().url('Domain must be a valid URL'),
    competitors: z.array(z.string().url()).max(5, 'Maximum 5 competitors allowed').default([]),
    description: z.string().optional(),
});

const UpdateProjectSchema = CreateProjectSchema.partial();

const app = new Hono()
    .get('/', async (c) => {
        const supabase = createSupabaseAdmin();

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Failed to list projects', { error: error.message });
            return c.json({ error: 'Failed to list projects' }, 500);
        }

        return c.json({
            data: data || [],
            pagination: { total: data?.length || 0, page: 1, limit: 20 },
        });
    })
    .post('/', zValidator('json', CreateProjectSchema), async (c) => {
        const { name, domain, competitors, description } = c.req.valid('json');
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
            return c.json({ error: 'Failed to create project', message: error.message }, 500);
        }

        return c.json({ data }, 201);
    })
    .get('/:id', async (c) => {
        const id = c.req.param('id');
        const supabase = createSupabaseAdmin();

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return c.json({ error: 'Project not found' }, 404);
        }

        return c.json({ data });
    })
    .patch('/:id', zValidator('json', UpdateProjectSchema), async (c) => {
        const id = c.req.param('id');
        const body = c.req.valid('json');
        const supabase = createSupabaseAdmin();

        const { data, error } = await supabase
            .from('projects')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return c.json({ error: 'Failed to update project' }, 500);
        }

        return c.json({ data });
    })
    .delete('/:id', async (c) => {
        const id = c.req.param('id');
        const supabase = createSupabaseAdmin();

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) {
            return c.json({ error: 'Failed to delete project' }, 500);
        }

        return c.body(null, 204);
    });

export default app;
export type ProjectsAppType = typeof app;
