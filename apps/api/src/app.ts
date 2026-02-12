import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './config/env';
import { logger } from './core/logger';
import { aiViewMiddleware } from './middlewares/ai-view';

import healthRouter from './routers/health.router';
import projectsRouter from './routers/projects.router';
import keywordsRouter from './routers/keywords.router';
import scansRouter from './routers/scans.router';
import knowledgeGraphRouter from './routers/knowledge-graph.router';
import llmsTxtRouter from './routers/llms-txt.router';
import dashboardRouter from './routers/dashboard.router';
import edgeRouter from './routers/edge.router';
import webhooksRouter from './routers/webhooks.router';

const app = new Hono();

app.use(secureHeaders({
    contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https://api.dicebear.com", "https://www.google.com"],
    },
}));

app.use('*', cors({
    origin: env.NODE_ENV === 'production'
        ? (process.env['ALLOWED_ORIGINS']?.split(',') || [])
        : '*',
    credentials: true,
}));

app.use(compress());

app.use(aiViewMiddleware);

app.use('*', async (c, next) => {
    logger.debug(`${c.req.method} ${c.req.path}`, {
        query: c.req.query(),
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
    });
    await next();
});

const routes = app
    .route('/health', healthRouter)
    .route('/api/v1/projects', projectsRouter)
    .route('/api/v1/keywords', keywordsRouter)
    .route('/api/v1/scans', scansRouter)
    .route('/api/v1/kg', knowledgeGraphRouter)
    .route('/api/v1/dashboard', dashboardRouter)
    .route('/api/v1/edge', edgeRouter)
    .route('/api/v1/webhooks', webhooksRouter)
    .route('/llms.txt', llmsTxtRouter);

app.notFound((c) => {
    return c.json({
        error: 'Not Found',
        message: 'The requested resource does not exist',
    }, 404);
});

app.onError((err, c) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
    });

    return c.json({
        error: 'Internal Server Error',
        message: env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    }, 500);
});

const PORT = env.PORT;

serve({
    fetch: app.fetch,
    port: PORT,
}, () => {
    logger.info(`🌿 Mentha API server running on port ${PORT}`, {
        environment: env.NODE_ENV,
        port: PORT,
    });
});

export default app;
export type AppType = typeof routes;
