import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { KeywordController } from '../controllers/keywords.controller';
import { createKeywordSchema } from '../schemas/keyword.schema';

const router = new Hono()
    .get('/', KeywordController.list)
    .post('/', zValidator('json', createKeywordSchema), KeywordController.create)
    .delete('/:id', KeywordController.delete);

export default router;
