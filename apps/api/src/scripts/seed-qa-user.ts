import { hashPassword } from '../core/hash';
import { db } from '../db';
import { profiles } from '../db/schema/core';
import { eq } from 'drizzle-orm';

async function seedQaUser() {
    const email = 'qa@mentha.io';
    const password = 'QaTest1234!';

    // Check if already exists and delete to start fresh
    await db.delete(profiles).where(eq(profiles.email, email));

    const passwordHash = await hashPassword(password);

    const [user] = await db
        .insert(profiles)
        .values({
            email,
            password_hash: passwordHash,
            display_name: 'QA Tester',
            role: 'admin',
            plan: 'pro',
            credit_balance: 5000,
            daily_quota: 100,
        })
        .returning();

    console.log('✅ QA user created:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Credits:  ${user?.credit_balance}`);
    console.log(`   Role:     ${user?.role}`);
    console.log(`   Plan:     ${user?.plan}`);
    process.exit(0);
}

seedQaUser().catch(console.error);
