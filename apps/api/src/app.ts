import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';
import { secureHeaders } from 'hono/secure-headers';
import path from 'path';
import { env } from './config/index';
import { logger } from './infrastructure/logging/index';
import { aiViewMiddleware } from './infrastructure/middleware/index';
import healthRouter from './controllers/health.controller';
import projectsRouter from './controllers/projects.controller';
import keywordsRouter from './controllers/keywords.controller';
import scansRouter from './controllers/scans.controller';
import knowledgeGraphRouter from './controllers/knowledge-graph.controller';
import llmsTxtRouter from './controllers/llms-txt.controller';
import dashboardRouter from './controllers/dashboard.controller';
import edgeRouter from './controllers/edge.controller';
import webhooksRouter from './controllers/webhooks.controller';

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

app.route('/health', healthRouter);
app.route('/api/v1/projects', projectsRouter);
app.route('/api/v1/keywords', keywordsRouter);
app.route('/api/v1/scans', scansRouter);
app.route('/api/v1/kg', knowledgeGraphRouter);
app.route('/api/v1/dashboard', dashboardRouter);
app.route('/api/v1/edge', edgeRouter);
app.route('/api/v1/webhooks', webhooksRouter);
app.route('/llms.txt', llmsTxtRouter);

app.use('/shared/*', serveStatic({ root: path.join(process.cwd(), 'public') }));
app.use('/dashboard/*', serveStatic({ root: path.join(process.cwd(), 'public') }));
app.use('/optimization/*', serveStatic({ root: path.join(process.cwd(), 'public') }));
app.use('/authority/*', serveStatic({ root: path.join(process.cwd(), 'public') }));
app.use('/settings/*', serveStatic({ root: path.join(process.cwd(), 'public') }));

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
export type AppType = typeof app;
