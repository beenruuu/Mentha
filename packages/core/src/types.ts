/**
 * Configuration options for the Mentha API client
 */
export interface MenthaClientConfig {
    /**
     * Base URL of the API server
     * @example 'http://localhost:3000'
     * @example 'https://api.mentha.example.com'
     */
    baseUrl: string;

    /**
     * Authentication configuration
     */
    auth?: {
        /**
         * Static JWT token
         */
        token?: string;
        /**
         * Function to dynamically get the token
         * Useful for refreshing tokens or getting them from storage
         */
        getToken?: () => string | Promise<string>;
    };

    /**
     * Custom headers to include in all requests
     * @example { 'X-Custom-Header': 'value' }
     */
    headers?: Record<string, string>;

    /**
     * Custom fetch implementation
     * Useful for testing or custom fetch configurations
     */
    fetch?: typeof fetch;
}

/**
 * Re-export Hono client type inference utilities
 */
export type { InferRequestType, InferResponseType } from 'hono/client';

/**
 * Project entity
 */
export interface Project {
    id: string;
    name: string;
    domain: string;
    description?: string;
    competitors: string[];
    created_at: string;
}

/**
 * Keyword entity
 */
export interface Keyword {
    id: string;
    project_id: string;
    keyword: string;
    category?: string;
    created_at: string;
}

/**
 * Visibility score metric
 */
export interface VisibilityScore {
    score: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
}
