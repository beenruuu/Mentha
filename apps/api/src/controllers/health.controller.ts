import { Hono } from 'hono';

const app = new Hono()
    .get('/', (c) => {
        return c.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env['npm_package_version'] || '1.0.0',
        });
    })
    .get('/ready', (c) => {
        return c.json({
            status: 'ready',
            checks: {
                database: 'pending',
                redis: 'pending',
            },
        });
    });

export default app;
export type HealthAppType = typeof app;
