'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    TrendingUp,
    TrendingDown,
    Trophy,
    Target,
    ChevronRight,
    ChevronDown
} from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import { brandsService, type Brand } from '@/features/brand/api/brands'
import { type Competitor } from '@/features/competitors/api/competitors'

interface CompetitorsTabProps {
    brandId: string
    brandName: string
    brandScore: number
    brandTrend?: number
    competitors: Competitor[]
}

export function CompetitorsTab({
    brandId,
    brandName,
    brandScore,
    brandTrend = 0,
    competitors = [],
}: CompetitorsTabProps) {
    const { t } = useTranslations()
    const router = useRouter()
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)

    // Load all brands for dropdown
    useEffect(() => {
        const loadBrands = async () => {
            try {
                const allBrands = await brandsService.getAll()
                setBrands(allBrands)
            } catch (error) {
                console.error('Error loading brands:', error)
            } finally {
                setLoading(false)
            }
        }
        loadBrands()
    }, [])

    const handleBrandChange = (newBrandId: string) => {
        router.push(`/brand/${newBrandId}?tab=competitors`)
    }

    // Sort by score descending
    const sortedCompetitors = [...competitors].sort((a, b) => (b.visibility_score ?? 0) - (a.visibility_score ?? 0))

    // All entities for ranking
    const allEntities = [
        { id: null, name: brandName, score: brandScore, isOwn: true, trend: brandTrend, domain: null },
        ...sortedCompetitors.map(c => ({
            id: c.id,
            name: c.name,
            score: c.visibility_score ?? 0,
            isOwn: false,
            domain: c.domain,
            trend: 0 // Competitor service doesn't return trend yet
        }))
    ].sort((a, b) => b.score - a.score)

    const brandRank = allEntities.findIndex(e => e.isOwn) + 1
    const totalScore = allEntities.reduce((sum, e) => sum + e.score, 0)
    const brandShare = totalScore > 0 ? Math.round((brandScore / totalScore) * 100) : 0

    return (
        <div className="space-y-6">
            {/* Header with Brand Selector */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.brand_competitors}</h2>
                    {/* Brand Dropdown Selector */}
                    {brands.length > 1 && (
                        <Select value={brandId} onValueChange={handleBrandChange}>
                            <SelectTrigger className="w-[180px] h-8 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                                <SelectValue placeholder={brandName} />
                            </SelectTrigger>
                            <SelectContent>
                                {brands.map((b) => (
                                    <SelectItem key={b.id} value={b.id} className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                                {b.domain && (
                                                    <img
                                                        src={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=32`}
                                                        alt=""
                                                        className="w-3 h-3"
                                                    />
                                                )}
                                            </div>
                                            {b.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <p className="text-sm text-gray-500">Comparativa de visibilidad en IA frente a competidores</p>
            </div>

            {competitors.length === 0 ? (
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardContent className="py-12 text-center">
                        <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.noCompetitorsTracked}</p>
                        <p className="text-xs text-gray-500 mt-1">Usa el botón del header para añadir competidores</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Left: Stats */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Position Card */}
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardContent className="py-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Trophy className="h-5 w-5 text-amber-500" />
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tu Posición</span>
                                </div>
                                <p className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums">#{brandRank}</p>
                                <p className="text-xs text-gray-500 mt-1">de {allEntities.length} marcas</p>
                            </CardContent>
                        </Card>

                        {/* Share of Voice */}
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardContent className="py-4">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Share of Voice</p>
                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{brandShare}%</span>
                                    <span className="text-xs text-gray-400">del total</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-emerald-500" style={{ width: `${brandShare}%` }} />
                                    <div className="h-full bg-gray-300 dark:bg-gray-600" style={{ width: `${100 - brandShare}%` }} />
                                </div>
                                <div className="flex items-center justify-between mt-2 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-gray-500">Tu marca</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                                        <span className="text-gray-500">Competencia</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Ranking List */}
                    <div className="lg:col-span-8">
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800">
                                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ranking de Visibilidad</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {allEntities.map((entity, index) => (
                                        <div
                                            key={`${entity.name}-${index}`}
                                            onClick={() => !entity.isOwn && (entity as any).id && router.push(`/brand/${brandId}/competitor/${(entity as any).id}`)}
                                            className={`flex items-center gap-3 px-4 py-3 ${entity.isOwn ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'}`}
                                        >
                                            {/* Rank */}
                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold
                                                ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                                    index === 1 ? 'bg-gray-200 text-gray-600' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}
                                            >
                                                {index + 1}
                                            </div>

                                            {/* Logo + Name */}
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="w-6 h-6 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                                    {(entity as any).domain ? (
                                                        <img
                                                            src={`https://www.google.com/s2/favicons?domain=${(entity as any).domain}&sz=64`}
                                                            alt=""
                                                            className="w-4 h-4 object-contain"
                                                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                                                        />
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-400">{entity.name.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`text-sm font-medium truncate ${entity.isOwn ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                                        {entity.name}
                                                    </span>
                                                    {entity.isOwn && (
                                                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] h-4 px-1">{t.you || 'TÚ'}</Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Score Bar */}
                                            <div className="w-24 hidden sm:block">
                                                <div className="flex justify-between text-[10px] mb-0.5">
                                                    <span className="text-gray-400">Score</span>
                                                    <span className="font-medium text-gray-600 dark:text-gray-300">{entity.score}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${entity.isOwn ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-600'}`}
                                                        style={{ width: `${entity.score}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Trend */}
                                            <div className="w-16 text-right">
                                                {(entity as any).trend !== undefined && (entity as any).trend !== 0 ? (
                                                    <span className={`text-xs font-medium inline-flex items-center gap-0.5 ${(entity as any).trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {(entity as any).trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {(entity as any).trend > 0 ? '+' : ''}{(entity as any).trend}%
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </div>

                                            {/* Arrow for clickable items */}
                                            {!entity.isOwn && (entity as any).id && (
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )
            }
        </div >
    )
}
