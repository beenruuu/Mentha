export {
    createRedisConnection,
    getRedisConnection,
    closeRedisConnection,
    testRedisConnection,
} from './connection';

export {
    QUEUE_NAMES,
    type QueueName,
    type ScanJobData,
    type AnalysisJobData,
    type NotificationJobData,
    type ScheduledJobData,
    getQueue,
    addScanJob,
    addAnalysisJob,
    addNotificationJob,
    scheduleRecurringScan,
    removeRecurringScan,
    closeAllQueues,
} from './queues';

export {
    scheduleKeywordScan,
    removeKeywordSchedule,
    syncKeywordSchedules,
    getSchedulerStats,
} from './scheduler';
