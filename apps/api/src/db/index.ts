import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { env } from '../config/env';
import { logger } from '../core/logger';

const connectionString = env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/mentha';
const queryClient = postgres(connectionString);

export const db = drizzle(queryClient);

export async function initializeDatabase(): Promise<void> {
    try {
        const migrationClient = postgres(connectionString, { max: 1 });
        const migrationDb = drizzle(migrationClient);
        await migrate(migrationDb, { migrationsFolder: './src/db/migrations' });
        await migrationClient.end();
        logger.info('Database initialized (PostgreSQL)');
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
        await queryClient.end();
        logger.info('Database connection closed');
    } catch (err) {
        logger.error({ error: (err as Error).message }, 'Error closing database connection');
    }
}

