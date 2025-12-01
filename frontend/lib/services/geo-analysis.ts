import { fetchAPI } from '@/lib/api-client'

export interface GEOAnalysisRequest {
    brand_name: string
    domain: string
    industry?: string
    competitors?: string[]
    topics?: string[]
    run_full_analysis?: boolean
    modules?: string[]
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
    modules: {
        ai_visibility?: AIVisibilityModule
        citations?: CitationsModule
        search_simulator?: any
        content_structure?: any
        knowledge_graph?: any
        eeat?: any
    }
    summary: string | any
    recommendations: Recommendation[]
    error?: string
}

export interface AIVisibilityModule {
    overall_score: number
    mention_count: number
    models: {
        [key: string]: {
            visibility_score: number
            mention_count: number
            sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed'
            contexts?: string[]
        }
    }
}

export interface CitationsModule {
    citation_score: number
    citations: Citation[]
    total_citations: number
}

export interface Citation {
    model: string
    query: string
    context?: string
    url?: string
    type?: 'direct' | 'indirect' | 'partial' | 'attribution'
}

export interface Recommendation {
    priority: 'critical' | 'high' | 'medium' | 'low'
    category: string
    title: string
    description?: string
}

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
    metadata: any
}

export interface LatestVisibilityScores {
    history: VisibilitySnapshot[]
    latest_scores: VisibilitySnapshot[]
}

export interface CitationData {
    citations: Citation[]
    citation_rates: CitationRate[]
}

export interface CitationRate {
    brand_id: string
    ai_model: string
    total_citations: number
    direct_citations: number
    latest_citation: string
}

export interface TechnicalAEO {
    id: string
    brand_id: string
    domain: string
    ai_crawler_permissions: {
        [key: string]: boolean
    }
    schema_types: string[]
    total_schemas: number
    has_faq: boolean
    has_howto: boolean
    has_article: boolean
    has_rss: boolean
    has_api: boolean
    mobile_responsive: boolean
    https_enabled: boolean
    response_time_ms: number
    aeo_readiness_score: number
    voice_readiness_score: number
    recommendations: string[]
    last_audit: string
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
}
