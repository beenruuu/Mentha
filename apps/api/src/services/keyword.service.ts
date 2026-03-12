import { desc, eq } from 'drizzle-orm';

import { logger } from '../core/logger';
import { db } from '../db';
import { keywords } from '../db/schema/core';
import type { InsertKeyword, Keyword } from '../db/types';
import { NotFoundException } from '../exceptions/http';

export interface CreateKeywordInput {
    project_id: string;
    query: string;
    intent?: 'informational' | 'transactional' | 'navigational' | 'commercial';
    scan_frequency?: 'daily' | 'weekly' | 'manual';
    engines?: Array<'perplexity' | 'openai' | 'gemini'>;
}

export interface UpdateKeywordInput {
    query?: string;
    intent?: 'informational' | 'transactional' | 'navigational' | 'commercial';
    scan_frequency?: 'daily' | 'weekly' | 'manual';
    engines?: Array<'perplexity' | 'openai' | 'gemini'>;
    is_active?: boolean;
}

export interface KeywordFilters {
    projectId?: string;
    isActive?: boolean;
}

export class KeywordService {
    async list(filters?: KeywordFilters): Promise<Keyword[]> {
        logger.debug({ filters }, 'Listing keywords');

        let query = db.select().from(keywords).orderBy(desc(keywords.created_at));

        if (filters?.projectId) {
            query = query.where(eq(keywords.project_id, filters.projectId)) as typeof query;
        }

        if (filters?.isActive !== undefined) {
            query = query.where(eq(keywords.is_active, filters.isActive)) as typeof query;
        }

        const data = await query;
        return data;
    }

    async listByProject(projectId: string): Promise<Keyword[]> {
        logger.debug({ projectId }, 'Listing keywords by project');

        const data = await db
            .select()
            .from(keywords)
            .where(eq(keywords.project_id, projectId))
            .orderBy(desc(keywords.created_at));

        return data;
    }

    async getById(id: string): Promise<Keyword> {
        logger.debug({ id }, 'Getting keyword by ID');

        const data = await db.select().from(keywords).where(eq(keywords.id, id)).limit(1);

        if (data.length === 0) {
            throw new NotFoundException('Keyword not found');
        }

        return data[0]!;
    }

    async create(input: CreateKeywordInput): Promise<Keyword> {
        logger.info({ projectId: input.project_id, query: input.query }, 'Creating keyword');

        const keywordData: InsertKeyword = {
            project_id: input.project_id,
            query: input.query,
            intent: input.intent || 'informational',
            scan_frequency: input.scan_frequency || 'weekly',
            engines: input.engines || ['perplexity'],
            is_active: true,
        };

        const result = await db.insert(keywords).values(keywordData).returning();

        if (!result[0]) {
            throw new Error('Failed to create keyword');
        }

        logger.info({ keywordId: result[0].id }, 'Keyword created successfully');
        return result[0];
    }

    async update(id: string, input: UpdateKeywordInput): Promise<Keyword> {
        logger.info({ id, updates: Object.keys(input) }, 'Updating keyword');

        const result = await db
            .update(keywords)
            .set({
                ...input,
                updated_at: new Date(),
            })
            .where(eq(keywords.id, id))
            .returning();

        if (result.length === 0) {
            throw new NotFoundException('Keyword not found');
        }

        logger.info({ keywordId: id }, 'Keyword updated successfully');
        return result[0]!;
    }

    async delete(id: string): Promise<void> {
        logger.info({ id }, 'Deleting keyword');

        const result = await db.delete(keywords).where(eq(keywords.id, id)).returning();

        if (result.length === 0) {
            throw new NotFoundException('Keyword not found');
        }

        logger.info({ keywordId: id }, 'Keyword deleted successfully');
    }

    async toggleActive(id: string, isActive: boolean): Promise<Keyword> {
        logger.info({ id, isActive }, 'Toggling keyword active status');

        const result = await db
            .update(keywords)
            .set({
                is_active: isActive,
                updated_at: new Date(),
            })
            .where(eq(keywords.id, id))
            .returning();

        if (result.length === 0) {
            throw new NotFoundException('Keyword not found');
        }

        return result[0]!;
    }

    async exists(id: string): Promise<boolean> {
        const data = await db
            .select({ id: keywords.id })
            .from(keywords)
            .where(eq(keywords.id, id))
            .limit(1);

        return data.length > 0;
    }
}

let keywordService: KeywordService | null = null;

export function getKeywordService(): KeywordService {
    if (!keywordService) {
        keywordService = new KeywordService();
    }
    return keywordService;
}
