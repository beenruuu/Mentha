import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({
    baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1') + '/auth',
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

export const { signIn, signUp, useSession, signOut } = authClient;
