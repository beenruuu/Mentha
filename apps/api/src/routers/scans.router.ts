import { Hono } from 'hono';

import { ScanController } from '../controllers/scans.controller';
import { requireAuth } from '../middlewares/auth';
import { extractProjectId, requireProjectAccess } from '../middlewares/project-auth';
import { applyRateLimit, RATE_LIMITS } from '../middlewares/rate-limit-middleware';

const router = new Hono()
    .use('*', requireAuth)
    .get('/', applyRateLimit(RATE_LIMITS.API), extractProjectId('projectId'), ScanController.list)
    .post(
        '/trigger',
        applyRateLimit(RATE_LIMITS.API),
        extractProjectId('projectId'),
        ScanController.trigger,
    )
    .get(
        '/runs/:id',
        applyRateLimit(RATE_LIMITS.API),
        requireProjectAccess('projectId'),
        ScanController.getById,
    )
    .get(
        '/:id',
        applyRateLimit(RATE_LIMITS.API),
        requireProjectAccess('projectId'),
        ScanController.getById,
    );

export default router;
