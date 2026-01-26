import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /health
 * Health check endpoint for load balancers and monitoring
 */
router.get('/', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env['npm_package_version'] ?? '1.0.0',
    });
});

/**
 * GET /health/ready
 * Readiness probe - indicates if service is ready to accept traffic
 */
router.get('/ready', (_req: Request, res: Response) => {
    // TODO: Add database and Redis connectivity checks
    res.json({
        status: 'ready',
        checks: {
            database: 'pending',
            redis: 'pending',
        },
    });
});

export { router as healthRouter };
