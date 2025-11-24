'use client'

import { useEffect, useState } from "react"
import Image from "next/image"
import { 
  Calendar as CalendarIcon, 
  Settings, 
  MoreHorizontal, 
  CheckCircle2
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { useTranslations } from '@/lib/i18n'
import { brandsService, Brand } from "@/lib/services/brands"
import { analysisService, Analysis } from "@/lib/services/analysis"
import { competitorsService, Competitor } from "@/lib/services/competitors"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'
import { format } from "date-fns"

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
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 text-sm">
          <div className="flex flex-col gap-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-600 capitalize">{entry.name === 'rank' ? 'Rank Score' : entry.name === 'position' ? 'Avg. Position' : 'Inclusion Rate'}</span>
                </div>
                <span className="font-medium">{entry.value}{entry.name === 'position' ? '' : '%'}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400 text-right">
            {label}
          </div>
        </div>
      )
    }
    return null
  }

  const currentRankScore = `${Math.round(analysis?.score || 0)}%`
  const keywordInsights = Array.isArray(analysis?.results?.keywords) ? analysis.results.keywords : []
  const crawlerInsights = Array.isArray(analysis?.results?.crawlers) ? analysis.results.crawlers : []
  const notifications = Array.isArray(analysis?.results?.notifications) ? analysis.results.notifications : []
  const summaryInsight = typeof analysis?.results?.summary === 'string' ? analysis.results.summary : undefined
  const visibilityFindings = analysis?.results?.visibility_findings
  const providerScoreMap = (visibilityFindings?.provider_scores || visibilityFindings?.model_scores || analysis?.results?.provider_scores || analysis?.results?.model_scores) as Record<string, number> | undefined
  const trackingModels = Array.isArray(visibilityFindings?.models_tracking) ? visibilityFindings.models_tracking : []
  const aiProviderCoverage = AI_PROVIDER_META.map((provider) => {
    let providerScore = providerScoreMap?.[provider.id]

    if (typeof providerScore !== 'number' && provider.id === 'chatgpt') {
      const fallbackScore = typeof analysis?.score === 'number'
        ? analysis.score
        : typeof visibilityFindings?.visibility_score === 'number'
          ? Number(visibilityFindings.visibility_score)
          : undefined
      providerScore = fallbackScore
    }

    return {
      ...provider,
      score: typeof providerScore === 'number' ? Math.round(providerScore) : undefined,
      isTracking: trackingModels.includes(provider.id) || (provider.id === 'chatgpt' && !!analysis)
    }
  })

  const formatHoursAgo = (hours?: number) => {
    if (typeof hours !== 'number' || Number.isNaN(hours)) return '—'
    if (hours < 1) return 'within the hour'
    if (hours < 24) return `${Math.round(hours)}h ago`
    const days = Math.round(hours / 24)
    return `${days}d ago`
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#fdfdfc] dark:bg-[#050505] h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#1f1f23] bg-[#fdfdfc] dark:bg-[#050505]">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overview of your brand's AI visibility</p>
          </div>
          <Button variant="ghost" size="icon">
             <Settings className="w-5 h-5 text-gray-500" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#fdfdfc] dark:bg-[#050505]">
          <div className="max-w-8xl mx-auto space-y-6">
            
            {/* Top Row: AI Providers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {aiProviderCoverage.map(provider => (
                 <Card key={provider.id} className="border-gray-200 dark:border-[#27272a] shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-[#27272a] flex items-center justify-center p-2">
                             <Image src={provider.icon} alt={provider.name} width={24} height={24} />
                          </div>
                          <div>
                             <p className="font-medium text-sm text-gray-900 dark:text-white">{provider.name}</p>
                             <p className="text-xs text-gray-500">{provider.isTracking ? 'Tracking' : 'Inactive'}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                             {typeof provider.score === 'number' ? `${provider.score}%` : '—'}
                          </span>
                       </div>
                    </CardContent>
                 </Card>
               ))}
            </div>

            {/* Middle Row: Chart & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Chart - Takes 2 cols */}
               <Card className="lg:col-span-2 border-gray-200 dark:border-[#27272a] shadow-sm">
                  <CardHeader>
                     <CardTitle>Visibility Trend</CardTitle>
                     <CardDescription>Your AI visibility score over time</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-0">
                     <div className="h-[300px] w-full pr-4">
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#9ca3af', fontSize: 12 }} 
                                dy={10}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#9ca3af', fontSize: 12 }} 
                                tickFormatter={(value) => `${value}%`}
                                domain={[0, 100]}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Line 
                                type="monotone" 
                                dataKey="rank" 
                                stroke="#8b5cf6" 
                                strokeWidth={2} 
                                dot={false} 
                                activeDot={{ r: 4, strokeWidth: 0 }} 
                                animationDuration={500}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            No historical data available yet
                          </div>
                        )}
                     </div>
                  </CardContent>
               </Card>

               {/* Recommendations / Actions - Takes 1 col */}
               <Card className="border-gray-200 dark:border-[#27272a] shadow-sm flex flex-col h-full">
                  <CardHeader>
                     <CardTitle>Recommended Actions</CardTitle>
                     <CardDescription>Improve your standing</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto pr-2">
                     <div className="space-y-4">
                        {analysis?.results?.recommendations && analysis.results.recommendations.length > 0 ? (
                          analysis.results.recommendations.slice(0, 5).map((rec: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#27272a]/50">
                              <div className="mt-0.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
                                {typeof rec === 'string' ? rec : rec.title}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 italic text-center py-8">No actions recommended yet.</div>
                        )}
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Bottom Row: Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {/* Competitors */}
               <Card className="border-gray-200 dark:border-[#27272a] shadow-sm">
                  <CardHeader>
                     <CardTitle>Competitors</CardTitle>
                     <CardDescription>Visibility comparison</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {competitors.length > 0 ? competitors.slice(0, 5).map((comp) => (
                      <div key={comp.id} className="flex items-center justify-between">
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{comp.name}</p>
                          <p className="text-xs text-gray-500 truncate">{comp.domain}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-semibold text-emerald-500">{Math.round(comp.visibility_score || 0)}%</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500 italic">No competitors tracked.</p>
                    )}
                  </CardContent>
               </Card>

               {/* Keywords */}
               <Card className="border-gray-200 dark:border-[#27272a] shadow-sm">
                  <CardHeader>
                     <CardTitle>Top Keywords</CardTitle>
                     <CardDescription>High opportunity terms</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {keywordInsights.length > 0 ? keywordInsights.slice(0, 5).map((item: any, idx: number) => (
                      <div key={`${item.keyword}-${idx}`} className="flex items-center justify-between">
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.keyword}</p>
                          <p className="text-xs text-gray-500">{item.search_volume ? `${item.search_volume.toLocaleString()}` : '-'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-semibold text-emerald-500">{item.ai_visibility_score ? `${Math.round(item.ai_visibility_score)}%` : '—'}</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500 italic">No keywords found.</p>
                    )}
                  </CardContent>
               </Card>

               {/* Recent Activity */}
               <Card className="border-gray-200 dark:border-[#27272a] shadow-sm">
                  <CardHeader>
                     <CardTitle>Recent Activity</CardTitle>
                     <CardDescription>Crawlers & Alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {crawlerInsights.length > 0 ? crawlerInsights.slice(0, 3).map((crawler: any, idx: number) => (
                      <div key={`${crawler.name}-${idx}`} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{crawler.name}</p>
                          <p className="text-xs text-gray-500">{formatHoursAgo(crawler.last_visit_hours)}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{crawler.pages_visited || 0} pages</Badge>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500 italic">No recent crawler activity.</p>
                    )}
                    
                    {notifications.length > 0 && (
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                        <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Notifications</p>
                        {notifications.slice(0, 2).map((note: any, idx: number) => (
                          <div key={`note-${idx}`} className="text-sm text-gray-600 dark:text-gray-300 mb-2 last:mb-0">
                            {note.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
               </Card>
            </div>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}










