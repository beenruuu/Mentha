import type { Context } from 'hono';

import { logger } from '../core/logger';
import { runUiCapture } from '../core/ui-capture';

export const UiCaptureController = {
    capture: async (c: Context) => {
        try {
            const result = await runUiCapture(await c.req.json());
            return c.json({ data: result });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'UI capture failed');
            return c.json({ error: (error as Error).message }, 500);
        }
    },
} as const;
