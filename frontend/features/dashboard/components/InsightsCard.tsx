'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { insightsService, type InsightsData, type Insight } from '@/features/dashboard/api/insights'
import { useTranslations } from '@/lib/i18n'
import { Loader2, Info } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const AI_PROVIDERS = [
    { names: ['ChatGPT', 'GPT', 'OpenAI'], icon: '/providers/openai.svg?v=3', invert: true },
    { names: ['Claude', 'Anthropic'], icon: '/providers/claude-color.svg?v=3', invert: false },
    { names: ['Perplexity'], icon: '/providers/perplexity-color.svg?v=3', invert: false },
    { names: ['Gemini', 'Google AI'], icon: '/providers/gemini-color.svg?v=3', invert: false },
]

interface InsightViewModel {
    type: string
    icon: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    data?: Record<string, any>
}

interface InsightsViewModel {
    brand_id: string
    generated_at: string
    insights: InsightViewModel[]
}

interface InsightsCardProps {
    brandId: string
}

export function InsightsCard({ brandId }: InsightsCardProps) {
    const { t } = useTranslations()
    const [insights, setInsights] = useState<InsightsViewModel | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Function to render insight text with AI provider icons and highlighted numbers
    // isNegative determines if badges should be red (bad data) or green (good data)
    const renderInsightWithIcons = (text: string, insight?: InsightViewModel) => {
        // Determine if this insight represents negative/bad data
        const isNegative = insight?.data ? (
            (insight.data.direction === 'down') ||
            (typeof insight.data.change === 'number' && insight.data.change < 0) ||
            (insight.type === 'score_decrease') ||
            (insight.type === 'consecutive_decline')
        ) : false

        // Badge colors based on sentiment
        const badgeClass = isNegative
            ? "inline-flex items-center px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold text-xs mx-0.5"
            : "inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold text-xs mx-0.5"

        // First, find all provider matches
        const providerMatches: { index: number, length: number, name: string, icon: string, invert: boolean }[] = []

        AI_PROVIDERS.forEach(provider => {
            provider.names.forEach(name => {
                const regex = new RegExp(`\\b${name}\\b`, 'gi')
                let match
                while ((match = regex.exec(text)) !== null) {
                    // Check if this position is already matched (avoid duplicates)
                    const alreadyMatched = providerMatches.some(m =>
                        (match!.index >= m.index && match!.index < m.index + m.length) ||
                        (m.index >= match!.index && m.index < match!.index + match![0].length)
                    )
                    if (!alreadyMatched) {
                        providerMatches.push({
                            index: match.index,
                            length: match[0].length,
                            name: match[0],
                            icon: provider.icon,
                            invert: provider.invert
                        })
                    }
                }
            })
        })

        // Find numbers and scores (like "4", "78/100", "5 points", "15 días/days")
        const numberMatches: { index: number, length: number, value: string }[] = []
        const numberRegex = /\b(\d+(?:\/\d+)?)\b/g
        let numMatch
        while ((numMatch = numberRegex.exec(text)) !== null) {
            // Check if this position overlaps with a provider match
            const overlapsProvider = providerMatches.some(m =>
                (numMatch!.index >= m.index && numMatch!.index < m.index + m.length)
            )
            if (!overlapsProvider) {
                numberMatches.push({
                    index: numMatch.index,
                    length: numMatch[0].length,
                    value: numMatch[0]
                })
            }
        }

        // Combine all matches and sort by position
        type MatchType = { index: number, length: number, type: 'provider' | 'number', data: any }
        const allMatches: MatchType[] = [
            ...providerMatches.map(m => ({ index: m.index, length: m.length, type: 'provider' as const, data: m })),
            ...numberMatches.map(m => ({ index: m.index, length: m.length, type: 'number' as const, data: m }))
        ].sort((a, b) => a.index - b.index)

        // If no matches, return text as-is
        if (allMatches.length === 0) {
            return <>{text}</>
        }

        // Build result
        const result: React.ReactNode[] = []
        let lastIndex = 0

        allMatches.forEach((match, i) => {
            // Add text before this match
            if (match.index > lastIndex) {
                result.push(<span key={`text-${i}`}>{text.substring(lastIndex, match.index)}</span>)
            }

            if (match.type === 'provider') {
                const m = match.data
                result.push(
                    <span key={`provider-${i}`}>
                        <Image
                            src={m.icon}
                            alt={m.name}
                            width={14}
                            height={14}
                            className={m.invert ? 'dark:invert' : ''}
                            style={{ display: 'inline', verticalAlign: '-2px', marginRight: '2px' }}
                        />
                        <span className="font-medium">{m.name}</span>
                    </span>
                )
            } else {
                // Number - render with badge style (red for negative, green for positive)
                const m = match.data
                result.push(
                    <span
                        key={`num-${i}`}
                        className={badgeClass}
                    >
                        {m.value}
                    </span>
                )
            }

            lastIndex = match.index + match.length
        })

        // Add remaining text
        if (lastIndex < text.length) {
            result.push(<span key="text-end">{text.substring(lastIndex)}</span>)
        }

        return <>{result}</>
    }

    // Function to translate demo insights
    const translateDemoInsights = (data: InsightsViewModel): InsightsViewModel => {
        const translatedInsights = data.insights.map(insight => {
            let description = insight.description

            switch (insight.type) {
                case 'consecutive_improvement':
                    description = (t.insightConsecutiveImprovement || 'Score improved for {days} consecutive days')
                        .replace('{days}', String(insight.data?.days || 4))
                    break
                case 'leading_model':
                    description = (t.insightLeadingModel || '{model} leads with a score of {score}/100')
                        .replace('{model}', insight.data?.model === 'anthropic' ? 'Claude' : 'ChatGPT')
                        .replace('{score}', String(insight.data?.score || 78))
                    break
                case 'score_increase':
                    description = (t.insightScoreIncrease || '{model} score increased {points} points to {score}/100')
                        .replace('{model}', insight.data?.model === 'anthropic' ? 'Claude' : (insight.data?.model === 'perplexity' ? 'Perplexity' : 'ChatGPT'))
                        .replace('{points}', String(Math.abs(insight.data?.change || 5)))
                        .replace('{score}', String(insight.data?.current || 67))
                    break
                case 'score_decrease':
                    description = (t.insightScoreDecrease || '{model} score decreased {points} points to {score}/100')
                        .replace('{model}', insight.data?.model === 'anthropic' ? 'Claude' : (insight.data?.model === 'perplexity' ? 'Perplexity' : 'ChatGPT'))
                        .replace('{points}', String(Math.abs(insight.data?.change || 12)))
                        .replace('{score}', String(insight.data?.current || 25))
                    break
                case 'new_competitors':
                    description = (t.insightNewCompetitors || '{count} new competitors in the last {days} days')
                        .replace('{count}', String(insight.data?.count || 2))
                        .replace('{days}', String(insight.data?.period_days || 15))
                    break
            }

            return { ...insight, description }
        })

        return { ...data, insights: translatedInsights }
    }

    useEffect(() => {
        if (!brandId) return

        const fetchInsights = async () => {
            try {
                setLoading(true)
                setError(null)
                // insightsService.getInsights uses fetchAPI which handles demo mode automatically
                const data = await insightsService.getInsights(brandId, 30)
                // Translate insights if needed
                setInsights(translateDemoInsights(data))
            } catch (err: any) {
                console.error('Failed to fetch insights:', err)
                setError(err.message || 'Failed to load insights')
            } finally {
                setLoading(false)
            }
        }

        fetchInsights()
    }, [brandId])

    if (loading) {
        return (
            <div className="space-y-3">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    {t.notableChanges || 'CAMBIOS NOTABLES'}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="w-3 h-3 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[200px]">
                            {t.notableChangesTooltip || "Resumen de los cambios más importantes en tu visibilidad IA"}
                        </TooltipContent>
                    </Tooltip>
                </h3>
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    if (error || !insights || !insights.insights || insights.insights.length === 0) {
        return (
            <div className="space-y-3">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    {t.notableChanges || 'CAMBIOS NOTABLES'}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="w-3 h-3 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[200px]">
                            {t.notableChangesTooltip || "Resumen de los cambios más importantes en tu visibilidad IA"}
                        </TooltipContent>
                    </Tooltip>
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    {t.noInsightsYet || 'Aún no hay suficientes datos.'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                {t.notableChanges || 'CAMBIOS NOTABLES'}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="w-3 h-3 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                        {t.notableChangesTooltip || "Resumen de los cambios más importantes en tu visibilidad IA"}
                    </TooltipContent>
                </Tooltip>
            </h3>
            <ul className="space-y-2.5">
                {insights.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                        {renderInsightWithIcons(insight.description, insight)}
                    </li>
                ))}
            </ul>
        </div>
    )
}
