'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { UserAvatarMenu } from '@/components/layout/user-avatar-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Download, Play, RefreshCw, Plus } from 'lucide-react'
import { AnalysisProgressToast } from '@/components/shared/AnalysisProgressToast'
import { BrandSwitcher } from "@/components/shared/BrandSwitcher"
import { PromptsChat } from '@/features/prompts/components/PromptsChat'

// Imports from same feature
import { VisibilityTab } from './VisibilityTab'
import { OptimizeTab } from './OptimizeTab'
import { CompetitorsTab } from './CompetitorsTab'
import { useBrandData, type UseBrandDataProps } from '../hooks/useBrandData'

// i18n
import { useTranslations } from '@/lib/i18n'

// Loading skeleton for tab content
function TabSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl space-y-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                ))}
            </div>
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-4">
                <Skeleton className="h-4 w-32" />
                <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    )
}

export function BrandClient(props: UseBrandDataProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // We can use the simple hook for translations instead of the async/state one if available, 
    // or keep the pattern. The original used getTranslations(lang).
    // Let's assume useTranslations hook exists (it was used in DashboardClient).
    const { t } = useTranslations()

    const activeTab = searchParams.get('tab') || 'visibility'

    // Use Custom Hook
    const {
        brand,
        brands,
        competitors,
        visibility,
        insights,
        citations,
        hallucinations,
        sentiment,
        prompts,
        recommendations,
        enhancedGEO,
        loading,
        analyzing,
        analysisTrigger,
        handleAnalysisComplete,
        handleRunAnalysis,
        handleDataRefresh,
        handleExport,
        handleAddCompetitor
    } = useBrandData(props)

    // Handle invalid tab redirection
    useEffect(() => {
        if (brand && activeTab && !['overview', 'visibility', 'optimize', 'competitors', 'prompts'].includes(activeTab)) {
            router.push('/dashboard')
        }
    }, [activeTab, brand, router])

    // Render content based on active tab
    const renderContent = useMemo(() => {
        if (!brand) return null
        
        // Show skeleton while loading data
        if (loading) {
            return <TabSkeleton />
        }

        switch (activeTab) {
            case 'visibility':
                return (
                    <VisibilityTab
                        brandId={brand.id}
                        brandName={brand.name}
                        citations={citations}
                        hallucinations={hallucinations}
                        sentiment={sentiment}
                        prompts={prompts}
                        enhancedGEO={enhancedGEO}
                    />
                )
            case 'optimize':
                return (
                    <OptimizeTab
                        brandId={brand.id}
                        brandName={brand.name}
                        domain={brand.domain}
                        industry={brand.industry}
                        recommendations={recommendations}
                    />
                )
            case 'competitors':
                return (
                    <CompetitorsTab
                        brandId={brand.id}
                        brandName={brand.name}
                        brandScore={visibility?.overall_score ?? 0}
                        brandTrend={visibility?.trend ?? 0}
                        competitors={competitors}
                    />
                )
            case 'prompts':
                return (
                    <PromptsChat brandId={brand.id} brandName={brand.name} brandDomain={brand.domain} />
                )
            default:
                return null
        }
    }, [activeTab, brand, loading, analyzing, visibility, insights, citations, hallucinations, sentiment, prompts, recommendations, competitors])

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                {/* Header with Actions */}
                <header className="flex items-center justify-between px-6 py-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-1" />

                        {/* Brand Dropdown */}
                        <div className="relative group">
                            {brand && (
                                <BrandSwitcher
                                    brands={brands}
                                    selectedBrand={brand}
                                    activeTab={activeTab || undefined}
                                />
                            )}
                        </div>
                    </div>

                    {/* Action Buttons - Context-aware */}
                    <div className="flex items-center gap-3">
                        {activeTab === 'overview' && (
                            <>
                                <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                                    <Download className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t.export}</span>
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleRunAnalysis}
                                    disabled={analyzing}
                                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {analyzing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Play className="h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">{analyzing ? t.analyzingBrand : t.new_analysis}</span>
                                </Button>
                            </>
                        )}
                        {activeTab === 'visibility' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRunAnalysis}
                                disabled={analyzing}
                                className="gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">{t.refresh}</span>
                            </Button>
                        )}
                        {activeTab === 'competitors' && (
                            <Button
                                size="sm"
                                onClick={handleAddCompetitor}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">{t.add_competitor}</span>
                            </Button>
                        )}
                        <UserAvatarMenu />
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-y-auto shadow-2xl p-6">
                    {renderContent}
                </main>

                {/* Analysis Progress Toast */}
                <AnalysisProgressToast
                    brandId={props.brandId}
                    onComplete={handleAnalysisComplete}
                    onDataAvailable={handleDataRefresh}
                    analysisTrigger={analysisTrigger}
                />
            </SidebarInset>
        </SidebarProvider>
    )
}
