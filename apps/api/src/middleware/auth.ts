import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/index.js';
import { logger } from '../infrastructure/logging/index.js';

/**
 * Decoded JWT payload from Supabase
 */
export interface JWTPayload {
    sub: string;           // User ID
    email?: string;
    role?: string;
    aud: string;
    iat: number;
    exp: number;
}

/**
 * Extended Request with authenticated user context
 */
export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email?: string;
        role?: string;
    };
}

/**
 * Extract and verify JWT from Authorization header
 */
function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        logger.debug('JWT verification failed', { error: (error as Error).message });
        return null;
    }
}

/**
 * Authentication middleware - requires valid JWT
 * Use this for protected routes
 */
export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid Authorization header',
        });
        return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
        return;
    }

    // Attach user context to request
    (req as AuthenticatedRequest).user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
    };

    next();
}

/**
 * Optional authentication middleware
 * Attaches user if token present, continues without error if not
 */
export function optionalAuth(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);

        if (payload) {
            (req as AuthenticatedRequest).user = {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
            };
        }
    }

    next();
}

/**
 * Type guard to check if request is authenticated
 */
export function isAuthenticated(req: Request): req is AuthenticatedRequest {
    return 'user' in req && typeof (req as AuthenticatedRequest).user?.id === 'string';
}
