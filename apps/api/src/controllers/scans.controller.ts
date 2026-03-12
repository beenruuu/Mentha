import type { Context } from 'hono';

import { logger } from '../core/logger';
import { BadRequestException, handleHttpException } from '../exceptions/http';
import { getScanService } from '../services/scan.service';

const scanService = getScanService();

export const ScanController = {
    list: async (c: Context) => {
        const project_id = c.req.query('project_id');
        const limit = c.req.query('limit') || '20';

        if (!project_id) {
            throw new BadRequestException('project_id is required');
        }

        try {
            const limitNum = parseInt(limit, 10);
            const results = await scanService.listResults({
                projectId: project_id,
                limit: limitNum,
            });

            return c.json({ data: results });
        } catch (error) {
            logger.error(
                {
                    error: (error as Error).message,
                },
                'Failed to list scan results',
            );
            return handleHttpException(c, error);
        }
    },

    getById: async (c: Context) => {
        const id = c.req.param('id');

        try {
            const result = await scanService.getResultById(id);
            return c.json({ data: result });
        } catch (error) {
            logger.error(
                {
                    error: (error as Error).message,
                },
                'Failed to get scan result',
            );
            return handleHttpException(c, error);
        }
    },
} as const;
