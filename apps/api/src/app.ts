import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/index.js';
import { logger } from './infrastructure/logging/index.js';
import { aiViewMiddleware } from './infrastructure/middleware/index.js';
import { healthRouter } from './controllers/health.controller.js';
import { projectsRouter } from './controllers/projects.controller.js';
import { keywordsRouter } from './controllers/keywords.controller.js';
import { scansRouter } from './controllers/scans.controller.js';
import { knowledgeGraphRouter } from './controllers/knowledge-graph.controller.js';
import { llmsTxtRouter } from './controllers/llms-txt.controller.js';
import { dashboardRouter } from './controllers/dashboard.controller.js';
import { edgeRouter } from './controllers/edge.controller.js';

const app = express();

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Security headers
// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https://api.dicebear.com", "https://www.google.com"],
        },
    },
}));

// CORS configuration
app.use(cors({
    origin: env.NODE_ENV === 'production'
        ? process.env['ALLOWED_ORIGINS']?.split(',')
        : '*',
    credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// AI Crawler Detection (sets req.isAIBot)
app.use(aiViewMiddleware);

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug(`${req.method} ${req.path}`, {
        query: req.query,
        ip: req.ip,
    });
    next();
});

// =============================================================================
// ROUTES
// =============================================================================

app.use('/health', healthRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/keywords', keywordsRouter);
app.use('/api/v1/scans', scansRouter);

// Knowledge Graph & AEO endpoints
app.use('/api/v1/kg', knowledgeGraphRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/edge', edgeRouter);
app.use('/llms.txt', llmsTxtRouter);

// Dashboard UI (static files)
app.use('/shared', express.static(path.join(process.cwd(), 'public', 'shared')));
app.use('/dashboard', express.static(path.join(process.cwd(), 'public', 'dashboard')));
app.use('/optimization', express.static(path.join(process.cwd(), 'public', 'optimization')));
app.use('/authority', express.static(path.join(process.cwd(), 'public', 'authority')));
app.use('/settings', express.static(path.join(process.cwd(), 'public', 'settings')));

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * 404 Handler
 */
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource does not exist',
    });
});

/**
 * Global error handler
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
    });

    res.status(500).json({
        error: 'Internal Server Error',
        message: env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const PORT = env.PORT;

app.listen(PORT, () => {
    logger.info(`🌿 Mentha API server running on port ${PORT}`, {
        environment: env.NODE_ENV,
        port: PORT,
    });
});

export { app };
