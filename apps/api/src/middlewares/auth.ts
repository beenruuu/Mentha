import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { jwt, sign } from 'hono/jwt';

import { env } from '../config/env';

export interface UserPayload {
    id: string;
    email?: string;
    role?: string;
}

export interface AuthVariables {
    user: UserPayload;
}

export const requireAuth = jwt({
    secret: env.JWT_SECRET,
    alg: env.JWT_ALGORITHM,
});

export const attachUser = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const payload = c.get('jwtPayload');

    if (!payload || typeof payload !== 'object') {
        await next();
        return;
    }

    if ('sub' in payload) {
        const user: UserPayload = {
            id: payload.sub as string,
            email: (payload as { email?: string }).email,
            role: (payload as { role?: string }).role,
        };
        c.set('user', user);
    }

    await next();
});

export const getUser = (c: {
    get: (key: string) => UserPayload | undefined;
}): UserPayload | undefined => {
    return c.get('user');
};

export const isAuthenticated = (c: { get: (key: string) => UserPayload | undefined }): boolean => {
    const user = c.get('user');
    return !!user?.id;
};

export const requireRole = (allowedRoles: string[]) => {
    return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
        const user = c.get('user');

        if (!user || !user.role) {
            throw new HTTPException(403, { message: 'Access denied' });
        }

        if (!allowedRoles.includes(user.role)) {
            throw new HTTPException(403, { message: 'Insufficient permissions' });
        }

        await next();
    });
};

export async function generateToken(user: UserPayload): Promise<string> {
    const expiresIn = env.JWT_EXPIRES_IN;
    const expirationSeconds = parseExpiration(expiresIn);

    const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + expirationSeconds,
        iat: Math.floor(Date.now() / 1000),
        iss: env.JWT_ISSUER,
    };

    return await sign(payload, env.JWT_SECRET, env.JWT_ALGORITHM);
}

function parseExpiration(exp: string): number {
    const unit = exp.slice(-1);
    const value = parseInt(exp.slice(0, -1), 10);

    switch (unit) {
        case 'd':
            return value * 24 * 60 * 60;
        case 'h':
            return value * 60 * 60;
        case 'm':
            return value * 60;
        case 's':
            return value;
        default:
            return 60 * 60 * 24 * 7;
    }
}
