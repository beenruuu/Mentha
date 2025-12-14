'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Globe, Trash2, ArrowRight, Activity, Search, ShieldCheck, Sparkles, Network, PieChart as PieChartIcon, Mic, BookOpen } from 'lucide-react'
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
import { useRouter } from "next/navigation"
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
import { ContentOptimizationCard } from "@/components/analysis/content-optimization-card"
import { VisualOpportunitiesCard } from "@/components/analysis/visual-opportunities-card"
import { AuthoritySourcesCard } from "@/components/analysis/authority-sources-card"

export default function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslations()
  const { id } = use(params)
  const router = useRouter()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [technicalAeo, setTechnicalAeo] = useState<TechnicalAEO | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
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
          analysesData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          setAnalysis(analysesData[0])
        }
      } catch (error) {
        console.error('Failed to fetch brand data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

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
      <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
        {/* Header - matches dashboard style */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center overflow-hidden shadow-sm">
              <img
                src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=64`}
                alt={`${brand.name} logo`}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerText = brand.name.charAt(0).toUpperCase();
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
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
        <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex flex-col shadow-2xl relative z-10">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
            <div className="space-y-8">

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricTab
                  label="AEO Readiness"
                  value={`${Math.round(technicalAeo?.aeo_readiness_score || 0)}%`}
                  trend={5}
                  isActive={false}
                  onClick={() => { }}
                />
                <MetricTab
                  label="Tracked Keywords"
                  value={keywords.length.toString()}
                  trend={keywords.length > 0 ? 100 : 0}
                  isActive={false}
                  onClick={() => { }}
                />
                <MetricTab
                  label="Competitors"
                  value={competitors.length.toString()}
                  trend={0}
                  isActive={false}
                  onClick={() => { }}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (2/3) */}
                <div className="lg:col-span-2 space-y-8">

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
                                Simulate Answer
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                              <AIAnswerPreview brandName={brand.name} defaultKeyword={keywords[0]?.keyword || ''} />
                            </DialogContent>
                          </Dialog>
                          <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                            {technicalAeo?.recommendations?.length || 0} Pending
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {technicalAeo?.recommendations && technicalAeo.recommendations.length > 0 ? (
                        <div className="space-y-3">
                          {technicalAeo.recommendations.slice(0, 3).map((rec: any, i: number) => (
                            <div key={i} className="group p-4 rounded-xl bg-white dark:bg-[#1E1E24] border border-border/40 hover:border-primary/30 transition-all">
                              <div className="flex items-start gap-4">
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${rec.priority === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                  rec.priority === 'high' ? 'bg-orange-500' : 'bg-emerald-500'
                                  }`} />
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {rec.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No pending actions. Great job!
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Keywords Preview */}
                  <Card className="border-border/50 shadow-sm rounded-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <Search className="w-5 h-5 text-blue-500" />
                          Top Performing Keywords
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs" asChild>
                          <Link href={`/brand/${id}/keywords`}>View All <ArrowRight className="w-3 h-3 ml-1" /></Link>
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
                            No keywords tracked yet.
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
                          Authority Nexus
                        </CardTitle>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              View Strategy
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl h-[600px] flex flex-col">
                            <DialogHeader>
                              <DialogTitle>Authority Nexus Strategy</DialogTitle>
                              <DialogDescription>
                                Build your brand's authority graph to dominate AI citations.
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
                            Authority Score
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
                            Missing Citations
                          </span>
                          <div className="flex items-end gap-1 mt-1">
                            <span className="text-3xl font-bold text-red-500">
                              {analysis?.results?.authority_nexus?.citations?.filter((c: any) => c.status === 'missing' && c.impact === 'high').length || 0}
                            </span>
                            <span className="text-sm text-gray-400 mb-1">critical</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Share of Model */}
                  <Card className="border-border/50 shadow-sm rounded-xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                        Share of Model
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ShareOfModel brandName={brand.name} brandId={brand.id} />
                    </CardContent>
                  </Card>

                </div>

                {/* Sidebar (1/3) */}
                <div className="space-y-8">

                  {/* Competitors Preview */}
                  <Card className="border-border/50 shadow-sm rounded-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Competitors</CardTitle>
                        <div className="flex items-center gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                <Activity className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-[90vw] h-[85vh] flex flex-col">
                              <DialogHeader>
                                <DialogTitle>Competitor Content Gap Analysis</DialogTitle>
                                <DialogDescription>
                                  See where your competitors are outperforming you in content coverage.
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
                            No competitors added.
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
                        Technical Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {technicalAeo ? (
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">AEO Readiness</span>
                              <span className={`font-medium ${technicalAeo.aeo_readiness_score >= 80 ? 'text-emerald-600' :
                                technicalAeo.aeo_readiness_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {technicalAeo.aeo_readiness_score >= 80 ? 'Excellent' :
                                  technicalAeo.aeo_readiness_score >= 50 ? 'Good' : 'Needs Work'}
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
                                Voice Readiness
                              </span>
                              <span className={`font-medium ${technicalAeo.voice_readiness_score && technicalAeo.voice_readiness_score >= 80 ? 'text-emerald-600' :
                                technicalAeo.voice_readiness_score && technicalAeo.voice_readiness_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {technicalAeo.voice_readiness_score && technicalAeo.voice_readiness_score >= 80 ? 'Excellent' :
                                  technicalAeo.voice_readiness_score && technicalAeo.voice_readiness_score >= 50 ? 'Good' : 'Needs Work'}
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
                              <span className="text-muted-foreground">Schema Markup</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${technicalAeo.total_schemas && technicalAeo.total_schemas > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {technicalAeo.total_schemas && technicalAeo.total_schemas > 0 ? `${technicalAeo.total_schemas} Types` : 'Missing'}
                                </span>
                                {(!technicalAeo.total_schemas || technicalAeo.total_schemas === 0) && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-900/20">
                                        Fix it
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                                      <DialogHeader>
                                        <DialogTitle>Schema Generator</DialogTitle>
                                        <DialogDescription>
                                          Generate the missing JSON-LD code to help AI understand your brand.
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
                          No technical audit data available.
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
                </div>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
