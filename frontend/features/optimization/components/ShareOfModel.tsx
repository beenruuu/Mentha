'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Users, BarChart3 } from 'lucide-react'
import Image from 'next/image'
import { fetchAPI } from "@/lib/api-client"
import { geoAnalysisService, type VisibilitySnapshot } from "@/features/geo-analysis/api/geo-analysis"

const AI_PROVIDER_META = [
    { id: 'chatgpt', name: 'ChatGPT', icon: '/providers/openai.svg' },
    { id: 'claude', name: 'Claude', icon: '/providers/claude-color.svg' },
    { id: 'perplexity', name: 'Perplexity', icon: '/providers/perplexity-color.svg' },
    { id: 'gemini', name: 'Gemini', icon: '/providers/gemini-color.svg' },
] as const

interface ShareOfModelProps {
    brandName: string
    brandId: string
    lastUpdated?: number
}

interface ShareOfModelData {
    brand_mentions: number
    competitor_mentions: Record<string, number>
    total_mentions: number
    share_of_voice: number
    last_updated: string
    trend?: 'up' | 'down' | 'stable'
}

export function ShareOfModel({ brandName, brandId }: ShareOfModelProps) {
    const [data, setData] = useState<ShareOfModelData | null>(null)
    const [modelPerformance, setModelPerformance] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            if (!brandId) return
            try {
                setLoading(true)
                const [shareData, visibilityData] = await Promise.all([
                    fetchAPI<ShareOfModelData>(`/analysis/share_of_model/${brandId}`),
                    geoAnalysisService.getVisibilityData(brandId)
                ])
                setData(shareData)

                if (visibilityData.latest_scores && visibilityData.latest_scores.length > 0) {
                    const scores: Record<string, number> = {}
                    visibilityData.latest_scores.forEach((snapshot: VisibilitySnapshot) => {
                        scores[snapshot.ai_model] = snapshot.visibility_score
                    })
                    setModelPerformance(scores)
                }
            } catch (error) {
                console.error("Failed to fetch Share of Model data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [brandId])

    if (!mounted) return null

    if (loading) {
        return (
            <div className="h-[200px] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800" />
                    <div className="w-24 h-4 rounded bg-gray-100 dark:bg-zinc-800" />
                </div>
            </div>
        )
    }

    if (!data || data.total_mentions === 0 || !data.competitor_mentions) {
        return (
            <div className="h-[200px] flex flex-col items-center justify-center text-center">
                <BarChart3 className="w-10 h-10 text-gray-300 dark:text-zinc-700 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No mention data available</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Run an analysis to see your Share of Model</p>
            </div>
        )
    }

    // Get top competitors sorted by mentions
    const topCompetitors = Object.entries(data.competitor_mentions || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)

    // Calculate max for progress bars
    const maxMentions = Math.max(data.brand_mentions, ...Object.values(data.competitor_mentions || {}))

    // Determine trend from backend data
    const trend = data.trend || 'stable'

    return (
        <div className="space-y-8">
            {/* Main Stats Row */}
            <div className="grid grid-cols-2 gap-6">
                {/* Share of Voice - Big Number */}
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-2">
                        Share of Voice
                    </span>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {Math.round(data.share_of_voice)}%
                        </span>
                        {trend === 'up' && (
                            <span className="flex items-center text-emerald-500 text-sm font-medium mb-1.5">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                growing
                            </span>
                        )}
                        {trend === 'down' && (
                            <span className="flex items-center text-red-500 text-sm font-medium mb-1.5">
                                <TrendingDown className="w-4 h-4 mr-1" />
                                declining
                            </span>
                        )}
                    </div>
                </div>

                {/* Brand Mentions */}
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-2">
                        Brand Mentions
                    </span>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {data.brand_mentions}
                        </span>
                    </div>
                </div>
            </div>

            {/* Competition Bars */}
            <div className="space-y-4">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                    Top Competitors
                </span>

                <div className="space-y-3">
                    {/* Brand first */}
                    <div className="flex items-center gap-3">
                        <span className="w-20 sm:w-24 text-sm font-medium text-gray-900 dark:text-white truncate min-w-0">
                            {brandName}
                        </span>
                        <div className="flex-1 min-w-0 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${(data.brand_mentions / maxMentions) * 100}%` }}
                            />
                        </div>
                        <span className="w-8 text-sm font-mono text-gray-600 dark:text-gray-400 text-right shrink-0">
                            {data.brand_mentions}
                        </span>
                    </div>

                    {/* Competitors */}
                    {topCompetitors.map(([name, count], index) => (
                        <div key={name} className="flex items-center gap-3">
                            <span className="w-20 sm:w-24 text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">
                                {name}
                            </span>
                            <div className="flex-1 min-w-0 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gray-400 dark:bg-zinc-600 rounded-full transition-all duration-500"
                                    style={{ width: `${(count / maxMentions) * 100}%` }}
                                />
                            </div>
                            <span className="w-8 text-sm font-mono text-gray-500 dark:text-gray-500 text-right">
                                {count}
                            </span>
                        </div>
                    ))}

                    {topCompetitors.length === 0 && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                            No competitor mentions found
                        </p>
                    )}
                </div>
            </div>

            {/* Individual Model Performance */}
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800/50">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                    Model Performance
                </span>
                <div className="grid grid-cols-1 gap-3">
                    {AI_PROVIDER_META.map((provider) => {
                        const score = modelPerformance[provider.id] || 0
                        const hasData = modelPerformance[provider.id] !== undefined

                        return (
                            <div key={provider.id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#111114] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 p-1.5 text-gray-900 dark:text-white flex items-center justify-center">
                                        <Image
                                            src={provider.icon}
                                            alt={provider.name}
                                            width={20}
                                            height={20}
                                            className={provider.icon.includes('openai.svg') ? 'w-full h-full object-contain dark:invert' : 'w-full h-full object-contain'}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate min-w-0">{provider.name}</span>
                                </div>
                                <div className="flex items-center gap-3 flex-1 justify-end max-w-[200px]">
                                    {hasData ? (
                                        <>
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${score}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-emerald-500 font-medium w-10 text-right">
                                                {Math.round(score)}%
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-xs text-gray-400">No data</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
