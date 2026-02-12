import type { Context } from 'hono';

import { logger } from '../core/logger';
import { BadRequestException, handleHttpException } from '../exceptions/http';
import { getScanService } from '../services/scan.service';

const scanService = getScanService();

export class ScanController {
    static async list(c: Context) {
        const project_id = c.req.query('project_id');
        const limit = c.req.query('limit') || '20';

        if (!project_id) {
            throw new BadRequestException('project_id is required');
        }

        try {
            const limitNum = parseInt(limit, 10);
            const results = await scanService.getResultsByProject(project_id, limitNum);

            return c.json({ data: results });
        } catch (error) {
            logger.error('Failed to list scan results', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }

    static async getById(c: Context) {
        const id = c.req.param('id');

        try {
            const result = await scanService.getResultById(id);
            return c.json({ data: result });
        } catch (error) {
            logger.error('Failed to get scan result', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }
}
