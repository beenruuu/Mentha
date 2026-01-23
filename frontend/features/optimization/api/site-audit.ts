import { fetchAPI } from '@/lib/api-client'

export interface SiteAudit {
    audit_id: string
    brand_id: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    created_at: string
    completed_at?: string
    domain: string
    pages_requested: number
    pages_analyzed: number
    pages: PageFinding[]
    findings: {
        schema_markup?: {
            found: boolean
            types: string[]
        }
        content?: {
            total_words: number
            faq_pages: number
        }
        total_issues?: number
    }
    recommendations: Recommendation[]
    error?: string
}

export interface PageFinding {
    url: string
    title?: string
    has_schema_markup: boolean
    schema_types: string[]
    has_faq_content: boolean
    heading_structure: Record<string, number>
    word_count: number
    issues: string[]
}

export interface Recommendation {
    priority: 'high' | 'medium' | 'low'
    category: string
    title: string
    description: string
    action?: string
}

export interface SiteAuditRequest {
    brand_id: string
    pages_limit?: number
}

export const siteAuditService = {
    /**
     * Start a new site audit
     */
    analyze: async (request: SiteAuditRequest): Promise<SiteAudit> => {
        return fetchAPI<SiteAudit>('/site-audit/analyze', {
            method: 'POST',
            body: JSON.stringify(request),
        })
    },

    /**
     * Get audit status and results by ID
     */
    getAudit: async (auditId: string): Promise<SiteAudit> => {
        return fetchAPI<SiteAudit>(`/site-audit/${auditId}`)
    },

    /**
     * Get the latest completed audit for a brand
     */
    getLatestAudit: async (brandId: string): Promise<SiteAudit | null> => {
        try {
            return await fetchAPI<SiteAudit>(`/site-audit/brand/${brandId}/latest`)
        } catch (error: any) {
            if (error.message?.includes('404')) {
                return null
            }
            throw error
        }
    },
}
