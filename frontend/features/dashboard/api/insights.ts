import { fetchAPI } from '@/lib/api-client'
import type { Insight, InsightsData } from '@/lib/types'

// Re-export types for backward compatibility
export type { Insight, InsightsData }

export const insightsService = {
    /**
     * Get dynamic insights for a brand
     */
    async getInsights(brandId: string, days: number = 30): Promise<InsightsData> {
        return fetchAPI<InsightsData>(`/insights/${brandId}?days=${days}`)
    }
}
