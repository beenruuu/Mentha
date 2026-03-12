import crypto from 'node:crypto';

import { env } from '../config/env';
import { logger } from './logger';
import { getRedisConnection } from './queue';

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
            logger.debug({ provider, keyPrefix: key.substring(0, 20) }, 'Cache hit');
            return JSON.parse(cached) as CacheEntry;
        }

        logger.debug({ provider }, 'Cache miss');
        return null;
    } catch (error) {
        logger.warn({ error: (error as Error).message }, 'Cache get error');
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
    },
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

        logger.debug(
            {
                provider,
                ttlHours: env.CACHE_TTL_HOURS,
            },
            'Result cached',
        );
    } catch (error) {
        logger.warn({ error: (error as Error).message }, 'Cache set error');
    }
}

export async function invalidateCache(query: string, provider: string): Promise<void> {
    const redis = getRedisConnection();
    const key = generateCacheKey(query, provider);

    await redis.del(key);
    logger.debug({ provider }, 'Cache invalidated');
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

    logger.info({ keysDeleted: keys.length }, 'Search cache cleared');
    return keys.length;
}
