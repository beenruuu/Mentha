'use client'

import { use, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Building2, Globe, Trash2, ArrowRight, Activity, Search, ShieldCheck, Sparkles, Network, PieChart as PieChartIcon, Mic, BookOpen, Play, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { useTranslations } from "@/lib/i18n"
import { brandsService, type Brand } from "@/lib/services/brands"
import { competitorsService, Competitor } from "@/lib/services/competitors"
import { keywordsService, Keyword } from "@/lib/services/keywords"
import { analysisService, Analysis } from "@/lib/services/analysis"
import { technicalAeoService, TechnicalAEO } from "@/lib/services/technical-aeo"
import { useDemo } from "@/lib/demo-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MetricTab } from "@/components/dashboard/metric-tab"
import { SchemaGenerator } from "@/components/optimization/SchemaGenerator"
import { AIAnswerPreview } from "@/components/optimization/AIAnswerPreview"
import { CompetitorGapAnalysis } from "@/components/optimization/CompetitorGapAnalysis"
import { AuthorityNexus } from "@/components/optimization/AuthorityNexus"
import { ShareOfModel } from "@/components/optimization/ShareOfModel"
import { BrandPageSkeleton } from "@/components/skeletons/brand-page-skeleton"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { subDays, isAfter, startOfDay, isBefore, endOfDay } from "date-fns"
import { DateRange } from "react-day-picker"
import { ContentOptimizationCard } from "@/components/analysis/content-optimization-card"
import { VisualOpportunitiesCard } from "@/components/analysis/visual-opportunities-card"
import { AuthoritySourcesCard } from "@/components/analysis/authority-sources-card"
import { SentimentAnalysisCard } from "@/components/analysis/SentimentAnalysisCard"
import { PromptTracker } from "@/components/analysis/PromptTracker"
import { HallucinationCard } from "@/components/analysis/HallucinationCard"
import { EntityTracker } from "@/components/analysis/EntityTracker"
import { PromptDiscovery } from "@/components/analysis/PromptDiscovery"
import { LLMOptimizationCard } from "@/components/analysis/LLMOptimizationCard"
import { ExportButton } from "@/components/shared/ExportButton"
import { fetchAPI } from "@/lib/api-client"

export default function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslations()
  const { toast } = useToast()
  const { isDemoMode } = useDemo()
  const { id } = use(params)
  const router = useRouter()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [technicalAeo, setTechnicalAeo] = useState<TechnicalAEO | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [lastUpdated, setLastUpdated] = useState<number>(Date.now())

  // Date Range State
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [selectedDays, setSelectedDays] = useState(30)

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      const diffTime = Math.abs(range.to.getTime() - range.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setSelectedDays(diffDays || 1)
      // Trigger refetch or re-filter
      fetchData(range)
    }
  }

  /* Polling logic to check for analysis updates */
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Check if we need to poll (if analysis is pending/processing or if we just triggered one)
    const shouldPoll = isAnalyzing || (analysis && ['pending', 'processing'].includes(analysis.status));

    if (shouldPoll) {
      intervalId = setInterval(async () => {
        try {
          const latestAnalyses = await analysisService.getAll(id);
          if (latestAnalyses.length > 0) {
            latestAnalyses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            const latest = latestAnalyses[0];

            // If status changed or it's a new analysis, update state
            if (!analysis || latest.id !== analysis.id || latest.status !== analysis.status) {
              setAnalysis(latest);
              setLastUpdated(Date.now()); // Trigger updates in child components

              // Also refresh other data that might have changed
              const [competitorsData, keywordsData, technicalAeoData] = await Promise.all([
                competitorsService.getAll(id),
                keywordsService.getAll(id),
                technicalAeoService.getLatestByBrandId(id)
              ]);
              setCompetitors(competitorsData);
              setKeywords(keywordsData);
              setTechnicalAeo(technicalAeoData);
            }

            // Stop analyzing state if completed
            if (['completed', 'failed'].includes(latest.status)) {
              setIsAnalyzing(false);
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, isAnalyzing, analysis]);

  const fetchData = useCallback(async (customRange?: DateRange | undefined) => {
    setLoading(true)
    try {
      const [brandData, competitorsData, keywordsData, analysesData, technicalAeoData] = await Promise.all([
        brandsService.getById(id),
        competitorsService.getAll(id),
        keywordsService.getAll(id),
        analysisService.getAll(id),
        technicalAeoService.getLatestByBrandId(id)
      ])
      setBrand(brandData)
      setCompetitors(competitorsData)
      setKeywords(keywordsData)
      setTechnicalAeo(technicalAeoData)

      if (analysesData.length > 0) {
        // Filter by date range
        const range = customRange || dateRange
        let filtered = analysesData

        if (range?.from) {
          filtered = filtered.filter(a => {
            const date = new Date(a.created_at)
            // If range.to is missing, assume up to now? Or just from start date?
            // DateRangePicker usually gives both or logic handles it.
            if (range.to) {
              return (
                (isAfter(date, startOfDay(range.from!)) || date.toDateString() === range.from!.toDateString()) &&
                (isBefore(date, endOfDay(range.to)) || date.toDateString() === range.to.toDateString())
              )
            }
            return isAfter(date, startOfDay(range.from!))
          })
        }

        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        if (filtered.length > 0) {
          const latest = filtered[0]
          setAnalysis(latest)
          // If the latest analysis is still running, make sure we're in analyzing mode
          if (['pending', 'processing'].includes(latest.status)) {
            setIsAnalyzing(true)
          }
        } else {
          setAnalysis(null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch brand data:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData(dateRange)
  }, [fetchData])

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      await fetchAPI(`/analysis/trigger/${id}`, { method: 'POST' })
      toast({
        title: t.analysisTriggered,
        description: t.analysisTriggeredDesc,
      })
      // The polling effect will pick up the new analysis status automatically
    } catch (error) {
      console.error('Failed to trigger analysis:', error)
      toast({
        title: 'Error',
        description: 'Failed to start analysis. Please try again.',
        variant: 'destructive',
      })
      setIsAnalyzing(false)
    }
  }

  const handleDeleteBrand = async () => {
    setIsDeleting(true)
    try {
      await brandsService.delete(id)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to delete brand:', error)
      setIsDeleting(false)
    }
  }

  if (loading || !brand) {
    return <BrandPageSkeleton />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] !min-h-0 h-full max-h-screen overflow-hidden flex flex-col">
        {/* Header - matches dashboard style */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center overflow-hidden shadow-sm">
              <img
                src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=64`}
                alt={`${brand.name} logo`}
                className="w-6 h-6 object-contain m-auto"
                style={{ display: 'block' }}
                onError={(e) => {
                  const target = e.currentTarget;
                  const parent = target.parentElement;
                  if (parent) {
                    target.remove();
                    parent.innerHTML = `<span class="text-lg font-bold text-primary flex items-center justify-center w-full h-full">${brand.name.charAt(0).toUpperCase()}</span>`;
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{brand.name}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Globe className="w-3 h-3" />
                <a href={brand.domain} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  {brand.domain}
                </a>
                {/* Platform Detection Badge */}
                {technicalAeo?.detected_platform && technicalAeo.detected_platform !== 'unknown' && (
                  <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-secondary/80 rounded-full">
                    <img
                      src={`/platforms/${technicalAeo.detected_platform}.svg`}
                      alt={technicalAeo.detected_platform}
                      className="w-3.5 h-3.5"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <span className="text-[10px] font-medium capitalize">
                      {t[`platform${technicalAeo.detected_platform.charAt(0).toUpperCase()}${technicalAeo.detected_platform.slice(1)}` as keyof typeof t] || technicalAeo.detected_platform}
                    </span>
                    {technicalAeo.platform_confidence && technicalAeo.platform_confidence >= 80 && (
                      <span className="text-[8px] text-emerald-600 dark:text-emerald-400">✓</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker
              date={dateRange}
              onDateChange={handleDateRangeChange}
              onDaysChange={(days) => {
                setSelectedDays(days)
                // We need to update dateRange too based on days if it wasn't done by onDateChange
                // actually DateRangePicker handles calling onDateChange, so we might duplicate fetch if we listen to both.
                // But onDaysChange is useful for presets. 
                // Let's rely on handleDateRangeChange which DateRangePicker calls.
              }}
            />
            <Button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isAnalyzing ? t.analyzingBrand : t.runAnalysis}
            </Button>
            <ExportButton brandId={id} brandName={brand.name} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/30">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t.deleteBrand}
                </Button>
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
                  <AlertDialogAction onClick={handleDeleteBrand} className="bg-red-600 hover:bg-red-700">
                    {isDeleting ? t.deleting : t.delete}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        {/* Main Content Panel with Rounded Top-Left Corner - matches dashboard */}
        <div className="flex-1 min-h-0 bg-white dark:bg-black rounded-tl-3xl overflow-y-auto overflow-x-hidden shadow-2xl relative z-10 p-4 md:p-6 lg:p-8">
          <div className="space-y-6 md:space-y-8">

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricTab
                label={t.aeoReadiness}
                value={`${Math.round(technicalAeo?.aeo_readiness_score || 0)}%`}
                trend={0}
                isActive={false}
                onClick={() => { }}
              />
              <MetricTab
                label={t.trackedKeywordsLabel}
                value={keywords.length.toString()}
                trend={0}
                isActive={false}
                onClick={() => { }}
              />
              <MetricTab
                label={t.competitors}
                value={competitors.length.toString()}
                trend={0}
                isActive={false}
                onClick={() => { }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 min-w-0">
              {/* Main Content (2/3) */}
              <div className="lg:col-span-2 space-y-6 md:space-y-8 min-w-0 overflow-hidden">

                {/* Actionable Insights */}
                <Card className="border-border/50 shadow-sm rounded-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        {t.actionableInsights}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50 dark:border-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-900/20">
                              <Sparkles className="w-3 h-3" />
                              {t.simulateAnswer}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                            <AIAnswerPreview brandName={brand.name} defaultKeyword={keywords[0]?.keyword || ''} />
                          </DialogContent>
                        </Dialog>
                        <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                          {technicalAeo?.recommendations?.length || 0} {t.pendingBadge}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {technicalAeo?.recommendations && technicalAeo.recommendations.length > 0 ? (
                      <div className="space-y-3">
                        {technicalAeo.recommendations.map((rec: any, i: number) => {
                          // Helper for legacy data translation
                          const legacyTitleMap: Record<string, string> = {
                            'AI Crawlers Blocked': 'rec_crawler_title',
                            'Add FAQ Schema': 'rec_faq_title',
                            'Add HowTo Schema': 'rec_howto_title',
                            'No Structured Data Found': 'rec_structured_title',
                            'Enable HTTPS': 'rec_https_title',
                            'Add RSS Feed': 'rec_rss_title',
                            'Add Speakable Schema': 'rec_speakable_title',
                            'Local Business Schema': 'rec_local_title'
                          };

                          const legacyDescMap: Record<string, string> = {
                            'Some AI crawlers are blocked in robots.txt. Allow them to improve visibility.': 'rec_crawler_desc',
                            'Implement FAQPage schema to increase chances of being cited in question answering.': 'rec_faq_desc',
                            'Add HowTo schema for instructional content.': 'rec_howto_desc',
                            'Implement JSON-LD structured data (Schema.org) to help AI understand your content.': 'rec_structured_desc',
                            'Switch to HTTPS for security and crawler trust.': 'rec_https_desc',
                            'Provide an RSS/Atom feed for easier content discovery.': 'rec_rss_desc',
                            'Implement speakable schema for voice search.': 'rec_speakable_desc',
                            'Essential for "near me" voice searches.': 'rec_local_desc'
                          };

                          const getTitle = (r: any) => {
                            if (r.translation_key && t[r.translation_key as keyof typeof t]) return t[r.translation_key as keyof typeof t];
                            if (legacyTitleMap[r.title] && t[legacyTitleMap[r.title] as keyof typeof t]) return t[legacyTitleMap[r.title] as keyof typeof t];
                            return r.title;
                          };

                          const getDesc = (r: any) => {
                            if (r.translation_key_desc && t[r.translation_key_desc as keyof typeof t]) return t[r.translation_key_desc as keyof typeof t];
                            // Try exact match on description or fallback to title-based mapping for description if description match fails
                            if (legacyDescMap[r.description] && t[legacyDescMap[r.description] as keyof typeof t]) return t[legacyDescMap[r.description] as keyof typeof t];
                            // Fallback: if we mapped the title, try to map the description using the same key convention (title_key -> desc_key)
                            if (legacyTitleMap[r.title]) {
                              const descKey = legacyTitleMap[r.title].replace('_title', '_desc');
                              if (t[descKey as keyof typeof t]) return t[descKey as keyof typeof t];
                            }
                            return r.description;
                          };

                          return (
                            <div key={i} className="group p-4 rounded-xl bg-white dark:bg-[#1E1E24] border border-border/40 hover:border-primary/30 transition-all">
                              <div className="flex items-start gap-4">
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${rec.priority === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                  rec.priority === 'high' ? 'bg-orange-500' : 'bg-emerald-500'
                                  }`} />
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {getTitle(rec)}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {getDesc(rec)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        {t.noPendingActions}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Authority Sources & Content Optimization Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AuthoritySourcesCard
                    sources={analysis?.results?.authority_nexus?.citations || []}
                  />
                  <ContentOptimizationCard
                    analysis={analysis}
                  />
                </div>

                {/* Advanced AEO Intelligence Section - Moved to Main Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t.advancedAeoIntelligence || "Inteligencia AEO Avanzada"}</h3>
                      <p className="text-sm text-muted-foreground">{t.advancedAeoDesc || "Análisis profundo de tu presencia en respuestas de IA"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LLMOptimizationCard analysis={analysis} />

                    <HallucinationCard
                      brandId={id}
                      brandName={brand.name}
                      domain={brand.domain}
                    />

                    <EntityTracker
                      brandId={id}
                      brandName={brand.name}
                    />
                  </div>

                  <PromptDiscovery
                    brandName={brand.name}
                    industry={brand.industry}
                  />
                </div>

                {/* Top Keywords Preview */}
                <Card className="border-border/50 shadow-sm rounded-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" />
                        {t.topPerformingKeywords}
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs" asChild>
                        <Link href={`/brand/${id}/keywords`}>{t.viewAll} <ArrowRight className="w-3 h-3 ml-1" /></Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {keywords.slice(0, 5).map((kw) => (
                        <div key={kw.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                          <span className="text-sm font-medium text-foreground">{kw.keyword}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">{kw.search_volume?.toLocaleString() || '-'} vol</span>
                            <Badge variant="outline" className={`${(kw.ai_visibility_score || 0) > 70 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-secondary text-muted-foreground'
                              }`}>
                              {kw.ai_visibility_score ? `${Math.round(kw.ai_visibility_score)}%` : '-'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {keywords.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          {t.noKeywordsTracked}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Authority Nexus */}
                <Card className="border-border/50 shadow-sm rounded-xl">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                        {t.authorityNexus}
                      </CardTitle>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            {t.viewStrategy}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
                          <DialogHeader>
                            <DialogTitle>{t.authorityNexusStrategy}</DialogTitle>
                            <DialogDescription>
                              {t.buildAuthorityGraph}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex-1 overflow-hidden mt-4">
                            <AuthorityNexus
                              brandName={brand.name}
                              citations={analysis?.results?.authority_nexus?.citations}
                              score={analysis?.results?.authority_nexus?.score}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                          {t.authorityScore}
                        </span>
                        <div className="flex items-end gap-1 mt-1">
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {analysis?.results?.authority_nexus?.score || 0}
                          </span>
                          <span className="text-sm text-gray-400 mb-1">/ 100</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                          {t.missingCitations}
                        </span>
                        <div className="flex items-end gap-1 mt-1">
                          <span className="text-3xl font-bold text-red-500">
                            {analysis?.results?.authority_nexus?.citations?.filter((c: any) => c.status === 'missing' && c.impact === 'high').length || 0}
                          </span>
                          <span className="text-sm text-gray-400 mb-1">{t.critical}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Share of Model */}
                <Card className="border-border/50 shadow-sm rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                      {t.shareOfModel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ShareOfModel
                      brandName={brand.name}
                      brandId={brand.id}
                      lastUpdated={lastUpdated}
                    />
                  </CardContent>
                </Card>

              </div>

              {/* Sidebar (1/3) */}
              <div className="space-y-6 md:space-y-8 min-w-0 overflow-hidden">

                {/* Competitors Preview */}
                <Card className="border-border/50 shadow-sm rounded-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">{t.competitors}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <Activity className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-[90vw] h-[85vh] flex flex-col">
                            <DialogHeader>
                              <DialogTitle>{t.competitorContentGapAnalysis}</DialogTitle>
                              <DialogDescription>
                                {t.competitorsOutperforming}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-hidden mt-4">
                              <CompetitorGapAnalysis
                                brandName={brand.name}
                                brandId={brand.id}
                                competitors={competitors}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/brand/${id}/competitors`}><ArrowRight className="w-4 h-4" /></Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {competitors.slice(0, 4).map((comp) => (
                        <div key={comp.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center overflow-hidden">
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${comp.domain}&sz=32`}
                                alt={comp.name}
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-bold text-muted-foreground">${comp.name.charAt(0)}</span>`
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-foreground">{comp.name}</span>
                          </div>
                          <span className="text-xs font-mono font-medium text-muted-foreground">
                            {comp.visibility_score ? `${comp.visibility_score}%` : '-'}
                          </span>
                        </div>
                      ))}
                      {competitors.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-xs">
                          {t.noCompetitorsAdded}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Health */}
                <Card className="border-border/50 shadow-sm rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-500" />
                      {t.technicalHealth}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {technicalAeo ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{t.aeoReadiness}</span>
                            <span className={`font-medium ${technicalAeo.aeo_readiness_score >= 80 ? 'text-emerald-600' :
                              technicalAeo.aeo_readiness_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                              {technicalAeo.aeo_readiness_score >= 80 ? t.excellent :
                                technicalAeo.aeo_readiness_score >= 50 ? t.good : t.needsWork}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full w-full transition-all duration-1000 ${technicalAeo.aeo_readiness_score >= 80 ? 'bg-emerald-500' :
                                technicalAeo.aeo_readiness_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                              style={{ width: `${technicalAeo.aeo_readiness_score}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Mic className="w-3.5 h-3.5" />
                              {t.voiceReadiness}
                            </span>
                            <span className={`font-medium ${technicalAeo.voice_readiness_score && technicalAeo.voice_readiness_score >= 80 ? 'text-emerald-600' :
                              technicalAeo.voice_readiness_score && technicalAeo.voice_readiness_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                              {technicalAeo.voice_readiness_score && technicalAeo.voice_readiness_score >= 80 ? t.excellent :
                                technicalAeo.voice_readiness_score && technicalAeo.voice_readiness_score >= 50 ? t.good : t.needsWork}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full w-full transition-all duration-1000 ${technicalAeo.voice_readiness_score && technicalAeo.voice_readiness_score >= 80 ? 'bg-emerald-500' :
                                technicalAeo.voice_readiness_score && technicalAeo.voice_readiness_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                              style={{ width: `${technicalAeo.voice_readiness_score || 0}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{t.schemaMarkup}</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${technicalAeo.total_schemas && technicalAeo.total_schemas > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {technicalAeo.total_schemas && technicalAeo.total_schemas > 0 ? `${technicalAeo.total_schemas} ${t.types}` : t.missing}
                              </span>
                              {(!technicalAeo.total_schemas || technicalAeo.total_schemas === 0) && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-900/20">
                                      {t.fixIt}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                                    <DialogHeader>
                                      <DialogTitle>{t.schemaGenerator}</DialogTitle>
                                      <DialogDescription>
                                        {t.generateMissingCode}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex-1 overflow-hidden mt-4">
                                      <SchemaGenerator
                                        brandName={brand.name}
                                        brandUrl={brand.domain}
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {technicalAeo.schema_types?.slice(0, 3).map((schema, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">
                                {schema}
                              </span>
                            ))}
                            {technicalAeo.schema_types?.length && technicalAeo.schema_types.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">
                                +{technicalAeo.schema_types.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className={`w-1.5 h-1.5 rounded-full ${technicalAeo.https_enabled ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            HTTPS
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className={`w-1.5 h-1.5 rounded-full ${technicalAeo.mobile_responsive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            Mobile
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className={`w-1.5 h-1.5 rounded-full ${technicalAeo.response_time_ms && technicalAeo.response_time_ms < 500 ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                            Speed ({technicalAeo.response_time_ms ?? '-'}ms)
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className={`w-1.5 h-1.5 rounded-full ${technicalAeo.has_faq ? 'bg-emerald-500' : 'bg-secondary'}`} />
                            FAQ Schema
                          </div>
                        </div>


                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-xs">
                        {t.noTechnicalData}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Authority Sources */}
                <AuthoritySourcesCard
                  sources={analysis?.results?.authority_nexus?.citations?.map((c: any) => ({
                    source: c.source,
                    type: c.type || 'Unknown',
                    authority: c.authority || 0,
                    status: c.status === 'present' ? 'present' : 'missing',
                    impact: c.impact || 'medium',
                    url: c.url
                  }))}
                />

                {/* Content Optimization */}
                <ContentOptimizationCard analysis={analysis} />

                {/* Visual Opportunities */}
                {analysis?.results?.visual_suggestions && (
                  <VisualOpportunitiesCard opportunities={analysis.results.visual_suggestions} />
                )}

                {/* Sentiment Analysis - NEW */}
                <SentimentAnalysisCard
                  brandId={id}
                  brandName={brand.name}
                  lastUpdated={lastUpdated}
                />

                {/* Prompt Tracking */}
                <PromptTracker
                  brandId={id}
                  brandName={brand.name}
                  competitors={competitors.map(c => c.name)}
                  lastUpdated={lastUpdated}
                />

              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
