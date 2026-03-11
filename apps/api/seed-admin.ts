import { hashPassword } from './src/core/hash';
import { db } from './src/db';
import { profiles } from './src/db/schema/core';
import { logger } from './src/core/logger';
import { eq } from 'drizzle-orm';

async function seedAdmin() {
    const email = 'admin@admin';
    const password = 'admin';
    const displayName = 'Administrator';

    try {
        logger.info('Starting admin seeding...', { email });

        // Check if exists
        const existing = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
        
        if (existing.length > 0) {
            logger.info('Admin user already exists. Updating password and role...');
            const passwordHash = await hashPassword(password);
            await db.update(profiles)
                .set({ 
                    password_hash: passwordHash, 
                    role: 'admin',
                    credit_balance: 1000000 // Unlimited-ish for admin
                })
                .where(eq(profiles.email, email));
        } else {
            logger.info('Creating new admin user...');
            const passwordHash = await hashPassword(password);
            await db.insert(profiles).values({
                email,
                password_hash: passwordHash,
                display_name: displayName,
                role: 'admin',
                plan: 'enterprise',
                credit_balance: 1000000
            });
        }

        logger.info('Admin seed completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Admin seed failed', { error: (error as Error).message });
        process.exit(1);
    }
}

seedAdmin();