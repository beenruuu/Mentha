import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import { env } from '../config/env';
import * as authSchema from '../db/schema/auth';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: authSchema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    user: {
        additionalFields: {
            role: {
                type: 'string',
                defaultValue: 'user',
            },
            plan: {
                type: 'string',
                defaultValue: 'free',
            },
            creditBalance: {
                type: 'string',
                defaultValue: '0',
            },
        },
    },
});

export type Auth = typeof auth;
