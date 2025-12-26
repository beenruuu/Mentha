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
import { fetchAPI } from '@/lib/api-client'
import { brandsService, type Brand } from '@/lib/services/brands'
import { competitorsService, type Competitor } from '@/lib/services/competitors'
import { geoAnalysisService } from '@/lib/services/geo-analysis'
import { insightsService } from '@/lib/services/insights'
import { getTranslations, getLanguage, type Language } from '@/lib/i18n'
import { Loader2, Download, Play, RefreshCw, Plus, ChevronDown } from 'lucide-react'
import { AnalysisProgressToast } from '@/components/shared/AnalysisProgressToast'
import { BrandPageSkeleton } from '@/components/skeletons'

export default function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: brandId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [lang, setLang] = useState<Language>('es')
  const t = getTranslations(lang)

  // Get active tab from URL - if none, redirect to dashboard
  const activeTab = searchParams.get('tab')

  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // Used to trigger data refresh

  // Data states
  const [brand, setBrand] = useState<Brand | null>(null)
  const [visibility, setVisibility] = useState<any>(null)
  const [insights, setInsights] = useState<any[]>([])
  const [citations, setCitations] = useState<any[]>([])
  const [hallucinations, setHallucinations] = useState<any[]>([])
  const [sentiment, setSentiment] = useState<any>(null)
  const [prompts, setPrompts] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [technicalAeo, setTechnicalAeo] = useState<any>(null)
  const [brands, setBrands] = useState<Brand[]>([])

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
    loadBrandData()
    // Load all brands for dropdown
    brandsService.getAll().then(setBrands).catch(console.error)
  }, [brandId, refreshKey]) // Add refreshKey to dependencies

  const loadBrandData = async () => {
    try {
      // Only show loading spinner on initial load, not refreshes
      if (refreshKey === 0) {
        setLoading(true)
      }

      // Load brand info - fetchAPI automatically handles demo mode via isDemoModeActive()
      const brandData = await brandsService.getById(brandId)

      // If brand doesn't exist, redirect to onboarding
      if (!brandData) {
        router.push('/onboarding')
        return
      }

      setBrand(brandData)

      // Load all data in parallel for better performance
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

      // Process competitors - map visibility_score to score for CompetitorsTab
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

        // Calculate overall score from latest_scores
        if (visData.latest_scores && visData.latest_scores.length > 0) {
          const scores = visData.latest_scores.map(s => s.visibility_score)
          const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

          // Build models object
          const models: Record<string, any> = {}
          visData.latest_scores.forEach(s => {
            models[s.ai_model] = {
              score: s.visibility_score,
              mentions: s.mention_count,
              sentiment: s.sentiment || 'neutral'
            }
          })

          setVisibility({
            overall_score: avgScore,
            trend: 0, // Would need historical comparison
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
          // Extract recommendations from technical AEO
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

      // Process latest GEO analysis for more recommendations
      if (latestAnalysisResult.status === 'fulfilled' && latestAnalysisResult.value) {
        const geoData = latestAnalysisResult.value
        if (geoData.recommendations) {
          setRecommendations(prev => [...geoData.recommendations, ...prev])
        }

        // Extract sentiment from analysis if available
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

      // Load prompts/queries if available
      try {
        const queriesData = await fetchAPI<any[]>('/queries')
        const brandQueries = queriesData?.filter((q: any) => q.brand_id === brandId) || []
        setPrompts(brandQueries.map((q: any) => ({
          query: q.prompt_text,
          model: Object.keys(q.results || {})[0] || 'Unknown',
          mentioned: Object.values(q.results || {}).some((r: any) => r.mentioned)
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
      // Trigger analysis - this runs in background
      await fetchAPI<any>(`/analysis/trigger/${brandId}`, {
        method: 'POST'
      })

      // The AnalysisProgressToast will automatically detect the running analysis
      // and show progress. Data will refresh when complete.

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
      default:
        // No valid tab - redirect to dashboard
        router.push('/dashboard')
        return null
    }
  }, [activeTab, brand, analyzing, visibility, insights, citations, hallucinations, sentiment, prompts, recommendations, competitors])

  if (loading) {
    return <BrandPageSkeleton />
  }

  if (!brand) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium">Marca no encontrada</p>
            <p className="text-muted-foreground">La marca solicitada no existe</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

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
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 hover:border-primary/50 transition-colors text-sm font-medium">
                <div className="w-6 h-6 rounded bg-gray-100 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=32`}
                    alt=""
                    className="w-4 h-4 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-gray-900 dark:text-white">{brand.name}</span>
                  <span className="text-xs text-muted-foreground">{brand.domain}</span>
                </div>
                {brands.length > 1 && <ChevronDown className="w-4 h-4 text-muted-foreground ml-2" />}
              </button>
              {brands.length > 1 && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-zinc-900 border border-border/50 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => router.push(`/brand/${b.id}${activeTab !== 'overview' ? `?tab=${activeTab}` : ''}`)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors first:rounded-t-lg last:rounded-b-lg ${b.id === brandId ? 'bg-primary/5 text-primary' : ''}`}
                    >
                      <div className="w-6 h-6 rounded bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=32`}
                          alt=""
                          className="w-4 h-4 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium truncate">{b.name}</span>
                        <span className="text-xs text-muted-foreground">{b.domain}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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

        {/* Analysis Progress Toast - Fixed in bottom-right corner */}
        <AnalysisProgressToast
          brandId={brandId}
          onComplete={handleAnalysisComplete}
          onDataAvailable={handleDataRefresh}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}

