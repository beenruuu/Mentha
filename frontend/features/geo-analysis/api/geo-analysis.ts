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

    /**
     * Get enhanced GEO/AEO data (SSoV, Entity Gaps, RAG Simulation, Hallucination metrics)
     */
    getEnhancedGEO: async (brandId: string): Promise<EnhancedGEOData | null> => {
        try {
            return await fetchAPI<EnhancedGEOData>(`/geo-analysis/brands/${brandId}/enhanced-geo`)
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null
            }
            console.log('Enhanced GEO data not available yet')
            return null
        }
    },
}

// Enhanced GEO Types
export interface EnhancedGEOData {
    ssov: SSoVData | null
    ssov_score: number
    entity_gaps: EntityGapsData | null
    high_priority_gaps: number
    rag_simulation: RAGSimulationData | null
    retrieval_readiness: number
    hallucination_analysis: HallucinationMetricsData | null
    hallucination_risk: 'low' | 'medium' | 'high' | 'critical' | 'unknown'
    entity_resolution: EntityResolutionData | null
    knowledge_graph_grounded: boolean
    voice_profile: VoiceProfileData | null
    voice_dimensions: VoiceDimensionsData | null
    geo_readiness_score: number
    recommendations: Array<{
        source: string
        priority: string
        category: string
        recommendation: string
        entity?: string
    }>
    // Legacy field for backwards compatibility
    hallucination_metrics?: HallucinationMetricsData | null
}

export interface EntityResolutionData {
    brand_name: string
    brand_domain: string
    is_known_entity: boolean
    ambiguity_level: string
    recommended_same_as: string[]
    disambiguation_needed: boolean
}

export interface VoiceDimensionsData {
    formality: number
    technical_depth: number
    complexity: number
    vocabulary_level: number
    sentiment: number
}

export interface VoiceProfileData {
    content_id: string
    content_title: string
    word_count: number
    sentence_count: number
    scores: {
        formality: number
        technical: number
        sentiment: number
        complexity: number
        vocabulary: number
    }
}

export interface SSoVData {
    overall_ssov: number
    model_breakdown: Record<string, {
        ssov: number
        mentions: number
        sentiment: number
        prominence: number
    }>
    competitor_comparison: Record<string, number>
    trend: number
}

export interface EntityGapsData {
    gaps: Array<{
        entity: string
        entity_type: string
        priority: 'critical' | 'high' | 'medium' | 'low'
        competitors_using: string[]
        suggested_context: string
    }>
    coverage_score: number
    entity_diversity: number
}

export interface RAGSimulationData {
    chunks_analyzed: number
    avg_retrieval_score: number
    top_performing_sections: string[]
    weak_sections: string[]
    recommendations: string[]
}

export interface HallucinationMetricsData {
    faithfulness: number
    answer_relevancy: number
    context_precision: number
    context_recall: number
    overall_score: number
}
