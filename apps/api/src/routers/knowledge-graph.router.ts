import { Hono } from 'hono';

import { KnowledgeGraphController } from '../controllers/knowledge-graph.controller';
import { requireAuth } from '../middlewares/auth';
import { requireProjectAccess } from '../middlewares/project-auth';

const router = new Hono()
    .use('*', requireAuth)
    .use('*', requireProjectAccess('project_id'))
    .get('/entities', KnowledgeGraphController.listEntities)
    .get('/entities/:slug/jsonld', KnowledgeGraphController.getEntityJsonLd)
    .get('/entities/:slug/claims', KnowledgeGraphController.getEntityClaims)
    .get('/entities/:slug/faqs', KnowledgeGraphController.getEntityFaqs);

export default router;
