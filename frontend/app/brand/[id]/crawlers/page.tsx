'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Bot, CheckCircle, XCircle, ShieldCheck, Loader2, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { useTranslations } from '@/lib/i18n'
import { brandsService, type Brand } from '@/lib/services/brands'
import { analysisService, type Analysis } from '@/lib/services/analysis'
import { technicalAeoService, type TechnicalAEO } from '@/lib/services/technical-aeo'
import { CrawlActivityChart } from '@/components/crawlers/crawl-activity-chart'
import { format } from 'date-fns'

export default function CrawlersPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
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

  if (!brandId) return null

  const Content = () => (
    <div className={`bg-[#FAFAFA] dark:bg-[#09090b] h-full flex flex-col ${isEmbedded ? '' : 'h-screen overflow-hidden'}`}>
      {/* Header - Only show if NOT embedded */}
      {!isEmbedded && (
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden shadow-sm">
              {brand && (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=64`}
                  alt={brand.name}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerText = brand.name.charAt(0).toUpperCase();
                  }}
                />
              )}
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{t.aiCrawlers}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1A1A20] px-2 py-1 rounded-md">
              Last updated: {analysis ? format(new Date(analysis.created_at), 'MMM d, h:mm a') : 'Never'}
            </span>
          </div>
        </header>
      )}

      <main className={`flex-1 bg-white dark:bg-black ${isEmbedded ? 'rounded-xl border border-gray-200 dark:border-[#2A2A30]' : 'rounded-tl-3xl border-t border-l border-gray-200 dark:border-[#2A2A30]'} overflow-y-auto shadow-sm relative z-10`}>
        {loading ? (
          <div className="flex items-center justify-center w-full h-full min-h-[400px]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="p-8 max-w-7xl mx-auto space-y-8">

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-100 dark:border-blue-900/20 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Bot className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className="bg-white/50 dark:bg-black/20 text-blue-700 dark:text-blue-300">Active</Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.total}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.activeCrawlers}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border-emerald-100 dark:border-emerald-900/20 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className="bg-white/50 dark:bg-black/20 text-emerald-700 dark:text-emerald-300">Safe</Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.allowed}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Allowed Bots</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10 border-red-100 dark:border-red-900/20 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className="bg-white/50 dark:bg-black/20 text-red-700 dark:text-red-300">Blocked</Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.blocked}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Blocked Bots</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-[#161619] border-gray-200 dark:border-[#2A2A30] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl rounded-full -mr-8 -mt-8" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="border-gray-200 dark:border-gray-700">Score</Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{Math.round(stats.score)}/100</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">AEO Readiness</p>
                </CardContent>
              </Card>
            </div>

            {/* Activity Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <CrawlActivityChart />
            </div>

            {/* Permissions Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.aiCrawlerPermissions}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Detailed breakdown of AI bot access permissions.</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Configure Robots.txt
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {crawlerPermissions.map((crawler, idx) => (
                  <div
                    key={`${crawler.name}-${idx}`}
                    className="group p-4 rounded-xl bg-white dark:bg-[#161619] border border-gray-200 dark:border-[#2A2A30] hover:border-emerald-500/30 hover:shadow-md transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${crawler.statusType === 'allowed' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600' :
                        crawler.statusType === 'blocked' ? 'bg-red-50 dark:bg-red-900/10 text-red-600' :
                          'bg-gray-50 dark:bg-gray-800 text-gray-500'
                        }`}>
                        {crawler.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">{crawler.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">AI Bot</p>
                      </div>
                    </div>
                    <Badge
                      variant={crawler.statusType === 'blocked' ? 'destructive' : 'default'}
                      className={`capitalize ${crawler.statusType === 'allowed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200' :
                        crawler.statusType === 'unknown' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' : ''
                        }`}
                    >
                      {crawler.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )

  if (isEmbedded) {
    return <Content />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
        <Content />
      </SidebarInset>
    </SidebarProvider>
  )
}