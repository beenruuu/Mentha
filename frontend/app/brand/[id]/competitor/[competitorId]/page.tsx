'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { UserAvatarMenu } from '@/components/layout/user-avatar-menu'
import { useTranslations } from '@/lib/i18n'
import { competitorsService, type Competitor } from '@/lib/services/competitors'
import { brandsService, type Brand } from '@/lib/services/brands'
import { geoAnalysisService } from '@/lib/services/geo-analysis'
import {
  Loader2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Globe,
  BarChart3,
  Target,
  Zap
} from 'lucide-react'

/**
 * Competitor Detail Page
 * Shows individual competitor analysis with same layout as brand panel
 */

const AI_PROVIDERS = [
  { id: 'chatgpt', name: 'ChatGPT', icon: '/providers/openai.svg', color: '#10a37f' },
  { id: 'claude', name: 'Claude', icon: '/providers/claude-color.svg', color: '#da7756' },
  { id: 'perplexity', name: 'Perplexity', icon: '/providers/perplexity-color.svg', color: '#3b82f6' },
  { id: 'gemini', name: 'Gemini', icon: '/providers/gemini-color.svg', color: '#4b5563' },
]

export default function CompetitorDetailPage({
  params
}: {
  params: Promise<{ id: string; competitorId: string }>
}) {
  const { id: brandId, competitorId } = use(params)
  const router = useRouter()
  const { t } = useTranslations()

  const [loading, setLoading] = useState(true)
  const [brand, setBrand] = useState<Brand | null>(null)
  const [competitor, setCompetitor] = useState<Competitor | null>(null)
  const [competitorAnalysis, setCompetitorAnalysis] = useState<any>(null)
  const [modelPerformance, setModelPerformance] = useState<Record<string, number>>({})

  useEffect(() => {
    loadData()
  }, [brandId, competitorId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load brand and competitor info
      const [brandData, competitors] = await Promise.all([
        brandsService.getById(brandId),
        competitorsService.getAll(brandId)
      ])

      setBrand(brandData)

      const comp = competitors.find(c => c.id === competitorId)
      if (!comp) {
        router.push(`/brand/${brandId}?tab=competitors`)
        return
      }
      setCompetitor(comp)

      // Try to load competitor-specific analysis if available
      try {
        const analysis = await geoAnalysisService.getCompetitorAnalysis(brandId, competitorId)
        setCompetitorAnalysis(analysis)

        if (analysis?.model_scores) {
          setModelPerformance(analysis.model_scores)
        }
      } catch {
        // Use competitor's basic score if no detailed analysis
        setModelPerformance({
          chatgpt: comp.score || 0,
          claude: Math.round((comp.score || 0) * 0.9),
          perplexity: Math.round((comp.score || 0) * 0.85),
          gemini: Math.round((comp.score || 0) * 0.8),
        })
      }
    } catch (error) {
      console.error('Error loading competitor:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!competitor || !brand) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium">{t.competitorNotFound || 'Competitor not found'}</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const overallScore = competitor.score || 0
  const trend: any = competitor.trend || 0

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <Link href={`/brand/${brandId}?tab=competitors`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t.back || 'Volver'}
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-border flex items-center justify-center overflow-hidden">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${competitor.domain}&sz=64`}
                  alt=""
                  className="w-6 h-6 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                  {competitor.name}
                </h1>
                <p className="text-sm text-muted-foreground">{competitor.domain}</p>
              </div>
              <Badge variant="outline" className="ml-2 text-xs">
                {t.competitor || 'Competidor'}
              </Badge>
            </div>
          </div>
          <UserAvatarMenu />
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex flex-col shadow-2xl">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Overall Score */}
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.visibilityScore || 'Visibility Score'}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{overallScore}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                        {trend !== 0 && (
                          <span className={`text-sm flex items-center gap-1 ${trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {trend > 0 ? '+' : ''}{trend}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Domain */}
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.domain || 'Dominio'}</p>
                      <p className="text-lg font-semibold">{competitor.domain}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comparison with your brand */}
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.vsYourBrand || 'vs Tu Marca'}</p>
                      <p className="text-lg font-semibold">
                        {overallScore > 50 ? t.aheadOfYou || 'Por delante' : t.behindYou || 'Por detrás'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Model Performance */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t.modelPerformance || 'Rendimiento por Modelo'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {AI_PROVIDERS.map(provider => {
                    const score = modelPerformance[provider.id] || 0
                    return (
                      <div key={provider.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <img src={provider.icon} alt={provider.name} className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{provider.name}</span>
                            <span className="text-sm text-muted-foreground">{score}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${score}%`,
                                backgroundColor: provider.color
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Analysis Details */}
            {competitorAnalysis && (
              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    {t.analysisDetails || 'Detalles del Análisis'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-muted-foreground">
                      {competitorAnalysis.summary || t.noAnalysisAvailable || 'Análisis detallado no disponible. Ejecuta un análisis para obtener más información.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
