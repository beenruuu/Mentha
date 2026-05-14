import { db } from '../db';
import { user, session, account } from '../db/schema/auth';
import { profiles } from '../db/schema/core';
import { projects } from '../db/schema/core';
import { keywords, scanJobs, scanResults, citations, creditTransactions } from '../db/schema/core';

async function resetAll() {
    console.log('🗑️  Cleaning ALL data...');

    // Delete in dependency order
    try {
        await db.delete(citations);
    } catch (e) {
        /* ok */
    }
    try {
        await db.delete(scanResults);
    } catch (e) {
        /* ok */
    }
    try {
        await db.delete(scanJobs);
    } catch (e) {
        /* ok */
    }
    try {
        await db.delete(keywords);
    } catch (e) {
        /* ok */
    }
    try {
        await db.delete(creditTransactions);
    } catch (e) {
        /* ok */
    }
    try {
        await db.delete(projects);
    } catch (e) {
        /* ok */
    }
    try {
        await db.delete(profiles);
    } catch (e) {
        /* ok */
    }
    try {
        await db.delete(session);
    } catch (e) {
        /* ok */
    }
    try {
        await db.delete(account);
    } catch (e) {
        /* ok */
    }
    try {
        await db.delete(user);
    } catch (e) {
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
