import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { SettingsController } from '../controllers/settings.controller';
import { requireAuth } from '../middlewares/auth';

const setApiKeySchema = z.object({
    provider: z.literal('openrouter'),
    key: z.string().min(10),
});

const testApiKeySchema = z.object({
    provider: z.literal('openrouter'),
});

const router = new Hono()
    .use('*', requireAuth)
    .get('/api-keys', SettingsController.getApiKeys)
    .put('/api-keys', zValidator('json', setApiKeySchema), SettingsController.setApiKey)
    .delete('/api-keys/:provider', SettingsController.deleteApiKey)
    .post('/api-keys/test', zValidator('json', testApiKeySchema), SettingsController.testApiKey);

export default router;
