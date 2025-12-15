/**
 * Prompt Tracking Service - Frontend API client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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

export interface CreatePromptRequest {
    prompt_text: string
    category?: string
    check_frequency?: 'hourly' | 'daily' | 'weekly'
}

export interface UpdatePromptRequest {
    prompt_text?: string
    category?: string
    is_active?: boolean
    check_frequency?: 'hourly' | 'daily' | 'weekly'
}

export const promptTrackingService = {
    /**
     * Get all tracked prompts for a brand
     */
    async getAll(brandId: string, activeOnly: boolean = true): Promise<TrackedPrompt[]> {
        const response = await fetch(
            `${API_URL}/api/prompts/${brandId}?active_only=${activeOnly}`,
            { credentials: 'include' }
        )

        if (!response.ok) {
            throw new Error('Failed to fetch prompts')
        }

        const data = await response.json()
        return data.prompts || []
    },

    /**
     * Create a new tracked prompt
     */
    async create(brandId: string, request: CreatePromptRequest): Promise<TrackedPrompt> {
        const response = await fetch(`${API_URL}/api/prompts/${brandId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(request)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Failed to create prompt')
        }

        const data = await response.json()
        return data.prompt
    },

    /**
     * Update a tracked prompt
     */
    async update(promptId: string, request: UpdatePromptRequest): Promise<TrackedPrompt> {
        const response = await fetch(`${API_URL}/api/prompts/${promptId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(request)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Failed to update prompt')
        }

        const data = await response.json()
        return data.prompt
    },

    /**
     * Delete a tracked prompt
     */
    async delete(promptId: string): Promise<void> {
        const response = await fetch(`${API_URL}/api/prompts/${promptId}`, {
            method: 'DELETE',
            credentials: 'include'
        })

        if (!response.ok) {
            throw new Error('Failed to delete prompt')
        }
    },

    /**
     * Check a single prompt across AI models
     */
    async check(
        promptId: string,
        brandName: string,
        competitors?: string[],
        models?: string[]
    ): Promise<PromptCheckResult> {
        const response = await fetch(`${API_URL}/api/prompts/${promptId}/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                brand_name: brandName,
                competitors: competitors || [],
                models: models
            })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Check failed')
        }

        return await response.json()
    },

    /**
     * Get historical check results for a prompt
     */
    async getHistory(promptId: string, limit: number = 50): Promise<PromptHistoryItem[]> {
        const response = await fetch(
            `${API_URL}/api/prompts/${promptId}/history?limit=${limit}`,
            { credentials: 'include' }
        )

        if (!response.ok) {
            throw new Error('Failed to fetch history')
        }

        const data = await response.json()
        return data.history || []
    },

    /**
     * Check all active prompts for a brand
     */
    async checkAll(
        brandId: string,
        brandName: string,
        competitors?: string[]
    ): Promise<{
        total_prompts: number
        checked: number
        average_visibility: number
        results: PromptCheckResult[]
        checked_at: string
    }> {
        const response = await fetch(`${API_URL}/api/prompts/${brandId}/check-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                brand_name: brandName,
                competitors: competitors || []
            })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Check all failed')
        }

        return await response.json()
    }
}
