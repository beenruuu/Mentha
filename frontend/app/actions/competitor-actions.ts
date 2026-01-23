'use server'

import { revalidatePath } from 'next/cache'
import { serverFetchAPI, requireAuth } from '@/lib/server-api-client'
import type { Competitor } from '@/lib/types'

// Re-export type for backward compatibility
export type { Competitor }

/**
 * Get competitors for a brand
 */
export async function getCompetitors(brandId: string): Promise<Competitor[]> {
    await requireAuth()
    return serverFetchAPI<Competitor[]>(`/competitors/?brand_id=${brandId}`)
}

/**
 * Add a competitor to a brand
 */
export async function addCompetitor(data: {
    brand_id: string
    name: string
    domain: string
    source?: string
}): Promise<Competitor> {
    await requireAuth()
    const competitor = await serverFetchAPI<Competitor>('/competitors/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
    revalidatePath(`/brand/${data.brand_id}`)
    return competitor
}

/**
 * Delete a competitor
 */
export async function deleteCompetitor(competitorId: string, brandId: string): Promise<void> {
    await requireAuth()
    await serverFetchAPI(`/competitors/${competitorId}`, {
        method: 'DELETE',
    })
    revalidatePath(`/brand/${brandId}`)
}

/**
 * Discover competitors for a brand using AI
 */
export async function discoverCompetitors(brandId: string): Promise<Competitor[]> {
    await requireAuth()
    const competitors = await serverFetchAPI<Competitor[]>(`/competitors/discover/${brandId}`, {
        method: 'POST',
    })
    revalidatePath(`/brand/${brandId}`)
    return competitors
}
