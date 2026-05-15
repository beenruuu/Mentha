import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { ProjectController } from '../controllers/projects.controller';
import { requireAuth } from '../middlewares/auth';
import { requireProjectAccess } from '../middlewares/project-auth';
import {
    analyzeDomainSchema,
    createProjectSchema,
    updateProjectSchema,
} from '../schemas/project.schema';

const router = new Hono()
    .use('*', requireAuth)
    .get('/', ProjectController.list)
    .post('/', zValidator('json', createProjectSchema), ProjectController.create)
    .post('/analyze', zValidator('json', analyzeDomainSchema), ProjectController.analyzeDomain)
    .get('/:id', requireProjectAccess('id'), ProjectController.getById)
    .patch(
        '/:id',
        requireProjectAccess('id'),
        zValidator('json', updateProjectSchema),
        ProjectController.update,
    )
    .delete('/:id', requireProjectAccess('id'), ProjectController.delete);

export default router;
