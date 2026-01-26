import { Queue, QueueOptions, JobsOptions } from 'bullmq';
import { getRedisConnection } from './connection.js';
import { logger } from '../logging/index.js';

/**
 * Queue names enumeration
 */
export const QUEUE_NAMES = {
    SCRAPERS: 'scrapers-queue',
    ANALYSIS: 'analysis-queue',
    NOTIFICATIONS: 'notifications-queue',
    SCHEDULED: 'scheduled-queue',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

/**
 * Default queue options
 */
const defaultQueueOptions: QueueOptions = {
    connection: getRedisConnection(),
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000,    // Keep at most 1000 completed jobs
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
    },
};

/**
 * Job data types for each queue
 */
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

/**
 * Queue factory - creates or returns existing queue instance
 */
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

/**
 * Convenience methods for adding jobs to queues
 */
export async function addScanJob(data: ScanJobData, options?: JobsOptions) {
    const queue = getQueue<ScanJobData>(QUEUE_NAMES.SCRAPERS);
    const job = await queue.add('scan', data, {
        priority: 2, // Normal priority
        ...options,
    });
    logger.info('Scan job added', { jobId: job.id, keywordId: data.keywordId, engine: data.engine });
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
        priority: 3, // Low priority
        ...options,
    });
    logger.debug('Notification job added', { jobId: job.id, type: data.type });
    return job;
}

/**
 * Schedule a repeatable scan job
 */
export async function scheduleRecurringScan(
    keywordId: string,
    engines: string[],
    cronPattern: string,
    jitterMinutes: number = 30
) {
    const queue = getQueue<ScheduledJobData>(QUEUE_NAMES.SCHEDULED);

    // Add jitter to prevent thundering herd
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
        }
    );

    logger.info('Recurring scan scheduled', {
        keywordId,
        cronPattern,
        jitterMs,
    });

    return job;
}

/**
 * Remove a recurring scan job
 */
export async function removeRecurringScan(keywordId: string) {
    const queue = getQueue<ScheduledJobData>(QUEUE_NAMES.SCHEDULED);
    await queue.removeRepeatableByKey(`scheduled-scan:recurring-${keywordId}:::${keywordId}`);
    logger.info('Recurring scan removed', { keywordId });
}

/**
 * Close all queues gracefully
 */
export async function closeAllQueues(): Promise<void> {
    for (const [name, queue] of queues) {
        await queue.close();
        logger.debug(`Queue closed: ${name}`);
    }
    queues.clear();
}
