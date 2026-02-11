import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { env } from '../../config/index';
import { logger } from '../logging/index';
import * as schema from './schema';

/**
 * PostgreSQL connection using postgres.js
 * Configured for Supabase Transaction pooling mode
 */
const client = postgres(env.DATABASE_URL, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

/**
 * Drizzle ORM database instance with schema
 */
export const db = drizzle({ client, schema });

/**
 * Test database connectivity
 */
export async function testDatabaseConnection(): Promise<boolean> {
    try {
        await db.execute(sql`SELECT 1`);
        logger.info('Database connection test passed');
        return true;
    } catch (err) {
        logger.error('Database connection test error', { error: (err as Error).message });
        return false;
    }
}

/**
 * Close database connection
 * Should be called on application shutdown
 */
export async function closeDatabaseConnection(): Promise<void> {
    try {
        await client.end();
        logger.info('Database connection closed');
    } catch (err) {
        logger.error('Error closing database connection', { error: (err as Error).message });
    }
}
