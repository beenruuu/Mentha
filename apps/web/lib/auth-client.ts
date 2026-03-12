import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
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

export const { signIn, signUp, useSession, signOut } = authClient;
