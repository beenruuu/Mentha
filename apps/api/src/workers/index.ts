import { logger } from '../infrastructure/logging/index';
import { closeRedisConnection, closeAllQueues } from '../infrastructure/queue/index';
import { createScanWorker } from './scan.worker';
import { createAnalysisWorker } from './analysis.worker';

/**
 * Worker process entry point
 * Starts all workers and handles graceful shutdown
 */
async function main() {
    logger.info('🚀 Starting Mentha workers');

    // Initialize workers
    const scanWorker = createScanWorker();
    const analysisWorker = createAnalysisWorker();

    logger.info('Workers initialized', {
        workers: ['scan', 'analysis'],
    });

    // Graceful shutdown handler
    const shutdown = async (signal: string) => {
        logger.info(`Received ${signal}, shutting down workers...`);

        try {
            // Close workers (waits for current jobs to complete)
            await Promise.all([
                scanWorker.close(),
                analysisWorker.close(),
            ]);

            // Clean up queues and Redis
            await closeAllQueues();
            await closeRedisConnection();

            logger.info('Workers shut down gracefully');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown', { error: (error as Error).message });
            process.exit(1);
        }
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Keep process alive
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    });

    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled rejection', { reason });
    });
}

main().catch((error) => {
    logger.error('Failed to start workers', { error: error.message });
    process.exit(1);
});
