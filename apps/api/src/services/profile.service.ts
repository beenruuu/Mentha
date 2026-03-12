import { eq } from 'drizzle-orm';

import { comparePassword, hashPassword } from '../core/hash';
import { logger } from '../core/logger';
import { db } from '../db';
import { profiles } from '../db/schema/core';
import type { InsertProfile, Profile } from '../db/types';
import { ConflictException, NotFoundException } from '../exceptions/http';

export interface CreateProfileInput {
    email: string;
    password: string;
    display_name?: string;
}

export interface UpdateProfileInput {
    display_name?: string;
    plan?: 'free' | 'pro' | 'enterprise';
    daily_quota?: number;
}

export class ProfileService {
    async findByEmail(email: string): Promise<Profile | null> {
        logger.debug({ email }, 'Finding profile by email');

        const data = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);

        return data[0] || null;
    }

    async findById(id: string): Promise<Profile> {
        logger.debug({ id }, 'Finding profile by ID');

        const data = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);

        if (data.length === 0) {
            throw new NotFoundException('Profile not found');
        }

        return data[0]!;
    }

    async create(input: CreateProfileInput): Promise<Profile> {
        logger.info({ email: input.email }, 'Creating profile');

        const existingProfile = await this.findByEmail(input.email);
        if (existingProfile) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await hashPassword(input.password);

        const profileData: InsertProfile = {
            email: input.email,
            password_hash: passwordHash,
            display_name: input.display_name,
        };

        const result = await db.insert(profiles).values(profileData).returning();

        if (!result[0]) {
            throw new Error('Failed to create profile');
        }

        logger.info({ profileId: result[0].id }, 'Profile created successfully');
        return result[0];
    }

    async validateCredentials(email: string, password: string): Promise<Profile | null> {
        logger.debug({ email }, 'Validating credentials');

        const profile = await this.findByEmail(email);
        if (!profile) {
            return null;
        }

        const isValid = await comparePassword(password, profile.password_hash);
        if (!isValid) {
            return null;
        }

        return profile;
    }

    async update(id: string, input: UpdateProfileInput): Promise<Profile> {
        logger.info({ id, updates: Object.keys(input) }, 'Updating profile');

        const result = await db
            .update(profiles)
            .set({
                ...input,
                updated_at: new Date(),
            })
            .where(eq(profiles.id, id))
            .returning();

        if (result.length === 0) {
            throw new NotFoundException('Profile not found');
        }

        logger.info({ profileId: id }, 'Profile updated successfully');
        return result[0]!;
    }

    async delete(id: string): Promise<void> {
        logger.info({ id }, 'Deleting profile');

        const result = await db.delete(profiles).where(eq(profiles.id, id)).returning();

        if (result.length === 0) {
            throw new NotFoundException('Profile not found');
        }

        logger.info({ profileId: id }, 'Profile deleted successfully');
    }

    async emailExists(email: string): Promise<boolean> {
        const profile = await this.findByEmail(email);
        return profile !== null;
    }
}

let profileService: ProfileService | null = null;

export function getProfileService(): ProfileService {
    if (!profileService) {
        profileService = new ProfileService();
    }
    return profileService;
}
