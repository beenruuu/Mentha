import { desc, eq } from 'drizzle-orm';

import { env } from '../config/env';
import { CreditService } from '../core/credits';
import { createLogger, logger } from '../core/logger';
import { db } from '../db';
import { keywords, projects, scanJobs, scanResults } from '../db/schema/core';
import type { ScanResult } from '../db/types';
import { NotFoundException } from '../exceptions/http';

export interface ScanJobData {
    jobId: string;
    keywordId: string;
    engine: string;
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
    /**
     * Executes a real scan using OpenRouter and deducts credits
     */
    async executeScan(data: ScanJobData): Promise<ScanServiceResult> {
        const log = createLogger({ jobId: data.jobId, keywordId: data.keywordId });
        const startTime = Date.now();

        log.info({ engine: data.engine, query: data.query }, 'Starting real scan via OpenRouter');

        try {
            // 1. Get User ID from Keyword -> Project
            const [keywordData] = await db
                .select({ userId: projects.user_id })
                .from(keywords)
                .innerJoin(projects, eq(keywords.project_id, projects.id))
                .where(eq(keywords.id, data.keywordId))
                .limit(1);

            if (!keywordData) {
                throw new NotFoundException('Keyword or associated project not found');
            }

            const userId = keywordData.userId;

            // 2. Check and deduct credits
            const cost = CreditService.getModelCost(data.engine);
            const hasCredits = await CreditService.deductCredits(
                userId,
                cost,
                `AEO Scan: ${data.engine} for "${data.query}"`,
                { keywordId: data.keywordId, engine: data.engine },
            );

            if (!hasCredits) {
                log.warn({ userId, cost }, 'Insufficient credits for scan');
                throw new Error('Insufficient credits to perform this scan');
            }

            // 3. Mark job as processing
            await db
                .update(scanJobs)
                .set({
                    status: 'processing',
                    started_at: new Date(),
                })
                .where(eq(scanJobs.id, data.jobId));

            // 4. Call OpenRouter API
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://mentha.saas',
                    'X-Title': 'Mentha AEO Platform',
                },
                body: JSON.stringify({
                    model: data.engine,
                    messages: [
                        {
                            role: 'system',
                            content: `You are an AEO (Answer Engine Optimization) analyzer. Analyze the visibility of the brand "${data.brand}" compared to competitors: ${data.competitors.join(', ')}. Provide a detailed analysis including sentiment and visibility score.`,
                        },
                        {
                            role: 'user',
                            content: data.query,
                        },
                    ],
                    response_format: { type: 'json_object' },
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API failed: ${errorText}`);
            }

            const aiResponse = (await response.json()) as any;
            const rawResponse = aiResponse.choices?.[0]?.message?.content || '';

            // Try to parse JSON from AI if requested, otherwise store as raw
            let analysisJson = {};
            try {
                analysisJson = JSON.parse(rawResponse);
            } catch (e) {
                analysisJson = { raw_content: rawResponse };
            }

            const latencyMs = Date.now() - startTime;

            // 5. Store Results
            const scanResult = await db
                .insert(scanResults)
                .values({
                    job_id: data.jobId,
                    raw_response: rawResponse,
                    analysis_json: analysisJson,
                    brand_visibility: rawResponse.toLowerCase().includes(data.brand.toLowerCase()),
                    sentiment_score: 0.5, // Default for now, should be extracted from AI JSON
                    token_count: aiResponse.usage?.total_tokens || 0,
                })
                .returning();

            if (!scanResult[0]) {
                throw new Error('Failed to store scan result');
            }

            // 6. Mark job as completed
            await db
                .update(scanJobs)
                .set({
                    status: 'completed',
                    latency_ms: latencyMs,
                    completed_at: new Date(),
                })
                .where(eq(scanJobs.id, data.jobId));

            log.info({ latencyMs, cost }, 'Scan completed successfully');

            return { success: true, resultId: scanResult[0].id, latencyMs };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            log.error({ error: errorMessage }, 'Scan failed');

            await db
                .update(scanJobs)
                .set({
                    status: 'failed',
                    error_message: errorMessage,
                    completed_at: new Date(),
                })
                .where(eq(scanJobs.id, data.jobId));

            throw error;
        }
    }

    async listResults(filters: { projectId: string; limit?: number }): Promise<any[]> {
        logger.debug({ projectId: filters.projectId }, 'Listing scan results');

        const limit = filters.limit || 20;

        return await db
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
    }

    async getResultById(id: string): Promise<ScanResult> {
        const data = await db.select().from(scanResults).where(eq(scanResults.id, id)).limit(1);
        if (data.length === 0) throw new NotFoundException('Scan result not found');
        return data[0]!;
    }

    async getLatestByKeyword(keywordId: string): Promise<any | null> {
        const data = await db
            .select()
            .from(scanResults)
            .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
            .where(eq(scanJobs.keyword_id, keywordId))
            .orderBy(desc(scanResults.created_at))
            .limit(1);

        return data.length > 0 ? data[0] : null;
    }
}

let scanService: ScanService | null = null;

export function getScanService(): ScanService {
    if (!scanService) {
        scanService = new ScanService();
    }
    return scanService;
}
