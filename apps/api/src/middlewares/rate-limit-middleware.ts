import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import { logger } from '../core/logger';
import { checkRateLimit, RATE_LIMITS } from '../core/rate-limit';

// Re-export for convenience
export { RATE_LIMITS };

export interface RateLimitConfig {
    limit: number;
    windowSeconds: number;
    keyPrefix: string;
}

/**
 * Middleware to apply rate limiting
 * Usage: router.post('/scan', applyRateLimit(RATE_LIMITS.SCAN), ...)
 */
export const applyRateLimit = (config: RateLimitConfig = RATE_LIMITS.API) => {
    return createMiddleware(async (c, next) => {
        const user = c.get('user');

        if (!user) {
            // Skip rate limiting for unauthenticated requests
            await next();
            return;
        }

        const { allowed, remaining, resetAt } = await checkRateLimit(user.id, config);

        // Set headers
        c.header('X-RateLimit-Limit', config.limit.toString());
        c.header('X-RateLimit-Remaining', remaining.toString());
        c.header('X-RateLimit-Reset', resetAt.toISOString());

        if (!allowed) {
            logger.warn(
                `Rate limit exceeded for user ${user.id} on ${config.keyPrefix}. Reset: ${resetAt.toISOString()}`,
            );

            throw new HTTPException(429, {
                message: `Rate limit exceeded. ${remaining} remaining. Resets at ${resetAt.toISOString()}`,
            });
        }

        await next();
    });
};

/**
 * Stricter rate limiting for expensive operations
 * Usage: router.post('/expensive-scan', applyRateLimit(RATE_LIMITS.SCAN), ...)
 */
export const createCustomRateLimit = (limit: number, windowSeconds: number, keyPrefix: string) => {
    return applyRateLimit({
        limit,
        windowSeconds,
        keyPrefix,
    });
};

/**
 * Per-IP rate limiting (useful for public endpoints)
 */
export const applyIpRateLimit = (limit: number = 10, windowSeconds: number = 60) => {
    return createMiddleware(async (c, next) => {
        const ip =
            c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
            c.req.header('x-real-ip') ||
            'unknown';

        if (ip === 'unknown') {
            await next();
            return;
        }

        // Use IP-based rate limit config
        const config: RateLimitConfig = {
            limit,
            windowSeconds,
            keyPrefix: `ratelimit:ip:${ip}`,
        };

        const { allowed, remaining, resetAt } = await checkRateLimit(ip, config);

        c.header('X-RateLimit-Limit', limit.toString());
        c.header('X-RateLimit-Remaining', remaining.toString());
        c.header('X-RateLimit-Reset', resetAt.toISOString());

        if (!allowed) {
            throw new HTTPException(429, {
                message: 'Rate limit exceeded',
            });
        }

        await next();
    });
};
