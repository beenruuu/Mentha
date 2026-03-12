import { eq } from 'drizzle-orm';

import { logger } from '../core/logger';
import { db } from '../db';
import { profiles } from '../db/schema/core';
import type { InsertProfile, Profile } from '../db/types';

export interface WebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    record: Record<string, unknown>;
    old_record?: Record<string, unknown>;
}

export class WebhookService {
    async processUserWebhook(payload: WebhookPayload): Promise<void> {
        logger.info({ type: payload.type, table: payload.table }, 'Processing user webhook');

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

        logger.info({ userId, email }, 'Creating profile for new user');

        const profileData: InsertProfile = {
            id: userId,
            email: email || '',
            password_hash: '',
            plan: 'free',
            daily_quota: 100,
        };

        const result = await db.insert(profiles).values(profileData).returning();

        if (!result[0]) {
            throw new Error('Failed to create profile');
        }

        logger.info({ userId }, 'Profile created successfully');
        return result[0];
    }

    async updateProfile(record: Record<string, unknown>): Promise<Profile> {
        const userId = record.id as string;
        const email = record.email as string | undefined;

        logger.info({ userId }, 'Updating profile');

        const result = await db
            .update(profiles)
            .set({
                email: email || '',
                updated_at: new Date(),
            })
            .where(eq(profiles.id, userId))
            .returning();

        if (result.length === 0) {
            logger.warn({ userId }, 'Profile not found for update, creating new one');
            return await this.createProfile(record);
        }

        logger.info({ userId }, 'Profile updated successfully');
        return result[0]!;
    }

    async deleteProfile(record: Record<string, unknown>): Promise<void> {
        const userId = record.id as string;

        logger.info({ userId }, 'User deleted, profile will cascade');
    }
}

let webhookService: WebhookService | null = null;

export function getWebhookService(): WebhookService {
    if (!webhookService) {
        webhookService = new WebhookService();
    }
    return webhookService;
}
