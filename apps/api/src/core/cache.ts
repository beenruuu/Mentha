import crypto from 'crypto';
import { getRedisConnection } from './queue';
import { logger } from './logger';
import { env } from '../config/env';

interface CacheEntry {
    content: string;
    citations: unknown[];
    model: string;
    cachedAt: string;
}

function generateCacheKey(query: string, provider: string): string {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
    const dateStr = new Date().toISOString().split('T')[0];
    const hash = crypto
        .createHash('sha256')
        .update(`${provider}:${normalized}:${dateStr}`)
        .digest('hex');

    return `cache:search:${hash}`;
}

export async function getCachedResult(query: string, provider: string): Promise<CacheEntry | null> {
    const redis = getRedisConnection();
    const key = generateCacheKey(query, provider);

    try {
        const cached = await redis.get(key);

        if (cached) {
            logger.debug('Cache hit', { provider, keyPrefix: key.substring(0, 20) });
            return JSON.parse(cached) as CacheEntry;
        }

        logger.debug('Cache miss', { provider });
        return null;
    } catch (error) {
        logger.warn('Cache get error', { error: (error as Error).message });
        return null;
    }
}

export async function setCachedResult(
    query: string,
    provider: string,
    result: {
        content: string;
        citations: unknown[];
        model: string;
    }
): Promise<void> {
    const redis = getRedisConnection();
    const key = generateCacheKey(query, provider);

    const entry: CacheEntry = {
        ...result,
        cachedAt: new Date().toISOString(),
    };

    try {
        const ttlSeconds = env.CACHE_TTL_HOURS * 3600;
        await redis.setex(key, ttlSeconds, JSON.stringify(entry));

        logger.debug('Result cached', {
            provider,
            ttlHours: env.CACHE_TTL_HOURS,
        });
    } catch (error) {
        logger.warn('Cache set error', { error: (error as Error).message });
    }
}

export async function invalidateCache(query: string, provider: string): Promise<void> {
    const redis = getRedisConnection();
    const key = generateCacheKey(query, provider);

    await redis.del(key);
    logger.debug('Cache invalidated', { provider });
}

export async function getCacheStats(): Promise<{
    approximateSize: number;
    memoryUsage: string;
}> {
    const redis = getRedisConnection();

    const keys = await redis.keys('cache:search:*');

    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(\S+)/);
    const memoryUsage = memoryMatch?.[1] ?? 'unknown';

    return {
        approximateSize: keys.length,
        memoryUsage,
    };
}

export async function clearSearchCache(): Promise<number> {
    const redis = getRedisConnection();

    const keys = await redis.keys('cache:search:*');

    if (keys.length > 0) {
        await redis.del(...keys);
    }

    logger.info('Search cache cleared', { keysDeleted: keys.length });
    return keys.length;
}
