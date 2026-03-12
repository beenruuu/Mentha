/**
 * @mentha/core
 * Type-safe API client for Mentha applications using Hono RPC
 */

export { createMenthaClient } from './client';
export type {
    InferRequestType,
    InferResponseType,
    Keyword,
    MenthaClientConfig,
    Project,
    VisibilityScore,
} from './types';
