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
    trustedOrigins: ['http://localhost:3000'],
    user: {
        additionalFields: {
            role: {
                type: 'string',
                defaultValue: 'admin',
            },
            plan: {
                type: 'string',
                defaultValue: 'pro',
            },
            credit_balance: {
                type: 'number',
                defaultValue: 5000,
            },
            daily_quota: {
                type: 'number',
                defaultValue: 100,
            },
        },
    },
});

export type Auth = typeof auth;
