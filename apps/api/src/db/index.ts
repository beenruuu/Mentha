import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { PGlite } from '@electric-sql/pglite';

import { env } from '../config/env';
import { logger } from '../core/logger';

let queryClient: PGlite;

if (env.DATABASE_URL) {
    throw new Error('Remote PostgreSQL not supported in this build. Remove DATABASE_URL to use PGlite.');
} else {
    queryClient = new PGlite({ dataDir: './mentha_db' });
}

export const db = drizzle(queryClient);

export async function initializeDatabase(): Promise<void> {
    try {
        await migrate(db, { migrationsFolder: './src/db/migrations' });
        logger.info('Database initialized (PGlite)');
    } catch (err) {
        logger.error({ error: (err as Error).message }, 'Database initialization error');
        throw err;
    }
}

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
        await queryClient.close();
        logger.info('Database connection closed');
    } catch (err) {
        logger.error({ error: (err as Error).message }, 'Error closing database connection');
    }
}
