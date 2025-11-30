'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Globe, Trash2, ArrowRight, Activity, Search, ShieldCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
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
import { MetricTab } from "@/components/dashboard/metric-tab"

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
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex items-center justify-center h-screen bg-[#fdfdfc] dark:bg-[#050505]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#fdfdfc] dark:bg-[#050505] h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 bg-[#fdfdfc] dark:bg-[#050505] border-b border-border/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center overflow-hidden shadow-sm">
              <img
                src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`}
                alt={`${brand.name} logo`}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerText = brand.name.charAt(0).toUpperCase();
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{brand.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Globe className="w-3.5 h-3.5" />
                <a href={brand.domain} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  {brand.domain}
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/30">
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

        <main className="flex-1 overflow-y-auto p-8 bg-[#fdfdfc] dark:bg-[#050505]">
          <div className="max-w-7xl mx-auto space-y-8">

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
                <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        {t.actionableInsights}
                      </CardTitle>
                      <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                        {technicalAeo?.recommendations?.length || 0} Pending
                      </Badge>
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
                <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
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

              </div>

              {/* Sidebar (1/3) */}
              <div className="space-y-8">

                {/* Competitors Preview */}
                <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">Competitors</CardTitle>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/brand/${id}/competitors`}><ArrowRight className="w-4 h-4" /></Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {competitors.slice(0, 4).map((comp) => (
                        <div key={comp.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {comp.name.charAt(0)}
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
                <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-500" />
                      Technical Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Schema Markup</span>
                          <span className="font-medium text-emerald-600">Good</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[85%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Site Speed</span>
                          <span className="font-medium text-yellow-600">Average</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 w-[60%]" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
