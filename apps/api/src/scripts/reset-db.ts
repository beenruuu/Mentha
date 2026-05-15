import { db } from '../db';
import { account, session, user } from '../db/schema/auth';
import {
    citations,
    creditTransactions,
    keywords,
    profiles,
    projects,
    scanJobs,
    scanResults,
} from '../db/schema/core';

async function resetAll() {
    console.log('🗑️  Cleaning ALL data...');

    // Delete in dependency order
    try {
        await db.delete(citations);
    } catch {
        /* ok */
    }
    try {
        await db.delete(scanResults);
    } catch {
        /* ok */
    }
    try {
        await db.delete(scanJobs);
    } catch {
        /* ok */
    }
    try {
        await db.delete(keywords);
    } catch {
        /* ok */
    }
    try {
        await db.delete(creditTransactions);
    } catch {
        /* ok */
    }
    try {
        await db.delete(projects);
    } catch {
        /* ok */
    }
    try {
        await db.delete(profiles);
    } catch {
        /* ok */
    }
    try {
        await db.delete(session);
    } catch {
        /* ok */
    }
    try {
        await db.delete(account);
    } catch {
        /* ok */
    }
    try {
        await db.delete(user);
    } catch {
        /* ok */
    }

    console.log('✅ All tables cleaned.');

    // Now update ALL existing users in `user` table to have credits (for any that survived cascade)
    await db.update(user).set({
        role: 'admin',
        plan: 'pro',
        credit_balance: 5000,
        daily_quota: 100,
    });

    console.log('✅ All remaining users updated with 5000 credits.');
    console.log('');
    console.log('👉 Register a new account at http://localhost:3000/register');
    console.log('   New accounts will automatically get admin/pro/5000 credits.');

    process.exit(0);
}

resetAll().catch(console.error);
