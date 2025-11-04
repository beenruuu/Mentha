'use client'

import { Info, ArrowUp, LayoutDashboard } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { PageHeader } from '@/components/page-header'
import { useTranslations } from '@/lib/i18n'

export default function DashboardPage() {
  const { t } = useTranslations()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          icon={<LayoutDashboard className="h-5 w-5 text-emerald-600" />}
          title={t.dashboard}
        />

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          <h1 className="text-3xl font-semibold text-[#0A0A0A] dark:text-white mb-8">{t.rankingMovements}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Brand Overview */}
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.brandOverview}</h2>
                <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="space-y-4">
                {[
                  { name: "Vercel", icon: "▲", iconBg: "bg-black", score: 75, change: 3.0 },
                  { name: "Strava", icon: "S", iconBg: "bg-[#FC4C02]", score: 72, change: 0.4 },
                  { name: "Airbnb", icon: "A", iconBg: "bg-[#FF5A5F]", score: 71, change: 6.6 },
                  { name: "Revolut", icon: "R", iconBg: "bg-white border border-gray-300", score: 69, change: 4.6 },
                ].map((brand) => (
                  <div key={brand.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 ${brand.iconBg} rounded-full flex items-center justify-center`}>
                        <span
                          className={`text-xs font-bold ${brand.iconBg === "bg-white border border-gray-300" ? "text-black" : "text-white"}`}
                        >
                          {brand.icon}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-[#0A0A0A] dark:text-white">{brand.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center relative shrink-0">
                        <span className="text-xs font-semibold text-[#0A0A0A] dark:text-white z-10">{brand.score}</span>
                        <svg
                          viewBox="0 0 40 40"
                          preserveAspectRatio="xMidYMid meet"
                          className="absolute inset-0 w-10 h-10 -rotate-90"
                          style={{ transformOrigin: "50% 50%" }}
                        >
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="3"
                            className="dark:stroke-[#0A0A0F]"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeDasharray={`${(brand.score / 100) * 100.53} 100.53`}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUp className="w-3 h-3" />
                        <span className="text-sm font-semibold">{brand.change}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Competitor Overview */}
            <Card id="competitors-overview" className="p-6 bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] shadow-sm">
              <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">{t.competitorOverview}</h2>
              <div className="flex items-center gap-2 mb-6">
                {[
                  { name: "Airbnb", color: "bg-[#FF5A5F]" },
                  { name: "Strava", color: "bg-[#FC4C02]" },
                  { name: "Vercel", color: "bg-black" },
                  { name: "Revolut", color: "bg-white border border-gray-300" },
                ].map((brand) => (
                  <div key={brand.name} className="flex items-center gap-1.5">
                    <div className={`w-4 h-4 ${brand.color} rounded-full`}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{brand.name}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-5">
                {[
                  { name: "Airbnb", icon: "A", iconBg: "bg-[#FF5A5F]", percentage: 71, position: 1.8 },
                  { name: "Booking.com", icon: "B", iconBg: "bg-[#003580]", percentage: 57, position: 2.4 },
                  { name: "Expedia", icon: "E", iconBg: "bg-[#FFCB05]", percentage: 54, position: 3.4 },
                  { name: "Trivago", icon: "T", iconBg: "bg-[#007FAD]", percentage: 51, position: 4.4 },
                ].map((competitor) => (
                  <div key={competitor.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 ${competitor.iconBg} rounded flex items-center justify-center`}>
                          <span className="text-[10px] font-bold text-white">{competitor.icon}</span>
                        </div>
                        <span className="text-sm font-medium text-[#0A0A0A] dark:text-white">{competitor.name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{competitor.percentage}%</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t.averagePositionShort} {competitor.position}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-[#0A0A0F] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${competitor.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Mentha quick view removed to avoid duplication */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Notable Changes */}
            <Card className="lg:col-span-2 p-6 bg-white dark:bg-black">
              <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">{t.notableChanges}</h2>
              <div className="space-y-3">
                {[
                  {
                    text: t.rankingImproved,
                    brand: "Strava",
                    brandIcon: "S",
                    brandBg: "bg-[#FC4C02]",
                    context: "in",
                    model: "Claude-4-sonnet",
                    modelIcon: "✨",
                    modelBg: "bg-orange-100",
                    query: "fitness queries",
                  },
                  {
                    text: t.newMention,
                    brand: "Airbnb",
                    brandIcon: "A",
                    brandBg: "bg-[#FF5A5F]",
                    context: "in",
                    model: "GPT-5",
                    modelIcon: "⚫",
                    modelBg: "bg-gray-100",
                    query: "travel recommendations",
                  },
                  {
                    text: t.performanceImprovement,
                    brand: "Vercel",
                    brandIcon: "▲",
                    brandBg: "bg-black",
                    context: "in",
                    model: "Grok-3",
                    modelIcon: "⚡",
                    modelBg: "bg-gray-100",
                    query: "development tools queries",
                  },
                  {
                    text: "Revolut",
                    brand: "Revolut",
                    brandIcon: "R",
                    brandBg: "bg-white border border-gray-300",
                    context: t.visibilityIncreased,
                    model: "Gemini-2.5-flash",
                    modelIcon: "✦",
                    modelBg: "bg-blue-100",
                    query: "fintech comparisons",
                  },
                ].map((change, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 flex-wrap">
                    <span>{change.text}</span>
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-[#0A0A0F] dark:border dark:border-[#2A2A30] hover:bg-gray-100 dark:hover:bg-[#0A0A0A]"
                    >
                      <div className={`w-3.5 h-3.5 ${change.brandBg} rounded-full flex items-center justify-center`}>
                        <span
                          className={`text-[8px] font-bold ${change.brandBg.includes("bg-white") ? "text-black" : "text-white"}`}
                        >
                          {change.brandIcon}
                        </span>
                      </div>
                      <span className="font-medium">{change.brand}</span>
                    </Badge>
                    <span>{change.context}</span>
                    <Badge
                      variant="secondary"
                      className={`flex items-center gap-1.5 px-2 py-0.5 ${change.modelBg} dark:bg-black dark:border dark:border-[#2A2A30] hover:${change.modelBg} dark:hover:bg-[#0A0A0A]`}
                    >
                      <span>{change.modelIcon}</span>
                      <span className="font-medium text-[#0A0A0A] dark:text-white">{change.model}</span>
                    </Badge>
                    <span className="text-gray-500 dark:text-gray-400">{change.query}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Promotional Card */}
            <Card className="p-6 bg-gradient-to-br from-pink-300 to-pink-400 border-0 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-[#0A0A0A] mb-6 leading-tight">
                  {t.invisibleInAI}
                </h3>
                <Button className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black">{t.trackBrand}</Button>
              </div>
              <div className="absolute right-4 bottom-4 w-32 h-32">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  {/* Person climbing ladder */}
                  <g stroke="black" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {/* Ladder */}
                    <line x1="70" y1="90" x2="85" y2="40" />
                    <line x1="80" y1="90" x2="95" y2="40" />
                    <line x1="72" y1="80" x2="82" y2="80" />
                    <line x1="74" y1="70" x2="84" y2="70" />
                    <line x1="76" y1="60" x2="86" y2="60" />
                    <line x1="78" y1="50" x2="88" y2="50" />

                    {/* Person */}
                    <circle cx="82" cy="55" r="6" fill="white" />
                    <line x1="82" y1="61" x2="82" y2="75" />
                    <line x1="82" y1="65" x2="75" y2="70" />
                    <line x1="82" y1="65" x2="88" y2="58" />
                    <line x1="82" y1="75" x2="77" y2="85" />
                    <line x1="82" y1="75" x2="87" y2="85" />
                  </g>

                  {/* Star */}
                  <g transform="translate(95, 25)">
                    <path
                      d="M 0,-8 L 2,-2 L 8,-2 L 3,2 L 5,8 L 0,4 L -5,8 L -3,2 L -8,-2 L -2,-2 Z"
                      fill="none"
                      stroke="black"
                      strokeWidth="2"
                    />
                  </g>

                  {/* Sparkles */}
                  <text x="105" y="20" fontSize="12">
                    +
                  </text>
                  <text x="110" y="35" fontSize="10">
                    ✦
                  </text>
                </svg>
              </div>
            </Card>
          </div>

          {/* Data Table */}
          <Card className="p-6 bg-white dark:bg-black">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#2A2A30]">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {t.brand}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {t.averagePosition}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {t.inclusionRate}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {t.bestModel}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "Airbnb",
                      icon: "A",
                      iconBg: "bg-[#FF5A5F]",
                      position: "1.8",
                      rate: 89,
                      model: "gpt-5",
                      modelIcon: "⚫",
                    },
                    {
                      name: "Strava",
                      icon: "S",
                      iconBg: "bg-[#FC4C02]",
                      position: "1.8",
                      rate: 89,
                      model: "claude-4-sonnet",
                      modelIcon: "✨",
                    },
                    {
                      name: "Vercel",
                      icon: "▲",
                      iconBg: "bg-black",
                      position: "1.8",
                      rate: 89,
                      model: "grok-3",
                      modelIcon: "⚡",
                    },
                  ].map((row) => (
                    <tr key={row.name} className="border-b border-gray-100 dark:border-[#1E1E24] hover:bg-gray-50 dark:hover:bg-[#0A0A0A]">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 ${row.iconBg} rounded-full flex items-center justify-center`}>
                            <span className="text-xs font-bold text-white">{row.icon}</span>
                          </div>
                          <span className="text-sm font-medium text-[#0A0A0A] dark:text-white">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{row.position}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center relative shrink-0">
                            <span className="text-xs font-semibold text-[#0A0A0A] dark:text-white z-10">{row.rate}</span>
                            <svg
                              viewBox="0 0 40 40"
                              preserveAspectRatio="xMidYMid meet"
                              className="absolute inset-0 w-10 h-10 -rotate-90"
                              style={{ transformOrigin: "50% 50%" }}
                            >
                              <circle
                                cx="20"
                                cy="20"
                                r="16"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="3"
                                className="dark:stroke-[#0A0A0F]"
                              />
                              <circle
                                cx="20"
                                cy="20"
                                r="16"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                                strokeDasharray={`${(row.rate / 100) * 100.53} 100.53`}
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-[#0A0A0F] dark:border dark:border-[#2A2A30] hover:bg-gray-100 dark:hover:bg-[#1E1E24] w-fit"
                        >
                          <span>{row.modelIcon}</span>
                          <span className="font-medium text-sm">{row.model}</span>
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}





