'use client'

import { useEffect, useState } from 'react'
import { fetchAPI } from '@/lib/api-client'
import { useTranslations } from '@/lib/i18n'
import { DEMO_BRAND_ID, demoInsights } from '@/lib/demo-data'
import { Loader2, Info } from 'lucide-react'

interface Insight {
    type: string
    icon: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    data?: Record<string, any>
}

interface InsightsData {
    brand_id: string
    generated_at: string
    insights: Insight[]
}

interface InsightsCardProps {
    brandId: string
}

export function InsightsCard({ brandId }: InsightsCardProps) {
    const { t } = useTranslations()
    const [insights, setInsights] = useState<InsightsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const isDemo = brandId === DEMO_BRAND_ID

    useEffect(() => {
        if (!brandId) return

        if (isDemo) {
            setInsights(demoInsights as InsightsData)
            setLoading(false)
            return
        }

        const fetchInsights = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await fetchAPI<InsightsData>(`/insights/${brandId}?days=30`)
                setInsights(data)
            } catch (err: any) {
                console.error('Failed to fetch insights:', err)
                setError(err.message || 'Failed to load insights')
            } finally {
                setLoading(false)
            }
        }

        fetchInsights()
    }, [brandId, isDemo])

    if (loading) {
        return (
            <div className="space-y-3">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    {t.notableChanges || 'CAMBIOS NOTABLES'}
                    <Info className="w-3 h-3" />
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
                    <Info className="w-3 h-3" />
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
                <Info className="w-3 h-3" />
            </h3>
            <ul className="space-y-2.5">
                {insights.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                        {insight.description}
                    </li>
                ))}
            </ul>
        </div>
    )
}
