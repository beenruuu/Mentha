import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { env } from '../config/env';
import { db } from '../db';
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
            credit_balance: {
                type: 'number',
                defaultValue: 0,
            },
            daily_quota: {
                type: 'number',
                defaultValue: 0,
            },
        },
    },
});

export type Auth = typeof auth;
