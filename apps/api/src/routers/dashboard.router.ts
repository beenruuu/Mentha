import { Hono } from 'hono';

import { DashboardController } from '../controllers/dashboard.controller';
import { requireAuth, attachUser } from '../middlewares/auth';

const router = new Hono()
    .use('*', requireAuth, attachUser)
    .get('/share-of-model', DashboardController.getShareOfModel)
    .get('/keywords', DashboardController.getKeywordPerformance)
    .get('/citations', DashboardController.getCitationAnalysis);

export default router;
