import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { profiles, creditTransactions } from '../db/schema/core';
import { logger } from './logger';

export const CreditService = {
    /**
     * Get user current credit status (daily quota + permanent balance)
     */
    getUserBalance: async (userId: string) => {
        const [profile] = await db
            .select({
                daily_quota: profiles.daily_quota,
                credit_balance: profiles.credit_balance,
            })
            .from(profiles)
            .where(eq(profiles.id, userId));
        
        return profile || { daily_quota: 0, credit_balance: 0 };
    },

    /**
     * Deduct credits from user. Prioritizes daily quota, then permanent balance.
     * Returns true if successful, false if insufficient funds.
     */
    deductCredits: async (userId: string, amount: number, description: string, metadata: any = {}) => {
        return await db.transaction(async (tx) => {
            const [profile] = await tx
                .select()
                .from(profiles)
                .where(eq(profiles.id, userId))
                .for('update'); // Lock row

            if (!profile) throw new Error('User not found');

            const daily = profile.daily_quota || 0;
            const balance = profile.credit_balance || 0;
            const totalAvailable = daily + balance;

            if (totalAvailable < amount) {
                return false;
            }

            let newDaily = daily;
            let newBalance = balance;

            // Deduct from daily quota first
            if (daily >= amount) {
                newDaily = daily - amount;
            } else {
                newDaily = 0;
                newBalance = balance - (amount - daily);
            }

            // Update profile
            await tx
                .update(profiles)
                .set({
                    daily_quota: newDaily,
                    credit_balance: newBalance,
                    updated_at: new Date(),
                })
                .where(eq(profiles.id, userId));

            // Log transaction
            await tx.insert(creditTransactions).values({
                user_id: userId,
                amount: -amount,
                type: 'usage',
                description,
                metadata,
            });

            logger.info('Credits deducted', { userId, amount, newDaily, newBalance });
            return true;
        });
    },

    /**
     * Model to Credit mapping
     */
    getModelCost: (modelId: string): number => {
        const costs: Record<string, number> = {
            'google/gemini-2.5-flash': 1,
            'anthropic/claude-3-haiku': 1,
            'meta-llama/llama-3-8b-instruct': 1,
            'openai/gpt-3.5-turbo': 2,
            'anthropic/claude-3-sonnet': 10,
            'openai/gpt-4o': 10,
            'perplexity/llama-3-sonar-large-32k-online': 15,
        };

        // Default cost for unknown models
        return costs[modelId] || 5;
    }
};