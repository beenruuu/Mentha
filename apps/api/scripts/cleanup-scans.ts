import { db } from '../src/db';
import { scanJobs, scanResults, scanRuns, keywords } from '../src/db/schema/core';
import { eq, inArray } from 'drizzle-orm';

const projectId = 'd4fcdd25-7311-48bd-9d82-128d94a796e0';

async function main() {
    console.log('Starting cleanup...');

    // Get keyword IDs for this project
    const kwIds = await db
        .select({ id: keywords.id })
        .from(keywords)
        .where(eq(keywords.project_id, projectId));
    const keywordIdList = kwIds.map((k) => k.id);

    console.log('Keywords found:', keywordIdList.length);

    if (keywordIdList.length === 0) {
        console.log('No keywords for this project');
        return;
    }

    // Get scan jobs for these keywords
    const jobs = await db
        .select({ id: scanJobs.id })
        .from(scanJobs)
        .where(inArray(scanJobs.keyword_id, keywordIdList));
    const jobIds = jobs.map((j) => j.id);

    console.log('Scan jobs to delete:', jobIds.length);

    // Delete scan results first
    if (jobIds.length > 0) {
        await db.delete(scanResults).where(inArray(scanResults.job_id, jobIds));
        console.log('Deleted scan results');
    }

    // Delete scan jobs
    await db.delete(scanJobs).where(inArray(scanJobs.keyword_id, keywordIdList));
    console.log('Deleted scan jobs');

    // Delete scan runs for this project
    await db.delete(scanRuns).where(eq(scanRuns.project_id, projectId));
    console.log('Deleted scan runs');

    console.log('All scans deleted!');

    // Trigger a manual scan
    const firstKeyword = await db
        .select()
        .from(keywords)
        .where(eq(keywords.project_id, projectId))
        .limit(1);

    if (firstKeyword.length > 0) {
        const { addScanJob } = await import('../src/core/queue');
        await addScanJob({
            keywordId: firstKeyword[0].id,
            engine: 'perplexity',
            projectId: projectId,
            query: firstKeyword[0].query,
            brand: 'example',
            competitors: [],
        });
        console.log('Manual scan triggered for:', firstKeyword[0].query);
    }
}

main()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
