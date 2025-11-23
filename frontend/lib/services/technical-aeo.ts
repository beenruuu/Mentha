import { fetchAPI } from '@/lib/api-client';

export interface TechnicalAEO {
    id: string;
    brand_id: string;
    analysis_id: string;
    aeo_readiness_score: number;
    ai_crawler_permissions: {
        crawlers: Record<string, string>;
        summary: string;
    };
    structured_data: {
        total_schemas: number;
        schema_types: string[];
        has_faq: boolean;
        has_howto: boolean;
        has_article: boolean;
        details: any;
    };
    technical_signals: {
        https: boolean;
        mobile_viewport: boolean;
        rss_feed: boolean;
        api_available: boolean;
        response_time_ms: number;
    };
    recommendations: Array<{
        title: string;
        description: string;
        priority: 'critical' | 'high' | 'medium' | 'low';
        category: string;
    }>;
    created_at: string;
}

export const technicalAeoService = {
    getByBrandId: async (brandId: string) => {
        // We need to implement this endpoint in backend first or use Supabase client directly
        // For now, let's assume we'll add an endpoint or query via existing analysis
        // Actually, let's use the analysis endpoint to get the latest technical AEO data
        // But wait, we don't have a direct endpoint for technical AEO yet.
        // Let's create a simple fetch wrapper that assumes we'll add the endpoint.
        return fetchAPI<TechnicalAEO[]>(`/technical-aeo/?brand_id=${brandId}`);
    },

    getLatestByBrandId: async (brandId: string) => {
        const results = await fetchAPI<TechnicalAEO[]>(`/technical-aeo/?brand_id=${brandId}`);
        if (results && results.length > 0) {
            // Sort by created_at desc
            return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        }
        return null;
    }
};
