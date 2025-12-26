'use client'

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar as CalendarIcon,
  Settings,
  CheckCircle2,
  ChevronDown,
  Building2,
  Plus,
  Info,
  Trash2,
  ArrowLeft
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

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu"
import { useTranslations } from "@/lib/i18n"
import { brandsService, type Brand } from "@/lib/services/brands"
import { analysisService, type Analysis } from "@/lib/services/analysis"
import { competitorsService, type Competitor } from "@/lib/services/competitors"
import { geoAnalysisService, type VisibilitySnapshot } from "@/lib/services/geo-analysis"


import { DateRangePicker } from "@/components/ui/date-range-picker"
import { InsightsCard } from "@/components/dashboard/InsightsCard"
import { LanguageComparisonCard } from "@/components/dashboard/LanguageComparisonCard"
import { RegionalComparisonCard } from "@/components/dashboard/RegionalComparisonCard"
import { LocalMarketCard } from "@/components/dashboard/LocalMarketCard"
import { subDays, isAfter, startOfDay, format } from "date-fns"
import { DateRange } from "react-day-picker"
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const AI_PROVIDER_META = [
  { id: 'chatgpt', name: 'ChatGPT', icon: '/providers/openai.svg?v=3', color: '#10a37f' },
  { id: 'claude', name: 'Claude', icon: '/providers/claude-color.svg?v=3', color: '#da7756' },
  { id: 'perplexity', name: 'Perplexity', icon: '/providers/perplexity-color.svg?v=3', color: '#3b82f6' },
  { id: 'gemini', name: 'Gemini', icon: '/providers/gemini-color.svg?v=3', color: '#4b5563' },
] as const

const MODEL_ID_MAP: Record<string, string> = {
  'openai': 'chatgpt',
  'anthropic': 'claude',
  'perplexity': 'perplexity',
  'gemini': 'gemini'
}

export default function DashboardPage() {
  const { t } = useTranslations()
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [modelPerformance, setModelPerformance] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeMetric, setActiveMetric] = useState<'rank' | 'position' | 'inclusion'>('rank')
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null)

  // State for viewing competitor as main entity
  const [viewingCompetitor, setViewingCompetitor] = useState<Competitor | null>(null)

  // Date Range State
  const [selectedDays, setSelectedDays] = useState(30)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const router = useRouter()

  // Common fetch function
  const fetchDataForBrand = async (brand: Brand, days: number) => {
    setLoading(true)
    try {
      const analyses = await analysisService.getAll(brand.id)

      // Filter analyses based on date range
      const startDate = dateRange?.from || subDays(new Date(), days)
      const filteredAnalyses = analyses.filter(a => {
        const date = new Date(a.created_at)
        return isAfter(date, startOfDay(startDate)) || date.toDateString() === startDate.toDateString()
      })

      const processedChartData = filteredAnalyses
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(a => ({
          date: format(new Date(a.created_at), 'MM/dd'),
          rank: a.score ? Math.round(a.score) : 0,
          position: a.avg_position ? Math.round(a.avg_position) : 0,
          inclusion: a.inclusion_rate ? Math.round(a.inclusion_rate) : 0,
        }))
      setChartData(processedChartData)

      if (analyses.length > 0) {
        setAnalysis(analyses[analyses.length - 1])
      } else {
        setAnalysis(null)
      }

      const comps = await competitorsService.getAll(brand.id)
      setCompetitors(comps)

      try {
        const visibilityData = await geoAnalysisService.getVisibilityData(brand.id, undefined, days)
        if (visibilityData.latest_scores?.length > 0) {
          const scores: Record<string, number> = {}
          visibilityData.latest_scores.forEach((snapshot: VisibilitySnapshot) => {
            const frontendId = MODEL_ID_MAP[snapshot.ai_model] || snapshot.ai_model
            scores[frontendId] = snapshot.visibility_score
          })
          setModelPerformance(scores)
        } else {
          setModelPerformance({})
        }

        // Handle History for Chart
        if (visibilityData.history && visibilityData.history.length > 0) {
          const historyMap = new Map<string, Record<string, number>>()

          visibilityData.history.forEach((snapshot) => {
            const dateKey = format(new Date(snapshot.measured_at || new Date().toISOString()), 'MM/dd')
            if (!historyMap.has(dateKey)) {
              historyMap.set(dateKey, {})
            }
            const dayData = historyMap.get(dateKey)!
            const frontendId = MODEL_ID_MAP[snapshot.ai_model] || snapshot.ai_model

            dayData[frontendId] = snapshot.visibility_score ?? 0
            dayData[`${frontendId}_position`] = snapshot.average_position ?? 0
            dayData[`${frontendId}_inclusion`] = (snapshot.inclusion_rate ?? 0) * 100
          })

          setChartData(prevData => {
            // If prevData is empty (no analysis), create from history
            if (prevData.length === 0) {
              return Array.from(historyMap.entries()).sort().map(([date, scores]) => ({
                date,
                rank: 0,
                position: 0,
                inclusion: 0,
                ...scores
              }))
            }

            return prevData.map(item => {
              const modelScores = historyMap.get(item.date) || {}
              return { ...item, ...modelScores }
            })
          })
        }
      } catch {
        setModelPerformance({})
      }
    } catch (error) {
      console.error('Error loading brand data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handler to change selected brand
  const handleBrandChange = async (brand: Brand) => {
    setSelectedBrand(brand)
    await fetchDataForBrand(brand, selectedDays)
  }

  // Handler to delete a brand
  const handleDeleteBrand = async (brandId: string) => {
    setDeletingBrandId(brandId)
    try {
      await brandsService.delete(brandId)
      const updatedBrands = brands.filter(b => b.id !== brandId)
      setBrands(updatedBrands)

      // If deleted brand was selected, switch to another brand or redirect
      if (selectedBrand?.id === brandId) {
        if (updatedBrands.length > 0) {
          setSelectedBrand(updatedBrands[0])
          await fetchDataForBrand(updatedBrands[0], selectedDays)
        } else {
          router.push('/onboarding')
        }
      }
    } catch (error) {
      console.error('Failed to delete brand:', error)
    } finally {
      setDeletingBrandId(null)
    }
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      const diffTime = Math.abs(range.to.getTime() - range.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setSelectedDays(diffDays || 1) // limit must be at least 1
    }
  }

  // Refetch when selectedDays changes
  useEffect(() => {
    if (selectedBrand) {
      fetchDataForBrand(selectedBrand, selectedDays)
    }
  }, [selectedDays]) // Only depend on selectedDays and rely on selectedBrand being stable enough or check it


  useEffect(() => {
    const initData = async () => {
      try {
        const brandsData = await brandsService.getAll()
        setBrands(brandsData)

        if (brandsData.length > 0) {
          const brand = brandsData[0]
          setSelectedBrand(brand)
          // Initial fetch with default 30 days
          await fetchDataForBrand(brand, 30)
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    initData()
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-border/50 text-sm ring-1 ring-black/5 dark:ring-white/10">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="flex flex-col gap-2">
            {payload.map((entry: any, index: number) => {
              // Be selective about what to show based on activeMetric
              // If we are showing 'rank', we might see 'chatgpt', 'claude' etc.
              // If we are showing 'position', we might see 'chatgpt_position' etc.

              // Filter out entries that don't match the current view mode if we want to be strict,
              // or just clean up the names.
              let displayName = entry.name
              let value = entry.value
              let isPercentage = true
              let provider: typeof AI_PROVIDER_META[number] | undefined

              if (activeMetric === 'rank') {
                if (entry.name === 'rank') displayName = t.dashboardRankScore
                // If it's a model ID (chatgpt, claude...), we show its name
                provider = AI_PROVIDER_META.find(p => p.id === entry.name)
                if (provider) displayName = provider.name
              } else if (activeMetric === 'position') {
                if (entry.name === 'position') displayName = t.dashboardAvgPosition
                if (entry.name.endsWith('_position')) {
                  const modelId = entry.name.replace('_position', '')
                  provider = AI_PROVIDER_META.find(p => p.id === modelId)
                  if (provider) displayName = provider.name
                }
                isPercentage = false
              } else if (activeMetric === 'inclusion') {
                if (entry.name === 'inclusion') displayName = t.dashboardInclusionRate
                if (entry.name.endsWith('_inclusion')) {
                  const modelId = entry.name.replace('_inclusion', '')
                  provider = AI_PROVIDER_META.find(p => p.id === modelId)
                  if (provider) displayName = provider.name
                }
              }

              // Skip the overall metric entry (rank, position, inclusion) to show only model data
              if (['rank', 'position', 'inclusion'].includes(entry.name)) return null

              return (
                <div key={index} className="flex items-center justify-between gap-8">
                  <div className="flex items-center gap-2">
                    {provider ? (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: provider.color }}
                      >
                        <Image
                          src={provider.icon}
                          alt={provider.name}
                          width={12}
                          height={12}
                          className="brightness-0 invert"
                        />
                      </div>
                    ) : (
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    )}
                    <span className="text-muted-foreground">
                      {displayName}
                    </span>
                  </div>
                  <span className="font-mono font-medium text-foreground">
                    {isPercentage ? `${Math.round(value)}%` : `#${Math.round(value)}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

  // Calculate current metrics
  // Use model performance average for rank if available, otherwise fallback to analysis
  const currentRank = Object.keys(modelPerformance).length > 0
    ? Math.round(Object.values(modelPerformance).reduce((a, b) => a + b, 0) / Object.values(modelPerformance).length)
    : (analysis?.score ? Math.round(analysis.score) : 0)

  const currentPosition = analysis?.avg_position ? Math.round(analysis.avg_position) : 0
  const currentInclusion = analysis?.inclusion_rate ? Math.round(analysis.inclusion_rate * 100) : 0

  return (
    <SidebarProvider>
      <AppSidebar />
      {/* SidebarInset background matches the sidebar to create the "integrated" feel */}
      <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">

        {/* Header sits on the "sidebar" background */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />

            {/* Back button when viewing competitor */}
            {viewingCompetitor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingCompetitor(null)}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.back || 'Volver'}
              </Button>
            )}

            {/* Brand/Competitor Display with Dropdown */}
            {loading && !selectedBrand && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 animate-pulse">
                <div className="w-6 h-6 rounded bg-gray-200 dark:bg-zinc-700" />
                <div className="flex flex-col gap-1">
                  <div className="w-24 h-4 bg-gray-200 dark:bg-zinc-700 rounded" />
                  <div className="w-16 h-3 bg-gray-200 dark:bg-zinc-700 rounded" />
                </div>
              </div>
            )}
            {selectedBrand && !viewingCompetitor && (
              <div className="relative group">
                <button className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 hover:border-primary/50 transition-colors text-sm font-medium">
                  <div className="w-6 h-6 rounded bg-gray-100 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${selectedBrand.domain}&sz=32`}
                      alt=""
                      className="w-4 h-4 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedBrand.name}</span>
                    <span className="text-xs text-muted-foreground">{selectedBrand.domain}</span>
                  </div>
                  {brands.length > 1 && <ChevronDown className="w-4 h-4 text-muted-foreground ml-2" />}
                </button>
                {brands.length > 1 && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-zinc-900 border border-border/50 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {brands.map((brand) => (
                      <div
                        key={brand.id}
                        className={`flex items-center justify-between px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors first:rounded-t-lg ${brand.id === selectedBrand.id ? 'bg-primary/5 text-primary' : ''}`}
                      >
                        <button
                          onClick={() => handleBrandChange(brand)}
                          className="flex-1 flex items-center gap-3"
                        >
                          <div className="w-6 h-6 rounded bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=32`}
                              alt=""
                              className="w-4 h-4 object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-medium truncate">{brand.name}</span>
                            <span className="text-xs text-muted-foreground">{brand.domain}</span>
                          </div>
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 hover:bg-destructive/10 rounded-md transition-colors ml-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.deleteWarning.replace('{name}', brand.name)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteBrand(brand.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {deletingBrandId === brand.id ? t.deleting : t.delete}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                    <div className="border-t border-border/50">
                      <button
                        onClick={() => router.push('/onboarding')}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors rounded-b-lg"
                      >
                        <Plus className="w-4 h-4" />
                        {t.addBrand}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Competitor Display when viewing competitor */}
            {viewingCompetitor && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <div className="w-6 h-6 rounded bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${viewingCompetitor.domain}&sz=32`}
                    alt=""
                    className="w-4 h-4 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-orange-900 dark:text-orange-100">{viewingCompetitor.name}</span>
                  <span className="text-xs text-orange-600 dark:text-orange-400">{viewingCompetitor.domain}</span>
                </div>
                <span className="text-xs px-2 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full ml-2">
                  {t.competitor || 'Competidor'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Picker */}
            <DateRangePicker
              date={dateRange}
              onDateChange={handleDateRangeChange}
              onDaysChange={setSelectedDays}
            />

            {selectedBrand && (
              <Link href={`/brand/${selectedBrand.id}`}>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Building2 className="h-3.5 w-3.5" />
                  {t.viewDetails}
                </Button>
              </Link>
            )}
            <UserAvatarMenu />
          </div>
        </header>

        {/* Main Content Panel with Rounded Top-Left Corner */}
        <main className="dashboard-main flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex flex-col shadow-2xl relative z-10">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">

            {/* Top Section: Metrics & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* Left Column: Metrics & Chart (8 cols) */}
              <div className="lg:col-span-8 space-y-3">

                {/* Metrics Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-[#1A1A20] pb-1">
                  <button
                    onClick={() => setActiveMetric('rank')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all relative ${activeMetric === 'rank'
                      ? 'text-emerald-600 dark:text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                      }`}
                  >
                    {t.dashboardRankScore}
                    {activeMetric === 'rank' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                  </button>
                  <button
                    onClick={() => setActiveMetric('position')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all relative ${activeMetric === 'position'
                      ? 'text-emerald-600 dark:text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                      }`}
                  >
                    {t.dashboardAvgPosition}
                    {activeMetric === 'position' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                  </button>
                  <button
                    onClick={() => setActiveMetric('inclusion')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all relative ${activeMetric === 'inclusion'
                      ? 'text-emerald-600 dark:text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                      }`}
                  >
                    {t.dashboardInclusionRate}
                    {activeMetric === 'inclusion' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                  </button>
                </div>

                {/* Main Chart Area */}
                <div className="w-full">
                  <div className="mb-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {activeMetric === 'rank' && `${currentRank}/100`}
                          {activeMetric === 'position' && `#${currentPosition}`}
                          {activeMetric === 'inclusion' && `${currentInclusion}%`}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activeMetric === 'rank' && t.dashboardOverallVisibility}
                          {activeMetric === 'position' && t.dashboardAvgPositionDesc}
                          {activeMetric === 'inclusion' && t.dashboardInclusionRateDesc}
                        </p>
                      </div>

                      {/* Model Breakdown - Main Chart Header */}
                      {activeMetric === 'rank' && Object.keys(modelPerformance).length > 0 && (
                        <div className="flex items-center gap-3 mb-1">
                          {AI_PROVIDER_META.map((provider) => {
                            const score = modelPerformance[provider.id]
                            if (score === undefined) return null
                            return (
                              <div key={provider.id} className="flex flex-col items-center gap-1 group relative">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 p-1.5 flex items-center justify-center">
                                  <Image
                                    src={provider.icon}
                                    alt={provider.name}
                                    width={20}
                                    height={20}
                                    className={provider.icon.includes('openai.svg') ? 'w-full h-full object-contain dark:invert' : 'w-full h-full object-contain'}
                                  />
                                </div>
                                <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-400">
                                  {Math.round(score)}%
                                </span>
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10">
                                  {provider.name}: {Math.round(score)}%
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-[280px]">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                            tickFormatter={(value) => activeMetric === 'position' ? `#${Math.round(value)}` : `${Math.round(value)}%`}
                            domain={activeMetric === 'position' ? [1, 5] : [0, 100]}
                            ticks={activeMetric === 'position' ? [1, 2, 3, 4, 5] : undefined}
                            reversed={activeMetric === 'position'}
                            allowDecimals={false}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '5 5' }} />


                          {/* Individual Model Lines - Overlaid on top */}
                          {Object.keys(modelPerformance).length > 0 && AI_PROVIDER_META.map((provider) => {
                            // Determine data key based on active metric
                            let dataKey: string = provider.id
                            if (activeMetric === 'position') dataKey = `${provider.id}_position`
                            if (activeMetric === 'inclusion') dataKey = `${provider.id}_inclusion`

                            return (
                              <Area
                                key={provider.id}
                                type="monotone"
                                dataKey={dataKey}
                                stroke={provider.color}
                                strokeWidth={2}
                                fillOpacity={0}
                                fill="transparent"
                                connectNulls
                              />
                            )
                          })}
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

              {/* Right Column: All insights in compact format */}
              <div className="lg:col-span-4 space-y-4 pl-0 lg:pl-6 border-l border-transparent lg:border-gray-100 dark:lg:border-[#1A1A20]">

                {/* Dynamic Insights Panel */}
                {selectedBrand && (
                  <InsightsCard brandId={selectedBrand.id} />
                )}

                {/* Language & Regional comparison - Only for truly international businesses */}
                {selectedBrand && selectedBrand.business_scope === 'international' && (
                  <div className="grid grid-cols-2 gap-6">
                    <LanguageComparisonCard brandId={selectedBrand.id} />
                    <RegionalComparisonCard brandId={selectedBrand.id} />
                  </div>
                )}

                {/* For local, regional, and national businesses - show market dominance card */}
                {selectedBrand && (
                  selectedBrand.business_scope === 'local' ||
                  selectedBrand.business_scope === 'regional' ||
                  selectedBrand.business_scope === 'national' ||
                  !selectedBrand.business_scope
                ) && (
                    <LocalMarketCard
                      brandId={selectedBrand.id}
                      city={selectedBrand.city}
                      location={selectedBrand.location}
                      scope={selectedBrand.business_scope || 'national'}
                    />
                  )}



                {/* Upgrade Banner */}
                <div className="p-4 rounded-xl bg-white dark:bg-gradient-to-br dark:from-[#111114] dark:to-black border border-gray-200 dark:border-gray-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl -mr-12 -mt-12" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 relative z-10">
                    {t.dashboardUpgradeMessage}
                  </p>
                  <Button className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 border-0 font-medium text-sm">
                    {t.upgradePlan}
                  </Button>
                </div>

              </div>
            </div>

            {/* Bottom Section: Performance Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Competition Performance */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  {t.dashboardCompetitionPerformance}
                  <TooltipUI>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      {t.dashboardCompetitionPerformanceTooltip}
                    </TooltipContent>
                  </TooltipUI>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{t.dashboardLive}</span>
                </h3>
                <div className="space-y-3">
                  {/* When viewing a competitor, show the original brand as first "competitor" */}
                  {viewingCompetitor && selectedBrand && (
                    <button
                      onClick={() => setViewingCompetitor(null)}
                      className="w-full flex items-center justify-between group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#111114] transition-colors cursor-pointer text-left border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center overflow-hidden">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${selectedBrand.domain}&sz=32`}
                            alt={selectedBrand.name}
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.parentElement!.innerHTML = `<span class="text-[10px] font-bold">${selectedBrand.name.charAt(0)}</span>`
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{selectedBrand.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">{t.yourBrand || 'Tu marca'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 justify-end">
                        <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${currentRank}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-emerald-600 w-8 text-right">{currentRank}%</span>
                      </div>
                    </button>
                  )}
                  {/* Filter out the competitor being viewed, show the rest */}
                  {(viewingCompetitor
                    ? competitors.filter(c => c.id !== viewingCompetitor.id).slice(0, 4)
                    : competitors.slice(0, 5)
                  ).map((comp) => (
                    viewingCompetitor ? (
                      // When viewing competitor, show as non-clickable div
                      <div
                        key={comp.id}
                        className="w-full flex items-center justify-between p-2 rounded-lg opacity-50 cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${comp.domain}&sz=32`}
                              alt={comp.name}
                              className="w-4 h-4 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.parentElement!.innerHTML = `<span class="text-[10px] font-bold">${comp.name.charAt(0)}</span>`
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-400 dark:text-gray-500">{comp.name}</span>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                          <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gray-400 dark:bg-gray-600 rounded-full"
                              style={{ width: `${comp.visibility_score || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-gray-400 w-8 text-right">{comp.visibility_score || 0}%</span>
                        </div>
                      </div>
                    ) : (
                      // Normal clickable button when not viewing competitor
                      <button
                        key={comp.id}
                        onClick={() => setViewingCompetitor(comp)}
                        className="w-full flex items-center justify-between group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#111114] transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${comp.domain}&sz=32`}
                              alt={comp.name}
                              className="w-4 h-4 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.parentElement!.innerHTML = `<span class="text-[10px] font-bold">${comp.name.charAt(0)}</span>`
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{comp.name}</span>
                        </div>
                        <div className="flex flex-col gap-2 max-w-[200px]">
                          {comp.metrics_breakdown ? (
                            // Show breakdown with SVG icons
                            <div className="flex items-center gap-2">
                              {Object.entries(comp.metrics_breakdown).map(([modelKey, score]) => {
                                const frontendId = MODEL_ID_MAP[modelKey] || modelKey
                                const provider = AI_PROVIDER_META.find(p => p.id === frontendId)
                                if (!provider) return null

                                return (
                                  <div key={modelKey} className="flex flex-col items-center group/tooltip relative">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 p-1.5 flex items-center justify-center">
                                      <Image
                                        src={provider.icon}
                                        alt={provider.name}
                                        width={20}
                                        height={20}
                                        className={provider.icon.includes('openai.svg') ? 'w-full h-full object-contain dark:invert' : 'w-full h-full object-contain'}
                                      />
                                    </div>
                                    <span className="text-xs font-mono text-gray-500 mt-0.5">{score}%</span>
                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/tooltip:block bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                                      {provider.name}: {score}%
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            // Fallback to overall score
                            <div className="flex items-center gap-3 justify-end">
                              <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gray-900 dark:bg-white rounded-full"
                                  style={{ width: `${comp.visibility_score || 0}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-gray-500 w-8 text-right">{comp.visibility_score || 0}%</span>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  ))}
                  {competitors.length === 0 && !viewingCompetitor && (
                    <div className="text-sm text-gray-500 italic">{t.noCompetitorsTracked}</div>
                  )}
                </div>
              </div>

              {/* Model Performance */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  {t.dashboardModelPerformance}
                  <TooltipUI>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      {t.dashboardModelPerformanceTooltip}
                    </TooltipContent>
                  </TooltipUI>
                </h3>
                <div className="space-y-3">
                  {AI_PROVIDER_META.map((provider) => {
                    const score = modelPerformance[provider.id] || 0
                    const hasData = modelPerformance[provider.id] !== undefined

                    return (
                      <div key={provider.id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#111114] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 p-1.5 text-gray-900 dark:text-white flex items-center justify-center">
                            <Image
                              src={provider.icon}
                              alt={provider.name}
                              width={20}
                              height={20}
                              className={provider.icon.includes('openai.svg') ? 'w-full h-full object-contain dark:invert' : 'w-full h-full object-contain'}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{provider.name}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-1 justify-end max-w-[140px]">
                          {hasData ? (
                            <>
                              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-emerald-500 font-medium w-9 text-right">
                                {Math.round(score)}%
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">{t.dashboardNoData}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
