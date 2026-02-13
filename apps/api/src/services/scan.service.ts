import { desc, eq } from 'drizzle-orm';

import { createLogger, logger } from '../core/logger';
import { db } from '../db';
import { keywords, scanJobs, scanResults } from '../db/schema/core';
import type { ScanResult } from '../db/types';
import { NotFoundException } from '../exceptions/http';

export interface ScanJobData {
    keywordId: string;
    engine: 'perplexity' | 'openai' | 'gemini';
    query: string;
    brand: string;
    competitors: string[];
}

export interface ScanServiceResult {
    success: boolean;
    resultId: string;
    latencyMs: number;
}

export class ScanService {
    async executeScan(data: ScanJobData): Promise<ScanServiceResult> {
        const log = createLogger({ keywordId: data.keywordId });
        const startTime = Date.now();

        log.info('Starting scan', { engine: data.engine, query: data.query });

        try {
            await db
                .update(scanJobs)
                .set({
                    status: 'processing',
                    started_at: new Date(),
                })
                .where(eq(scanJobs.id, data.keywordId));

            const rawResponse = `Placeholder response for "${data.query}" from ${data.engine}`;

            const latencyMs = Date.now() - startTime;

            const scanResult = await db
                .insert(scanResults)
                .values({
                    job_id: data.keywordId,
                    raw_response: rawResponse,
                })
                .returning();

            if (!scanResult[0]) {
                throw new Error('Failed to store scan result');
            }

            log.info('Scan completed', { latencyMs });

            await db
                .update(scanJobs)
                .set({
                    status: 'completed',
                    latency_ms: latencyMs,
                    completed_at: new Date(),
                })
                .where(eq(scanJobs.id, data.keywordId));

            return { success: true, resultId: scanResult[0].id, latencyMs };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            log.error('Scan failed', { error: errorMessage });

            await db
                .update(scanJobs)
                .set({
                    status: 'failed',
                    error_message: errorMessage,
                    completed_at: new Date(),
                })
                .where(eq(scanJobs.id, data.keywordId));

            throw error;
        }
    }

    async listResults(filters: { projectId: string; limit?: number }): Promise<
        Array<{
            id: string;
            brand_visibility: boolean | null;
            sentiment_score: number | null;
            recommendation_type: string | null;
            raw_response: string | null;
            analysis_json: unknown;
            created_at: Date | null;
            engine: string;
            project_id: string;
            query: string;
        }>
    > {
        logger.debug('Listing scan results', { projectId: filters.projectId });

        const limit = filters.limit || 20;

        const results = await db
            .select({
                id: scanResults.id,
                brand_visibility: scanResults.brand_visibility,
                sentiment_score: scanResults.sentiment_score,
                recommendation_type: scanResults.recommendation_type,
                raw_response: scanResults.raw_response,
                analysis_json: scanResults.analysis_json,
                created_at: scanResults.created_at,
                engine: scanJobs.engine,
                project_id: keywords.project_id,
                query: keywords.query,
            })
            .from(scanResults)
            .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
            .innerJoin(keywords, eq(scanJobs.keyword_id, keywords.id))
            .where(eq(keywords.project_id, filters.projectId))
            .orderBy(desc(scanResults.created_at))
            .limit(limit);

        return results;
    }

    async getResultById(id: string): Promise<ScanResult> {
        logger.debug('Getting scan result by ID', { id });

        const data = await db.select().from(scanResults).where(eq(scanResults.id, id)).limit(1);

        if (data.length === 0) {
            throw new NotFoundException('Scan result not found');
        }

        return data[0]!;
    }

    async getLatestByKeyword(keywordId: string): Promise<ScanResult | null> {
        logger.debug('Getting latest scan result for keyword', { keywordId });

        const data = await db
            .select()
            .from(scanResults)
            .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
            .where(eq(scanJobs.keyword_id, keywordId))
            .orderBy(desc(scanResults.created_at))
            .limit(1);

        return data.length > 0 ? data[0]?.scan_results : null;
    }

    async getResultsByProject(
        projectId: string,
        limit: number = 20,
    ): Promise<
        Array<{
            id: string;
            brand_visibility: boolean | null;
            sentiment_score: number | null;
            recommendation_type: string | null;
            raw_response: string | null;
            analysis_json: unknown;
            created_at: Date | null;
            engine: string;
            project_id: string;
            query: string;
        }>
    > {
        return this.listResults({ projectId, limit });
    }
}

let scanService: ScanService | null = null;

export function getScanService(): ScanService {
    if (!scanService) {
        scanService = new ScanService();
    }
    return scanService;
}
