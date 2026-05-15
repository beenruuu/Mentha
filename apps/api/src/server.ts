import { serve } from '@hono/node-server';

import app from './app';
import { env } from './config/env';
import { logger } from './core/logger';
import { initializeDatabase } from './db';
import { startWorkers, stopWorkers } from './workers';

const PORT = env.PORT;

initializeDatabase()
    .then(async () => {
        await startWorkers();

        const server = serve(
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

        const shutdown = async (signal: NodeJS.Signals) => {
            logger.info({ signal }, 'Shutting down Mentha API and workers');
            server.close();
            await stopWorkers();
            process.exit(0);
        };

        process.once('SIGINT', shutdown);
        process.once('SIGTERM', shutdown);
    })
    .catch((err) => {
        logger.error({ error: (err as Error).message }, 'Failed to initialize API server');
        process.exit(1);
    });
