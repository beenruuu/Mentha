import { Hono } from 'hono';

import { DashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/auth';
import { requireProjectAccess } from '../middlewares/project-auth';

const router = new Hono()
    .use('*', requireAuth)
    .use('*', requireProjectAccess('project_id'))
    .get('/report-status', DashboardController.getReportStatus)
    .get('/share-of-model', DashboardController.getShareOfModel)
    .get('/keywords', DashboardController.getKeywordPerformance)
    .get('/citations', DashboardController.getCitationAnalysis)
    .get('/top-brands', DashboardController.getTopBrands);

export default router;
