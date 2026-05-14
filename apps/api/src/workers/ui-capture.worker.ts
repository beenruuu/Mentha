import { Worker } from 'bullmq';

import { env } from '../config/env';
import { logger } from '../core/logger';
import { getRedisConnection } from '../core/queue';
import { runUiCapture } from '../core/ui-capture';
import type { UiCaptureRequest } from '../core/ui-capture/types';

export const UI_CAPTURE_QUEUE = 'ui-capture-queue';

export const uiCaptureWorker = new Worker<UiCaptureRequest>(
    UI_CAPTURE_QUEUE,
    async (job) => {
        if (!env.MENTHA_UI_CAPTURE_ENABLED) {
            throw new Error('UI capture is disabled. Set MENTHA_UI_CAPTURE_ENABLED=true.');
        }

        logger.info(
            {
                jobId: job.id,
                provider: job.data.provider,
            },
            'Starting experimental UI capture job',
        );

        return runUiCapture(job.data);
    },
    {
        connection: getRedisConnection(),
        concurrency: 1,
        autorun: false,
    },
);

uiCaptureWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'UI capture job completed');
});

uiCaptureWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'UI capture job failed');
});

export default uiCaptureWorker;
