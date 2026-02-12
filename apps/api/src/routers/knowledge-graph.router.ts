import { Hono } from 'hono';
import { KnowledgeGraphController } from '../controllers/knowledge-graph.controller';

const router = new Hono()
    .get('/entities', KnowledgeGraphController.listEntities)
    .get('/entities/:slug/jsonld', KnowledgeGraphController.getEntityJsonLd)
    .get('/entities/:slug/claims', KnowledgeGraphController.getEntityClaims)
    .get('/entities/:slug/faqs', KnowledgeGraphController.getEntityFaqs);

export default router;
