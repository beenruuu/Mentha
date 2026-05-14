import type { Context } from 'hono';
import { createHmac, timingSafeEqual } from 'node:crypto';

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
            if (!timingSafeEqual(Buffer.from(webhookSecret), Buffer.from(expectedSecret))) {
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

    processGitHub: async (c: Context) => {
        const event = c.req.header('x-github-event') || 'unknown';
        const delivery = c.req.header('x-github-delivery') || 'unknown';
        const signature = c.req.header('x-hub-signature-256');
        const secret = process.env.GITHUB_WEBHOOK_SECRET;
        const body = await c.req.text();

        if (secret) {
            if (!signature) {
                throw new UnauthorizedException('Missing GitHub signature');
            }

            const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
            const expectedBuffer = Buffer.from(expected);
            const actualBuffer = Buffer.from(signature);
            if (
                expectedBuffer.length !== actualBuffer.length ||
                !timingSafeEqual(expectedBuffer, actualBuffer)
            ) {
                throw new UnauthorizedException('Invalid GitHub signature');
            }
        }

        const payload = body ? JSON.parse(body) : {};
        const repository = payload.repository
            ? {
                  id: payload.repository.id,
                  fullName: payload.repository.full_name,
                  url: payload.repository.html_url,
                  defaultBranch: payload.repository.default_branch,
              }
            : null;

        logger.info(
            {
                event,
                delivery,
                repository: repository?.fullName,
                action: payload.action,
            },
            'GitHub webhook received',
        );

        return c.json({
            success: true,
            mode: process.env.MENTHA_QA_MODE === 'true' ? 'qa' : 'live',
            event,
            delivery,
            repository,
            nextActions: [
                'register_repository',
                'run_local_artifact_audit',
                'publish_operational_event_if_artifacts_are_missing',
            ],
        });
    },
} as const;
