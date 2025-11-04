'use client'

import { Search, Clock, TrendingUp, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { PageHeader } from "@/components/page-header"
import { useTranslations } from '@/lib/i18n'
import Link from "next/link"

export default function SearchPage() {
  const { t } = useTranslations()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          icon={<Search className="h-5 w-5 text-emerald-600" />}
          title={t.searchTitle}
        />

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">{t.searchTitle}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">{t.searchDescription}</p>
          </div>

          <div className="max-w-2xl mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder={t.searchBrands}
                className="pl-12 pr-4 py-6 text-base bg-white dark:bg-black border-gray-300 dark:border-[#2A2A30]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">{t.recentSearches}</h2>
              </div>
              <div className="space-y-3">
                {[
                  { text: t.airbnbPerformance, time: t.hoursAgo2 },
                  { text: t.stravaComparison, time: t.hoursAgo5 },
                  { text: t.vercelRanking, time: t.yesterday },
                  { text: t.revolutMentions, time: t.daysAgo.replace('{n}', '2') },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.time}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">{t.popularSearches}</h2>
              </div>
              <div className="space-y-3">
                {[
                  { text: t.bestBrandsAI, count: t.hoursAgo234 },
                  { text: t.modelRanking, count: t.hoursAgo189 },
                  { text: t.competitorComparison, count: t.hoursAgo156 },
                  { text: t.mentionTrends, count: t.hoursAgo142 },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.count}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-white dark:bg-black">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">{t.quickAccess}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Airbnb", icon: "A", iconBg: "bg-[#FF5A5F]", queries: `12 ${t.queriesLowercase}` },
                { name: "Strava", icon: "S", iconBg: "bg-[#FC4C02]", queries: `8 ${t.queriesLowercase}` },
                { name: "Vercel", icon: "▲", iconBg: "bg-black", queries: `15 ${t.queriesLowercase}` },
                { name: "Revolut", icon: "R", iconBg: "bg-white border border-gray-300", queries: `6 ${t.queriesLowercase}` },
              ].map((brand) => (
                <Link key={brand.name} href={`/brand/${brand.name.toLowerCase()}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-black">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 ${brand.iconBg} rounded-full flex items-center justify-center`}>
                        <span
                          className={`text-sm font-bold ${brand.iconBg.includes("border") ? "text-black dark:text-white" : "text-white"}`}
                        >
                          {brand.icon}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{brand.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{brand.queries}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}





