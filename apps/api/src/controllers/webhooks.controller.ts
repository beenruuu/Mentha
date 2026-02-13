import type { Context } from 'hono';

import { logger } from '../core/logger';
import { handleHttpException, UnauthorizedException } from '../exceptions/http';
import { getWebhookService } from '../services/webhook.service';

const webhookService = getWebhookService();

export const WebhookController = {
    processUser: async (c: Context) => {
        const webhookSecret = c.req.header('x-webhook-secret');

        if (webhookSecret !== process.env.SUPABASE_WEBHOOK_SECRET) {
            logger.warn('Invalid webhook secret');
            throw new UnauthorizedException('Invalid webhook secret');
        }

        const payload = await c.req.json();

        try {
            await webhookService.processUserWebhook(payload);
            return c.json({ success: true });
        } catch (error) {
            logger.error('Webhook processing error', {
                error: (error as Error).message,
            });
            return handleHttpException(c, error);
        }
    },
} as const;
