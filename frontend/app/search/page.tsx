'use client'

import { useState, useEffect } from 'react'
import { Search, Clock, TrendingUp, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { PageHeader } from "@/components/page-header"
import { useTranslations } from '@/lib/i18n'
import Link from "next/link"
import { brandsService, Brand } from '@/lib/services/brands'

export default function SearchPage() {
  const { t } = useTranslations()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    try {
      const data = await brandsService.getAll()
      setBrands(data)
    } catch (error) {
      console.error('Failed to load brands:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          icon={<Search className="h-5 w-5 text-emerald-600" />}
          title={t.searchTitle}
        />

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">{t.searchTitle}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">{t.searchDescription}</p>
          </div>

          <div className="max-w-2xl mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder={t.searchBrands}
                className="pl-12 pr-4 py-6 text-base bg-white dark:bg-black border-gray-300 dark:border-[#2A2A30]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">{t.recentSearches}</h2>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t.noRecentSearches || "No recent searches"}</p>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">{t.popularSearches}</h2>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t.noPopularSearches || "No popular searches"}</p>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-white dark:bg-black">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">{t.quickAccess}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {brands.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic col-span-full">{t.noBrandsFound || "No brands found"}</p>
              ) : (
                brands.map((brand) => (
                  <Link key={brand.id} href={`/brand/${brand.id}`}>
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-black">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img 
                            src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=64`}
                            alt={brand.name}
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.parentElement!.innerText = brand.name.substring(0, 2).toUpperCase()
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{brand.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">0 {t.queriesLowercase}</p>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}





