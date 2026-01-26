import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/index.js';
import { logger } from '../logging/index.js';

/**
 * Supabase client for authenticated user requests
 * Uses anon key - respects RLS policies
 */
export function createSupabaseClient(accessToken?: string) {
    const options = accessToken
        ? {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        }
        : undefined;

    return createClient(
        env.SUPABASE_URL,
        env.SUPABASE_ANON_KEY,
        options
    );
}

/**
 * Supabase admin client for backend workers
 * Uses service role key - bypasses RLS
 * ⚠️ Only use in trusted backend context (workers, webhooks)
 */
export function createSupabaseAdmin() {
    return createClient(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}

/**
 * Test database connectivity
 */
export async function testDatabaseConnection(): Promise<boolean> {
    try {
        const client = createSupabaseAdmin();
        const { error } = await client.from('profiles').select('id').limit(1);

        if (error) {
            logger.error('Database connection test failed', { error: error.message });
            return false;
        }

        logger.info('Database connection test passed');
        return true;
    } catch (err) {
        logger.error('Database connection test error', { error: (err as Error).message });
        return false;
    }
}
