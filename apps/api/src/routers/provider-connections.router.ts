import { Hono } from 'hono';

import { ProviderConnectionsController } from '../controllers/provider-connections.controller';
import { requireAuth } from '../middlewares/auth';
import { applyRateLimit, RATE_LIMITS } from '../middlewares/rate-limit-middleware';

const router = new Hono()
    .use('*', requireAuth)
    .get('/', applyRateLimit(RATE_LIMITS.API), ProviderConnectionsController.list)
    .post('/:provider/connect', applyRateLimit(RATE_LIMITS.API), ProviderConnectionsController.connect)
    .post(
        '/:provider/disconnect',
        applyRateLimit(RATE_LIMITS.API),
        ProviderConnectionsController.disconnect,
    );

export default router;
