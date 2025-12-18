'use client'

import { useEffect, useState } from 'react'
import { fetchAPI } from '@/lib/api-client'
import { useTranslations } from '@/lib/i18n'
import { DEMO_BRAND_ID, demoIndustryComparison } from '@/lib/demo-data'
import { Loader2, Info, TrendingUp, TrendingDown } from 'lucide-react'

interface TopPerformer {
    name: string
    score: number
}

interface IndustryComparisonData {
    brand_id: string
    industry: string | null
    brand_score: number
    industry_average: number
    percentile: number
    rank: number
    total_brands: number
    top_performers: TopPerformer[]
    message?: string
}

interface IndustryComparisonCardProps {
    brandId: string
}

export function IndustryComparisonCard({ brandId }: IndustryComparisonCardProps) {
    const { t } = useTranslations()
    const [data, setData] = useState<IndustryComparisonData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const isDemo = brandId === DEMO_BRAND_ID

    useEffect(() => {
        if (!brandId) return

        if (isDemo) {
            setData(demoIndustryComparison as IndustryComparisonData)
            setLoading(false)
            return
        }

        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await fetchAPI<IndustryComparisonData>(`/insights/${brandId}/industry`)
                setData(response)
            } catch (err: any) {
                console.error('Failed to fetch industry comparison:', err)
                setError(err.message || 'Failed to load')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [brandId, isDemo])

    if (loading) {
        return (
            <div className="space-y-3">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    {t.industryComparison || 'COMPARACIÓN DE INDUSTRIA'}
                    <Info className="w-3 h-3" />
                </h3>
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    if (error || !data || !data.industry || data.message) {
        return (
            <div className="space-y-3">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    {t.industryComparison || 'COMPARACIÓN DE INDUSTRIA'}
                    <Info className="w-3 h-3" />
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    {data?.message || t.noIndustryData || 'Sin industria configurada.'}
                </p>
            </div>
        )
    }

    const isAboveAverage = data.brand_score >= data.industry_average
    const difference = Math.abs(data.brand_score - data.industry_average)

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                {t.industryComparison || 'COMPARACIÓN DE INDUSTRIA'}
                <Info className="w-3 h-3" />
            </h3>

            {/* Score comparison */}
            <div className="flex items-center gap-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.brand_score}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.yourScore || 'Tu marca'}</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    {isAboveAverage ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm">
                            <TrendingUp className="w-4 h-4" />
                            +{difference.toFixed(0)}
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm">
                            <TrendingDown className="w-4 h-4" />
                            -{difference.toFixed(0)}
                        </span>
                    )}
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{data.industry_average}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.industryAverage || 'Media'}</p>
                </div>
            </div>

            {/* Ranking info */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.position || 'Posición'} <strong className="text-gray-900 dark:text-white">#{data.rank}</strong> de {data.total_brands} en <span className="text-purple-600 dark:text-purple-400">{data.industry}</span>
            </p>
        </div>
    )
}
