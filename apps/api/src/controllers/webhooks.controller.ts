import type { Context } from 'hono';
import { timingSafeEqual } from 'crypto';

import { logger } from '../core/logger';
import { handleHttpException, UnauthorizedException } from '../exceptions/http';
import { getWebhookService } from '../services/webhook.service';

const webhookService = getWebhookService();

export const WebhookController = {
    processUser: async (c: Context) => {
        const webhookSecret = c.req.header('x-webhook-secret');
        const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;

        if (!webhookSecret || !expectedSecret) {
            logger.warn('Missing webhook secret in request or configuration');
            throw new UnauthorizedException('Invalid webhook secret');
        }

        try {
            if (!timingSafeEqual(
                Buffer.from(webhookSecret),
                Buffer.from(expectedSecret)
            )) {
                logger.warn('Invalid webhook secret provided');
                throw new UnauthorizedException('Invalid webhook secret');
            }
        } catch (error) {
            if ((error as Error).message.includes('timingSafeEqual')) {
                logger.warn('Webhook secret comparison failed - length mismatch');
            }
            throw new UnauthorizedException('Invalid webhook secret');
        }

        const payload = await c.req.json();

        try {
            await webhookService.processUserWebhook(payload);
            return c.json({ success: true });
        } catch (error) {
            logger.error(
                {
                    error: (error as Error).message,
                },
                'Webhook processing error',
            );
            return handleHttpException(c, error);
        }
    },
} as const;
