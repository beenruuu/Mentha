/**
 * Prompt Tracking Service - Frontend API client
 * 
 * Refactored to use centralized fetchAPI for consistency with other services.
 */

import { fetchAPI } from '@/lib/api-client'
import type { 
    TrackedPrompt, 
    PromptCheckResult, 
    PromptHistoryItem 
} from '@/lib/types'

// Re-export types for backward compatibility
export type { TrackedPrompt, PromptCheckResult, PromptHistoryItem }

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
        const data = await fetchAPI<{ prompts: TrackedPrompt[] }>(
            `/prompts/${brandId}?active_only=${activeOnly}`
        )
        return data.prompts || []
    },

    /**
     * Create a new tracked prompt
     */
    async create(brandId: string, request: CreatePromptRequest): Promise<TrackedPrompt> {
        const data = await fetchAPI<{ prompt: TrackedPrompt }>(`/prompts/${brandId}`, {
            method: 'POST',
            body: JSON.stringify(request)
        })
        return data.prompt
    },

    /**
     * Update a tracked prompt
     */
    async update(promptId: string, request: UpdatePromptRequest): Promise<TrackedPrompt> {
        const data = await fetchAPI<{ prompt: TrackedPrompt }>(`/prompts/${promptId}`, {
            method: 'PUT',
            body: JSON.stringify(request)
        })
        return data.prompt
    },

    /**
     * Delete a tracked prompt
     */
    async delete(promptId: string): Promise<void> {
        await fetchAPI<void>(`/prompts/${promptId}`, {
            method: 'DELETE'
        })
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
        return fetchAPI<PromptCheckResult>(`/prompts/${promptId}/check`, {
            method: 'POST',
            body: JSON.stringify({
                brand_name: brandName,
                competitors: competitors || [],
                models: models
            })
        })
    },

    /**
     * Get historical check results for a prompt
     */
    async getHistory(promptId: string, limit: number = 50): Promise<PromptHistoryItem[]> {
        const data = await fetchAPI<{ history: PromptHistoryItem[] }>(
            `/prompts/${promptId}/history?limit=${limit}`
        )
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
        return fetchAPI(`/prompts/${brandId}/check-all`, {
            method: 'POST',
            body: JSON.stringify({
                brand_name: brandName,
                competitors: competitors || []
            })
        })
    }
}
