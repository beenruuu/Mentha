import { fetchAPI } from '@/lib/api-client'
import type {
    GEOAnalysisResponse,
    AIVisibilityModule,
    CitationsModule,
    Citation,
    CitationRate,
    CitationData,
    Recommendation,
    VisibilitySnapshot,
    LatestVisibilityScores,
    TechnicalAEO
} from '@/lib/types'

// Re-export types for backward compatibility
export type {
    GEOAnalysisResponse,
    AIVisibilityModule,
    CitationsModule,
    Citation,
    CitationRate,
    CitationData,
    Recommendation,
    VisibilitySnapshot,
    LatestVisibilityScores,
    TechnicalAEO
}

export interface GEOAnalysisRequest {
    brand_name: string
    domain: string
    industry?: string
    competitors?: string[]
    topics?: string[]
    run_full_analysis?: boolean
    modules?: string[]
}

export const geoAnalysisService = {
    /**
     * Start a new GEO analysis
     */
    analyze: async (request: GEOAnalysisRequest): Promise<GEOAnalysisResponse> => {
        return fetchAPI<GEOAnalysisResponse>('/geo-analysis/analyze', {
            method: 'POST',
            body: JSON.stringify(request),
        })
    },

    /**
     * Get analysis status and results by ID
     */
    getAnalysis: async (analysisId: string): Promise<GEOAnalysisResponse> => {
        return fetchAPI<GEOAnalysisResponse>(`/geo-analysis/analyze/${analysisId}`)
    },

    /**
     * Get the latest GEO analysis for a brand
     */
    getLatestAnalysis: async (brandId: string): Promise<GEOAnalysisResponse | null> => {
        try {
            return await fetchAPI<GEOAnalysisResponse>(`/geo-analysis/brands/${brandId}/latest`)
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null
            }
            throw error
        }
    },

    /**
     * Get historical GEO analyses for a brand
     */
    getHistory: async (brandId: string, limit: number = 10): Promise<GEOAnalysisResponse[]> => {
        return fetchAPI<GEOAnalysisResponse[]>(`/geo-analysis/brands/${brandId}/history?limit=${limit}`)
    },

    /**
     * Get AI visibility data for a brand
     */
    getVisibilityData: async (
        brandId: string,
        aiModel?: string,
        limit: number = 30
    ): Promise<LatestVisibilityScores> => {
        const params = new URLSearchParams({ limit: limit.toString() })
        if (aiModel) params.append('ai_model', aiModel)
        return fetchAPI<LatestVisibilityScores>(`/geo-analysis/brands/${brandId}/visibility?${params}`)
    },

    /**
     * Get citation data for a brand
     */
    getCitations: async (
        brandId: string,
        aiModel?: string,
        limit: number = 50
    ): Promise<CitationData> => {
        const params = new URLSearchParams({ limit: limit.toString() })
        if (aiModel) params.append('ai_model', aiModel)
        return fetchAPI<CitationData>(`/geo-analysis/brands/${brandId}/citations?${params}`)
    },

    /**
     * Get technical AEO data for a brand
     */
    getTechnicalAEO: async (brandId: string): Promise<TechnicalAEO[]> => {
        return fetchAPI<TechnicalAEO[]>(`/technical-aeo/?brand_id=${brandId}`)
    },

    /**
     * Run a quick GEO check (faster than full analysis)
     */
    quickCheck: async (brandName: string, domain: string): Promise<any> => {
        return fetchAPI<any>(`/geo-analysis/quick-check?brand_name=${encodeURIComponent(brandName)}&domain=${encodeURIComponent(domain)}`, {
            method: 'POST',
        })
    },

    /**
     * List available analysis modules
     */
    getAvailableModules: async (): Promise<any> => {
        return fetchAPI<any>('/geo-analysis/modules')
    },

    /**
     * Get competitor-specific analysis data
     */
    getCompetitorAnalysis: async (brandId: string, competitorId: string): Promise<any> => {
        return fetchAPI<any>(`/geo-analysis/brands/${brandId}/competitors/${competitorId}/analysis`)
    },
}
