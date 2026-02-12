import type { Context } from 'hono';

export class HealthController {
    static async check(c: Context) {
        return c.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
        });
    }

    static async ready(c: Context) {
        return c.json({
            status: 'ready',
            checks: {
                database: 'pending',
                redis: 'pending',
            },
        });
    }
}
