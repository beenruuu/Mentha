import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'
import { DEMO_BRAND_ID, DEMO_BRAND_NAME, DEMO_BRAND_DOMAIN } from '@/lib/demo/constants'

// Types for initial data
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
    business_scope?: 'local' | 'regional' | 'national' | 'international'
    city?: string
    location?: string
}

export interface Competitor {
    id: string
    brand_id: string
    name: string
    domain: string
    logo?: string
    source: string
    visibility_score?: number
    metrics_breakdown?: Record<string, number>
    tracked?: boolean
    updated_at?: string
    created_at: string
}

export interface ServerDashboardData {
    brands: Brand[]
    initialBrand: Brand | null
    initialCompetitors: Competitor[]
    isDemo: boolean
}

async function getDashboardData(): Promise<ServerDashboardData> {
    // Check for demo mode via cookie
    const cookieStore = await cookies()
    const isDemoMode = cookieStore.get('mentha_demo_mode')?.value === 'true'

    if (isDemoMode) {
        // Return demo data with competitors
        const { DEMO_BRAND, DEMO_COMPETITORS } = await import('@/lib/demo/constants')
        return {
            brands: [DEMO_BRAND as Brand],
            initialBrand: DEMO_BRAND as Brand,
            initialCompetitors: DEMO_COMPETITORS as Competitor[],
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
        // Fetch brands
        const brandsRes = await fetch(`${API_URL}/brands/`, {
            headers,
            cache: 'no-store',
        })

        if (!brandsRes.ok) {
            console.error('Failed to fetch brands:', brandsRes.status)
            return { brands: [], initialBrand: null, initialCompetitors: [], isDemo: false }
        }

        const brands: Brand[] = await brandsRes.json()

        if (brands.length === 0) {
            redirect('/onboarding')
        }

        const initialBrand = brands[0]

        // Fetch competitors for initial brand
        let initialCompetitors: Competitor[] = []
        try {
            const compsRes = await fetch(`${API_URL}/competitors/?brand_id=${initialBrand.id}`, {
                headers,
                cache: 'no-store',
            })
            if (compsRes.ok) {
                initialCompetitors = await compsRes.json()
            }
        } catch (e) {
            console.error('Failed to fetch competitors:', e)
        }

        return {
            brands,
            initialBrand,
            initialCompetitors,
            isDemo: false,
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error)
        return { brands: [], initialBrand: null, initialCompetitors: [], isDemo: false }
    }
}

/**
 * Dashboard Page - Server Component
 * 
 * This is the new paradigm: data is fetched on the server and passed to the client.
 * The client component handles all interactivity (state changes, chart updates, etc.)
 * 
 * Benefits:
 * - Faster initial load (no loading spinner for initial data)
 * - Better SEO (HTML is pre-rendered)
 * - Reduced client-side JavaScript
 */
export default async function DashboardPage() {
    const { brands, initialBrand, initialCompetitors } = await getDashboardData()

    // If no brands and we didn't redirect, show empty state
    if (!initialBrand) {
        redirect('/onboarding')
    }

    return (
        <DashboardClient
            initialBrands={brands}
            initialBrand={initialBrand}
            initialCompetitors={initialCompetitors}
        />
    )
}
