import { createMiddleware } from 'hono/factory';
import { jwt } from 'hono/jwt';
import { env } from '../config/index';

export type UserPayload = {
    id: string;
    email?: string;
    role?: string;
};

export type AuthVariables = {
    user: UserPayload;
};

export const requireAuth = jwt({
    secret: env.SUPABASE_JWT_SECRET,
    alg: 'HS256',
});

export const attachUser = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const payload = c.get('jwtPayload');

    if (payload && typeof payload === 'object' && 'sub' in payload) {
        const user: UserPayload = {
            id: payload.sub as string,
            email: (payload as any).email,
            role: (payload as any).role,
        };
        c.set('user', user);
    }

    await next();
});

export const getUser = (c: any): UserPayload | undefined => {
    return c.get('user');
};

export const isAuthenticated = (c: any): boolean => {
    const user = c.get('user');
    return !!user?.id;
};
