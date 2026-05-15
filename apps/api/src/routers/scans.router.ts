import { Hono } from 'hono';

import { ScanController } from '../controllers/scans.controller';
import { requireAuth } from '../middlewares/auth';
import { requireProjectAccess, requireScanAccess } from '../middlewares/project-auth';
import { applyRateLimit, RATE_LIMITS } from '../middlewares/rate-limit-middleware';

const router = new Hono()
    .use('*', requireAuth)
    .get(
        '/',
        applyRateLimit(RATE_LIMITS.API),
        requireProjectAccess('project_id'),
        ScanController.list,
    )
    .post(
        '/trigger',
        applyRateLimit(RATE_LIMITS.API),
        requireProjectAccess('project_id'),
        ScanController.trigger,
    )
    .get(
        '/runs/:id',
        applyRateLimit(RATE_LIMITS.API),
        requireScanAccess('id'),
        ScanController.getById,
    )
    .get('/:id', applyRateLimit(RATE_LIMITS.API), requireScanAccess('id'), ScanController.getById);

export default router;
