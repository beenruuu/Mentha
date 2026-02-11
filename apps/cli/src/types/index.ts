export interface Project {
    id: string;
    name: string;
    domain: string;
    competitors: string[];
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface Keyword {
    id: string;
    project_id: string;
    query: string;
    intent: 'informational' | 'transactional' | 'navigational' | 'commercial';
    scan_frequency: 'daily' | 'weekly' | 'manual';
    engines: ProviderType[];
    created_at: string;
}

export interface ScanResult {
    id: string;
    brand_visibility: boolean;
    sentiment_score: number;
    recommendation_type: 'direct_recommendation' | 'neutral_comparison' | 'negative_mention' | 'absent';
    raw_response: string;
    analysis_json: Record<string, unknown>;
    created_at: string;
    scan_jobs?: {
        engine: string;
        keywords: {
            project_id: string;
            query: string;
        };
    };
}

export interface Citation {
    position: number;
    url: string;
    domain: string;
    title?: string;
    snippet?: string;
}

export interface SearchResult {
    content: string;
    citations: Citation[];
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    latencyMs: number;
}

export interface SearchOptions {
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
    systemPrompt?: string;
    geo?: {
        country?: string;
        location?: string;
    };
}

export type ProviderType = 'perplexity' | 'openai' | 'gemini' | 'claude';

export interface Entity {
    id: string;
    name: string;
    type: string;
    description?: string;
    created_at: string;
}

export interface Claim {
    id: string;
    entity_id: string;
    claim_text: string;
    source_url?: string;
    created_at: string;
}

export interface ShareOfModelMetrics {
    project_id: string;
    visibility_rate: number;
    total_scans: number;
    visible_scans: number;
    period: string;
}

export interface SentimentTrend {
    date: string;
    average_sentiment: number;
    scan_count: number;
}

export interface TopCitation {
    domain: string;
    citation_count: number;
    urls: string[];
}

export interface ApiResponse<T> {
    data: T;
    pagination?: {
        total: number;
        page: number;
        limit: number;
    };
}

export interface ApiError {
    error: string;
    message?: string;
    details?: Record<string, unknown>;
}
