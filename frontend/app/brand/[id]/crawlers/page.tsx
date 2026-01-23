'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Bot, CheckCircle, XCircle, ShieldCheck, Info, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BrandSwitcher } from "@/components/shared/BrandSwitcher"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from '@/lib/i18n'
import { brandsService, Brand } from '@/features/brand/api/brands'
import { technicalAeoService, TechnicalAEO } from '@/features/optimization/api/technical-aeo'
import { CrawlActivityChart } from '@/components/crawlers/crawl-activity-chart'

function CrawlersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border/50 shadow-sm rounded-xl">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Next.js passes params/searchParams to pages, so we need to allow extra props
export default function CrawlersPage(props: any) {
  const { isEmbedded = false } = props
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const brandId = params?.id
  const { t } = useTranslations()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [technicalAeo, setTechnicalAeo] = useState<TechnicalAEO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!brandId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const [brandResponse, technicalAeoData, brandsData] = await Promise.all([
          brandsService.getById(brandId),
          technicalAeoService.getLatestByBrandId(brandId),
          brandsService.getAll()
        ])
        setBrand(brandResponse)
        setBrands(brandsData)
        setTechnicalAeo(technicalAeoData)
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
        displayStatus = 'No Rule'
        statusType = 'allowed'
      } else {
        displayStatus = 'Unknown'
        statusType = 'unknown'
      }

      return { name, status: displayStatus, statusType }
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

  if (!brandId) return null

  const Content = () => (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.activeCrawlers}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Allowed</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.allowed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Blocked</p>
                <p className="text-2xl font-bold text-red-500">{stats.blocked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">AEO Score</p>
                <p className="text-2xl font-bold text-blue-600">{Math.round(stats.score)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      {technicalAeo?.ai_crawler_permissions?.summary && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {technicalAeo.ai_crawler_permissions.summary}
          </p>
        </div>
      )}

      {/* Crawler Permissions Grid */}
      <Card className="border-border/50 shadow-sm rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
            {t.aiCrawlerPermissions}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {crawlerPermissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{t.noPermissionsDataFound}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {crawlerPermissions.map((crawler, idx) => (
                <div
                  key={`${crawler.name}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{crawler.name}</span>
                  </div>
                  <Badge
                    variant={crawler.statusType === 'blocked' ? 'destructive' : 'default'}
                    className={crawler.statusType === 'allowed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                  >
                    {crawler.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crawl Activity Chart */}
      <CrawlActivityChart brandId={brandId} days={7} />
    </div>
  )

  if (isEmbedded) {
    if (loading) return <CrawlersSkeleton />
    return <Content />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              {brand && (
                <>
                  <BrandSwitcher
                    brands={brands}
                    selectedBrand={brand}
                    onSelect={(b) => router.push(`/brand/${b.id}/crawlers`)}
                  />
                  <span className="text-gray-400">/</span>
                </>
              )}
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                {t.aiCrawlers}
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex flex-col shadow-2xl relative z-10">
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {loading ? <CrawlersSkeleton /> : <Content />}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}