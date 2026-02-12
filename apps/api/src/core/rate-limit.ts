import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { env } from '../config/env';
import { logger } from './logger';
import { getRedisConnection } from './queue';

interface RateLimitConfig {
    limit: number;
    windowSeconds: number;
    keyPrefix: string;
}

export const RATE_LIMITS = {
    API: {
        limit: 100,
        windowSeconds: 60,
        keyPrefix: 'ratelimit:api',
    },
    SCAN: {
        limit: env.DEFAULT_DAILY_QUOTA,
        windowSeconds: 86400,
        keyPrefix: 'ratelimit:scan',
    },
    AUTH: {
        limit: 5,
        windowSeconds: 900,
        keyPrefix: 'ratelimit:auth',
    },
} as const;

export async function checkRateLimit(
    userId: string,
    config: RateLimitConfig = RATE_LIMITS.SCAN,
): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
}> {
    const redis = getRedisConnection();
    const key = `${config.keyPrefix}:${userId}`;

    const currentStr = await redis.get(key);
    const current = currentStr ? parseInt(currentStr, 10) : 0;

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

export async function incrementRateLimit(
    userId: string,
    config: RateLimitConfig = RATE_LIMITS.SCAN,
): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
}> {
    const redis = getRedisConnection();
    const key = `${config.keyPrefix}:${userId}`;

    const current = await redis.incr(key);

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

export async function getCurrentUsage(
    userId: string,
    config: RateLimitConfig = RATE_LIMITS.SCAN,
): Promise<{
    used: number;
    limit: number;
    remaining: number;
    resetAt: Date | null;
}> {
    const redis = getRedisConnection();
    const key = `${config.keyPrefix}:${userId}`;

    const [currentStr, ttl] = await Promise.all([redis.get(key), redis.ttl(key)]);

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

export async function resetRateLimit(
    userId: string,
    config: RateLimitConfig = RATE_LIMITS.SCAN,
): Promise<void> {
    const redis = getRedisConnection();
    const key = `${config.keyPrefix}:${userId}`;

    await redis.del(key);
    logger.info('Rate limit reset', { userId, keyPrefix: config.keyPrefix });
}

export async function setUserQuota(userId: string, quota: number): Promise<void> {
    const redis = getRedisConnection();
    const key = `quota:${userId}`;

    await redis.set(key, quota.toString());
    logger.info('User quota set', { userId, quota });
}

export async function getUserQuota(userId: string): Promise<number> {
    const redis = getRedisConnection();
    const key = `quota:${userId}`;

    const quotaStr = await redis.get(key);
    return quotaStr ? parseInt(quotaStr, 10) : env.DEFAULT_DAILY_QUOTA;
}

export function createAuthRateLimiter(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    const windowSeconds = Math.floor(windowMs / 1000);

    return async function authRateLimitMiddleware(c: Context, next: () => Promise<void>) {
        const ip =
            c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
            c.req.header('x-real-ip') ||
            'unknown';

        const redis = getRedisConnection();
        const key = `ratelimit:auth:${ip}`;

        const currentStr = await redis.get(key);
        const current = currentStr ? parseInt(currentStr, 10) : 0;

        if (current >= maxAttempts) {
            const ttl = await redis.ttl(key);
            const resetAt = new Date(Date.now() + ttl * 1000);

            logger.warn('Auth rate limit exceeded', {
                ip,
                attempts: current,
                resetAt: resetAt.toISOString(),
            });

            throw new HTTPException(429, {
                message: 'Too many authentication attempts. Please try again later.',
            });
        }

        const newCount = await redis.incr(key);

        if (newCount === 1) {
            await redis.expire(key, windowSeconds);
        }

        c.header('X-RateLimit-Limit', maxAttempts.toString());
        c.header('X-RateLimit-Remaining', Math.max(0, maxAttempts - newCount).toString());

        await next();
    };
}
