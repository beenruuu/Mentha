import { Router, Request, Response } from 'express';
import { createSupabaseAdmin } from '../infrastructure/database/index.js';
import { logger } from '../infrastructure/logging/index.js';

const router = Router();

/**
 * Supabase webhook event types
 */
interface WebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    record: Record<string, unknown>;
    old_record?: Record<string, unknown>;
}

/**
 * POST /webhooks/supabase/user
 * Receives user events from Supabase auth.users
 * Creates/updates corresponding profile in public.profiles
 */
router.post('/user', async (req: Request, res: Response) => {
    // Verify webhook secret (should match Supabase webhook configuration)
    const webhookSecret = req.headers['x-webhook-secret'];
    if (webhookSecret !== process.env['SUPABASE_WEBHOOK_SECRET']) {
        logger.warn('Invalid webhook secret');
        res.status(401).json({ error: 'Invalid webhook secret' });
        return;
    }

    const payload = req.body as WebhookPayload;
    const supabase = createSupabaseAdmin();

    try {
        if (payload.type === 'INSERT') {
            // New user registered - create profile
            const user = payload.record as { id: string; email?: string };

            const { error } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: user.email ?? null,
                    plan: 'free' as const,
                    daily_quota: 100,
                });

            if (error) {
                logger.error('Failed to create profile', { userId: user.id, error: error.message });
                res.status(500).json({ error: 'Failed to create profile' });
                return;
            }

            logger.info('Profile created for new user', { userId: user.id });
        }

        if (payload.type === 'UPDATE') {
            // User updated - sync email if changed
            const user = payload.record as { id: string; email?: string };

            const { error } = await supabase
                .from('profiles')
                .update({ email: user.email })
                .eq('id', user.id);

            if (error) {
                logger.error('Failed to update profile', { userId: user.id, error: error.message });
            } else {
                logger.info('Profile updated', { userId: user.id });
            }
        }

        if (payload.type === 'DELETE') {
            // User deleted - profile cascades automatically via FK
            logger.info('User deleted, profile will cascade', {
                userId: (payload.old_record as { id: string })?.id
            });
        }

        res.json({ success: true });
    } catch (error) {
        logger.error('Webhook processing error', { error: (error as Error).message });
        res.status(500).json({ error: 'Internal error' });
    }
});

export { router as webhooksRouter };
