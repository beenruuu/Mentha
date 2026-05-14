import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { UiCaptureController } from '../controllers/ui-capture.controller';
import { requireAuth } from '../middlewares/auth';

const uiCaptureSchema = z.object({
    provider: z.enum(['chatgpt', 'gemini', 'perplexity', 'claude', 'ai-overview']),
    prompt: z.string().min(1),
    targetUrl: z.string().url().optional(),
    location: z.string().optional(),
    language: z.string().optional(),
    screenshotPath: z.string().optional(),
});

const router = new Hono()
    .use('*', requireAuth)
    .post('/', zValidator('json', uiCaptureSchema), UiCaptureController.capture);

export default router;
