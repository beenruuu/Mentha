import { Hono } from 'hono';

import { LlmsTxtController } from '../controllers/llms-txt.controller';

const router = new Hono()
    .get('/', LlmsTxtController.generate)
    .get('/full', LlmsTxtController.generateFull);

export default router;
