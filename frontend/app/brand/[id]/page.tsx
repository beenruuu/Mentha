'use client'

import { MapPin, Globe, ExternalLink, Plus, Building2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { PageHeader } from '@/components/page-header'
import Link from "next/link"
import { useTranslations } from '@/lib/i18n'
import { use, useEffect, useState } from 'react'
import { brandsService, Brand } from "@/lib/services/brands"
import { competitorsService, Competitor } from "@/lib/services/competitors"
import { keywordsService, Keyword } from "@/lib/services/keywords"
import { analysisService, Analysis } from "@/lib/services/analysis"
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

export default function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslations()
  const { id } = use(params)
  const router = useRouter()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandData, competitorsData, keywordsData, analysesData] = await Promise.all([
          brandsService.getById(id),
          competitorsService.getAll(id),
          keywordsService.getAll(id),
          analysisService.getAll(id)
        ])
        setBrand(brandData)
        setCompetitors(competitorsData)
        setKeywords(keywordsData)
        
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

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!brand) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <div>{t.brandNotFound}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Helper to generate consistent colors
  const getBrandColors = (name: string) => {
    const colors = [
      { bg: 'bg-red-500', text: 'text-white' },
      { bg: 'bg-blue-500', text: 'text-white' },
      { bg: 'bg-green-500', text: 'text-white' },
      { bg: 'bg-yellow-500', text: 'text-white' },
      { bg: 'bg-purple-500', text: 'text-white' },
      { bg: 'bg-pink-500', text: 'text-white' },
      { bg: 'bg-indigo-500', text: 'text-white' },
      { bg: 'bg-black dark:bg-white', text: 'text-white dark:text-black' },
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  const brandColors = getBrandColors(brand.name)
  const brandIcon = brand.name.charAt(0).toUpperCase()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex items-center justify-between pr-4 md:pr-6 lg:pr-8">
          <PageHeader 
            icon={<Building2 className="h-5 w-5 text-emerald-600" />}
            title={brand.name}
          />
        </div>
        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          {/* Brand Header */}
          <Card className="p-6 bg-white dark:bg-black mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-gray-100">
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`}
                  alt={`${brand.name} logo`}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    // Fallback to initial if favicon fails
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className={`hidden w-full h-full ${brandColors.bg} flex items-center justify-center`}>
                  <span className={`text-xl font-bold ${brandColors.text}`}>
                    {brandIcon}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{brand.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{brand.description || 'No description available'}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                  {brand.industry && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>{brand.industry}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Globe className="w-4 h-4 shrink-0" />
                    <a href={brand.domain} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-300 truncate">
                      {brand.domain}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Sugerencias Accionables */}
          <Card className="p-6 bg-white dark:bg-black mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.actionableInsights}</h2>
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                {t.pendingActions.replace('{n}', analysis?.results?.recommendations?.length?.toString() || '0')}
              </Badge>
            </div>
            {analysis?.results?.recommendations && analysis.results.recommendations.length > 0 ? (
              <div className="space-y-3">
                {analysis.results.recommendations.slice(0, 3).map((rec: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#1E1E24]">
                    <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {typeof rec === 'string' ? rec : rec.title || rec.description}
                      </p>
                      {typeof rec !== 'string' && rec.description && (
                        <p className="text-xs text-gray-500 mt-1">{rec.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {analysis ? 'No specific recommendations found.' : 'Start an analysis to get recommendations.'}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Brand Overview */}
            <Card className="lg:col-span-2 p-6 bg-white dark:bg-black">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Resumen de Marca</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#2A2A30]">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white flex items-center justify-center border border-gray-100">
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=64`}
                        alt={`${brand.name} logo`}
                        className="w-4 h-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className={`hidden w-full h-full ${brandColors.bg} flex items-center justify-center`}>
                        <span className={`text-xs font-bold ${brandColors.text}`}>
                          {brandIcon}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{brand.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-bold ${
                      (analysis?.score || 0) >= 70 ? 'text-emerald-600' : 
                      (analysis?.score || 0) >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {analysis?.score ? `${Math.round(analysis.score)}/100` : 'Score pending'}
                    </div>
                  </div>
                </div>
                {competitors.length > 0 ? (
                  competitors.map((competitor) => {
                    const compColors = getBrandColors(competitor.name)
                    return (
                      <div key={competitor.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 shrink-0 ${compColors.bg} rounded-full flex items-center justify-center`}>
                            <span className={`text-xs font-bold ${compColors.text}`}>{competitor.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{competitor.name}</span>
                        </div>
                        <div className="text-sm text-gray-500">{competitor.visibility_score || '-'}</div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2">No competitors tracked</div>
                )}
              </div>
            </Card>

            {/* Potential Competitors - Placeholder */}
            <Card className="p-6 bg-white dark:bg-black">
              <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Competidores Potenciales
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Analysis required to identify potential competitors.
              </div>
            </Card>
          </div>

          {/* Queries Section */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.topQueries}</h2>
            <div className="space-y-3">
              {keywords.length > 0 ? (
                keywords.map((keyword) => (
                  <Link key={keyword.id} href={`/brand/${id}/query/${keyword.id}`}>
                    <Card className="p-4 bg-white dark:bg-black hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{keyword.keyword}</p>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="text-sm text-gray-500">No keywords tracked yet.</div>
              )}
            </div>
          </div>

          {/* Delete Brand Section */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
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
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


