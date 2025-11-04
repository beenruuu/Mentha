'use client'

import { Activity, Bot, Globe, TrendingUp, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { PageHeader } from '@/components/page-header'
import Link from "next/link"
import { useTranslations } from '@/lib/i18n'
import { use } from 'react'

const brandData: Record<string, any> = {
  airbnb: { name: "Airbnb", icon: "A", iconBg: "bg-[#FF5A5F]" },
  strava: { name: "Strava", icon: "S", iconBg: "bg-[#FC4C02]" },
  vercel: { name: "Vercel", icon: "▲", iconBg: "bg-black" },
  revolut: { name: "Revolut", icon: "R", iconBg: "bg-white border border-gray-300" },
}

export default function CrawlersPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslations()
  const { id } = use(params)
  const brand = brandData[id]

  if (!brand) {
    return <div>{t.brandNotFound}</div>
  }

  const crawlers = [
    {
      name: "GPTBot",
      model: "OpenAI (GPT-5)",
      icon: "⚫",
      lastVisit: t.hoursAgo2,
      lastVisitDate: "15 Oct 2025, 14:23",
      frequency: t.daily,
      pagesVisited: 47,
      topPages: ["/", "/about", "/features", "/pricing", "/blog"],
      status: t.active,
      statusColor: "bg-green-500",
      avgTime: "3.2 min",
    },
    {
      name: "ClaudeBot",
      model: "Anthropic (Claude-4)",
      icon: "✨",
      lastVisit: t.hoursAgo5,
      lastVisitDate: "15 Oct 2025, 11:45",
      frequency: t.daily,
      pagesVisited: 38,
      topPages: ["/", "/docs", "/api", "/use-cases"],
      status: t.active,
      statusColor: "bg-green-500",
      avgTime: "2.8 min",
    },
    {
      name: "Google-Extended",
      model: "Google (Gemini-2.5)",
      icon: "✦",
      lastVisit: t.daysAgo1,
      lastVisitDate: "14 Oct 2025, 09:15",
      frequency: t.everyDays.replace('{n}', '2'),
      pagesVisited: 52,
      topPages: ["/", "/blog", "/resources", "/case-studies", "/about"],
      status: t.active,
      statusColor: "bg-green-500",
      avgTime: "4.1 min",
    },
    {
      name: "PerplexityBot",
      model: "Perplexity AI",
      icon: "◆",
      lastVisit: t.hoursAgo.replace('{n}', '3'),
      lastVisitDate: "15 Oct 2025, 13:00",
      frequency: t.daily,
      pagesVisited: 31,
      topPages: ["/", "/pricing", "/features"],
      status: t.active,
      statusColor: "bg-green-500",
      avgTime: "2.1 min",
    },
    {
      name: "Amazonbot",
      model: "Amazon (Alexa AI)",
      icon: "⚡",
      lastVisit: t.daysAgo.replace('{n}', '7'),
      lastVisitDate: "8 Oct 2025, 16:30",
      frequency: t.weekly,
      pagesVisited: 12,
      topPages: ["/", "/contact"],
      status: t.infrequent,
      statusColor: "bg-yellow-500",
      avgTime: "1.2 min",
    },
    {
      name: "Bingbot-AI",
      model: "Microsoft (Copilot)",
      icon: "🔷",
      lastVisit: t.daysAgo2,
      lastVisitDate: t.oct13Date,
      frequency: t.every3Days,
      pagesVisited: 28,
      topPages: ["/", "/features", "/blog"],
      status: t.active,
      statusColor: "bg-green-500",
      avgTime: "2.5 min",
    },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          icon={<Bot className="h-5 w-5 text-emerald-600" />}
          title={t.aiCrawlers}
        />
        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/brand/${id}`}>
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-[#0A0A0F] hover:bg-gray-200 dark:hover:bg-[#0A0A0A] cursor-pointer"
                >
                  <div className={`w-3.5 h-3.5 ${brand.iconBg} rounded-full flex items-center justify-center`}>
                    <span
                      className={`text-[8px] font-bold ${brand.iconBg.includes("border") ? "text-black dark:text-white" : "text-white"}`}
                    >
                      {brand.icon}
                    </span>
                  </div>
                  <span className="font-medium">{brand.name}</span>
                </Badge>
              </Link>
              <span className="text-gray-400 dark:text-gray-600">/</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t.aiCrawlers}</span>
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">{t.aiCrawlersMonitor}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t.trackBotsVisiting}
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-white dark:bg-black">
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-black dark:text-white" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.activeCrawlers}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">5</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white dark:bg-black">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-black dark:text-white" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.visitsToday}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">23</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white dark:bg-black">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-black dark:text-white" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.pagesIndexedShort}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">208</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white dark:bg-black">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-black dark:text-white" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.weeklyTrend}</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">+18%</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Insight Card */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 dark:bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {t.gptBotVisited}
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  {t.gptBotInsight}
                </p>
              </div>
            </div>
          </Card>

          {/* Crawlers Table */}
          <Card className="p-6 bg-white dark:bg-black">
            <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              {t.crawlerActivity}
            </h2>
            <div className="space-y-4">
              {crawlers.map((crawler, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-gray-200 dark:border-[#2A2A30] rounded-lg hover:bg-gray-50 dark:hover:bg-[#0A0A0F] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{crawler.icon}</div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{crawler.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{crawler.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 ${crawler.statusColor} rounded-full`}></div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{crawler.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.lastVisit}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{crawler.lastVisit}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{crawler.lastVisitDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.frequency}</p>
                      <Badge variant="secondary" className="bg-gray-100 dark:bg-[#1E1E24]">
                        <Calendar className="w-3 h-3 mr-1 text-gray-600 dark:text-gray-400" />
                        {crawler.frequency}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.pagesVisited}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{crawler.pagesVisited} {t.pages}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.avgCrawlTime}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{crawler.avgTime}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t.topPages}:</p>
                    <div className="flex flex-wrap gap-2">
                      {crawler.topPages.map((page, i) => (
                        <Badge key={i} variant="secondary" className="bg-gray-100 dark:bg-[#0A0A0F] text-xs">
                          {page}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-6 bg-white dark:bg-black mt-6">
            <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              {t.activityTimeline}
            </h2>
            <div className="space-y-3">
              {[
                { time: "14:23", bot: "GPTBot", icon: "⚫", action: t.indexedPages.replace('{n}', '3'), pages: ["/blog/post-123"] },
                { time: "13:00", bot: "PerplexityBot", icon: "◆", action: t.visitedHomepage, pages: ["/"] },
                { time: "11:45", bot: "ClaudeBot", icon: "✨", action: t.scannedDocumentation, pages: ["/docs"] },
                { time: "09:30", bot: "Google-Extended", icon: "✦", action: t.deepCrawling, pages: ["/blog", "/resources"] },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-[#0A0A0F] rounded-lg">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono w-12">{activity.time}</span>
                  <span className="text-lg">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.bot}</span> {activity.action}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activity.pages.map((page, i) => (
                        <Badge key={i} variant="secondary" className="bg-gray-200 dark:bg-[#1E1E24] text-xs">
                          {page}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}