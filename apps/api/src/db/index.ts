import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../config/env';
import { logger } from '../core/logger';

const client = postgres(env.DATABASE_URL, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

export const db = drizzle({ client });

export async function testDatabaseConnection(): Promise<boolean> {
    try {
        await db.execute(sql`SELECT 1`);
        logger.info('Database connection test passed');
        return true;
    } catch (err) {
        logger.error({ error: (err as Error).message }, 'Database connection test error');
        return false;
    }
}

export async function closeDatabaseConnection(): Promise<void> {
    try {
        await client.end();
        logger.info('Database connection closed');
    } catch (err) {
        logger.error({ error: (err as Error).message }, 'Error closing database connection');
    }
}
