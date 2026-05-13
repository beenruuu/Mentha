/**
 * BullMQ Workers Orchestrator
 * Imports and starts all workers when this file is loaded
 */

import { logger } from '../core/logger';
import { testDatabaseConnection } from '../db';
import analysisWorker from './analysis.worker';
import scraperWorker from './scraper.worker';

async function startWorkers() {
    logger.info('⏳ Waiting for database connection...');
    
    let connected = false;
    while (!connected) {
        connected = await testDatabaseConnection();
        if (!connected) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    logger.info('🚀 DB connected, starting BullMQ workers...');
    
    // Manually start workers since autorun is false
    scraperWorker.run();
    analysisWorker.run();

    logger.info(`   → Scraper: processing up to 3 scans in parallel`);
    logger.info(`   → Analysis: processing up to 2 analyses in parallel`);
}

startWorkers().catch(err => {
    logger.error({ err: err.message }, 'Fatal error starting workers');
    process.exit(1);
});

// Export for access if needed
export { scraperWorker, analysisWorker };
