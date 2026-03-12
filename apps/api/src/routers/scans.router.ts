import { Hono } from 'hono';

import { ScanController } from '../controllers/scans.controller';
import { requireAuth } from '../middlewares/auth';

const router = new Hono()
    .use('*', requireAuth)
    .get('/', ScanController.list)
    .get('/:id', ScanController.getById);

export default router;
