'use client'

import { useEffect, useState } from "react"
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Settings, 
  MoreHorizontal, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  Globe,
  User,
  MapPin,
  Languages
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

export default function DashboardPage() {
  const { t } = useTranslations()
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rank' | 'position' | 'inclusion'>('rank')

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
              // Mock data for position and inclusion since backend doesn't provide history for them yet
              position: a.score ? (Math.max(1, 10 - (a.score / 10) + (Math.random() * 2 - 1))).toFixed(1) : 0,
              inclusion: a.score ? Math.min(100, Math.round(a.score * 0.9 + (Math.random() * 10 - 5))) : 0,
              
              // Model specific tracking
              openai: a.results?.visibility_findings?.models_tracking?.includes('chatgpt') ? a.score : null,
              claude: a.results?.visibility_findings?.models_tracking?.includes('claude') ? a.score : null,
              gemini: a.results?.visibility_findings?.models_tracking?.includes('gemini') ? a.score : null,
              perplexity: a.results?.visibility_findings?.models_tracking?.includes('perplexity') ? a.score : null,
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

  const getCurrentValue = () => {
    if (!analysis) return '0%'
    switch (activeTab) {
      case 'rank': return `${Math.round(analysis.score || 0)}%`
      case 'position': return '4.2' // Mock current
      case 'inclusion': return '78%' // Mock current
    }
  }

  const getTabLabel = () => {
    switch (activeTab) {
      case 'rank': return 'CURRENT RANK SCORE'
      case 'position': return 'AVG. POSITION'
      case 'inclusion': return 'INCLUSION RATE'
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-white dark:bg-black h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-[#2A2A30]">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-9 rounded-lg border-gray-200 bg-white dark:bg-black text-gray-600 gap-2 font-normal shadow-sm">
              <CalendarIcon className="w-4 h-4" />
              <span>Last 30 Days</span>
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-gray-200 bg-white dark:bg-black text-gray-600 shadow-sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-8 pt-6 bg-[#F5F5F7] dark:bg-black/20">
            <div className="max-w-5xl mx-auto space-y-8">
              
              {/* Chart Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8 border-b border-gray-200 w-full">
                    <button 
                      onClick={() => setActiveTab('rank')}
                      className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'rank' ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Rank Score
                    </button>
                    <button 
                      onClick={() => setActiveTab('position')}
                      className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'position' ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Avg. Position
                    </button>
                    <button 
                      onClick={() => setActiveTab('inclusion')}
                      className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'inclusion' ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Inclusion Rate
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{getTabLabel()}</div>
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">
                        {getCurrentValue()}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full text-xs h-7 gap-1">
                      Group by <span className="font-semibold">provider</span>
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="h-[300px] w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
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
                            tickFormatter={(value) => activeTab === 'position' ? value : `${value}%`}
                            domain={activeTab === 'position' ? ['dataMin - 1', 'dataMax + 1'] : [0, 100]}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey={activeTab} 
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
                </div>
              </div>

              {/* Performance Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                
                {/* Competition Performance */}
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">COMPETITION PERFORMANCE</h3>
                  <div className="space-y-4">
                    {competitors.length > 0 ? competitors.map((comp) => (
                      <div key={comp.id} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                            {comp.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{comp.name}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-gray-100 bg-white dark:bg-black flex items-center justify-center text-xs font-medium text-emerald-600">
                          {Math.round(comp.visibility_score || 0)}
                        </div>
                      </div>
                    )) : (
                      <div className="text-sm text-gray-500 italic">No competitors tracked yet.</div>
                    )}
                  </div>
                </div>

                {/* Persona Performance */}
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">PERSONA PERFORMANCE</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-pink-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Head of Marketing</span>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-emerald-100 bg-white dark:bg-black text-emerald-600 flex items-center justify-center text-xs font-medium">75</div>
                    </div>
                    <div className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Startup Founder</span>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-orange-100 bg-white dark:bg-black text-orange-600 flex items-center justify-center text-xs font-medium">64</div>
                    </div>
                    <div className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-yellow-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Growth Leader</span>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-orange-100 bg-white dark:bg-black text-orange-600 flex items-center justify-center text-xs font-medium">62</div>
                    </div>
                  </div>
                </div>

                {/* Language Performance */}
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">LANGUAGE PERFORMANCE</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                          <Languages className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Dutch</span>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-emerald-100 bg-white dark:bg-black text-emerald-600 flex items-center justify-center text-xs font-medium">75</div>
                    </div>
                    <div className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                          <Languages className="w-3 h-3 text-red-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">English</span>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-orange-100 bg-white dark:bg-black text-orange-600 flex items-center justify-center text-xs font-medium">64</div>
                    </div>
                    <div className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                          <Languages className="w-3 h-3 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">French</span>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-orange-100 bg-white dark:bg-black text-orange-600 flex items-center justify-center text-xs font-medium">62</div>
                    </div>
                  </div>
                </div>

                {/* Region Performance */}
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">REGION PERFORMANCE</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-yellow-50 flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-yellow-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Belgium</span>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-emerald-100 bg-white dark:bg-black text-emerald-600 flex items-center justify-center text-xs font-medium">75</div>
                    </div>
                    <div className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">The Netherlands</span>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-orange-100 bg-white dark:bg-black text-orange-600 flex items-center justify-center text-xs font-medium">64</div>
                    </div>
                    <div className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">USA</span>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-orange-100 bg-white dark:bg-black text-orange-600 flex items-center justify-center text-xs font-medium">62</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="w-80 border-l border-gray-200 dark:border-[#2A2A30] p-6 overflow-y-auto hidden xl:block bg-white dark:bg-black">
            
            {/* Actions */}
            <div className="mb-10">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">ACTIONS</h3>
              <div className="space-y-4">
                {analysis?.results?.recommendations && analysis.results.recommendations.length > 0 ? (
                  analysis.results.recommendations.slice(0, 5).map((rec: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-gray-300 hover:text-emerald-500 cursor-pointer transition-colors" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
                        {typeof rec === 'string' ? rec : rec.title}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">No actions recommended yet.</div>
                )}
              </div>
            </div>

            {/* Notable Changes */}
            <div className="mb-10">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">NOTABLE CHANGES</h3>
              <div className="space-y-6">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Dropped from <span className="font-medium text-gray-900 dark:text-white">#2 → #4</span> in <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>Claude Sonnet</span> this week
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  New competitor detected <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-black"></div>Koto</span> in the UK
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Mentions in <span className="inline-flex items-center gap-1"><span className="text-base">🇩🇪</span> Germany</span> went up with 15%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Persona <span className="inline-flex items-center gap-1 bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>Head of Marketing</span> had the best performance
                </div>
              </div>
            </div>

            {/* Reasoning Layer */}
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">REASONING LAYER</h3>
              
              {analysis?.results?.strengths && analysis.results.strengths.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-3">Inclusion drivers</p>
                  <div className="space-y-2">
                    {analysis.results.strengths.slice(0, 3).map((strength: string, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-[#1E1E24] px-3 py-2 rounded-lg">
                        <span className="text-xs text-gray-600 dark:text-gray-300">{strength}</span>
                        <span className="text-xs font-medium text-emerald-600 border border-emerald-100 rounded-full w-6 h-6 flex items-center justify-center bg-white">+</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis?.results?.weaknesses && analysis.results.weaknesses.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-3">Exclusion drivers</p>
                  <div className="space-y-2">
                    {analysis.results.weaknesses.slice(0, 3).map((weakness: string, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-[#1E1E24] px-3 py-2 rounded-lg">
                        <span className="text-xs text-gray-600 dark:text-gray-300">{weakness}</span>
                        <span className="text-xs font-medium text-red-600 border border-red-100 rounded-full w-6 h-6 flex items-center justify-center bg-white">-</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!analysis?.results?.strengths && !analysis?.results?.weaknesses) && (
                 <div className="text-sm text-gray-500 italic">No reasoning data available.</div>
              )}

            </div>

          </aside>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}






