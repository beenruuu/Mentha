import { db } from '../db/index';
import { profiles } from '../db/schema/core';

async function setAdmin() {
    try {
        await db.update(profiles).set({
            role: 'admin',
            credit_balance: 5000,
            plan: 'pro',
        });
        console.log('Successfully updated profiles to admin with 5000 credits.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating profiles:', error);
        process.exit(1);
    }
}

setAdmin();
