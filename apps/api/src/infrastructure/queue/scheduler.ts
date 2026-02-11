import { getQueue, QUEUE_NAMES, ScheduledJobData } from './queues';
import { eq, inArray } from 'drizzle-orm';
import { db, keywords } from '../database/index';
import { logger } from '../logging/index';

/**
 * Cron patterns for different scan frequencies
 */
const CRON_PATTERNS = {
    daily: '0 0 * * *',    // Every day at midnight
    weekly: '0 0 * * 0',   // Every Sunday at midnight
} as const;

/**
 * Get jitter offset in milliseconds (0 to maxMinutes)
 * Prevents thundering herd problem when many jobs are scheduled at the same time
 */
function getJitterMs(maxMinutes: number = 59): number {
    return Math.floor(Math.random() * maxMinutes * 60 * 1000);
}

/**
 * Schedule a keyword for recurring scans
 */
export async function scheduleKeywordScan(
    keywordId: string,
    frequency: 'daily' | 'weekly',
    engines: string[]
): Promise<void> {
    const queue = getQueue<ScheduledJobData>(QUEUE_NAMES.SCHEDULED);
    const cronPattern = CRON_PATTERNS[frequency];
    const jitterMs = getJitterMs();

    // Remove any existing schedule for this keyword
    await removeKeywordSchedule(keywordId);

    await queue.add(
        'scheduled-scan',
        { keywordId, engines },
        {
            repeat: {
                pattern: cronPattern,
                offset: jitterMs,
            },
            jobId: `recurring-${keywordId}`,
        }
    );

    logger.info('Keyword scheduled for recurring scan', {
        keywordId,
        frequency,
        cronPattern,
        jitterMinutes: Math.round(jitterMs / 60000),
    });
}

/**
 * Remove a keyword's recurring scan schedule
 */
export async function removeKeywordSchedule(keywordId: string): Promise<void> {
    const queue = getQueue<ScheduledJobData>(QUEUE_NAMES.SCHEDULED);

    try {
        // Get all repeatable jobs and find the one for this keyword
        const repeatableJobs = await queue.getRepeatableJobs();
        const job = repeatableJobs.find(j => j.id === `recurring-${keywordId}`);

        if (job) {
            await queue.removeRepeatableByKey(job.key);
            logger.info('Keyword schedule removed', { keywordId });
        }
    } catch (error) {
        logger.warn('Failed to remove keyword schedule', {
            keywordId,
            error: (error as Error).message
        });
    }
}

/**
 * Sync all keyword schedules from the database
 * Call this on worker startup to restore schedules
 */
export async function syncKeywordSchedules(): Promise<void> {
    logger.info('Syncing keyword schedules from database');

    try {
        // Get all active keywords with automated scan frequencies
        const keywordsData = await db
            .select({
                id: keywords.id,
                scan_frequency: keywords.scan_frequency,
                engines: keywords.engines,
            })
            .from(keywords)
            .where(eq(keywords.is_active, true));

        // Filter for daily/weekly frequencies
        const filteredKeywords = keywordsData.filter(
            k => k.scan_frequency === 'daily' || k.scan_frequency === 'weekly'
        );

        if (filteredKeywords.length === 0) {
            logger.info('No keywords to schedule');
            return;
        }

        // Schedule each keyword
        for (const keyword of filteredKeywords) {
            if (keyword.scan_frequency === 'daily' || keyword.scan_frequency === 'weekly') {
                const engines = Array.isArray(keyword.engines)
                    ? keyword.engines as string[]
                    : ['perplexity'];

                await scheduleKeywordScan(keyword.id, keyword.scan_frequency, engines);
            }
        }

        logger.info('Keyword schedules synced', { count: filteredKeywords.length });
    } catch (error) {
        logger.error('Failed to sync keyword schedules', { error: (error as Error).message });
    }
}

/**
 * Get statistics about scheduled jobs
 */
export async function getSchedulerStats(): Promise<{
    scheduledCount: number;
    nextRun: Date | null;
}> {
    const queue = getQueue<ScheduledJobData>(QUEUE_NAMES.SCHEDULED);
    const repeatableJobs = await queue.getRepeatableJobs();

    // Find the next scheduled run
    let nextRun: Date | null = null;
    if (repeatableJobs.length > 0) {
        const nextTimestamp = Math.min(...repeatableJobs.map(j => j.next ?? Infinity));
        if (nextTimestamp !== Infinity) {
            nextRun = new Date(nextTimestamp);
        }
    }

    return {
        scheduledCount: repeatableJobs.length,
        nextRun,
    };
}
