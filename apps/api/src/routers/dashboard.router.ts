import { Hono } from 'hono';

import { DashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/auth';
import { extractProjectId } from '../middlewares/project-auth';

const router = new Hono()
    .use('*', requireAuth)
    .use('*', extractProjectId('projectId'))
    .get('/share-of-model', DashboardController.getShareOfModel)
    .get('/keywords', DashboardController.getKeywordPerformance)
    .get('/citations', DashboardController.getCitationAnalysis)
    .get('/top-brands', DashboardController.getTopBrands);

export default router;
