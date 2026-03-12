import { Hono } from 'hono';

import { KnowledgeGraphController } from '../controllers/knowledge-graph.controller';
import { requireAuth } from '../middlewares/auth';

const router = new Hono()
    .use('*', requireAuth)
    .get('/entities', KnowledgeGraphController.listEntities)
    .get('/entities/:slug/jsonld', KnowledgeGraphController.getEntityJsonLd)
    .get('/entities/:slug/claims', KnowledgeGraphController.getEntityClaims)
    .get('/entities/:slug/faqs', KnowledgeGraphController.getEntityFaqs);

export default router;
