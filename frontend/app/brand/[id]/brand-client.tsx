'use client'

import { use, useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { UserAvatarMenu } from '@/components/layout/user-avatar-menu'
import {
    VisibilityTab,
    OptimizeTab,
    CompetitorsTab
} from '@/components/brand'
import { BrandSwitcher } from "@/components/shared/BrandSwitcher"
import { PromptsChat } from '@/components/prompts/PromptsChat'
import { fetchAPI } from '@/lib/api-client'
import { brandsService, type Brand } from '@/lib/services/brands'
import { competitorsService, type Competitor } from '@/lib/services/competitors'
import { geoAnalysisService } from '@/lib/services/geo-analysis'
import { insightsService } from '@/lib/services/insights'
import { getTranslations, getLanguage, type Language } from '@/lib/i18n'
import { Loader2, Download, Play, RefreshCw, Plus, ChevronDown } from 'lucide-react'
import { AnalysisProgressToast } from '@/components/shared/AnalysisProgressToast'

// Props received from Server Component
interface BrandClientProps {
    brandId: string
    initialBrand: Brand
    initialBrands: Brand[]
    initialCompetitors: Competitor[]
    initialVisibility: any
    initialInsights: any[]
    initialCitations: any[]
    initialRecommendations: any[]
    initialTechnicalAeo: any
    initialSentiment: any
}

/**
 * BrandClient - Client Component for Brand Page
 * 
 * Receives initial data from server - no loading spinner on first render.
 * Handles interactivity: tab switching, analysis triggering, data refresh.
 */
export function BrandClient({
    brandId,
    initialBrand,
    initialBrands,
    initialCompetitors,
    initialVisibility,
    initialInsights,
    initialCitations,
    initialRecommendations,
    initialTechnicalAeo,
    initialSentiment
}: BrandClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [lang, setLang] = useState<Language>('es')
    const t = getTranslations(lang)

    // Get active tab from URL - if none, default to visibility
    const activeTab = searchParams.get('tab') || 'visibility'

    // No loading on initial render - we have data!
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [analysisTrigger, setAnalysisTrigger] = useState<number | null>(null)

    // Initialize state with server data
    const [brand, setBrand] = useState<Brand>(initialBrand)
    const [visibility, setVisibility] = useState<any>(initialVisibility)
    const [insights, setInsights] = useState<any[]>(initialInsights)
    const [citations, setCitations] = useState<any[]>(initialCitations)
    const [hallucinations, setHallucinations] = useState<any[]>([])
    const [sentiment, setSentiment] = useState<any>(initialSentiment)
    const [prompts, setPrompts] = useState<any[]>([])
    const [recommendations, setRecommendations] = useState<any[]>(initialRecommendations)
    const [competitors, setCompetitors] = useState<Competitor[]>(initialCompetitors)
    const [technicalAeo, setTechnicalAeo] = useState<any>(initialTechnicalAeo)
    const [brands, setBrands] = useState<Brand[]>(initialBrands)

    // Callback to refresh data when analysis completes
    const handleAnalysisComplete = useCallback(() => {
        toast.success('¡Análisis completado! Actualizando datos...')
        setRefreshKey(prev => prev + 1)
    }, [])

    // Callback for manual data refresh
    const handleDataRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1)
    }, [])

    useEffect(() => {
        setLang(getLanguage())
    }, [])

    // Reload data when refreshKey changes (after analysis or manual refresh)
    useEffect(() => {
        if (refreshKey > 0) {
            loadBrandData()
        }
    }, [refreshKey])

    const loadBrandData = async () => {
        try {
            setLoading(true)

            // Load all data in parallel
            const [
                insightsResult,
                competitorsResult,
                visibilityResult,
                citationsResult,
                technicalAeoResult,
                latestAnalysisResult
            ] = await Promise.allSettled([
                insightsService.getInsights(brandId),
                competitorsService.getAll(brandId),
                geoAnalysisService.getVisibilityData(brandId),
                geoAnalysisService.getCitations(brandId),
                geoAnalysisService.getTechnicalAEO(brandId),
                geoAnalysisService.getLatestAnalysis(brandId)
            ])

            // Process insights
            if (insightsResult.status === 'fulfilled' && insightsResult.value) {
                setInsights(insightsResult.value.insights || [])
            }

            // Process competitors
            if (competitorsResult.status === 'fulfilled') {
                const comps = competitorsResult.value || []
                setCompetitors(comps.map(c => ({
                    ...c,
                    score: c.visibility_score || 0
                })))
            }

            // Process visibility data
            if (visibilityResult.status === 'fulfilled' && visibilityResult.value) {
                const visData = visibilityResult.value
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

                    setVisibility({
                        overall_score: avgScore,
                        trend: 0,
                        last_updated: visData.latest_scores[0]?.measured_at || new Date().toISOString(),
                        models
                    })
                }
            }

            // Process citations
            if (citationsResult.status === 'fulfilled' && citationsResult.value) {
                const citData = citationsResult.value
                setCitations(citData.citations || [])
            }

            // Process technical AEO
            if (technicalAeoResult.status === 'fulfilled' && technicalAeoResult.value) {
                const aeoData = technicalAeoResult.value
                if (aeoData && aeoData.length > 0) {
                    setTechnicalAeo(aeoData[0])
                    if (aeoData[0].recommendations) {
                        const aeoRecs = aeoData[0].recommendations.map((rec: string, i: number) => ({
                            title: rec,
                            description: '',
                            priority: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
                            category: 'technical'
                        }))
                        setRecommendations(prev => [...prev, ...aeoRecs])
                    }
                }
            }

            // Process latest GEO analysis
            if (latestAnalysisResult.status === 'fulfilled' && latestAnalysisResult.value) {
                const geoData = latestAnalysisResult.value
                if (geoData.recommendations) {
                    setRecommendations(prev => [...geoData.recommendations, ...prev])
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
                        setSentiment({
                            positive: Math.round((sentimentCounts.positive / total) * 100),
                            neutral: Math.round((sentimentCounts.neutral / total) * 100),
                            negative: Math.round((sentimentCounts.negative / total) * 100)
                        })
                    }
                }
            }

            // Load prompts
            try {
                const promptsData = await fetchAPI<{ prompts: any[] }>(`/prompts/${brandId}`)
                const brandQueries = promptsData?.prompts || []
                setPrompts(brandQueries.map((q: any) => ({
                    query: q.prompt_text,
                    model: Object.keys(q.results || {})[0] || 'Unknown',
                    mentioned: Object.values(q.results || {}).some((r: any) => r?.mentioned)
                })))
            } catch (e) {
                console.log('No queries available')
            }

        } catch (error) {
            console.error('Error loading brand:', error)
            toast.error('Error al cargar la marca')
        } finally {
            setLoading(false)
        }
    }

    const handleRunAnalysis = async () => {
        if (!brand) return

        setAnalyzing(true)
        toast.info('Iniciando análisis... El progreso aparecerá abajo.')

        try {
            await fetchAPI<any>(`/analysis/trigger/${brandId}`, {
                method: 'POST'
            })
            setAnalysisTrigger(Date.now())
        } catch (error) {
            console.error('Analysis error:', error)
            toast.error('Error al iniciar el análisis')
        } finally {
            setAnalyzing(false)
        }
    }

    const handleExport = () => {
        toast.info('Exportando datos...')
    }

    const handleAddCompetitor = () => {
        router.push(`/brand/${brandId}?tab=competitors`)
    }

    // Handle invalid tab redirection
    useEffect(() => {
        if (brand && activeTab && !['overview', 'visibility', 'optimize', 'competitors', 'prompts'].includes(activeTab)) {
            router.push('/dashboard')
        }
    }, [activeTab, brand, router])

    // Render content based on active tab
    const renderContent = useMemo(() => {
        if (!brand) return null

        switch (activeTab) {
            case 'visibility':
                return (
                    <VisibilityTab
                        brandId={brandId}
                        brandName={brand.name}
                        citations={citations}
                        hallucinations={hallucinations}
                        sentiment={sentiment}
                        prompts={prompts}
                    />
                )
            case 'optimize':
                return (
                    <OptimizeTab
                        brandId={brandId}
                        brandName={brand.name}
                        domain={brand.domain}
                        industry={brand.industry}
                        recommendations={recommendations}
                    />
                )
            case 'competitors':
                return (
                    <CompetitorsTab
                        brandId={brandId}
                        brandName={brand.name}
                        brandScore={visibility?.overall_score ?? 0}
                        brandTrend={visibility?.trend ?? 0}
                        competitors={competitors}
                    />
                )
            case 'prompts':
                return (
                    <PromptsChat brandId={brandId} brandName={brand.name} brandDomain={brand.domain} />
                )
            default:
                return null
        }
    }, [activeTab, brand, analyzing, visibility, insights, citations, hallucinations, sentiment, prompts, recommendations, competitors])

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                {/* Header with Actions */}
                <header className="flex items-center justify-between px-6 py-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-1" />

                        {/* Brand Dropdown */}
                        <div className="relative group">
                            <BrandSwitcher
                                brands={brands}
                                selectedBrand={brand}
                                activeTab={activeTab || undefined}
                            />
                        </div>
                    </div>

                    {/* Action Buttons - Context-aware */}
                    <div className="flex items-center gap-3">
                        {activeTab === 'overview' && (
                            <>
                                <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                                    <Download className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t.export}</span>
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleRunAnalysis}
                                    disabled={analyzing}
                                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {analyzing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Play className="h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">{analyzing ? t.analyzingBrand : t.new_analysis}</span>
                                </Button>
                            </>
                        )}
                        {activeTab === 'visibility' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRunAnalysis}
                                disabled={analyzing}
                                className="gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">{t.refresh}</span>
                            </Button>
                        )}
                        {activeTab === 'competitors' && (
                            <Button
                                size="sm"
                                onClick={handleAddCompetitor}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">{t.add_competitor}</span>
                            </Button>
                        )}
                        <UserAvatarMenu />
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-y-auto shadow-2xl p-6">
                    {renderContent}
                </main>

                {/* Analysis Progress Toast */}
                <AnalysisProgressToast
                    brandId={brandId}
                    onComplete={handleAnalysisComplete}
                    onDataAvailable={handleDataRefresh}
                    analysisTrigger={analysisTrigger}
                />
            </SidebarInset>
        </SidebarProvider>
    )
}
