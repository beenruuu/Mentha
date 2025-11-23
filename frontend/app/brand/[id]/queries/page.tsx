'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, MessageSquare, Calendar, Copy, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { PageHeader } from '@/components/page-header'
import { useTranslations } from '@/lib/i18n'
import { brandsService, Brand } from '@/lib/services/brands'
import { analysisService, Analysis } from '@/lib/services/analysis'
import { queriesService, Query } from '@/lib/services/queries'

export default function QueriesPage() {
  const params = useParams<{ id: string }>()
  const brandId = params?.id
  const { t } = useTranslations()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [queries, setQueries] = useState<Query[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!brandId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const [brandResponse, analyses, queriesData] = await Promise.all([
          brandsService.getById(brandId),
          analysisService.getAll(brandId),
          queriesService.getAll(brandId)
        ])
        setBrand(brandResponse)
        setQueries(queriesData)

        const latestAnalysis = [...analyses]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        setAnalysis(latestAnalysis ?? null)
      } catch (error) {
        console.error('Failed to load query insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [brandId])

  const queryInsights = queries

  const stats = useMemo(() => {
    if (queryInsights.length === 0) {
      return { total: 0, highPriority: 0, categories: 0, weekly: 0 }
    }
    const categories = new Set(queryInsights.map((q) => q.category))
    return {
      total: queryInsights.length,
      highPriority: queryInsights.filter((q) => q.priority === 'high').length,
      categories: categories.size,
      weekly: queryInsights.filter((q) => q.frequency === 'weekly').length,
    }
  }, [queryInsights])

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy query', error)
    }
  }

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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader icon={<MessageSquare className="h-5 w-5 text-emerald-600" />} title={t.queries} />
        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/brand/${brandId}`}>{renderBrandBadge()}</Link>
              <span className="text-gray-400 dark:text-gray-600">/</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t.queries}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t.queryBuilder}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {analysis?.status === 'completed' || queries.length > 0
                    ? t.createStrategicQueries
                    : 'El análisis está en progreso. Te avisaremos cuando existan sugerencias.'}
                </p>
              </div>
              <Button className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                <Plus className="w-4 h-4 mr-2" />
                {t.newQuery}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 bg-white dark:bg-black">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.totalQueries}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                </Card>
                <Card className="p-4 bg-white dark:bg-black">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.activeQueries}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.highPriority}</p>
                </Card>
                <Card className="p-4 bg-white dark:bg-black">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.categories}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.categories}</p>
                </Card>
                <Card className="p-4 bg-white dark:bg-black">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.weekly || 'Weekly cadence'}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.weekly}</p>
                </Card>
              </div>

              <Card className="p-6 bg-white dark:bg-black">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t.allQueries}
                  </h2>
                  <span className="text-xs text-gray-400">
                    {analysis?.completed_at
                      ? `${t.lastExecution || 'Última actualización'}: ${new Date(analysis.completed_at).toLocaleString()}`
                      : t.analysisPending || 'Analizando...'}
                  </span>
                </div>

                {queryInsights.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-10">
                    {analysis?.status === 'processing'
                      ? 'Estamos generando tus consultas estratégicas. Vuelve en un momento.'
                      : 'Aún no hay sugerencias de consultas para esta marca.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {queryInsights.map((query, idx) => (
                      <div
                        key={`${query.title}-${idx}`}
                        className="p-4 border border-gray-200 dark:border-[#2A2A30] rounded-lg bg-white dark:bg-black"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                              {query.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{query.question}</p>
                            <div className="flex items-center gap-2 flex-wrap mt-3">
                              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                                {query.category}
                              </Badge>
                              <Badge
                                className={`text-xs ${query.priority === 'high'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                    : 'bg-gray-100 dark:bg-[#0A0A0F] text-gray-700 dark:text-gray-300'
                                  }`}
                              >
                                {query.priority}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {query.frequency}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleCopy(query.question)}>
                            <Copy className="w-3 h-3 mr-2" />
                            {t.useTemplate}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}