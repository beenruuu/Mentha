import { fetchAPI } from '@/lib/api-client'

export interface Insight {
    type: string
    icon: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    data?: Record<string, any>
}

export interface InsightsData {
    brand_id: string
    generated_at: string
    insights: Insight[]
    error?: string
}

export const insightsService = {
    /**
     * Get dynamic insights for a brand
     */
    async getInsights(brandId: string, days: number = 30): Promise<InsightsData> {
        return fetchAPI<InsightsData>(`/insights/${brandId}?days=${days}`)
    }
}
