import type { Context } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { creditTransactions, profiles } from '../db/schema/core';
import { logger } from '../core/logger';
import { handleHttpException } from '../exceptions/http';

export const BillingController = {
    /**
     * List user transactions
     */
    getTransactions: async (c: Context) => {
        try {
            const user = c.get('user');
            if (!user) throw new Error('Unauthorized');

            const transactions = await db
                .select()
                .from(creditTransactions)
                .where(eq(creditTransactions.user_id, user.id))
                .orderBy(desc(creditTransactions.created_at))
                .limit(50);

            return c.json({ data: transactions });
        } catch (error) {
            logger.error('Failed to fetch transactions', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    },

    /**
     * Top-up credit balance (Simulated/Admin only logic)
     */
    topUp: async (c: Context) => {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const { amount, description } = body;

            if (!amount || amount <= 0) {
                throw new Error('Invalid amount');
            }

            return await db.transaction(async (tx) => {
                // Update profile balance
                await tx
                    .update(profiles)
                    .set({ credit_balance: (profiles.credit_balance as any) + amount })
                    .where(eq(profiles.id, user.id));

                // Log transaction
                const [transaction] = await tx
                    .insert(creditTransactions)
                    .values({
                        user_id: user.id,
                        amount: amount,
                        type: 'top-up',
                        description: description || 'Credit purchase',
                    })
                    .returning();

                return c.json({ 
                    message: 'Credits added successfully', 
                    transaction 
                });
            });
        } catch (error) {
            logger.error('Top-up failed', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }
};