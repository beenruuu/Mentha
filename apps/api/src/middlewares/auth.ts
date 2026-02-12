import { createMiddleware } from 'hono/factory';
// import { jwt } from 'hono/jwt';
import { env } from '../config/env';

export type UserPayload = {
    id: string;
    email?: string;
    role?: string;
};

export type AuthVariables = {
    user: UserPayload;
};

// TODO: Configure JWT authentication after Drizzle migration
// Options:
// 1. Use a dedicated JWT_SECRET environment variable
// 2. Keep using Supabase Auth with @supabase/auth-js (auth only, not database)
// 3. Implement custom authentication system
//
// export const requireAuth = jwt({
//     secret: env.JWT_SECRET, // Add this to env schema
//     alg: 'HS256',
// });

export const attachUser = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    // TODO: Re-enable after configuring authentication

    // Temporarily disabled - uncomment when auth is configured:
    // const payload = c.get('jwtPayload');
    // if (payload && typeof payload === 'object' && 'sub' in payload) {
    //     const user: UserPayload = {
    //         id: payload.sub as string,
    //         email: (payload as any).email,
    //         role: (payload as any).role,
    //     };
    //     c.set('user', user);
    // }

    await next();
});

export const getUser = (c: any): UserPayload | undefined => {
    return c.get('user');
};

export const isAuthenticated = (c: any): boolean => {
    const user = c.get('user');
    return !!user?.id;
};
