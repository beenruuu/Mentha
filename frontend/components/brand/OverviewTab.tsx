'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
    Activity,
    AlertCircle,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Eye,
    Globe,
    LineChart,
    Sparkles,
    Target,
    Trophy,
    TrendingUp,
    TrendingDown
} from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

// AI Provider metadata
const AI_PROVIDERS = [
    { id: 'openai', name: 'ChatGPT', icon: '/providers/openai.svg?v=3', invert: true },
    { id: 'anthropic', name: 'Claude', icon: '/providers/claude-color.svg?v=3', invert: false },
    { id: 'perplexity', name: 'Perplexity', icon: '/providers/perplexity-color.svg?v=3', invert: false },
    { id: 'gemini', name: 'Gemini', icon: '/providers/gemini-color.svg?v=3', invert: false },
]

interface OverviewTabProps {
    brand: any
    visibility?: any
    insights?: any[]
    recommendations?: any[]
    competitors?: any[]
    technicalAeo?: any
    citations?: any[]
}

export function OverviewTab({
    brand,
    visibility,
    insights = [],
    recommendations = [],
    competitors = [],
    technicalAeo,
    citations = [],
}: OverviewTabProps) {
    const { t } = useTranslations()
    const overallScore = visibility?.overall_score ?? 0
    const trend = visibility?.trend ?? 0

    // Calculate derived stats from real data
    const pendingOptimizations = recommendations.filter(r => r.priority === 'high' || r.priority === 'medium').length
    const technicalScore = technicalAeo?.aeo_readiness_score ?? 0
    const optimizationProgress = technicalScore > 0 ? technicalScore : (pendingOptimizations > 0 ? Math.max(0, 100 - (pendingOptimizations * 15)) : 100)
    
    // Calculate rank among competitors
    const allScores = [
        { score: overallScore, isOwn: true },
        ...competitors.map(c => ({ score: c.visibility_score || c.score || 0, isOwn: false }))
    ].sort((a, b) => b.score - a.score)
    const currentRank = allScores.findIndex(s => s.isOwn) + 1
    const totalCompetitors = competitors.length + 1
    
    // Calculate citation stats
    const totalCitations = citations.length
    const positiveMentions = visibility?.models 
        ? Math.round((Object.values(visibility.models).filter((m: any) => m.sentiment === 'positive').length / Object.values(visibility.models).length) * 100)
        : 0

    // Generate dynamic visibility summary
    const getVisibilitySummary = () => {
        if (!visibility?.models || Object.keys(visibility.models).length === 0) {
            return { level: 'Sin datos', bestModel: null, worstModel: null }
        }
        
        const modelEntries = Object.entries(visibility.models) as [string, any][]
        const sorted = modelEntries.sort((a, b) => (b[1].score || 0) - (a[1].score || 0))
        
        const best = sorted[0]
        const worst = sorted[sorted.length - 1]
        
        const level = overallScore >= 70 ? 'Alta' : overallScore >= 40 ? 'Media' : 'Baja'
        const levelColor = overallScore >= 70 ? 'text-emerald-600' : overallScore >= 40 ? 'text-amber-600' : 'text-red-600'
        
        const modelNames: Record<string, string> = {
            openai: 'ChatGPT',
            anthropic: 'Claude',
            perplexity: 'Perplexity',
            gemini: 'Gemini'
        }
        
        return {
            level,
            levelColor,
            bestModel: best ? modelNames[best[0]] || best[0] : null,
            worstModel: worst && worst[1].score < 50 ? modelNames[worst[0]] || worst[0] : null
        }
    }
    const visibilitySummary = getVisibilitySummary()

    // Find competitive advantage (from analysis data)
    const getCompetitiveAdvantage = () => {
        if (recommendations.length === 0 && insights.length === 0) return null
        // Look for positive insights or strengths
        const strengthInsight = insights.find(i => i.type === 'leading_model' || i.type === 'overall_high' || i.type === 'consecutive_improvement')
        if (strengthInsight) return strengthInsight.title?.replace('lidera', '').trim() || 'Destacado'
        if (currentRank === 1) return 'Líder del sector'
        if (currentRank <= 3) return 'Top 3'
        return null
    }
    const competitiveAdvantage = getCompetitiveAdvantage()

    // Format relative time
    const formatRelativeTime = (dateStr?: string) => {
        if (!dateStr) return 'Recientemente'
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)
        
        if (diffMins < 1) return 'Ahora mismo'
        if (diffMins < 60) return `Hace ${diffMins} min`
        if (diffHours < 24) return `Hace ${diffHours}h`
        if (diffDays < 7) return `Hace ${diffDays}d`
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    }

    return (
        <div className="space-y-6">
            {/* Top Section: Brand Pulse (Health Score) */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* 1. Main Health Score */}
                <Card className="col-span-full lg:col-span-1 border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-900 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Activity className="w-24 h-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium text-gray-500 uppercase tracking-wider">{t.brand_health}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-4 mb-4">
                            <span className="text-6xl font-bold tracking-tighter text-gray-900 dark:text-white">
                                {overallScore}
                            </span>
                            <div className="mb-2">
                                <span className="text-sm font-medium text-gray-400 block uppercase text-[10px]">{t.global_score}</span>
                                <Badge
                                    variant="outline"
                                    className={`${trend >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'} gap-1`}
                                >
                                    {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {trend > 0 ? '+' : ''}{trend}% vs mes anterior
                                </Badge>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Tu marca tiene una visibilidad <span className={`font-medium ${visibilitySummary.levelColor || 'text-emerald-600'}`}>{visibilitySummary.level}</span>.
                            {visibilitySummary.bestModel && (
                                <> Rendimiento destacado en <span className="font-medium text-gray-900 dark:text-white">{visibilitySummary.bestModel}</span></>
                            )}
                            {visibilitySummary.worstModel && (
                                <>, pero requiere atención en <span className="font-medium text-gray-900 dark:text-white">{visibilitySummary.worstModel}</span></>
                            )}.
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Quick Actions / Status Summary Grid */}
                <div className="col-span-full lg:col-span-2 grid gap-4 grid-cols-1 md:grid-cols-3">

                    {/* Visibility Summary Card */}
                    <Link href={`/brand/${brand.id}?tab=visibility`} className="block h-full group">
                        <Card className="h-full border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 transition-all cursor-pointer hover:shadow-md">
                            <CardHeader className="pb-2 space-y-0 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-blue-500" />
                                    {t.brand_visibility}
                                </CardTitle>
                                <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Citas Totales</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{totalCitations}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Menciones Positivas</span>
                                        <span className="font-bold text-emerald-600">{positiveMentions}%</span>
                                    </div>
                                    <div className="pt-2 flex gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                                        {AI_PROVIDERS.map(p => (
                                            <Image key={p.id} src={p.icon} alt={p.name} width={12} height={12} className={p.invert ? 'dark:invert' : ''} />
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Optimization Summary Card */}
                    <Link href={`/brand/${brand.id}?tab=optimize`} className="block h-full group">
                        <Card className="h-full border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 transition-all cursor-pointer hover:shadow-md">
                            <CardHeader className="pb-2 space-y-0 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    {t.brand_optimization}
                                </CardTitle>
                                <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-500">Salud Técnica</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{optimizationProgress}%</span>
                                        </div>
                                        <Progress value={optimizationProgress} className="h-1.5" />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 px-2 py-1.5 rounded">
                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                        {pendingOptimizations} correcciones pendientes
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Competitors Summary Card */}
                    <Link href={`/brand/${brand.id}?tab=competitors`} className="block h-full group">
                        <Card className="h-full border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 transition-all cursor-pointer hover:shadow-md">
                            <CardHeader className="pb-2 space-y-0 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    {t.brand_competitors}
                                </CardTitle>
                                <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center py-1">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white mb-0">#{currentRank}</span>
                                    <span className="text-xs text-gray-400">de {totalCompetitors} marcas</span>
                                </div>
                                {competitiveAdvantage && (
                                    <div className="mt-2 text-center">
                                        <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">
                                            {competitiveAdvantage}
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>

            {/* Smart Feed: Latest Activity / Insights */}
            <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 px-1">{t.recent_activity_insights}</h3>
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardContent className="p-0">
                        {insights.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No hay actividad reciente importante.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {insights.map((insight, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${insight.priority === 'high' ? 'bg-red-500' :
                                            insight.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                                                {/* Simple render just to show text for now, assuming smart render is elsewhere or can be simplified */}
                                                {insight.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(insight.created_at || insight.generated_at)} • {insight.type?.replace('_', ' ') || 'insight'}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="shrink-0 h-8 text-xs text-gray-500">
                                            Ver detalle
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
