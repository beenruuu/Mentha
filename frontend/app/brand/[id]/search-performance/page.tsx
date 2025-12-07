'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from '@/lib/i18n'
import BrandKeywordsPage from '../keywords/page'
import BrandQueriesPage from '../queries/page'
import CrawlersPage from '../crawlers/page'

export default function SearchPerformancePage() {
    const params = useParams<{ id: string }>()
    const brandId = params?.id
    const { t } = useTranslations()

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                <header className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-1" />
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Search Performance</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden">
                    <Tabs defaultValue="keywords" className="h-full flex flex-col">
                        <div className="px-6 pt-4">
                            <TabsList>
                                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                                <TabsTrigger value="queries">Search Queries</TabsTrigger>
                                <TabsTrigger value="crawlers">AI Crawlers</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <TabsContent value="keywords" className="mt-0 h-full">
                                <BrandKeywordsPage isEmbedded={true} />
                            </TabsContent>
                            <TabsContent value="queries" className="mt-0 h-full">
                                <BrandQueriesPage isEmbedded={true} />
                            </TabsContent>
                            <TabsContent value="crawlers" className="mt-0 h-full">
                                <CrawlersPage isEmbedded={true} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
