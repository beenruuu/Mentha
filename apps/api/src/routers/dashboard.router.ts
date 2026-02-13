import { Hono } from 'hono';

import { DashboardController } from '../controllers/dashboard.controller';

const router = new Hono()
    .get('/share-of-model', DashboardController.getShareOfModel)
    .get('/keywords', DashboardController.getKeywordPerformance)
    .get('/citations', DashboardController.getCitationAnalysis);

export default router;
