import type { Context } from 'hono';

export const HealthController = {
    check: async (c: Context) => {
        return c.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
        });
    },

    ready: async (c: Context) => {
        return c.json({
            status: 'ready',
            checks: {
                database: 'pending',
                redis: 'pending',
            },
        });
    },
} as const;
