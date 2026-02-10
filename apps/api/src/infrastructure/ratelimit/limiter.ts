import IORedis from 'ioredis';
import { getRedisConnection } from '../queue/connection';
import { logger } from '../logging/index';
import { env } from '../../config/index';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
    /** Maximum requests allowed in the window */
    limit: number;
    /** Window duration in seconds */
    windowSeconds: number;
    /** Key prefix for Redis */
    keyPrefix: string;
}

/**
 * Default configurations for different limit types
 */
export const RATE_LIMITS = {
    API: {
        limit: 100,
        windowSeconds: 60,
        keyPrefix: 'ratelimit:api',
    },
    SCAN: {
        limit: env.DEFAULT_DAILY_QUOTA,
        windowSeconds: 86400, // 24 hours
        keyPrefix: 'ratelimit:scan',
    },
} as const;

/**
 * Check if a user has exceeded their rate limit
 * Uses Redis INCR with TTL for atomic counter increment
 */
export async function checkRateLimit(
    userId: string,
    config: RateLimitConfig = RATE_LIMITS.SCAN
): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
}> {
    const redis = getRedisConnection();
    const key = `${config.keyPrefix}:${userId}`;

    // Get current count
    const currentStr = await redis.get(key);
    const current = currentStr ? parseInt(currentStr, 10) : 0;

    // Get TTL for reset time
    let ttl = await redis.ttl(key);
    if (ttl < 0) {
        ttl = config.windowSeconds;
    }

    const resetAt = new Date(Date.now() + ttl * 1000);
    const remaining = Math.max(0, config.limit - current);

    return {
        allowed: current < config.limit,
        remaining,
        resetAt,
    };
}

/**
 * Increment the rate limit counter for a user
 * Returns the new count and whether the limit was exceeded
 */
export async function incrementRateLimit(
    userId: string,
    config: RateLimitConfig = RATE_LIMITS.SCAN
): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
}> {
    const redis = getRedisConnection();
    const key = `${config.keyPrefix}:${userId}`;

    // Atomic increment
    const current = await redis.incr(key);

    // Set TTL on first increment
    if (current === 1) {
        await redis.expire(key, config.windowSeconds);
    }

    const allowed = current <= config.limit;

    if (!allowed) {
        logger.warn('Rate limit exceeded', { userId, current, limit: config.limit });
    }

    return {
        allowed,
        current,
        limit: config.limit,
    };
}

/**
 * Get current usage for a user
 */
export async function getCurrentUsage(
    userId: string,
    config: RateLimitConfig = RATE_LIMITS.SCAN
): Promise<{
    used: number;
    limit: number;
    remaining: number;
    resetAt: Date | null;
}> {
    const redis = getRedisConnection();
    const key = `${config.keyPrefix}:${userId}`;

    const [currentStr, ttl] = await Promise.all([
        redis.get(key),
        redis.ttl(key),
    ]);

    const used = currentStr ? parseInt(currentStr, 10) : 0;
    const remaining = Math.max(0, config.limit - used);
    const resetAt = ttl > 0 ? new Date(Date.now() + ttl * 1000) : null;

    return {
        used,
        limit: config.limit,
        remaining,
        resetAt,
    };
}

/**
 * Reset a user's rate limit (admin function)
 */
export async function resetRateLimit(
    userId: string,
    config: RateLimitConfig = RATE_LIMITS.SCAN
): Promise<void> {
    const redis = getRedisConnection();
    const key = `${config.keyPrefix}:${userId}`;

    await redis.del(key);
    logger.info('Rate limit reset', { userId, keyPrefix: config.keyPrefix });
}

/**
 * Set a custom quota for a user (e.g., for paid plans)
 */
export async function setUserQuota(
    userId: string,
    quota: number
): Promise<void> {
    const redis = getRedisConnection();
    const key = `quota:${userId}`;

    await redis.set(key, quota.toString());
    logger.info('User quota set', { userId, quota });
}

/**
 * Get a user's custom quota (or default)
 */
export async function getUserQuota(userId: string): Promise<number> {
    const redis = getRedisConnection();
    const key = `quota:${userId}`;

    const quotaStr = await redis.get(key);
    return quotaStr ? parseInt(quotaStr, 10) : env.DEFAULT_DAILY_QUOTA;
}
