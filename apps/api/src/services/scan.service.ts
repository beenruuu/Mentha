import { desc, eq, and } from 'drizzle-orm';

import { env } from '../config/env';
import { CreditService } from '../core/credits';
import { createLogger, logger } from '../core/logger';
import { db } from '../db';
import { keywords, projects, scanJobs, scanResults } from '../db/schema/core';
import type { ScanResult } from '../db/types';
import { NotFoundException } from '../exceptions/http';
import { addScanJob } from '../core/queue';

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
     * Enqueues scan jobs for all active keywords in a project
     */
    async triggerProjectScan(projectId: string): Promise<{ jobCount: number; runId: string }> {
        logger.info({ projectId }, 'Triggering full project scan');

        const [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        const activeKeywords = await db
            .select()
            .from(keywords)
            .where(and(eq(keywords.project_id, projectId), eq(keywords.is_active, true)));

        let jobCount = 0;
        const brand = project.name;
        const competitors = (project.competitors as string[]) || [];

        // Create a scan run to group these jobs
        const [scanRun] = await db
            .insert((await import('../db/schema/core')).scanRuns)
            .values({
                project_id: projectId,
                status: 'pending',
                total_jobs: 0,
                completed_jobs: 0,
                visible_count: 0,
            })
            .returning();

        for (const kw of activeKeywords) {
            const engines = (kw.engines as string[]) || ['perplexity'];

            for (const engineName of engines) {
                // 1. Create a job record per (keyword, engine)
                const [jobRecord] = await db
                    .insert(scanJobs)
                    .values({
                        keyword_id: kw.id,
                        run_id: scanRun!.id,
                        engine: engineName,
                        status: 'pending',
                        priority: 'high',
                    })
                    .returning();

                if (jobRecord) {
                    // 2. Add a BullMQ job for this specific engine
                    await addScanJob({
                        keywordId: kw.id,
                        engine: engineName,
                        projectId: projectId,
                        query: kw.query,
                        brand: brand,
                        competitors: competitors,
                    }, { jobId: jobRecord.id });
                    
                    jobCount++;
                }
            }
        }

        // Update the scan run with total_jobs
        await db.update((await import('../db/schema/core')).scanRuns).set({ total_jobs: jobCount, status: 'processing', started_at: new Date() }).where(eq((await import('../db/schema/core')).scanRuns.id, scanRun!.id));

        logger.info({ projectId, jobCount, runId: scanRun!.id }, 'Project scan triggered successfully');
        return { jobCount, runId: scanRun!.id };
    }

    /**
     * Executes a real scan using OpenRouter and deducts credits
     */
    async executeScan(data: ScanJobData): Promise<ScanServiceResult> {
        const log = createLogger({ jobId: data.jobId, keywordId: data.keywordId });
        const startTime = Date.now();

        log.info({ engine: data.engine, query: data.query }, 'Starting real scan via OpenRouter');

        try {
            // 1. Get User ID and geo filters from Keyword -> Project
            const [keywordData] = await db
                .select({ 
                    userId: projects.user_id,
                    location: projects.location,
                    language: projects.language
                })
                .from(keywords)
                .innerJoin(projects, eq(keywords.project_id, projects.id))
                .where(eq(keywords.id, data.keywordId))
                .limit(1);

            if (!keywordData) {
                throw new NotFoundException('Keyword or associated project not found');
            }

            const { userId, location, language } = keywordData;

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

            // 4. Call Search Provider via Factory
            const provider = (await import('../core/search/factory')).createProvider(data.engine as any);
            const searchResult = await provider.search(data.query, {
                geo: {
                    country: 'Global', // Default if not specified in project
                    location: location || 'Global',
                },
                maxTokens: 2000,
                temperature: 0.1,
            });

            const rawResponse = searchResult.content || '';
            const aiResponse = { usage: searchResult.usage }; // Mocking minimal aiResponse for backward compat

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
        logger.debug({ projectId: filters.projectId }, 'Listing individual scan results');

        const limit = filters.limit || 20;

        // Return individual scan results joined with jobs and keywords
        const results = await db
            .select({
                id: scanResults.id,
                engine: scanJobs.engine,
                query: keywords.query,
                raw_response: scanResults.raw_response,
                analysis_json: scanResults.analysis_json,
                brand_visibility: scanResults.brand_visibility,
                sentiment_score: scanResults.sentiment_score,
                recommendation_type: scanResults.recommendation_type,
                created_at: scanResults.created_at,
            })
            .from(scanResults)
            .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
            .innerJoin(keywords, eq(scanJobs.keyword_id, keywords.id))
            .where(eq(keywords.project_id, filters.projectId))
            .orderBy(desc(scanResults.created_at))
            .limit(limit);

        // Strip model identifiers from analysis_json to avoid leaking
        // exact model names (e.g. openai/gpt-4o) to the frontend
        return results.map((r) => {
            if (r.analysis_json && typeof r.analysis_json === 'object' && 'model' in (r.analysis_json as any)) {
                const { model, ...safeJson } = r.analysis_json as any;
                return { ...r, analysis_json: safeJson };
            }
            return r;
        });
    }

    async getResultById(id: string): Promise<any> {
        // If id corresponds to a scan_run, return run details and per-engine jobs/results
        const { scanRuns, scanJobs, scanResults: sr, keywords } = await import('../db/schema/core');

        const runRow = await db.select().from(scanRuns).where(eq(scanRuns.id, id)).limit(1);
        if (runRow.length === 0) {
            // Fallback: try to find scan result by id
            const data = await db.select().from(sr).where(eq(sr.id, id)).limit(1);
            if (data.length === 0) throw new NotFoundException('Scan run/result not found');
            return data[0]!;
        }

        const run = runRow[0];

        // Fetch jobs and associated results
        const jobs = await db
            .select({
                job_id: scanJobs.id,
                engine: scanJobs.engine,
                status: scanJobs.status,
                keyword_id: scanJobs.keyword_id,
                created_at: scanJobs.created_at,
                result_id: sr.id,
                brand_visibility: sr.brand_visibility,
                sentiment_score: sr.sentiment_score,
                raw_response: sr.raw_response,
                analysis_json: sr.analysis_json,
            })
            .from(scanJobs)
            .leftJoin(sr, eq(sr.job_id, scanJobs.id))
            .where(eq(scanJobs.run_id, id))
            .orderBy(desc(scanJobs.created_at));

        return { run, jobs };
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
