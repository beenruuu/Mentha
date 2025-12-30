'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { serverFetchAPI, requireAuth } from '@/lib/server-api-client'

// Types
export interface Brand {
    id: string
    name: string
    domain: string
    logo?: string
    category?: string
    description?: string
    user_id: string
    created_at: string
    updated_at?: string
}

export interface BrandWithAnalysis extends Brand {
    latest_analysis?: {
        id: string
        overall_score: number
        grade: string
        created_at: string
    }
}

/**
 * Get all brands for the current user
 */
export async function getBrands(): Promise<Brand[]> {
    await requireAuth()
    return serverFetchAPI<Brand[]>('/brands/')
}

/**
 * Get a single brand by ID
 */
export async function getBrandById(brandId: string): Promise<Brand> {
    await requireAuth()
    return serverFetchAPI<Brand>(`/brands/${brandId}`)
}

/**
 * Create a new brand
 */
export async function createBrand(data: {
    name: string
    domain: string
    category?: string
    description?: string
}): Promise<Brand> {
    await requireAuth()
    const brand = await serverFetchAPI<Brand>('/brands/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
    revalidatePath('/dashboard')
    return brand
}

/**
 * Delete a brand
 */
export async function deleteBrand(brandId: string): Promise<void> {
    await requireAuth()
    await serverFetchAPI(`/brands/${brandId}`, {
        method: 'DELETE',
    })
    revalidatePath('/dashboard')
}

/**
 * Run analysis for a brand
 */
export async function runBrandAnalysis(brandId: string): Promise<{ id: string }> {
    await requireAuth()
    const result = await serverFetchAPI<{ id: string }>(`/brands/${brandId}/analyze`, {
        method: 'POST',
    })
    // Will revalidate when analysis completes (via polling or webhook)
    revalidateTag(`brand-${brandId}`)
    return result
}

/**
 * Get brand analysis status
 */
export async function getBrandAnalysisStatus(brandId: string): Promise<{
    status: 'idle' | 'analyzing' | 'completed' | 'failed'
    progress?: number
    message?: string
}> {
    await requireAuth()
    return serverFetchAPI(`/brands/${brandId}/analysis-status`)
}
