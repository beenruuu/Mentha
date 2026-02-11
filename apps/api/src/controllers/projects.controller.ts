import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db, projects } from '../infrastructure/database/index';
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
        try {
            const data = await db
                .select()
                .from(projects)
                .orderBy(desc(projects.created_at));

            return c.json({
                data,
                pagination: { total: data.length, page: 1, limit: 20 },
            });
        } catch (error) {
            logger.error('Failed to list projects', { error: (error as Error).message });
            return c.json({ error: 'Failed to list projects' }, 500);
        }
    })
    .post('/', zValidator('json', CreateProjectSchema), async (c) => {
        const { name, domain, competitors, description } = c.req.valid('json');

        logger.info('Creating project', { name, domain });

        try {
            const result = await db
                .insert(projects)
                .values({
                    name,
                    domain,
                    competitors,
                    description,
                    user_id: '00000000-0000-0000-0000-000000000000',
                })
                .returning();

            return c.json({ data: result[0] }, 201);
        } catch (error) {
            logger.error('Failed to create project', { error: (error as Error).message });
            return c.json({ error: 'Failed to create project', message: (error as Error).message }, 500);
        }
    })
    .get('/:id', async (c) => {
        const id = c.req.param('id');

        try {
            const data = await db
                .select()
                .from(projects)
                .where(eq(projects.id, id))
                .limit(1);

            if (data.length === 0) {
                return c.json({ error: 'Project not found' }, 404);
            }

            return c.json({ data: data[0] });
        } catch (error) {
            logger.error('Failed to get project', { error: (error as Error).message });
            return c.json({ error: 'Failed to get project' }, 500);
        }
    })
    .patch('/:id', zValidator('json', UpdateProjectSchema), async (c) => {
        const id = c.req.param('id');
        const body = c.req.valid('json');

        try {
            const result = await db
                .update(projects)
                .set(body)
                .where(eq(projects.id, id))
                .returning();

            if (result.length === 0) {
                return c.json({ error: 'Project not found' }, 404);
            }

            return c.json({ data: result[0] });
        } catch (error) {
            logger.error('Failed to update project', { error: (error as Error).message });
            return c.json({ error: 'Failed to update project' }, 500);
        }
    })
    .delete('/:id', async (c) => {
        const id = c.req.param('id');

        try {
            await db
                .delete(projects)
                .where(eq(projects.id, id));

            return c.body(null, 204);
        } catch (error) {
            logger.error('Failed to delete project', { error: (error as Error).message });
            return c.json({ error: 'Failed to delete project' }, 500);
        }
    });

export default app;
export type ProjectsAppType = typeof app;
