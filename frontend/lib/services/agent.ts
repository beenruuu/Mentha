/**
 * Firecrawl Agent Service - Frontend client for agent endpoints
 * 
 * Provides access to:
 * - Brand mention discovery
 * - Competitor scanning
 * - Web search with scraping
 */

import { fetchAPI } from '@/lib/api-client';

export interface BrandMentionRequest {
    brand_name: string;
    industry?: string;
    ai_engines?: string[];
    keywords?: string[];
}

export interface CompetitorScanRequest {
    brand_name: string;
    industry?: string;
    known_competitors?: string[];
    keywords?: string[];
}

export interface SearchRequest {
    query: string;
    limit?: number;
    lang?: string;
    country?: string;
}

export interface AgentJobResult {
    success: boolean;
    job_id?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    data?: any;
    error?: string;
}

export interface AgentHealthStatus {
    enabled: boolean;
    api_configured: boolean;
    max_pages_per_request: number;
}

/**
 * Check if the agent service is available
 */
export async function checkAgentHealth(): Promise<AgentHealthStatus> {
    return fetchAPI<AgentHealthStatus>('/agent/health');
}

/**
 * Discover brand mentions across AI search engines
 */
export async function discoverBrandMentions(
    request: BrandMentionRequest
): Promise<AgentJobResult> {
    return fetchAPI<AgentJobResult>('/agent/discover-mentions', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

/**
 * Scan for competitor intelligence
 */
export async function scanCompetitors(
    request: CompetitorScanRequest
): Promise<AgentJobResult> {
    return fetchAPI<AgentJobResult>('/agent/competitor-scan', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

/**
 * Search the web and extract content (cheaper than agent for simple queries)
 */
export async function searchWeb(request: SearchRequest): Promise<AgentJobResult> {
    const params = new URLSearchParams({
        query: request.query,
        limit: String(request.limit || 10),
        lang: request.lang || 'es',
        country: request.country || 'es',
    });

    return fetchAPI<AgentJobResult>(`/agent/search?${params}`, {
        method: 'POST',
    });
}

/**
 * Check the status of an async agent job
 */
export async function getAgentJobStatus(jobId: string): Promise<AgentJobResult> {
    return fetchAPI<AgentJobResult>(`/agent/status/${jobId}`);
}

/**
 * Poll for job completion with retry
 */
export async function waitForJobCompletion(
    jobId: string,
    maxRetries = 30,
    intervalMs = 2000
): Promise<AgentJobResult> {
    for (let i = 0; i < maxRetries; i++) {
        const result = await getAgentJobStatus(jobId);

        if (result.status === 'completed' || result.status === 'failed') {
            return result;
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    return { success: false, status: 'failed', error: 'Job timed out' };
}
