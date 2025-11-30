'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Bot, CheckCircle, XCircle, ShieldCheck, Activity, Globe, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { useTranslations } from '@/lib/i18n'
import { brandsService, type Brand } from '@/lib/services/brands'
import { analysisService, type Analysis } from '@/lib/services/analysis'
import { technicalAeoService, type TechnicalAEO } from '@/lib/services/technical-aeo'

export default function CrawlersPage() {
  const params = useParams<{ id: string }>()
  const brandId = params?.id
  const { t } = useTranslations()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [technicalAeo, setTechnicalAeo] = useState<TechnicalAEO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!brandId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const [brandResponse, analyses, technicalAeoData] = await Promise.all([
          brandsService.getById(brandId),
          analysisService.getAll(brandId),
          technicalAeoService.getLatestByBrandId(brandId)
        ])
        setBrand(brandResponse)
        setTechnicalAeo(technicalAeoData)

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

  const crawlerPermissions = useMemo(() => {
    if (!technicalAeo?.ai_crawler_permissions?.crawlers) {
      return []
    }
    return Object.entries(technicalAeo.ai_crawler_permissions.crawlers).map(([name, status]) => {
      // Map backend status to user-friendly display
      const statusStr = status as string
      let displayStatus: string
      let statusType: 'allowed' | 'blocked' | 'unknown'

      if (statusStr === 'allowed' || statusStr === 'Allowed') {
        displayStatus = 'Allowed'
        statusType = 'allowed'
      } else if (statusStr === 'disallowed' || statusStr === 'Disallowed' || statusStr === 'blocked' || statusStr === 'Blocked') {
        displayStatus = 'Blocked'
        statusType = 'blocked'
      } else if (statusStr === 'not_specified') {
        // not_specified means no explicit rule - defaults to allowed
        displayStatus = 'No Rule (Allowed)'
        statusType = 'allowed'
      } else {
        displayStatus = 'Unknown'
        statusType = 'unknown'
      }

      return {
        name,
        status: displayStatus,
        statusType,
        icon: '🤖'
      }
    })
  }, [technicalAeo])

  const stats = useMemo(() => {
    if (crawlerPermissions.length === 0) {
      return { total: 0, allowed: 0, blocked: 0, score: 0 }
    }
    const allowed = crawlerPermissions.filter(c => c.statusType === 'allowed').length
    const blocked = crawlerPermissions.filter(c => c.statusType === 'blocked').length
    return {
      total: crawlerPermissions.length,
      allowed,
      blocked,
      score: technicalAeo?.aeo_readiness_score || 0
    }
  }, [crawlerPermissions, technicalAeo])

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
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Allowed</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.allowed}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-black">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Blocked</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.blocked}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-black">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">AEO Readiness</p>
                      <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{Math.round(stats.score)}/100</p>
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
                      {t.robotsTxtStatus}
                    </h3>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {technicalAeo?.ai_crawler_permissions?.summary || t.analyzingCrawlPermissions}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      Sobre estos datos
                    </h3>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Esta información se basa en el análisis de tu archivo robots.txt. Muestra qué bots de IA tienen <strong>permiso</strong> para rastrear tu sitio, no datos reales de visitas. "No Rule (Allowed)" significa que no hay regla específica, por lo que el crawler puede acceder por defecto.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-black">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                  {t.aiCrawlerPermissions}
                </h2>
                {crawlerPermissions.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-10">
                    {analysis?.status === 'processing'
                      ? t.verifyingRobotsPermissions
                      : t.noPermissionsDataFound}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {crawlerPermissions.map((crawler, idx) => (
                      <div
                        key={`${crawler.name}-${idx}`}
                        className="p-4 border border-gray-200 dark:border-[#2A2A30] rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{crawler.icon}</div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{crawler.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">AI Bot</p>
                          </div>
                        </div>
                        <Badge
                          variant={crawler.statusType === 'blocked' ? 'destructive' : 'default'}
                          className={crawler.statusType === 'allowed' ? 'bg-green-600 hover:bg-green-700' : crawler.statusType === 'unknown' ? 'bg-gray-500' : ''}
                        >
                          {crawler.status}
                        </Badge>
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