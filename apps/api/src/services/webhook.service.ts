import { eq } from 'drizzle-orm';
import { db } from '../db';
import { profiles } from '../db/schema/core';
import type { Profile, InsertProfile } from '../db/types';
import { logger } from '../core/logger';

export interface WebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    record: Record<string, unknown>;
    old_record?: Record<string, unknown>;
}

export class WebhookService {
    async processUserWebhook(payload: WebhookPayload): Promise<void> {
        logger.info('Processing user webhook', { type: payload.type, table: payload.table });

        if (payload.type === 'INSERT') {
            await this.createProfile(payload.record);
        } else if (payload.type === 'UPDATE') {
            await this.updateProfile(payload.record);
        } else if (payload.type === 'DELETE') {
            await this.deleteProfile(payload.old_record || payload.record);
        }
    }

    async createProfile(record: Record<string, unknown>): Promise<Profile> {
        const userId = record.id as string;
        const email = record.email as string | undefined;

        logger.info('Creating profile for new user', { userId, email });

        const profileData: InsertProfile = {
            id: userId,
            email: email || null,
            plan: 'free',
            daily_quota: 100,
        };

        const result = await db
            .insert(profiles)
            .values(profileData)
            .returning();

        if (!result[0]) {
            throw new Error('Failed to create profile');
        }

        logger.info('Profile created successfully', { userId });
        return result[0];
    }

    async updateProfile(record: Record<string, unknown>): Promise<Profile> {
        const userId = record.id as string;
        const email = record.email as string | undefined;

        logger.info('Updating profile', { userId });

        const result = await db
            .update(profiles)
            .set({
                email: email || null,
                updated_at: new Date(),
            })
            .where(eq(profiles.id, userId))
            .returning();

        if (result.length === 0) {
            logger.warn('Profile not found for update, creating new one', { userId });
            return await this.createProfile(record);
        }

        logger.info('Profile updated successfully', { userId });
        return result[0]!;
    }

    async deleteProfile(record: Record<string, unknown>): Promise<void> {
        const userId = record.id as string;

        logger.info('User deleted, profile will cascade', { userId });
    }
}

let webhookService: WebhookService | null = null;

export function getWebhookService(): WebhookService {
    if (!webhookService) {
        webhookService = new WebhookService();
    }
    return webhookService;
}
