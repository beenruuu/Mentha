'use client'

import { useEffect, useState } from 'react'
import { fetchAPI } from '@/lib/api-client'
import { useTranslations } from '@/lib/i18n'
import { Loader2, MapPin, TrendingUp, Users, Target, Info } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface LocalMarketData {
    brand_id: string
    market_dominance: number  // 0-100 score
    local_mentions: number
    competitor_count: number
    top_queries: string[]
    location: string
    city?: string
    generated_at: string
}

interface LocalMarketCardProps {
    brandId: string
    city?: string
    location?: string
    scope?: 'local' | 'regional' | 'national' | string
}

/**
 * LocalMarketCard - Professional alternative to Language/Region cards for local/national businesses
 * Shows market dominance metrics instead of multi-region/language data
 */
export function LocalMarketCard({ brandId, city, location, scope = 'national' }: LocalMarketCardProps) {
    const { t, lang } = useTranslations()
    const [data, setData] = useState<LocalMarketData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Dynamic title based on business scope
    const getScopeTitle = () => {
        if (scope === 'local') {
            return lang === 'es' ? 'DOMINIO DE MERCADO LOCAL' : 'LOCAL MARKET DOMINANCE'
        } else if (scope === 'regional') {
            return lang === 'es' ? 'DOMINIO DE MERCADO REGIONAL' : 'REGIONAL MARKET DOMINANCE'
        } else {
            return lang === 'es' ? 'DOMINIO DE MERCADO NACIONAL' : 'NATIONAL MARKET DOMINANCE'
        }
    }

    const getTooltipText = () => {
        if (scope === 'local') {
            return lang === 'es' 
                ? 'Métricas de visibilidad IA específicas para tu mercado local objetivo'
                : 'AI visibility metrics specific to your target local market'
        } else if (scope === 'regional') {
            return lang === 'es' 
                ? 'Métricas de visibilidad IA para tu región objetivo'
                : 'AI visibility metrics for your target region'
        } else {
            return lang === 'es' 
                ? 'Métricas de visibilidad IA en el mercado nacional'
                : 'AI visibility metrics for the national market'
        }
    }

    useEffect(() => {
        if (!brandId) return

        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await fetchAPI<LocalMarketData>(`/insights/${brandId}/local-market`)
                setData(response)
            } catch (err: any) {
                console.error('Failed to fetch local market data:', err)
                // Use fallback data for display
                setData({
                    brand_id: brandId,
                    market_dominance: 0,
                    local_mentions: 0,
                    competitor_count: 0,
                    top_queries: [],
                    location: location || 'ES',
                    city: city,
                    generated_at: new Date().toISOString()
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [brandId, city, location])

    const locationDisplay = city 
        ? `${city}` 
        : (scope === 'national' && location) 
            ? (location === 'ES' ? 'España' : location === 'US' ? 'Estados Unidos' : location === 'MX' ? 'México' : location) 
            : (location || 'Tu mercado')

    const scopeTitle = getScopeTitle()
    const tooltipText = getTooltipText()

    if (loading) {
        return (
            <div className="col-span-2 space-y-3">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {scopeTitle}
                </h3>
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    return (
        <div className="col-span-2 space-y-4">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                {scopeTitle}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="w-3 h-3 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[220px]">
                        {tooltipText}
                    </TooltipContent>
                </Tooltip>
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
                {/* Market Dominance Score */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-900/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                            {lang === 'es' ? 'Dominio' : 'Dominance'}
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data?.market_dominance || 0}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {locationDisplay}
                    </div>
                </div>

                {/* Local Mentions */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-900/20">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                            {lang === 'es' ? 'Menciones' : 'Mentions'}
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data?.local_mentions || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {lang === 'es' ? 'En consultas locales' : 'In local queries'}
                    </div>
                </div>

                {/* Competitor Landscape */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-100 dark:border-purple-900/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                            {lang === 'es' ? 'Competidores' : 'Competitors'}
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data?.competitor_count || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {lang === 'es' ? 'Rastreados' : 'Tracked'}
                    </div>
                </div>
            </div>

            {/* Top Local Queries */}
            {data?.top_queries && data.top_queries.length > 0 && (
                <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {lang === 'es' ? 'Consultas locales principales:' : 'Top local queries:'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {data.top_queries.slice(0, 3).map((query, i) => (
                            <span 
                                key={i} 
                                className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                                {query}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
