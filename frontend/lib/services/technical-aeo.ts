import { fetchAPI } from '@/lib/api-client';

export interface TechnicalAEO {
    id: string;
    user_id: string;
    brand_id: string;
    domain: string;
    aeo_readiness_score: number;
    voice_readiness_score?: number;
    ai_crawler_permissions: {
        crawlers: Record<string, string>;
        summary?: string;
    };
    structured_data?: {
        total_schemas: number;
        schema_types: string[];
        has_faq: boolean;
        has_howto: boolean;
        has_article: boolean;
        details?: any;
    };
    schema_types?: string[];
    total_schemas?: number;
    has_faq?: boolean;
    has_howto?: boolean;
    has_article?: boolean;
    technical_signals?: {
        https: boolean;
        mobile_viewport: boolean;
        rss_feed: boolean;
        api_available: boolean;
        response_time_ms: number;
    };
    has_rss?: boolean;
    has_api?: boolean;
    mobile_responsive?: boolean;
    https_enabled?: boolean;
    response_time_ms?: number;
    recommendations: Array<{
        title: string;
        description: string;
        priority: 'critical' | 'high' | 'medium' | 'low';
        category: string;
    }>;
    last_audit?: string;
    created_at: string;
}

export const technicalAeoService = {
    getByBrandId: async (brandId: string) => {
        return fetchAPI<TechnicalAEO[]>(`/technical-aeo/?brand_id=${brandId}`);
    },

    getLatestByBrandId: async (brandId: string): Promise<TechnicalAEO | null> => {
        try {
            const results = await fetchAPI<TechnicalAEO[]>(`/technical-aeo/?brand_id=${brandId}`);
            if (results && results.length > 0) {
                // Sort by created_at desc and return the most recent
                return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch technical AEO data:', error);
            return null;
        }
    }
};
