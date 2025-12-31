import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { BrandClient } from './brand-client'
import { DEMO_BRAND_ID, DEMO_BRAND_NAME, DEMO_BRAND_DOMAIN } from '@/lib/demo/constants'

// Types
export interface Brand {
    id: string
    name: string
    domain: string
    logo?: string
    industry?: string
    category?: string
    description?: string
    user_id: string
    created_at: string
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
    score?: number
    tracked?: boolean
    updated_at?: string
    created_at: string
}

interface BrandPageData {
    brand: Brand
    brands: Brand[]
    competitors: Competitor[]
    visibility: any
    insights: any[]
    citations: any[]
    recommendations: any[]
    technicalAeo: any
    sentiment: any
    isDemo: boolean
}

async function getBrandPageData(brandId: string): Promise<BrandPageData | null> {
    // Check for demo mode via cookie
    const cookieStore = await cookies()
    const isDemoMode = cookieStore.get('mentha_demo_mode')?.value === 'true'

    if (isDemoMode) {
        // Return comprehensive demo data
        const {
            DEMO_BRAND, DEMO_COMPETITORS, DEMO_VISIBILITY,
            DEMO_CITATIONS, DEMO_RECOMMENDATIONS, DEMO_TECHNICAL_AEO,
            DEMO_SENTIMENT, DEMO_INSIGHTS
        } = await import('@/lib/demo/constants')

        // Transform visibility for demo
        let visibility = null
        if (DEMO_VISIBILITY.latest_scores && DEMO_VISIBILITY.latest_scores.length > 0) {
            const scores = DEMO_VISIBILITY.latest_scores.map((s: any) => s.visibility_score)
            const avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)

            const models: Record<string, any> = {}
            DEMO_VISIBILITY.latest_scores.forEach((s: any) => {
                models[s.ai_model] = {
                    score: s.visibility_score,
                    mentions: s.mention_count,
                    sentiment: s.sentiment || 'neutral'
                }
            })

            visibility = {
                overall_score: avgScore,
                trend: 5, // Fictional trend
                last_updated: DEMO_VISIBILITY.latest_scores[0]?.measured_at || new Date().toISOString(),
                models
            }
        }

        return {
            brand: DEMO_BRAND as Brand,
            brands: [DEMO_BRAND as Brand],
            competitors: DEMO_COMPETITORS as Competitor[],
            visibility,
            insights: DEMO_INSIGHTS,
            citations: DEMO_CITATIONS,
            recommendations: DEMO_RECOMMENDATIONS,
            technicalAeo: DEMO_TECHNICAL_AEO,
            sentiment: DEMO_SENTIMENT,
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
        // Fetch brand
        const brandRes = await fetch(`${API_URL}/brands/${brandId}`, {
            headers,
            cache: 'no-store',
        })

        if (!brandRes.ok) {
            if (brandRes.status === 404) {
                return null
            }
            console.error('Failed to fetch brand:', brandRes.status)
            return null
        }

        const brand: Brand = await brandRes.json()

        // Fetch all data in parallel
        const [
            brandsRes,
            competitorsRes,
            visibilityRes,
            citationsRes,
            technicalAeoRes,
            latestAnalysisRes,
            insightsRes
        ] = await Promise.allSettled([
            fetch(`${API_URL}/brands/`, { headers, cache: 'no-store' }),
            fetch(`${API_URL}/competitors/?brand_id=${brandId}`, { headers, cache: 'no-store' }),
            fetch(`${API_URL}/geo-analysis/brands/${brandId}/visibility?limit=30`, { headers, cache: 'no-store' }),
            fetch(`${API_URL}/geo-analysis/brands/${brandId}/citations?limit=50`, { headers, cache: 'no-store' }),
            fetch(`${API_URL}/technical-aeo/?brand_id=${brandId}`, { headers, cache: 'no-store' }),
            fetch(`${API_URL}/geo-analysis/brands/${brandId}/latest`, { headers, cache: 'no-store' }),
            fetch(`${API_URL}/insights/${brandId}`, { headers, cache: 'no-store' })
        ])

        // Process results
        let brands: Brand[] = []
        if (brandsRes.status === 'fulfilled' && brandsRes.value.ok) {
            brands = await brandsRes.value.json()
        }

        let competitors: Competitor[] = []
        if (competitorsRes.status === 'fulfilled' && competitorsRes.value.ok) {
            competitors = await competitorsRes.value.json()
            competitors = competitors.map(c => ({ ...c, score: c.visibility_score || 0 }))
        }

        let visibility: any = null
        if (visibilityRes.status === 'fulfilled' && visibilityRes.value.ok) {
            const visData = await visibilityRes.value.json()
            if (visData.latest_scores && visData.latest_scores.length > 0) {
                const scores = visData.latest_scores.map((s: any) => s.visibility_score)
                const avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)

                const models: Record<string, any> = {}
                visData.latest_scores.forEach((s: any) => {
                    models[s.ai_model] = {
                        score: s.visibility_score,
                        mentions: s.mention_count,
                        sentiment: s.sentiment || 'neutral'
                    }
                })

                visibility = {
                    overall_score: avgScore,
                    trend: 0,
                    last_updated: visData.latest_scores[0]?.measured_at || new Date().toISOString(),
                    models
                }
            }
        }

        let citations: any[] = []
        if (citationsRes.status === 'fulfilled' && citationsRes.value.ok) {
            const citData = await citationsRes.value.json()
            citations = citData.citations || []
        }

        let technicalAeo: any = null
        let recommendations: any[] = []
        if (technicalAeoRes.status === 'fulfilled' && technicalAeoRes.value.ok) {
            const aeoData = await technicalAeoRes.value.json()
            if (aeoData && aeoData.length > 0) {
                technicalAeo = aeoData[0]
                if (aeoData[0].recommendations) {
                    const aeoRecs = aeoData[0].recommendations.map((rec: string, i: number) => ({
                        title: rec,
                        description: '',
                        priority: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
                        category: 'technical'
                    }))
                    recommendations = [...recommendations, ...aeoRecs]
                }
            }
        }

        let sentiment: any = null
        if (latestAnalysisRes.status === 'fulfilled' && latestAnalysisRes.value.ok) {
            const geoData = await latestAnalysisRes.value.json()
            if (geoData.recommendations) {
                recommendations = [...geoData.recommendations, ...recommendations]
            }

            if (geoData.modules?.ai_visibility?.models) {
                const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
                Object.values(geoData.modules.ai_visibility.models).forEach((model: any) => {
                    if (model.sentiment === 'positive') sentimentCounts.positive++
                    else if (model.sentiment === 'negative') sentimentCounts.negative++
                    else sentimentCounts.neutral++
                })
                const total = Object.values(sentimentCounts).reduce((a, b) => a + b, 0)
                if (total > 0) {
                    sentiment = {
                        positive: Math.round((sentimentCounts.positive / total) * 100),
                        neutral: Math.round((sentimentCounts.neutral / total) * 100),
                        negative: Math.round((sentimentCounts.negative / total) * 100)
                    }
                }
            }
        }

        let insights: any[] = []
        if (insightsRes.status === 'fulfilled' && insightsRes.value.ok) {
            const insightsData = await insightsRes.value.json()
            insights = insightsData.insights || []
        }

        return {
            brand,
            brands,
            competitors,
            visibility,
            insights,
            citations,
            recommendations,
            technicalAeo,
            sentiment,
            isDemo: false,
        }
    } catch (error) {
        console.error('Error fetching brand page data:', error)
        return null
    }
}

/**
 * Brand Page - Server Component
 * 
 * Fetches all brand data on the server and passes to client component.
 * No loading spinner needed for initial render.
 */
export default async function BrandPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: brandId } = await params

    const data = await getBrandPageData(brandId)

    if (!data) {
        notFound()
    }

    return (
        <BrandClient
            brandId={brandId}
            initialBrand={data.brand}
            initialBrands={data.brands}
            initialCompetitors={data.competitors}
            initialVisibility={data.visibility}
            initialInsights={data.insights}
            initialCitations={data.citations}
            initialRecommendations={data.recommendations}
            initialTechnicalAeo={data.technicalAeo}
            initialSentiment={data.sentiment}
        />
    )
}
