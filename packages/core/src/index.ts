export interface Project {
    id: string;
    name: string;
    domain: string;
    description?: string;
    competitors: string[];
    created_at: string;
}

export interface Keyword {
    id: string;
    project_id: string;
    keyword: string;
    category?: string;
    created_at: string;
}

export interface VisibilityScore {
    score: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
}

import { hc } from 'hono/client';
import type { InferRequestType, InferResponseType } from 'hono/client';
import type { Hono } from 'hono';

export type { InferRequestType, InferResponseType };

export const createApiClient = <T extends Hono<any, any, any> = any>(baseUrl: string): ReturnType<typeof hc<T>> => {
    return hc<T>(baseUrl);
};
