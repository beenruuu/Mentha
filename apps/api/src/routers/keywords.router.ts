import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { KeywordController } from '../controllers/keywords.controller';
import { requireAuth } from '../middlewares/auth';
import { requireKeywordAccess, requireProjectAccess } from '../middlewares/project-auth';
import { createKeywordSchema } from '../schemas/keyword.schema';

const router = new Hono()
    .use('*', requireAuth)
    .get('/', requireProjectAccess('project_id'), KeywordController.list)
    .post(
        '/',
        requireProjectAccess('project_id'),
        zValidator('json', createKeywordSchema),
        KeywordController.create,
    )
    .delete('/:id', requireKeywordAccess('id'), KeywordController.delete);

export default router;
