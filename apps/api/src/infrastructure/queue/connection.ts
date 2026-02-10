import IORedis from 'ioredis';
import { env } from '../../config/index';
import { logger } from '../logging/index';

/**
 * Redis connection configuration for BullMQ
 * maxRetriesPerRequest: null is required by BullMQ
 */
export function createRedisConnection(): IORedis {
    const connection = new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => {
            if (times > 10) {
                logger.error('Redis connection failed after 10 retries');
                return null;
            }
            return Math.min(times * 100, 3000);
        },
    });

    connection.on('connect', () => {
        logger.info('Redis connected');
    });

    connection.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
    });

    return connection;
}

/**
 * Shared Redis connection for all queues
 * Singleton pattern to reuse connection
 */
let sharedConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
    if (!sharedConnection) {
        sharedConnection = createRedisConnection();
    }
    return sharedConnection;
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedisConnection(): Promise<void> {
    if (sharedConnection) {
        await sharedConnection.quit();
        sharedConnection = null;
        logger.info('Redis connection closed');
    }
}

/**
 * Test Redis connectivity
 */
export async function testRedisConnection(): Promise<boolean> {
    try {
        const connection = getRedisConnection();
        const pong = await connection.ping();
        logger.info('Redis connection test passed', { response: pong });
        return pong === 'PONG';
    } catch (err) {
        logger.error('Redis connection test failed', { error: (err as Error).message });
        return false;
    }
}
