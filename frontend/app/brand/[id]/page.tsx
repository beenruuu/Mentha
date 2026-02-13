import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { BrandClient } from '@/features/brand/components/BrandClient'
import type { Brand, Competitor } from '@/lib/types'

/**
 * Minimal server-side data fetching - only fetch the brand to validate access
 * All other data is loaded client-side for fast initial render
 */
async function getBrandData(brandId: string): Promise<{ brand: Brand; isDemo: boolean } | null> {
    // Check for demo mode via cookie
    const cookieStore = await cookies()
    const isDemoMode = cookieStore.get('mentha_demo_mode')?.value === 'true'

    if (isDemoMode) {
        const { DEMO_BRAND } = await import('@/lib/demo/constants')
        return {
            brand: DEMO_BRAND as Brand,
            isDemo: true,
        }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
    const { data: { session } } = await supabase.auth.getSession()

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
    }

    try {
        // Only fetch the brand - minimum required data for fast render
        const brandRes = await fetch(`${API_URL}/brands/${brandId}`, {
            headers,
            cache: 'no-store',
        })

        if (!brandRes.ok) {
            if (brandRes.status === 404) {
                return null
            }
            if (brandRes.status === 403) {
                redirect('/dashboard')
            }
            console.error('Failed to fetch brand:', brandRes.status)
            return null
        }

        const brand: Brand = await brandRes.json()

        return {
            brand,
            isDemo: false,
        }
    } catch (error) {
        console.error('Error fetching brand:', error)
        return null
    }
}

/**
 * Brand Page - Server Component
 * 
 * Fast initial render - only validates brand access on server.
 * All secondary data (competitors, visibility, etc.) loads client-side.
 */
export default async function BrandPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: brandId } = await params

    const data = await getBrandData(brandId)

    if (!data) {
        notFound()
    }

    return (
        <BrandClient
            brandId={brandId}
            initialBrand={data.brand}
            isDemo={data.isDemo}
        />
    )
}
