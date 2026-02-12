import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ProjectController } from '../controllers/projects.controller';
import { createProjectSchema, updateProjectSchema } from '../schemas/project.schema';
import { requireAuth, attachUser } from '../middlewares/auth';

const router = new Hono()
    .use('*', requireAuth, attachUser)
    .get('/', ProjectController.list)
    .post('/', zValidator('json', createProjectSchema), ProjectController.create)
    .get('/:id', ProjectController.getById)
    .patch('/:id', zValidator('json', updateProjectSchema), ProjectController.update)
    .delete('/:id', ProjectController.delete);

export default router;
