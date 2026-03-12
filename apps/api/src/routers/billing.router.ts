import { Hono } from 'hono';

import { BillingController } from '../controllers/billing.controller';
import { requireAuth } from '../middlewares/auth';

const router = new Hono()
    .use('*', requireAuth)
    .get('/transactions', BillingController.getTransactions)
    .post('/top-up', BillingController.topUp);

export default router;
