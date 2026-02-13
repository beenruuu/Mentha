'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { serverFetchAPI, requireAuth } from '@/lib/server-api-client'

// Types for GEO Analysis
export interface VisibilitySnapshot {
    id: string
    brand_id: string
    ai_model: 'openai' | 'anthropic' | 'perplexity' | 'gemini'
    visibility_score: number
    mention_count: number
    sentiment?: string
    measured_at: string
    query_count: number
    inclusion_rate?: number
    average_position?: number
}

export interface LatestVisibilityScores {
    history: VisibilitySnapshot[]
    latest_scores: VisibilitySnapshot[]
}

export interface GEOAnalysisResponse {
    id: string
    brand_name: string
    domain: string
    status: 'processing' | 'completed' | 'failed'
    created_at: string
    completed_at?: string
    overall_score: number
    grade: string
    summary: string | any
    recommendations: Array<{
        priority: 'critical' | 'high' | 'medium' | 'low'
        category: string
        title: string
        description?: string
    }>
}

/**
 * Get visibility data for a brand (chart data)
 */
export async function getVisibilityData(
    brandId: string,
    aiModel?: string,
    limit: number = 30
): Promise<LatestVisibilityScores> {
    await requireAuth()
    const params = new URLSearchParams({ limit: limit.toString() })
    if (aiModel) params.append('ai_model', aiModel)
    return serverFetchAPI<LatestVisibilityScores>(
        `/geo-analysis/brands/${brandId}/visibility?${params}`
    )
}

/**
 * Get the latest GEO analysis for a brand
 */
export async function getLatestGEOAnalysis(brandId: string): Promise<GEOAnalysisResponse | null> {
    await requireAuth()
    try {
        return await serverFetchAPI<GEOAnalysisResponse>(`/geo-analysis/brands/${brandId}/latest`)
    } catch (error: any) {
        // 404 means no analysis yet
        if (error.message?.includes('404') || error.message?.includes('not found')) {
            return null
        }
        throw error
    }
}

/**
 * Get GEO analysis history for a brand
 */
export async function getGEOAnalysisHistory(
    brandId: string,
    limit: number = 10
): Promise<GEOAnalysisResponse[]> {
    await requireAuth()
    return serverFetchAPI<GEOAnalysisResponse[]>(
        `/geo-analysis/brands/${brandId}/history?limit=${limit}`
    )
}

/**
 * Start a new GEO analysis
 */
export async function startGEOAnalysis(request: {
    brand_name: string
    domain: string
    industry?: string
    competitors?: string[]
    run_full_analysis?: boolean
}): Promise<GEOAnalysisResponse> {
    await requireAuth()
    const result = await serverFetchAPI<GEOAnalysisResponse>('/geo-analysis/analyze', {
        method: 'POST',
        body: JSON.stringify(request),
    })
    revalidateTag('geo-analysis')
    return result
}

/**
 * Get sentiment analysis summary for a brand
 */
export async function getSentimentSummary(brandId: string): Promise<{
    overall_sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
    sentiment_score: number
    trend: 'improving' | 'stable' | 'declining'
    positive_aspects: string[]
    negative_aspects: string[]
    sample_count?: number
    last_analyzed?: string
} | null> {
    await requireAuth()
    try {
        return await serverFetchAPI(`/api/sentiment/${brandId}/summary`)
    } catch {
        return null
    }
}

/**
 * Refresh sentiment analysis for a brand
 */
export async function refreshSentimentAnalysis(brandId: string): Promise<void> {
    await requireAuth()
    await serverFetchAPI(`/api/sentiment/${brandId}/analyze`, {
        method: 'POST',
    })
    revalidatePath(`/brand/${brandId}`)
}
