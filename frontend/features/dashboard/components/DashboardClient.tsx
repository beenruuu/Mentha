'use client'

import { useState } from "react"
import Image from "next/image"
import {
    Calendar as CalendarIcon,
    Settings,
    ChevronDown,
    ArrowLeft
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu"
import { useTranslations } from "@/lib/i18n"
import { type Brand } from "@/features/brand/api/brands"
import { type Competitor } from "@/features/competitors/api/competitors"

import { InsightsCard } from "./InsightsCard"
import { LanguageComparisonCard } from "./LanguageComparisonCard"
import { RegionalComparisonCard } from "./RegionalComparisonCard"
import { LocalMarketCard } from "./LocalMarketCard"
import { BrandSwitcher } from "@/components/shared/BrandSwitcher"
import { RainbowButton } from "@/components/ui/rainbow-button"
import { openUpgradeModal } from "@/components/shared/upgrade-modal"

// New Imports
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData"
import { DashboardChart, AI_PROVIDER_META } from "./DashboardChart"
import { CompetitorPerformance } from "./CompetitorPerformance"
import { ModelPerformance } from "./ModelPerformance"

type Period = 'last_week' | 'last_month' | 'last_quarter'
type ChartType = 'line' | 'area'

const periodLabels: Record<Period, string> = {
    last_week: 'Last Week',
    last_month: 'Last Month',
    last_quarter: 'Last Quarter',
}

const periodToDays: Record<Period, number> = {
    last_week: 7,
    last_month: 30,
    last_quarter: 90,
}

interface DashboardClientProps {
    initialBrands: Brand[]
    initialBrand: Brand
    initialCompetitors: Competitor[]
}

export function DashboardClient(props: DashboardClientProps) {
    const { t } = useTranslations()

    // 1. Hook Integration
    const {
        brands,
        selectedBrand,
        competitors,
        analysis,
        chartData,
        modelPerformance,
        loading,
        handleBrandChange: onBrandChange,
        handleDeleteBrand
    } = useDashboardData(props)

    // 2. UI Local State
    const [activeMetric, setActiveMetric] = useState<'rank' | 'position' | 'inclusion'>('rank')
    const [viewingCompetitor, setViewingCompetitor] = useState<Competitor | null>(null)
    
    // Chart Config
    const [period, setPeriod] = useState<Period>('last_month')
    const [selectedDays, setSelectedDays] = useState(30) // Used for fetching
    const [chartType, setChartType] = useState<ChartType>('area')
    const [showGrid, setShowGrid] = useState(true)
    const [visibleModels, setVisibleModels] = useState<Record<string, boolean>>({
        chatgpt: true,
        claude: true,
        perplexity: true,
        gemini: true,
    })

    // Handlers wrapper
    const handlePeriodChange = (newPeriod: Period) => {
        setPeriod(newPeriod)
        const days = periodToDays[newPeriod]
        setSelectedDays(days)
        if (selectedBrand) {
             onBrandChange(selectedBrand, days)
        }
    }

    const toggleModel = (modelId: string) => {
        setVisibleModels(prev => ({
            ...prev,
            [modelId]: !prev[modelId],
        }))
    }

    const resetChartSettings = () => {
        setChartType('area')
        setShowGrid(true)
        setVisibleModels({
            chatgpt: true,
            claude: true,
            perplexity: true,
            gemini: true,
        })
    }

    // Calculated Metrics
    const currentRank = Object.keys(modelPerformance).length > 0
        ? Math.round(Object.values(modelPerformance).reduce((a, b) => a + b, 0) / Object.values(modelPerformance).length)
        : (analysis?.score ? Math.round(analysis.score) : 0)

    const currentPosition = analysis?.avg_position ? Math.round(analysis.avg_position) : 0
    const currentInclusion = analysis?.inclusion_rate ? Math.round(analysis.inclusion_rate * 100) : 0

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">

                {/* HEADER */}
                <header className="flex items-center justify-between px-6 py-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-1" />

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

                        {selectedBrand && !viewingCompetitor && (
                            <BrandSwitcher
                                brands={brands}
                                selectedBrand={selectedBrand}
                                onSelect={(b) => onBrandChange(b, selectedDays)}
                                onDelete={(id) => handleDeleteBrand(id, selectedDays)}
                            />
                        )}

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
                        <UserAvatarMenu />
                    </div>
                </header>

                {/* MAIN CONTENT */}
                <main className="dashboard-main flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex flex-col shadow-2xl relative z-10">
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                            {/* LEFT COLUMN: Metric Tabs & Chart */}
                            <div className="lg:col-span-8 space-y-3">
                                
                                {/* Metric Tabs */}
                                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-[#1A1A20] pb-1">
                                    {(['rank', 'position', 'inclusion'] as const).map((metric) => (
                                        <button
                                            key={metric}
                                            onClick={() => setActiveMetric(metric)}
                                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all relative ${activeMetric === metric
                                                ? 'text-emerald-600 dark:text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            {metric === 'rank' && t.dashboardRankScore}
                                            {metric === 'position' && t.dashboardAvgPosition}
                                            {metric === 'inclusion' && t.dashboardInclusionRate}
                                            {activeMetric === metric && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                                        </button>
                                    ))}
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
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-card text-card-foreground rounded-lg border flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-border/50">
                                            <h3 className="font-medium text-sm sm:text-base">{t.dashboardAIVisibility || 'AI Visibility'}</h3>
                                            <div className="flex items-center gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-7 gap-1.5">
                                                            <CalendarIcon className="size-3.5" />
                                                            <span className="text-sm">{periodLabels[period]}</span>
                                                            <ChevronDown className="size-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {(Object.keys(periodLabels) as Period[]).map((p) => (
                                                            <DropdownMenuItem key={p} onClick={() => handlePeriodChange(p)}>
                                                                {periodLabels[p]} {period === p && "✓"}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="icon" className="size-7">
                                                            <Settings className="size-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger>Chart Type</DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent>
                                                                <DropdownMenuItem onClick={() => setChartType('line')}>
                                                                    Line Chart {chartType === 'line' && "✓"}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setChartType('area')}>
                                                                    Area Chart {chartType === 'area' && "✓"}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuCheckboxItem
                                                            checked={showGrid}
                                                            onCheckedChange={setShowGrid}
                                                        >
                                                            Show Grid
                                                        </DropdownMenuCheckboxItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger>Show Models</DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent>
                                                                {AI_PROVIDER_META.map((provider) => (
                                                                    <DropdownMenuCheckboxItem
                                                                        key={provider.id}
                                                                        checked={visibleModels[provider.id]}
                                                                        onCheckedChange={() => toggleModel(provider.id)}
                                                                    >
                                                                        <span
                                                                            className="size-2 rounded-full mr-2"
                                                                            style={{ backgroundColor: provider.color }}
                                                                        />
                                                                        {provider.name}
                                                                    </DropdownMenuCheckboxItem>
                                                                ))}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={resetChartSettings}>
                                                            Reset to Default
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <div className="h-[250px] sm:h-[280px] w-full">
                                                <DashboardChart 
                                                    data={chartData}
                                                    chartType={chartType}
                                                    showGrid={showGrid}
                                                    activeMetric={activeMetric}
                                                    visibleModels={visibleModels}
                                                    loading={loading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Insights & Widgets */}
                            <div className="lg:col-span-4 space-y-4 pl-0 lg:pl-6 border-l border-transparent lg:border-gray-100 dark:lg:border-[#1A1A20]">

                                {selectedBrand && (
                                    <InsightsCard brandId={selectedBrand.id} />
                                )}

                                {selectedBrand && selectedBrand.business_scope === 'international' && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <LanguageComparisonCard brandId={selectedBrand.id} />
                                        <RegionalComparisonCard brandId={selectedBrand.id} />
                                    </div>
                                )}

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

                                <div className="p-4 rounded-xl bg-white dark:bg-gradient-to-br dark:from-[#111114] dark:to-black border border-gray-200 dark:border-gray-800 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl -mr-12 -mt-12" />
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 relative z-10">
                                        {t.dashboardUpgradeMessage}
                                    </p>
                                    <RainbowButton
                                        onClick={openUpgradeModal}
                                        className="w-full h-9 text-sm font-medium"
                                    >
                                        {t.upgradePlan}
                                    </RainbowButton>
                                </div>

                            </div>
                        </div>

                        {/* BOTTOM ROW: Competitors & Model Performance */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            
                            {selectedBrand && (
                                <CompetitorPerformance 
                                    viewingCompetitor={viewingCompetitor}
                                    selectedBrand={selectedBrand}
                                    competitors={competitors}
                                    currentRank={currentRank}
                                    onViewCompetitor={setViewingCompetitor}
                                />
                            )}
                            
                            <ModelPerformance modelPerformance={modelPerformance} />

                        </div>

                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
