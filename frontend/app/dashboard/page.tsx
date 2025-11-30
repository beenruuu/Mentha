'use client'

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Calendar as CalendarIcon,
  Settings,
  CheckCircle2
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { useTranslations } from "@/lib/i18n"
import { brandsService, type Brand } from "@/lib/services/brands"
import { analysisService, type Analysis } from "@/lib/services/analysis"
import { competitorsService, type Competitor } from "@/lib/services/competitors"
import { MetricTab } from "@/components/dashboard/metric-tab"
import { ActionItem } from "@/components/dashboard/action-item"
import { ReasoningCard } from "@/components/dashboard/reasoning-card"

const AI_PROVIDER_META = [
  { id: 'chatgpt', name: 'ChatGPT', icon: '/providers/openai.svg' },
  { id: 'claude', name: 'Claude', icon: '/providers/claude-color.svg' },
  { id: 'perplexity', name: 'Perplexity', icon: '/providers/perplexity-color.svg' },
  { id: 'gemini', name: 'Gemini', icon: '/providers/gemini-color.svg' },
] as const

export default function DashboardPage() {
  const { t } = useTranslations()
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMetric, setActiveMetric] = useState<'rank' | 'position' | 'inclusion'>('rank')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const brandsData = await brandsService.getAll()
        setBrands(brandsData)

        if (brandsData.length > 0) {
          const brand = brandsData[0]
          setSelectedBrand(brand)

          // Fetch analysis
          const analyses = await analysisService.getAll(brand.id)

          // Process chart data from analyses history
          const processedChartData = analyses
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map(a => ({
              date: format(new Date(a.created_at), 'MM/dd'),
              rank: a.score ? Math.round(a.score) : 0,
              position: a.avg_position ? Math.round(a.avg_position) : 0,
              inclusion: a.inclusion_rate ? Math.round(a.inclusion_rate) : 0,
            }))

          setChartData(processedChartData)

          if (analyses.length > 0) {
            // Use the most recent analysis
            setAnalysis(analyses[analyses.length - 1])
          }

          // Fetch competitors
          const comps = await competitorsService.getAll(brand.id)
          setCompetitors(comps)
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-border/50 text-sm ring-1 ring-black/5 dark:ring-white/10">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="flex flex-col gap-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: entry.color, backgroundColor: entry.color }} />
                  <span className="text-muted-foreground capitalize">
                    {entry.name === 'rank' ? 'Rank Score' : entry.name === 'position' ? 'Avg. Position' : 'Inclusion Rate'}
                  </span>
                </div>
                <span className="font-mono font-medium text-foreground">{entry.value}{entry.name === 'position' ? '' : '%'}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  // Calculate current metrics
  const currentRank = analysis?.score ? Math.round(analysis.score) : 0
  const currentPosition = analysis?.avg_position ? Math.round(analysis.avg_position) : 0
  const currentInclusion = analysis?.inclusion_rate ? Math.round(analysis.inclusion_rate) : 0

  return (
    <SidebarProvider>
      <AppSidebar />
      {/* SidebarInset background matches the sidebar to create the "integrated" feel */}
      <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">

        {/* Header sits on the "sidebar" background */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{t.dashboardTitle}</h1>
            {/* Separator removed */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Live Updates</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden md:flex h-8 text-xs font-medium bg-white dark:bg-[#1E1E24] border-gray-200 dark:border-gray-800 shadow-sm">
              <CalendarIcon className="w-3.5 h-3.5 mr-2 text-gray-500" />
              Last 30 Days
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Main Content Panel with Rounded Top-Left Corner */}
        <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex flex-col shadow-2xl relative z-10">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">

            {/* Top Section: Metrics & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left Column: Metrics & Chart (8 cols) */}
              <div className="lg:col-span-8 space-y-6">

                {/* Metrics Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-[#1A1A20] pb-1">
                  <button
                    onClick={() => setActiveMetric('rank')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all relative ${activeMetric === 'rank'
                      ? 'text-emerald-600 dark:text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                      }`}
                  >
                    Rank Score
                    {activeMetric === 'rank' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                  </button>
                  <button
                    onClick={() => setActiveMetric('position')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all relative ${activeMetric === 'position'
                      ? 'text-blue-600 dark:text-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                      }`}
                  >
                    Avg. Position
                    {activeMetric === 'position' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                  </button>
                  <button
                    onClick={() => setActiveMetric('inclusion')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all relative ${activeMetric === 'inclusion'
                      ? 'text-purple-600 dark:text-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                      }`}
                  >
                    Inclusion Rate
                    {activeMetric === 'inclusion' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
                  </button>
                </div>

                {/* Main Chart Area */}
                <div className="w-full">
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {activeMetric === 'rank' && `${currentRank}/100`}
                      {activeMetric === 'position' && `#${currentPosition}`}
                      {activeMetric === 'inclusion' && `${currentInclusion}%`}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeMetric === 'rank' && 'Overall visibility score across all AI engines'}
                      {activeMetric === 'position' && 'Average ranking position in search results'}
                      {activeMetric === 'inclusion' && 'Percentage of queries where your brand appears'}
                    </p>
                  </div>

                  <div className="h-[300px]">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={activeMetric === 'rank' ? '#10b981' : activeMetric === 'position' ? '#3b82f6' : '#8b5cf6'} stopOpacity={0.2} />
                              <stop offset="95%" stopColor={activeMetric === 'rank' ? '#10b981' : activeMetric === 'position' ? '#3b82f6' : '#8b5cf6'} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickFormatter={(value) => activeMetric === 'position' ? `#${value}` : `${value}%`}
                            domain={activeMetric === 'position' ? ['auto', 'auto'] : [0, 100]}
                            reversed={activeMetric === 'position'}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '5 5' }} />
                          <Area
                            type="monotone"
                            dataKey={activeMetric}
                            stroke={activeMetric === 'rank' ? '#10b981' : activeMetric === 'position' ? '#3b82f6' : '#8b5cf6'}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorMetric)"
                            animationDuration={1000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm bg-gray-50/50 dark:bg-[#111114] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                        {t.dashboardNoHistoricalData}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Notable Changes & Insights (4 cols) */}
              <div className="lg:col-span-4 space-y-6 pl-0 lg:pl-6 border-l border-transparent lg:border-gray-100 dark:lg:border-[#1A1A20]">

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Notable Changes</h3>
                  <div className="space-y-6 relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-800" />

                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium leading-snug flex items-center gap-1 flex-wrap">
                        <Image src="/providers/gemini-color.svg" alt="Gemini" width={14} height={14} className="inline-block" />
                        <span>Gemini</span> leads with 33/100, 19 points above
                        <Image src="/providers/openai.svg" alt="ChatGPT" width={14} height={14} className="inline-block" />
                        <span>ChatGPT</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Today, 9:41 AM</p>
                    </div>

                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium leading-snug">
                        New competitor detected: <span className="text-orange-600 dark:text-orange-400">CBRE GWS</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                    </div>

                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium leading-snug flex items-center gap-1 flex-wrap">
                        <Image src="/providers/claude-color.svg" alt="Claude" width={14} height={14} className="inline-block" />
                        <span>Claude</span> shows lowest performance at 4/100 rank score
                      </p>
                      <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-[#1A1A20]">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Unlock Advanced Tracking</h3>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-gray-900 to-black dark:from-[#111114] dark:to-black border border-gray-800 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <p className="text-sm text-gray-300 mb-4 relative z-10">
                      Upgrade your brand plan to track performance across personas, regions, and languages.
                    </p>
                    <Button className="w-full bg-white text-black hover:bg-gray-100 border-0 font-medium">
                      Upgrade Plan
                    </Button>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Section: Performance Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Competition Performance */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  Competition Performance
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">Live</span>
                </h3>
                <div className="space-y-3">
                  {competitors.slice(0, 5).map((comp) => (
                    <div key={comp.id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#111114] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-[10px] font-bold">
                          {comp.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{comp.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-900 dark:bg-white rounded-full"
                            style={{ width: `${comp.visibility_score || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-gray-500 w-8 text-right">{comp.visibility_score || 0}</span>
                      </div>
                    </div>
                  ))}
                  {competitors.length === 0 && (
                    <div className="text-sm text-gray-500 italic">No competitors tracked.</div>
                  )}
                </div>
              </div>

              {/* Model Performance */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  Model Performance
                </h3>
                <div className="space-y-3">
                  {AI_PROVIDER_META.map((provider, index) => (
                    <div key={provider.id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#111114] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 p-1">
                          <Image src={provider.icon} alt={provider.name} width={16} height={16} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{provider.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-emerald-500 font-medium">
                          {90 - (index * 5)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
