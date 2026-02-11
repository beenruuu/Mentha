import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db, scanResults, scanJobs, keywords } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const app = new Hono()
    .get('/', async (c) => {
        const project_id = c.req.query('project_id');
        const limit = c.req.query('limit') || '20';

        if (!project_id) {
            return c.json({ error: 'project_id is required' }, 400);
        }

        try {
            const results = await db
                .select({
                    id: scanResults.id,
                    brand_visibility: scanResults.brand_visibility,
                    sentiment_score: scanResults.sentiment_score,
                    recommendation_type: scanResults.recommendation_type,
                    raw_response: scanResults.raw_response,
                    analysis_json: scanResults.analysis_json,
                    created_at: scanResults.created_at,
                    engine: scanJobs.engine,
                    project_id: keywords.project_id,
                    query: keywords.query,
                })
                .from(scanResults)
                .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
                .innerJoin(keywords, eq(scanJobs.keyword_id, keywords.id))
                .where(eq(keywords.project_id, project_id))
                .orderBy(desc(scanResults.created_at))
                .limit(parseInt(limit, 10));

            return c.json({
                data: results
            });
        } catch (error) {
            logger.error('Failed to list scan results', { error: (error as Error).message });
            return c.json({ error: 'Failed to list scan results' }, 500);
        }
    })
    .get('/:id', async (c) => {
        const id = c.req.param('id');

        try {
            const data = await db
                .select()
                .from(scanResults)
                .where(eq(scanResults.id, id))
                .limit(1);

            if (data.length === 0) {
                return c.json({ error: 'Scan result not found' }, 404);
            }

            return c.json({ data: data[0] });
        } catch (error) {
            logger.error('Failed to get scan result', { error: (error as Error).message });
            return c.json({ error: 'Failed to get scan result' }, 500);
        }
    });

export default app;
export type ScansAppType = typeof app;
