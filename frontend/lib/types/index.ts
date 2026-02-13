/**
 * Centralized TypeScript types for the Mentha frontend
 * 
 * This module exports all shared types used across the application.
 * Import from '@/lib/types' instead of defining types locally.
 */

// ============ BRAND TYPES ============

export interface Brand {
    id: string
    name: string
    domain: string
    logo_url?: string
    logo?: string  // Alias for compatibility
    industry?: string
    category?: string
    description?: string
    user_id?: string
    ai_providers?: string[]
    services?: string[]
    created_at: string
    updated_at?: string
    // Geographic scope fields
    business_scope?: 'local' | 'regional' | 'national' | 'international'
    city?: string
    location?: string
}

export interface CreateBrandData {
    name: string
    domain: string
    industry?: string
    description?: string
    ai_providers?: string[]
    services?: string[]
    discovery_prompts?: string[]
    business_scope?: 'local' | 'regional' | 'national' | 'international'
    city?: string
    location?: string
}

export interface BrandWithAnalysis extends Brand {
    latest_analysis?: {
        id: string
        overall_score: number
        grade: string
        created_at: string
    }
}

// ============ COMPETITOR TYPES ============

export interface Competitor {
    id: string
    name: string
    domain: string
    brand_id?: string
    logo?: string
    favicon?: string
    similarity_score?: number
    visibility_score?: number
    score?: number  // Alias for visibility_score
    tracked?: boolean
    source?: 'onboarding' | 'discovered' | 'manual' | string
    confidence?: 'high' | 'medium' | 'low'
    metrics_breakdown?: Record<string, number>
    trend?: 'up' | 'down' | 'stable'
    created_at: string
    updated_at?: string
}

export interface CreateCompetitorData {
    name: string
    domain: string
    brand_id?: string
    similarity_score?: number
    tracked?: boolean
    source?: string
}

// ============ ANALYSIS TYPES ============

export interface Analysis {
    id: string
    brand_id?: string
    analysis_type: string
    input_data: Record<string, any>
    results?: Record<string, any>
    score?: number
    status: 'pending' | 'processing' | 'completed' | 'failed'
    ai_model?: string
    error_message?: string
    created_at: string
    completed_at?: string
    avg_position?: number
    inclusion_rate?: number
}

export interface CreateAnalysisData {
    brand_id?: string
    analysis_type: string
    input_data: {
        domain?: string
        content?: string
        [key: string]: any
    }
    ai_model?: string
}

// ============ NOTIFICATION TYPES ============

export interface Notification {
    id: string
    brand_id?: string
    title: string
    message: string
    type: 'system' | 'analysis_complete' | 'alert' | 'info'
    status: 'unread' | 'read'
    metadata?: Record<string, any>
    created_at: string
    read_at?: string
}

// ============ VISIBILITY TYPES ============

export interface VisibilitySnapshot {
    id: string
    brand_id: string
    ai_model: 'openai' | 'anthropic' | 'perplexity' | 'gemini' | string
    visibility_score: number
    mention_count: number
    sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed' | string
    measured_at: string
    query_count: number
    inclusion_rate?: number
    average_position?: number
    metadata: Record<string, any>
}

export interface LatestVisibilityScores {
    history: VisibilitySnapshot[]
    latest_scores: VisibilitySnapshot[]
}

// ============ GEO ANALYSIS TYPES ============

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
    id?: string
    model: string
    query: string
    context?: string
    url?: string
    source?: string
    type?: 'direct' | 'indirect' | 'partial' | 'attribution'
    created_at?: string
}

export interface CitationRate {
    brand_id: string
    ai_model: string
    total_citations: number
    direct_citations: number
    latest_citation: string
}

export interface CitationData {
    citations: Citation[]
    citation_rates: CitationRate[]
}

export interface Recommendation {
    priority: 'critical' | 'high' | 'medium' | 'low'
    category: string
    title: string
    description?: string
    translation_key?: string
    translation_key_desc?: string
}

// ============ TECHNICAL AEO TYPES ============

export interface TechnicalAEO {
    id: string
    user_id?: string
    brand_id: string
    domain: string
    aeo_readiness_score: number
    voice_readiness_score: number
    ai_crawler_permissions: {
        crawlers: Record<string, 'allowed' | 'blocked'>
        summary: string
    }
    structured_data?: {
        total_schemas: number
        schema_types: string[]
        has_faq: boolean
        has_howto: boolean
        has_article: boolean
        details: Record<string, any>
    }
    schema_types: string[]
    total_schemas: number
    has_faq: boolean
    has_howto: boolean
    has_article: boolean
    technical_signals?: {
        https: boolean
        mobile_viewport: boolean
        rss_feed: boolean
        api_available: boolean
        response_time_ms: number
    }
    has_rss: boolean
    has_api: boolean
    mobile_responsive: boolean
    https_enabled: boolean
    response_time_ms: number
    recommendations: Recommendation[]
    last_audit: string
    created_at?: string
}

// ============ PROMPT TRACKING TYPES ============

export interface TrackedPrompt {
    id: string
    brand_id: string
    prompt_text: string
    category?: string
    is_active: boolean
    check_frequency: 'hourly' | 'daily' | 'weekly'
    last_checked_at?: string
    created_at: string
    updated_at: string
}

export interface PromptCheckResult {
    success: boolean
    prompt_id: string
    prompt_text: string
    visibility_rate: number
    models_checked: number
    brand_mentioned_count: number
    results: ModelCheckResult[]
    checked_at: string
    error?: string
}

export interface ModelCheckResult {
    model: string
    brand_mentioned: boolean
    position?: number
    sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed'
    sentiment_score?: number
    response_snippet?: string
    competitor_mentions?: Record<string, number>
    sources?: string[]
    error?: string
}

export interface PromptHistoryItem {
    id: string
    prompt_id: string
    ai_model: string
    brand_mentioned: boolean
    position?: number
    sentiment?: string
    sentiment_score?: number
    response_snippet?: string
    checked_at: string
}

// ============ INSIGHT TYPES ============

export interface Insight {
    type: string
    icon?: string
    title: string
    description: string
    message?: string
    priority: 'high' | 'medium' | 'low' | 'info' | 'warning' | 'success'
    data?: Record<string, any>
}

export interface InsightsData {
    brand_id: string
    generated_at: string
    insights: Insight[]
    error?: string
}

// ============ USER TYPES ============

export interface User {
    id: string
    email: string
    full_name?: string
    avatar_url?: string | null
    company_name?: string
    seo_experience?: string
    created_at?: string
}

// ============ SHARE OF MODEL TYPES ============

export interface ShareOfModelData {
    brand_id: string
    brand_name: string
    brand_mentions: number
    competitor_mentions: Record<string, number>
    total_mentions: number
    share_of_voice: number
    trend: 'up' | 'down' | 'stable'
    last_updated: string
    // Legacy fields
    total_queries?: number
    share_data?: Array<{ model: string; share: number; mentions: number }>
    competitors_share?: Array<{ competitor: string; share: number }>
}

// ============ HALLUCINATION TYPES ============

export interface Hallucination {
    id: string
    brand_id: string
    claim: string
    model: string
    severity: 'high' | 'medium' | 'low'
    detected_at: string
    context?: string
    corrected: boolean
}

// ============ LANGUAGE/REGION COMPARISON ============

export interface LanguageComparisonData {
    brand_id: string
    languages: Array<{ language: string; score: number; mention_count: number }>
    primary_language: string
    generated_at: string
}

export interface RegionalComparisonData {
    brand_id: string
    regions: Array<{ region: string; score: number; mention_count: number }>
    primary_region: string
    generated_at: string
}
