'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from '@/lib/i18n'
import { brandsService, Brand } from '@/lib/services/brands'
import BrandKeywordsPage from '../keywords/page'
import BrandQueriesPage from '../queries/page'
import CrawlersPage from '../crawlers/page'

function SearchPerformanceSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-28" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>
            <Skeleton className="h-64 rounded-xl" />
        </div>
    )
}

export default function SearchPerformancePage() {
    const params = useParams<{ id: string }>()
    const brandId = params?.id
    const { t } = useTranslations()
    const [brand, setBrand] = useState<Brand | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!brandId) return

        const fetchBrand = async () => {
            try {
                const brandData = await brandsService.getById(brandId)
                setBrand(brandData)
            } catch (error) {
                console.error('Failed to load brand:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchBrand()
    }, [brandId])

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-1" />
                        <div className="flex items-center gap-2">
                            {brand && (
                                <>
                                    <Link href={`/brand/${brandId}`} className="text-sm text-gray-500 hover:text-primary">
                                        {brand.name}
                                    </Link>
                                    <span className="text-gray-400">/</span>
                                </>
                            )}
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                                Search Performance
                            </h1>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex flex-col shadow-2xl relative z-10">
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        {loading ? (
                            <SearchPerformanceSkeleton />
                        ) : (
                            <Tabs defaultValue="keywords" className="space-y-6">
                                <TabsList className="bg-gray-100 dark:bg-zinc-800">
                                    <TabsTrigger value="keywords">Keywords</TabsTrigger>
                                    <TabsTrigger value="queries">Search Queries</TabsTrigger>
                                    <TabsTrigger value="crawlers">AI Crawlers</TabsTrigger>
                                </TabsList>

                                <TabsContent value="keywords" className="mt-0">
                                    <BrandKeywordsPage isEmbedded={true} />
                                </TabsContent>
                                <TabsContent value="queries" className="mt-0">
                                    <BrandQueriesPage isEmbedded={true} />
                                </TabsContent>
                                <TabsContent value="crawlers" className="mt-0">
                                    <CrawlersPage isEmbedded={true} />
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
