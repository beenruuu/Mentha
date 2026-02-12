import type { Hono } from 'hono';
import { hc } from 'hono/client';

import type { MenthaClientConfig } from './types';

/**
 * Creates a type-safe Mentha API client using Hono's RPC capabilities
 *
 * @template T - The AppType from the Hono backend (typeof routes)
 * @param config - Client configuration options
 * @returns Type-safe API client with full IntelliSense support
 *
 * @example
 * ```typescript
 * import { createMenthaClient } from '@mentha/core';
 * import type { AppType } from 'mentha-backend';
 *
 * const client = createMenthaClient<AppType>({
 *   baseUrl: 'http://localhost:3000',
 *   auth: {
 *     token: 'your-jwt-token'
 *   }
 * });
 *
 * // Type-safe API calls with full autocompletion
 * const response = await client.api.v1.projects.$get();
 * const projects = await response.json(); // fully typed!
 * ```
 *
 * @example With dynamic token
 * ```typescript
 * const client = createMenthaClient<AppType>({
 *   baseUrl: 'http://localhost:3000',
 *   auth: {
 *     getToken: async () => {
 *       return await getTokenFromStorage();
 *     }
 *   }
 * });
 * ```
 */
export function createMenthaClient<T extends Hono>(
    config: MenthaClientConfig,
): ReturnType<typeof hc<T>> {
    const { baseUrl, auth, headers = {}, fetch: customFetch } = config;

    return hc<T>(baseUrl, {
        fetch: customFetch,
        headers: async () => {
            const requestHeaders: Record<string, string> = { ...headers };

            if (auth?.token) {
                requestHeaders.Authorization = `Bearer ${auth.token}`;
            } else if (auth?.getToken) {
                try {
                    const token = await auth.getToken();
                    if (token) {
                        requestHeaders.Authorization = `Bearer ${token}`;
                    }
                } catch {}
            }

            return requestHeaders;
        },
    });
}
