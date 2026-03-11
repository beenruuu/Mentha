import { hc } from 'hono/client';
import type { AppType } from '../../api/src/app';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const client = hc<AppType>(API_URL);

/**
 * Helper to get the base fetch with credentials (for session cookies)
 */
export const api = client.api.v1;
