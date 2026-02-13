import { type JobsOptions, Queue, type QueueOptions } from 'bullmq';
import { eq } from 'drizzle-orm';
import IORedis from 'ioredis';

import { keywords } from '@/db/schema/core';
import { env } from '../config/env';
import { db } from '../db';
import { logger } from './logger';

export function createRedisConnection(): IORedis {
    const connection = new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => {
            if (times > 10) {
                logger.error('Redis connection failed after 10 retries');
                return null;
            }
            return Math.min(times * 100, 3000);
        },
    });

    connection.on('connect', () => {
        logger.info('Redis connected');
    });

    connection.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
    });

    return connection;
}

let sharedConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
    if (!sharedConnection) {
        sharedConnection = createRedisConnection();
    }
    return sharedConnection;
}

export async function closeRedisConnection(): Promise<void> {
    if (sharedConnection) {
        await sharedConnection.quit();
        sharedConnection = null;
        logger.info('Redis connection closed');
    }
}

export async function testRedisConnection(): Promise<boolean> {
    try {
        const connection = getRedisConnection();
        const pong = await connection.ping();
        logger.info('Redis connection test passed', { response: pong });
        return pong === 'PONG';
    } catch (err) {
        logger.error('Redis connection test failed', { error: (err as Error).message });
        return false;
    }
}

export const QUEUE_NAMES = {
    SCRAPERS: 'scrapers-queue',
    ANALYSIS: 'analysis-queue',
    NOTIFICATIONS: 'notifications-queue',
    SCHEDULED: 'scheduled-queue',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const defaultQueueOptions: QueueOptions = {
    connection: getRedisConnection(),
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 24 * 3600,
            count: 1000,
        },
        removeOnFail: {
            age: 7 * 24 * 3600,
        },
    },
};

export interface ScanJobData {
    keywordId: string;
    engine: 'perplexity' | 'openai' | 'gemini';
    projectId: string;
    query: string;
    brand: string;
    competitors: string[];
}

export interface AnalysisJobData {
    scanJobId: string;
    rawResponse: string;
    brand: string;
    competitors: string[];
}

export interface NotificationJobData {
    type: 'scan_complete' | 'weekly_digest' | 'alert';
    userId: string;
    projectId?: string;
    payload: Record<string, unknown>;
}

export interface ScheduledJobData {
    keywordId: string;
    engines: string[];
}

const queues = new Map<QueueName, Queue>();

export function getQueue<T>(name: QueueName): Queue<T> {
    let queue = queues.get(name);

    if (!queue) {
        queue = new Queue(name, defaultQueueOptions);
        queues.set(name, queue);
        logger.debug(`Queue created: ${name}`);
    }

    return queue as Queue<T>;
}

export async function addScanJob(data: ScanJobData, options?: JobsOptions) {
    const queue = getQueue<ScanJobData>(QUEUE_NAMES.SCRAPERS);
    const job = await queue.add('scan', data, {
        priority: 2,
        ...options,
    });
    logger.info('Scan job added', {
        jobId: job.id,
        keywordId: data.keywordId,
        engine: data.engine,
    });
    return job;
}

export async function addAnalysisJob(data: AnalysisJobData, options?: JobsOptions) {
    const queue = getQueue<AnalysisJobData>(QUEUE_NAMES.ANALYSIS);
    const job = await queue.add('analyze', data, options);
    logger.debug('Analysis job added', { jobId: job.id, scanJobId: data.scanJobId });
    return job;
}

export async function addNotificationJob(data: NotificationJobData, options?: JobsOptions) {
    const queue = getQueue<NotificationJobData>(QUEUE_NAMES.NOTIFICATIONS);
    const job = await queue.add(data.type, data, {
        priority: 3,
        ...options,
    });
    logger.debug('Notification job added', { jobId: job.id, type: data.type });
    return job;
}

export async function scheduleRecurringScan(
    keywordId: string,
    engines: string[],
    cronPattern: string,
    jitterMinutes: number = 30,
) {
    const queue = getQueue<ScheduledJobData>(QUEUE_NAMES.SCHEDULED);

    const jitterMs = Math.floor(Math.random() * jitterMinutes * 60 * 1000);

    const job = await queue.add(
        'scheduled-scan',
        { keywordId, engines },
        {
            repeat: {
                pattern: cronPattern,
                offset: jitterMs,
            },
            jobId: `recurring-${keywordId}`,
        },
    );

    logger.info('Recurring scan scheduled', {
        keywordId,
        cronPattern,
        jitterMs,
    });

    return job;
}

export async function removeRecurringScan(keywordId: string) {
    const queue = getQueue<ScheduledJobData>(QUEUE_NAMES.SCHEDULED);
    await queue.removeRepeatableByKey(`scheduled-scan:recurring-${keywordId}:::${keywordId}`);
    logger.info('Recurring scan removed', { keywordId });
}

export async function closeAllQueues(): Promise<void> {
    for (const [name, queue] of queues) {
        await queue.close();
        logger.debug(`Queue closed: ${name}`);
    }
    queues.clear();
}

const CRON_PATTERNS = {
    daily: '0 0 * * *',
    weekly: '0 0 * * 0',
} as const;

function getJitterMs(maxMinutes: number = 59): number {
    return Math.floor(Math.random() * maxMinutes * 60 * 1000);
}

export async function scheduleKeywordScan(
    keywordId: string,
    frequency: 'daily' | 'weekly',
    engines: string[],
): Promise<void> {
    const queue = getQueue<ScheduledJobData>(QUEUE_NAMES.SCHEDULED);
    const cronPattern = CRON_PATTERNS[frequency];
    const jitterMs = getJitterMs();

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
        },
    );

    logger.info('Keyword scheduled for recurring scan', {
        keywordId,
        frequency,
        cronPattern,
        jitterMinutes: Math.round(jitterMs / 60000),
    });
}

export async function removeKeywordSchedule(keywordId: string): Promise<void> {
    const queue = getQueue<ScheduledJobData>(QUEUE_NAMES.SCHEDULED);

    try {
        const repeatableJobs = await queue.getRepeatableJobs();
        const job = repeatableJobs.find((j) => j.id === `recurring-${keywordId}`);

        if (job) {
            await queue.removeRepeatableByKey(job.key);
            logger.info('Keyword schedule removed', { keywordId });
        }
    } catch (error) {
        logger.warn('Failed to remove keyword schedule', {
            keywordId,
            error: (error as Error).message,
        });
    }
}

export async function syncKeywordSchedules(): Promise<void> {
    logger.info('Syncing keyword schedules from database');

    try {
        const keywordsData = await db
            .select({
                id: keywords.id,
                scan_frequency: keywords.scan_frequency,
                engines: keywords.engines,
            })
            .from(keywords)
            .where(eq(keywords.is_active, true));

        const filteredKeywords = keywordsData.filter(
            (k) => k.scan_frequency === 'daily' || k.scan_frequency === 'weekly',
        );

        if (filteredKeywords.length === 0) {
            logger.info('No keywords to schedule');
            return;
        }

        for (const keyword of filteredKeywords) {
            if (keyword.scan_frequency === 'daily' || keyword.scan_frequency === 'weekly') {
                const engines = Array.isArray(keyword.engines)
                    ? (keyword.engines as string[])
                    : ['perplexity'];

                await scheduleKeywordScan(keyword.id, keyword.scan_frequency, engines);
            }
        }

        logger.info('Keyword schedules synced', { count: filteredKeywords.length });
    } catch (error) {
        logger.error('Failed to sync keyword schedules', { error: (error as Error).message });
    }
}

export async function getSchedulerStats(): Promise<{
    scheduledCount: number;
    nextRun: Date | null;
}> {
    const queue = getQueue<ScheduledJobData>(QUEUE_NAMES.SCHEDULED);
    const repeatableJobs = await queue.getRepeatableJobs();

    let nextRun: Date | null = null;
    if (repeatableJobs.length > 0) {
        const nextTimestamp = Math.min(...repeatableJobs.map((j) => j.next ?? Infinity));
        if (nextTimestamp !== Infinity) {
            nextRun = new Date(nextTimestamp);
        }
    }

    return {
        scheduledCount: repeatableJobs.length,
        nextRun,
    };
}
