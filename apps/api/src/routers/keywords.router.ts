import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { KeywordController } from '../controllers/keywords.controller';
import { requireAuth } from '../middlewares/auth';
import { extractProjectId, requireProjectAccess } from '../middlewares/project-auth';
import { createKeywordSchema } from '../schemas/keyword.schema';

const router = new Hono()
    .use('*', requireAuth)
    .get('/', extractProjectId('projectId'), KeywordController.list)
    .post(
        '/',
        extractProjectId('projectId'),
        zValidator('json', createKeywordSchema),
        KeywordController.create,
    )
    .delete('/:id', requireProjectAccess('projectId'), KeywordController.delete);

export default router;
