import { Hono } from 'hono';

import { HealthController } from '../controllers/health.controller';

const router = new Hono().get('/', HealthController.check).get('/ready', HealthController.ready);

export default router;
