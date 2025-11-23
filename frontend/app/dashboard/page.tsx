'use client'

import { useEffect, useState } from "react"
import { Info, ArrowUp, LayoutDashboard, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { PageHeader } from '@/components/page-header'
import { useTranslations } from '@/lib/i18n'
import { brandsService, Brand } from "@/lib/services/brands"
import { analysisService, Analysis } from "@/lib/services/analysis"
import Link from "next/link"

export default function DashboardPage() {
  const { t } = useTranslations()
  const [brands, setBrands] = useState<Brand[]>([])
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await brandsService.getAll()
        setBrands(data)

        // Fetch latest analysis for each brand
        const analysesMap: Record<string, Analysis> = {}
        await Promise.all(data.map(async (brand) => {
          try {
            const brandAnalyses = await analysisService.getAll(brand.id)
            if (brandAnalyses.length > 0) {
              // Sort by created_at desc
              brandAnalyses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              analysesMap[brand.id] = brandAnalyses[0]
            }
          } catch (e) {
            console.error(`Failed to fetch analysis for brand ${brand.id}`, e)
          }
        }))
        setAnalyses(analysesMap)

      } catch (err) {
        console.error("Failed to fetch brands:", err)
        setError("Failed to load brands. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchBrands()
  }, [])

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
           <div className="flex items-center justify-center h-screen text-emerald-600">Loading...</div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          icon={<LayoutDashboard className="h-5 w-5 text-emerald-600" />}
          title={t.dashboard}
        />

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          
          {brands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-emerald-100 dark:bg-emerald-900/20 p-4 rounded-full mb-4">
                <LayoutDashboard className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-[#0A0A0A] dark:text-white">Welcome to Mentha</h2>
              <p className="text-gray-500 mb-6 max-w-md">
                Start by adding your first brand to track its visibility across AI search engines.
              </p>
              <Link href="/brand/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Brand
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-semibold text-[#0A0A0A] dark:text-white">{t.rankingMovements}</h1>
                <Link href="/brand/new">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Brand
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Brand Overview - Real Data */}
                <Card className="p-6 bg-white dark:bg-black">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.brandOverview}</h2>
                    <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="space-y-4">
                    {brands.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full overflow-hidden bg-white flex items-center justify-center border border-gray-100`}>
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=64`}
                              alt={`${brand.name} logo`}
                              className="w-4 h-4 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden w-full h-full bg-emerald-600 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {brand.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-[#0A0A0A] dark:text-white">{brand.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {analyses[brand.id] ? (
                            <div className="flex flex-col items-end">
                              <span className={`text-lg font-bold ${
                                (analyses[brand.id].score || 0) >= 70 ? 'text-emerald-600' : 
                                (analyses[brand.id].score || 0) >= 40 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {analyses[brand.id].score !== undefined ? Math.round(analyses[brand.id].score!) : '-'}
                              </span>
                              <span className="text-xs text-gray-400 capitalize">{analyses[brand.id].status}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">No data yet</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                
                {/* Placeholder for Competitors */}
                 <Card className="p-6 bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] shadow-sm flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                        <p className="text-gray-400 text-sm mb-2">Competitor analysis</p>
                        <p className="text-xs text-gray-500">Add competitors to your brands to see them here.</p>
                    </div>
                 </Card>
              </div>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}





