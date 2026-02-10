import crypto from 'crypto';
import { getRedisConnection } from '../queue/connection';
import { logger } from '../logging/index';
import { env } from '../../config/index';

/**
 * Cache entry with metadata
 */
interface CacheEntry {
    content: string;
    citations: unknown[];
    model: string;
    cachedAt: string;
}

/**
 * Generate a cache key from a normalized query
 */
function generateCacheKey(query: string, provider: string): string {
    // Normalize: lowercase, trim, remove extra spaces
    const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');

    // Include date to ensure daily freshness
    const dateStr = new Date().toISOString().split('T')[0];

    // Generate SHA-256 hash
    const hash = crypto
        .createHash('sha256')
        .update(`${provider}:${normalized}:${dateStr}`)
        .digest('hex');

    return `cache:search:${hash}`;
}

/**
 * Get cached search result
 */
export async function getCachedResult(
    query: string,
    provider: string
): Promise<CacheEntry | null> {
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

/**
 * Store search result in cache
 */
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

/**
 * Invalidate cache for a specific query
 */
export async function invalidateCache(
    query: string,
    provider: string
): Promise<void> {
    const redis = getRedisConnection();
    const key = generateCacheKey(query, provider);

    await redis.del(key);
    logger.debug('Cache invalidated', { provider });
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
    approximateSize: number;
    memoryUsage: string;
}> {
    const redis = getRedisConnection();

    // Count cache keys
    const keys = await redis.keys('cache:search:*');

    // Get memory info
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(\S+)/);
    const memoryUsage = memoryMatch?.[1] ?? 'unknown';

    return {
        approximateSize: keys.length,
        memoryUsage,
    };
}

/**
 * Clear all search cache (admin function)
 */
export async function clearSearchCache(): Promise<number> {
    const redis = getRedisConnection();

    const keys = await redis.keys('cache:search:*');

    if (keys.length > 0) {
        await redis.del(...keys);
    }

    logger.info('Search cache cleared', { keysDeleted: keys.length });
    return keys.length;
}
