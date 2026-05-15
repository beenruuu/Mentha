import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';

import { decryptApiKey, encryptApiKey } from '../core/encryption';
import { logger } from '../core/logger';
import { db } from '../db';
import { userApiKeys } from '../db/schema/core';
import { handleHttpException } from '../exceptions/http';

export const SettingsController = {
    getApiKeys: async (c: Context) => {
        try {
            const user = c.get('user');
            if (!user) throw new Error('Unauthorized');

            const keys = await db
                .select()
                .from(userApiKeys)
                .where(and(eq(userApiKeys.user_id, user.id), eq(userApiKeys.is_active, true)));

            const result = keys.map((k) => ({
                id: k.id,
                provider: k.provider,
                key_preview: k.key_preview,
                is_active: k.is_active,
                created_at: k.created_at,
                updated_at: k.updated_at,
            }));

            return c.json({ data: result });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'Failed to fetch API keys');
            return handleHttpException(c, error);
        }
    },

    setApiKey: async (c: Context) => {
        try {
            const user = c.get('user');
            if (!user) throw new Error('Unauthorized');

            const { provider, key } = await c.req.json();

            if (provider !== 'openrouter') {
                return c.json({ error: 'Only openrouter provider is supported' }, 400);
            }

            if (!key || typeof key !== 'string' || key.length < 10) {
                return c.json({ error: 'Invalid API key' }, 400);
            }

            const encrypted = encryptApiKey(key);
            const preview = `...${key.slice(-4)}`;

            const existing = await db
                .select()
                .from(userApiKeys)
                .where(and(eq(userApiKeys.user_id, user.id), eq(userApiKeys.provider, provider)))
                .limit(1);

            if (existing.length > 0) {
                const existingKey = existing[0];
                if (!existingKey) {
                    throw new Error('API key lookup failed');
                }

                const updated = await db
                    .update(userApiKeys)
                    .set({
                        key_encrypted: encrypted,
                        key_preview: preview,
                        is_active: true,
                        updated_at: new Date(),
                    })
                    .where(eq(userApiKeys.id, existingKey.id))
                    .returning();
                const updatedKey = updated[0];
                if (!updatedKey) {
                    throw new Error('Failed to update API key');
                }

                return c.json({
                    data: {
                        id: updatedKey.id,
                        provider: updatedKey.provider,
                        key_preview: updatedKey.key_preview,
                        is_active: updatedKey.is_active,
                    },
                });
            }

            const inserted = await db
                .insert(userApiKeys)
                .values({
                    user_id: user.id,
                    provider,
                    key_encrypted: encrypted,
                    key_preview: preview,
                })
                .returning();
            const insertedKey = inserted[0];
            if (!insertedKey) {
                throw new Error('Failed to insert API key');
            }

            return c.json({
                data: {
                    id: insertedKey.id,
                    provider: insertedKey.provider,
                    key_preview: insertedKey.key_preview,
                    is_active: insertedKey.is_active,
                },
            });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'Failed to set API key');
            return handleHttpException(c, error);
        }
    },

    deleteApiKey: async (c: Context) => {
        try {
            const user = c.get('user');
            if (!user) throw new Error('Unauthorized');

            const provider = c.req.param('provider');
            if (!provider) throw new Error('Provider is required');

            await db
                .update(userApiKeys)
                .set({ is_active: false, updated_at: new Date() })
                .where(and(eq(userApiKeys.user_id, user.id), eq(userApiKeys.provider, provider)));

            return c.json({ data: { success: true } });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'Failed to delete API key');
            return handleHttpException(c, error);
        }
    },

    testApiKey: async (c: Context) => {
        try {
            const user = c.get('user');
            if (!user) throw new Error('Unauthorized');

            const { provider } = await c.req.json();

            if (provider !== 'openrouter') {
                return c.json({ error: 'Only openrouter provider is supported' }, 400);
            }

            const keyRecord = await db
                .select()
                .from(userApiKeys)
                .where(
                    and(
                        eq(userApiKeys.user_id, user.id),
                        eq(userApiKeys.provider, provider),
                        eq(userApiKeys.is_active, true),
                    ),
                )
                .limit(1);

            if (keyRecord.length === 0) {
                return c.json({ error: 'No API key found for this provider' }, 404);
            }

            const activeKey = keyRecord[0];
            if (!activeKey) {
                return c.json({ error: 'No API key found for this provider' }, 404);
            }

            const decrypted = decryptApiKey(activeKey.key_encrypted);

            const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
                headers: { Authorization: `Bearer ${decrypted}` },
            });

            if (!response.ok) {
                return c.json({ data: { valid: false, error: 'Key rejected by OpenRouter' } });
            }

            const body = (await response.json()) as { data?: { label?: string } };
            return c.json({
                data: {
                    valid: true,
                    label: body.data?.label || 'OpenRouter Key',
                },
            });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'Failed to test API key');
            return handleHttpException(c, error);
        }
    },
} as const;
