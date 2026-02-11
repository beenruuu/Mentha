import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, profiles } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const WebhookPayloadSchema = z.object({
    type: z.enum(['INSERT', 'UPDATE', 'DELETE']),
    table: z.string(),
    record: z.record(z.unknown()),
    old_record: z.record(z.unknown()).optional(),
});

const app = new Hono()
    .post('/user', zValidator('json', WebhookPayloadSchema), async (c) => {
        const webhookSecret = c.req.header('x-webhook-secret');

        if (webhookSecret !== process.env['SUPABASE_WEBHOOK_SECRET']) {
            logger.warn('Invalid webhook secret');
            return c.json({ error: 'Invalid webhook secret' }, 401);
        }

        const payload = c.req.valid('json');

        try {
            if (payload.type === 'INSERT') {
                const user = payload.record as { id: string; email?: string };

                await db
                    .insert(profiles)
                    .values({
                        id: user.id,
                        email: user.email || null,
                        plan: 'free',
                        daily_quota: 100,
                    });

                logger.info('Profile created for new user', { userId: user.id });
            }

            if (payload.type === 'UPDATE') {
                const user = payload.record as { id: string; email?: string };

                await db
                    .update(profiles)
                    .set({ email: user.email })
                    .where(eq(profiles.id, user.id));

                logger.info('Profile updated', { userId: user.id });
            }

            if (payload.type === 'DELETE') {
                logger.info('User deleted, profile will cascade', {
                    userId: (payload.old_record as { id: string })?.id
                });
            }

            return c.json({ success: true });
        } catch (error) {
            logger.error('Webhook processing error', { error: (error as Error).message });
            return c.json({ error: 'Internal error' }, 500);
        }
    });

export default app;
export type WebhooksAppType = typeof app;
