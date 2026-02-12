import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { WebhookController } from '../controllers/webhooks.controller';
import { webhookPayloadSchema } from '../schemas/webhook.schema';

const router = new Hono()
    .post('/user', zValidator('json', webhookPayloadSchema), WebhookController.processUser);

export default router;
