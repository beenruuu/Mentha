import { Hono } from 'hono';

import { OpenRouterController } from '../controllers/openrouter.controller';
import { requireAuth } from '../middlewares/auth';

const router = new Hono();

// All AI routes require authentication
router.use('/*', requireAuth);

// Proxy for OpenRouter
router.post('/chat/completions', OpenRouterController.chatCompletions);

export default router;
