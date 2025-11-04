'use client'

import { Plus, Filter, Play, Pause, Trash2, Copy, Calendar, MessageSquare } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

export default function QueriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslations()
  const { id } = use(params)
  const brand = brandData[id]

  if (!brand) {
    return <div>{t.brandNotFound}</div>
  }

  const queryTemplates = [
    { category: t.comparison, template: "¿{Marca A} vs {Marca B}: cuál es mejor?", count: 12 },
    { category: t.definition, template: "¿Qué es {Marca} y para qué sirve?", count: 8 },
    { category: t.recommendation, template: "¿Cuáles son las mejores alternativas a {Competidor}?", count: 15 },
    { category: t.tutorial, template: "¿Cómo usar {Marca} para {caso de uso}?", count: 6 },
    { category: t.topX, template: "Top 10 mejores herramientas de {categoría}", count: 10 },
    { category: t.review, template: "¿{Marca} vale la pena? Opiniones y experiencias", count: 5 },
  ]

  const queries = [
    {
      id: "vacation-rental-booking",
      query: "¿Cuáles son los sitios de reserva de alquiler vacacional más confiables con buena verificación de anfitriones?",
      category: t.recommendation,
      status: t.active,
      frequency: t.daily,
      lastRun: "Hace 2h",
      nextRun: "En 22h",
      mentions: 4,
      avgPosition: 1.8,
      models: ["GPT-5", "Claude-4", "Perplexity"],
    },
    {
      id: "vacation-vs-booking",
      query: "Airbnb vs Booking.com: ¿cuál es mejor para alquileres vacacionales?",
      category: t.comparison,
      status: t.active,
      frequency: "Cada 2 días",
      lastRun: "Hace 1d",
      nextRun: "En 1d",
      mentions: 5,
      avgPosition: 1.2,
      models: ["GPT-5", "Claude-4", "Gemini-2.5", "Grok-3", "Perplexity"],
    },
    {
      id: "how-to-host",
      query: "¿Cómo convertirse en anfitrión de alquiler vacacional?",
      category: t.tutorial,
      status: t.paused,
      frequency: t.weekly,
      lastRun: "Hace 3d",
      nextRun: "-",
      mentions: 2,
      avgPosition: 3.5,
      models: ["GPT-5", "Claude-4"],
    },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          icon={<MessageSquare className="h-5 w-5 text-emerald-600" />}
          title={t.queries}
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
              <span className="text-sm text-gray-600 dark:text-gray-400">{t.queries}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">{t.queryBuilder}</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t.createStrategicQueries}
                </p>
              </div>
              <Button className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                <Plus className="w-4 h-4 mr-2" />
                {t.newQuery}
              </Button>
            </div>
          </div>

          {/* Query Templates */}
          <Card className="p-6 bg-white dark:bg-black mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t.queryTemplates}
              </h2>
              <Badge variant="secondary" className="bg-gray-100 dark:bg-[#0A0A0F]">
                6 {t.categories}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t.generateQueriesAutomatically}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {queryTemplates.map((template, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-gray-200 dark:border-[#2A2A30] rounded-lg hover:bg-gray-50 dark:hover:bg-[#0A0A0F] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {template.category}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{template.count} {t.queriesLowercase}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{template.template}</p>
                  <Button size="sm" variant="outline" className="w-full h-7 text-xs">
                    <Copy className="w-3 h-3 mr-1 text-gray-600 dark:text-gray-400" />
                    {t.useTemplate}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-white dark:bg-black">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.totalQueries}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">56</p>
            </Card>
            <Card className="p-4 bg-white dark:bg-black">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.activeQueries}</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">42</p>
            </Card>
            <Card className="p-4 bg-white dark:bg-black">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.mentions}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">328</p>
            </Card>
            <Card className="p-4 bg-white dark:bg-black">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.avgPosition}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">2.1</p>
            </Card>
          </div>

          {/* Queries List */}
          <Card className="p-6 bg-white dark:bg-black">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t.allQueries}
              </h2>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {t.filter}
              </Button>
            </div>

            <div className="space-y-4">
              {queries.map((query, idx) => (
                <Link key={idx} href={`/brand/${id}/query/${query.id}`}>
                  <div className="p-4 border border-gray-200 dark:border-[#2A2A30] rounded-lg hover:bg-gray-50 dark:hover:bg-[#0A0A0F] cursor-pointer transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{query.query}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                            {query.category}
                          </Badge>
                          <Badge
                            className={
                              query.status === t.active
                                ? "bg-green-600 dark:bg-green-700 text-white text-xs"
                                : "bg-gray-400 dark:bg-gray-600 text-white text-xs"
                            }
                          >
                            {query.status}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                            {query.frequency}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          {query.status === t.active ? (
                            <Pause className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          ) : (
                            <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          )}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 dark:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.mentions}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{query.mentions}/5 {t.models}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.avgPos}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{query.avgPosition}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.lastExecution}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{query.lastRun}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.nextExecution}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{query.nextRun}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {query.models.map((model, i) => (
                          <Badge key={i} variant="secondary" className="bg-gray-100 dark:bg-[#0A0A0F] text-xs">
                            {model === "GPT-5" && "⚫"}
                            {model === "Claude-4" && "✨"}
                            {model === "Gemini-2.5" && "✦"}
                            {model === "Grok-3" && "⚡"}
                            {model === "Perplexity" && "◆"} {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}