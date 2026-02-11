import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db, keywords } from '../infrastructure/database/index';
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

        try {
            const data = project_id
                ? await db.select().from(keywords).where(eq(keywords.project_id, project_id)).orderBy(desc(keywords.created_at))
                : await db.select().from(keywords).orderBy(desc(keywords.created_at));

            return c.json({
                data,
                pagination: { total: data.length, page: 1, limit: 50 },
            });
        } catch (error) {
            logger.error('Failed to list keywords', { error: (error as Error).message });
            return c.json({ error: 'Failed to list keywords' }, 500);
        }
    })
    .post('/', zValidator('json', CreateKeywordSchema), async (c) => {
        const { project_id, query, intent, scan_frequency, engines } = c.req.valid('json');

        logger.info('Creating keyword', { project_id, query, intent });

        try {
            const result = await db
                .insert(keywords)
                .values({
                    project_id,
                    query,
                    intent,
                    scan_frequency,
                    engines,
                })
                .returning();

            return c.json({ data: result[0] }, 201);
        } catch (error) {
            logger.error('Failed to create keyword', { error: (error as Error).message });
            return c.json({ error: 'Failed to create keyword', message: (error as Error).message }, 500);
        }
    })
    .delete('/:id', async (c) => {
        const id = c.req.param('id');

        try {
            await db
                .delete(keywords)
                .where(eq(keywords.id, id));

            return c.body(null, 204);
        } catch (error) {
            logger.error('Failed to delete keyword', { error: (error as Error).message });
            return c.json({ error: 'Failed to delete keyword' }, 500);
        }
    });

export default app;
export type KeywordsAppType = typeof app;
