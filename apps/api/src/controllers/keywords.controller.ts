import type { Context } from 'hono';
import { getKeywordService } from '../services/keyword.service';
import { logger } from '../core/logger';
import { handleHttpException } from '../exceptions/http';

const keywordService = getKeywordService();

export class KeywordController {
    static async list(c: Context) {
        const project_id = c.req.query('project_id');

        try {
            const data = project_id
                ? await keywordService.listByProject(project_id)
                : await keywordService.list();

            return c.json({
                data,
                pagination: { total: data.length, page: 1, limit: 50 },
            });
        } catch (error) {
            logger.error('Failed to list keywords', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }

    static async create(c: Context) {
        const body = await c.req.json();
        const { project_id, query, intent, scan_frequency, engines } = body;

        try {
            const keyword = await keywordService.create({
                project_id,
                query,
                intent,
                scan_frequency,
                engines,
            });

            return c.json({ data: keyword }, 201);
        } catch (error) {
            logger.error('Failed to create keyword', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }

    static async delete(c: Context) {
        const id = c.req.param('id');

        try {
            await keywordService.delete(id);
            return c.body(null, 204);
        } catch (error) {
            logger.error('Failed to delete keyword', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }
}
