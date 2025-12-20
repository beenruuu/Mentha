'use client'

import { useEffect, useState } from 'react'
import { fetchAPI } from '@/lib/api-client'
import { useTranslations } from '@/lib/i18n'
import FlagIcon from '@/components/shared/flag-icon'
import { Loader2, Info } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface RegionScore {
    region: string
    score: number
    mention_count: number
}

interface RegionalComparisonData {
    brand_id: string
    regions: RegionScore[]
    primary_region: string
    generated_at: string
}

interface RegionalComparisonCardProps {
    brandId: string
}

export function RegionalComparisonCard({ brandId }: RegionalComparisonCardProps) {
    const { t } = useTranslations()
    const [data, setData] = useState<RegionalComparisonData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!brandId) return

        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)
                // fetchAPI handles demo mode automatically via isDemoModeActive()
                const response = await fetchAPI<RegionalComparisonData>(`/insights/${brandId}/regions`)
                setData(response)
            } catch (err: any) {
                console.error('Failed to fetch regional comparison:', err)
                setError(err.message || 'Failed to load')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [brandId])

    if (loading) {
        return (
            <div className="space-y-3">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    {t.regionalComparison || 'RENDIMIENTO POR REGIÓN'}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="w-3 h-3 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[200px]">
                            {t.regionalComparisonTooltip || "Tu puntuación de visibilidad IA desglosada por región geográfica"}
                        </TooltipContent>
                    </Tooltip>
                </h3>
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    if (error || !data || !data.regions || data.regions.length === 0) {
        return (
            <div className="space-y-3">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    {t.regionalComparison || 'RENDIMIENTO POR REGIÓN'}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="w-3 h-3 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[200px]">
                            {t.regionalComparisonTooltip || "Tu puntuación de visibilidad IA desglosada por región geográfica"}
                        </TooltipContent>
                    </Tooltip>
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    {t.noRegionalData || 'Sin datos de región.'}
                </p>
            </div>
        )
    }

    const sortedRegions = [...data.regions].sort((a, b) => b.score - a.score).slice(0, 4)

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                {t.regionalComparison || 'RENDIMIENTO POR REGIÓN'}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="w-3 h-3 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                        {t.regionalComparisonTooltip || "Tu puntuación de visibilidad IA desglosada por región geográfica"}
                    </TooltipContent>
                </Tooltip>
            </h3>
            <div className="space-y-2">
                {sortedRegions.map((region) => (
                    <div key={region.region} className="flex items-center gap-3">
                        <FlagIcon code={region.region.toLowerCase()} size={18} />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 uppercase">
                            {region.region}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right tabular-nums">
                            {Math.round(region.score)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
