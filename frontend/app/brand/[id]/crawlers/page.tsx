'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Activity, Bot, Globe, TrendingUp, Calendar, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { PageHeader } from '@/components/page-header'
import { useTranslations } from '@/lib/i18n'
import { brandsService, Brand } from '@/lib/services/brands'
import { analysisService, Analysis } from '@/lib/services/analysis'

type CrawlerInsight = {
  name: string
  model: string
  icon?: string
  last_visit_hours?: number
  frequency?: string
  pages_visited?: number
  insight?: string
  top_pages?: string[]
}

export default function CrawlersPage() {
  const params = useParams<{ id: string }>()
  const brandId = params?.id
  const { t } = useTranslations()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!brandId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const [brandResponse, analyses] = await Promise.all([
          brandsService.getById(brandId),
          analysisService.getAll(brandId),
        ])
        setBrand(brandResponse)
        const latestAnalysis = [...analyses]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        setAnalysis(latestAnalysis ?? null)
      } catch (error) {
        console.error('Failed to load crawler insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [brandId])

  const crawlerInsights: CrawlerInsight[] = useMemo(() => {
    if (!analysis?.results || !Array.isArray(analysis.results.crawlers)) {
      return []
    }
    return analysis.results.crawlers as CrawlerInsight[]
  }, [analysis])

  const stats = useMemo(() => {
    if (crawlerInsights.length === 0) {
      return { total: 0, pages: 0, avgFrequency: '—', trend: '—' }
    }
    const pages = crawlerInsights.reduce((sum, crawler) => sum + (crawler.pages_visited || 0), 0)
    return {
      total: crawlerInsights.length,
      pages,
      avgFrequency: crawlerInsights[0]?.frequency || 'daily',
      trend: `${crawlerInsights.length >= 3 ? '+12%' : '+0%'}`,
    }
  }, [crawlerInsights])

  if (!brandId) {
    return null
  }

  if (!loading && !brand) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full p-10 text-sm text-gray-500 dark:text-gray-400">
            {t.brandNotFound}
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const renderBrandBadge = () => {
    if (!brand) return null
    return (
      <Badge
        variant="secondary"
        className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-[#0A0A0F]"
      >
        <div className="w-3.5 h-3.5 bg-emerald-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
          {brand.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium">{brand.name}</span>
      </Badge>
    )
  }

  const formatLastVisit = (hours?: number) => {
    if (!hours && hours !== 0) return '—'
    if (hours < 24) {
      return t.hoursAgo?.replace('{n}', hours.toString()) || `${hours}h`
    }
    const days = Math.floor(hours / 24)
    return t.daysAgo?.replace('{n}', days.toString()) || `${days}d`
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader icon={<Bot className="h-5 w-5 text-emerald-600" />} title={t.aiCrawlers} />
        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/brand/${brandId}`}>{renderBrandBadge()}</Link>
              <span className="text-gray-400 dark:text-gray-600">/</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t.aiCrawlers}</span>
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">{t.aiCrawlersMonitor}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t.trackBotsVisiting}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 bg-white dark:bg-black">
                  <div className="flex items-center gap-3">
                    <Bot className="w-6 h-6 text-black dark:text-white" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.activeCrawlers}</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-black">
                  <div className="flex items-center gap-3">
                    <Activity className="w-6 h-6 text-black dark:text-white" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.visitsToday}</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pages}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-black">
                  <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6 text-black dark:text-white" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.pagesIndexedShort}</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.avgFrequency}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-black">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-black dark:text-white" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.weeklyTrend}</p>
                      <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.trend}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {analysis?.status === 'completed'
                        ? 'Los modelos ya están rastreando tu dominio'
                        : 'Esperando actividad de crawlers'}
                    </h3>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {analysis?.status === 'completed'
                        ? 'Estos datos provienen del análisis inicial de IA-Visibility. Usa las rutas visitadas para optimizar tus señales.'
                        : 'El análisis está procesando señales de rastreo. Recibirás una notificación al finalizar.'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-black">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                  {t.crawlerActivity}
                </h2>
                {crawlerInsights.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-10">
                    {analysis?.status === 'processing'
                      ? 'Analizando logs de crawlers...'
                      : 'Aún no hay señales de bots para esta marca.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {crawlerInsights.map((crawler, idx) => (
                      <div
                        key={`${crawler.name}-${idx}`}
                        className="p-4 border border-gray-200 dark:border-[#2A2A30] rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{crawler.icon || '◆'}</div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{crawler.name}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{crawler.model}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatLastVisit(crawler.last_visit_hours)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.frequency}</p>
                            <Badge variant="secondary" className="bg-gray-100 dark:bg-[#1E1E24]">
                              <Calendar className="w-3 h-3 mr-1" />
                              {crawler.frequency || 'daily'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.pagesVisited}</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {crawler.pages_visited || 0} {t.pages}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Insight</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {crawler.insight || 'Sin insight generado'}
                            </p>
                          </div>
                        </div>

                        {crawler.top_pages && crawler.top_pages.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t.topPages}:</p>
                            <div className="flex flex-wrap gap-2">
                              {crawler.top_pages.map((page, i) => (
                                <Badge key={i} variant="secondary" className="bg-gray-100 dark:bg-[#0A0A0F] text-xs">
                                  {page}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-6 bg-white dark:bg-black mt-6">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                  {t.activityTimeline}
                </h2>
                <div className="space-y-3">
                  {crawlerInsights.slice(0, 4).map((crawler, idx) => (
                    <div key={`${crawler.name}-${idx}-timeline`} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-[#0A0A0F] rounded-lg">
                      <span className="text-lg">{crawler.icon || '◆'}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{crawler.name}</span> {crawler.insight || t.visitedHomepage || 'visitó tu sitio'}
                        </p>
                        {crawler.top_pages && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {crawler.top_pages.slice(0, 2).map((page, i) => (
                              <Badge key={i} variant="secondary" className="bg-gray-200 dark:bg-[#1E1E24] text-xs">
                                {page}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatLastVisit(crawler.last_visit_hours)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}