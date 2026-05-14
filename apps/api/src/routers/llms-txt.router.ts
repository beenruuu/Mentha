import { Hono } from 'hono';

import { LlmsTxtController } from '../controllers/llms-txt.controller';

const router = new Hono()
    .get('/', LlmsTxtController.generate)
    .get('/full', LlmsTxtController.generateFull)
    .get('/artifacts', LlmsTxtController.listArtifacts)
    .get('/artifacts.zip', LlmsTxtController.downloadArtifactsZip)
    .get('/artifacts/:name', LlmsTxtController.generateArtifact)
    .get('/score', LlmsTxtController.scoreUrl)
    .get('/adapters', LlmsTxtController.listFrameworkAdapters)
    .get('/adapters/:name', LlmsTxtController.getFrameworkAdapter)
    .get('/report', LlmsTxtController.operationalReport);

export default router;
