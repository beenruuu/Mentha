import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { auth } from '../core/auth';

export interface UserPayload {
    id: string;
    email: string;
    name: string;
    role?: string;
    plan?: string;
}

export interface AuthVariables {
    user: UserPayload;
    session: any;
}

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (!session) {
        c.set('user', undefined as any);
        c.set('session', undefined as any);
        await next();
        return;
    }

    c.set('user', {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role,
        plan: (session.user as any).plan,
    });
    c.set('session', session.session);

    await next();
});

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }
    await next();
});

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

export const getUser = (c: {
    get: (key: string) => UserPayload | undefined;
}): UserPayload | undefined => {
    return c.get('user');
};

export const isAuthenticated = (c: { get: (key: string) => UserPayload | undefined }): boolean => {
    const user = c.get('user');
    return !!user?.id;
};
