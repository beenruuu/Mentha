import { eq, inArray } from 'drizzle-orm';

import { db } from '../src/db/index';
import { user } from '../src/db/schema/auth';
import {
    citations,
    creditTransactions,
    keywords,
    projects,
    scanJobs,
    scanResults,
    scanRuns,
} from '../src/db/schema/core';

const TARGET_EMAIL = 'ruxxer2006@gmail.com';

async function resetUser() {
    console.log(`🔍 Looking for user: ${TARGET_EMAIL}`);

    const [targetUser] = await db.select().from(user).where(eq(user.email, TARGET_EMAIL));

    if (!targetUser) {
        console.error('❌ User not found');
        process.exit(1);
    }

    console.log(`✅ Found user: ${targetUser.id}`);
    console.log(`   Current credits: ${targetUser.credit_balance}, daily_quota: ${targetUser.daily_quota}`);

    // 1. Find all projects for this user
    const userProjects = await db.select({ id: projects.id }).from(projects).where(eq(projects.user_id, targetUser.id));
    const projectIds = userProjects.map((p) => p.id);
    console.log(`📁 Projects found: ${projectIds.length}`);

    if (projectIds.length > 0) {
        // 2. Find keywords for these projects
        const projectKeywords = await db.select({ id: keywords.id }).from(keywords).where(inArray(keywords.project_id, projectIds));
        const keywordIds = projectKeywords.map((k) => k.id);
        console.log(`🔑 Keywords found: ${keywordIds.length}`);

        if (keywordIds.length > 0) {
            // 3. Find scan jobs for these keywords
            const jobs = await db.select({ id: scanJobs.id }).from(scanJobs).where(inArray(scanJobs.keyword_id, keywordIds));
            const jobIds = jobs.map((j) => j.id);
            console.log(`📊 Scan jobs found: ${jobIds.length}`);

            if (jobIds.length > 0) {
                // 4. Find scan results for these jobs
                const results = await db.select({ id: scanResults.id }).from(scanResults).where(inArray(scanResults.job_id, jobIds));
                const resultIds = results.map((r) => r.id);
                console.log(`📈 Scan results found: ${resultIds.length}`);

                if (resultIds.length > 0) {
                    // 5. Delete citations for these results
                    const { rowCount: citDel } = await db.delete(citations).where(inArray(citations.result_id, resultIds));
                    console.log(`   🗑️  Deleted ${citDel} citations`);
                }

                // 6. Delete scan results
                const { rowCount: resDel } = await db.delete(scanResults).where(inArray(scanResults.job_id, jobIds));
                console.log(`   🗑️  Deleted ${resDel} scan results`);
            }

            // 7. Delete scan jobs
            const { rowCount: jobDel } = await db.delete(scanJobs).where(inArray(scanJobs.keyword_id, keywordIds));
            console.log(`   🗑️  Deleted ${jobDel} scan jobs`);
        }

        // 8. Delete scan runs for these projects
        const { rowCount: runDel } = await db.delete(scanRuns).where(inArray(scanRuns.project_id, projectIds));
        console.log(`   🗑️  Deleted ${runDel} scan runs`);

        // 9. Delete keywords
        const { rowCount: kwDel } = await db.delete(keywords).where(inArray(keywords.project_id, projectIds));
        console.log(`   🗑️  Deleted ${kwDel} keywords`);

        // 10. Delete projects
        const { rowCount: projDel } = await db.delete(projects).where(eq(projects.user_id, targetUser.id));
        console.log(`   🗑️  Deleted ${projDel} projects`);
    }

    // 11. Delete credit transactions
    const { rowCount: txDel } = await db.delete(creditTransactions).where(eq(creditTransactions.user_id, targetUser.id));
    console.log(`   🗑️  Deleted ${txDel} credit transactions`);

    // 12. Reset credits and quotas to onboarding defaults
    await db
        .update(user)
        .set({
            credit_balance: 5000,
            daily_quota: 100,
            role: 'admin',
            plan: 'pro',
        })
        .where(eq(user.id, targetUser.id));

    console.log(`💰 Credits reset to: 5000 balance, 100 daily quota`);

    // 13. Verify
    const [verifiedUser] = await db.select().from(user).where(eq(user.id, targetUser.id));
    const remainingProjects = await db.select({ count: projects.id }).from(projects).where(eq(projects.user_id, targetUser.id));

    console.log('\n✅ Reset complete!');
    console.log(`   User ID: ${verifiedUser.id}`);
    console.log(`   Email: ${verifiedUser.email}`);
    console.log(`   Credits: ${verifiedUser.credit_balance} | Daily Quota: ${verifiedUser.daily_quota}`);
    console.log(`   Remaining projects: ${remainingProjects.length}`);
    console.log(`   User is now effectively at onboarding state (no projects, default credits).`);

    process.exit(0);
}

resetUser().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
