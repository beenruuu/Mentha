import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { ProjectController } from '../controllers/projects.controller';
import { attachUser, requireAuth } from '../middlewares/auth';
import { createProjectSchema, updateProjectSchema } from '../schemas/project.schema';

const router = new Hono()
    .use('*', requireAuth, attachUser)
    .get('/', ProjectController.list)
    .post('/', zValidator('json', createProjectSchema), ProjectController.create)
    .get('/:id', ProjectController.getById)
    .patch('/:id', zValidator('json', updateProjectSchema), ProjectController.update)
    .delete('/:id', ProjectController.delete);

export default router;
