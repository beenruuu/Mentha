import { Hono } from 'hono';

import { ScanController } from '../controllers/scans.controller';
import { requireAuth, attachUser } from '../middlewares/auth';

const router = new Hono()
    .use('*', requireAuth, attachUser)
    .get('/', ScanController.list).get('/:id', ScanController.getById);

export default router;
