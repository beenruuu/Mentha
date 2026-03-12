import { z } from 'zod';

export const webhookPayloadSchema = z.object({
    type: z.enum(['INSERT', 'UPDATE', 'DELETE']),
    table: z.string(),
    record: z.record(z.unknown()),
    old_record: z.record(z.unknown()).optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
