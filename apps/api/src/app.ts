import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import { env } from './config/env';
import { auth } from './core/auth';
import { logger } from './core/logger';
import { aiViewMiddleware } from './middlewares/ai-view';
import { authMiddleware } from './middlewares/auth';
import billingRouter from './routers/billing.router';
import dashboardRouter from './routers/dashboard.router';
import edgeRouter from './routers/edge.router';
import healthRouter from './routers/health.router';
import keywordsRouter from './routers/keywords.router';
import knowledgeGraphRouter from './routers/knowledge-graph.router';
import llmsTxtRouter from './routers/llms-txt.router';
import openrouterRouter from './routers/openrouter.router';
import projectsRouter from './routers/projects.router';
import scansRouter from './routers/scans.router';
import webhooksRouter from './routers/webhooks.router';

const app = new Hono();

app.use(
    secureHeaders({
        contentSecurityPolicy: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
            imgSrc: ["'self'", 'data:', 'https://api.dicebear.com', 'https://www.google.com'],
        },
    }),
);

app.use(
    '*',
    cors({
        origin: (origin) => {
            if (env.NODE_ENV === 'development') return origin;
            const allowed = process.env.ALLOWED_ORIGINS?.split(',') || [];
            if (allowed.includes(origin)) return origin;
            return null;
        },
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposeHeaders: ['Content-Length', 'X-JSON'],
    }),
);

app.use(compress());
app.use(aiViewMiddleware);
app.use('*', authMiddleware);

app.use('*', async (c, next) => {
    logger.debug(
        {
            query: c.req.query(),
            ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        },
        `${c.req.method} ${c.req.path}`,
    );
    await next();
});

// Better Auth Handler
app.on(['POST', 'GET'], '/api/v1/auth/*', (c) => auth.handler(c.req.raw));

const routes = app
    .route('/health', healthRouter)
    .route('/api/v1/projects', projectsRouter)
    .route('/api/v1/keywords', keywordsRouter)
    .route('/api/v1/scans', scansRouter)
    .route('/api/v1/kg', knowledgeGraphRouter)
    .route('/api/v1/dashboard', dashboardRouter)
    .route('/api/v1/edge', edgeRouter)
    .route('/api/v1/webhooks', webhooksRouter)
    .route('/api/v1/ai', openrouterRouter)
    .route('/api/v1/billing', billingRouter)
    .route('/llms.txt', llmsTxtRouter);

app.notFound((c) => {
    return c.json(
        {
            error: 'Not Found',
            message: 'The requested resource does not exist',
        },
        404,
    );
});

app.onError((err, c) => {
    logger.error(
        {
            error: err.message,
            stack: err.stack,
        },
        'Unhandled error',
    );

    return c.json(
        {
            error: 'Internal Server Error',
            message: env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
        },
        500,
    );
});

const PORT = env.PORT;

serve(
    {
        fetch: app.fetch,
        port: PORT,
    },
    () => {
        logger.info(
            {
                environment: env.NODE_ENV,
                port: PORT,
            },
            `🌿 Mentha API server running on port ${PORT}`,
        );
    },
);

export default app;
export type AppType = typeof routes;
