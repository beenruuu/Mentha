/**
 * Centralized API configuration
 * 
 * All API URL configuration should use these constants.
 * This eliminates duplicate URL definitions across the codebase.
 */

/**
 * Base API URL for client-side requests
 * Includes the /api prefix
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Raw API URL without /api prefix (for services that construct full paths)
 */
export const API_ROOT_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000';

/**
 * Server-side API URL (for Server Components and Server Actions)
 * Falls back to client URL if server URL not set
 */
export const SERVER_API_URL = process.env.API_URL || API_BASE_URL;

/**
 * Default request timeout in milliseconds
 */
export const DEFAULT_TIMEOUT = 90000;

/**
 * Short timeout for quick operations
 */
export const SHORT_TIMEOUT = 30000;

/**
 * Long timeout for heavy analysis operations
 */
export const LONG_TIMEOUT = 180000;
