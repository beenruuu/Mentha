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

const LANGUAGE_TO_COUNTRY: Record<string, { code: string; name: string }> = {
    'en': { code: 'gb', name: 'English' },
    'es': { code: 'es', name: 'Español' },
    'fr': { code: 'fr', name: 'Français' },
    'de': { code: 'de', name: 'Deutsch' },
    'it': { code: 'it', name: 'Italiano' },
    'pt': { code: 'pt', name: 'Português' },
    'nl': { code: 'nl', name: 'Nederlands' },
    'pl': { code: 'pl', name: 'Polski' },
    'ru': { code: 'ru', name: 'Русский' },
    'ja': { code: 'jp', name: '日本語' },
    'ko': { code: 'kr', name: '한국어' },
    'zh': { code: 'cn', name: '中文' },
}

interface LanguageScore {
    language: string
    score: number
    mention_count: number
}

interface LanguageComparisonData {
    brand_id: string
    languages: LanguageScore[]
    primary_language: string
    generated_at: string
}

interface LanguageComparisonCardProps {
    brandId: string
}

export function LanguageComparisonCard({ brandId }: LanguageComparisonCardProps) {
    const { t } = useTranslations()
    const [data, setData] = useState<LanguageComparisonData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!brandId) return

        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)
                // fetchAPI handles demo mode automatically via isDemoModeActive()
                const response = await fetchAPI<LanguageComparisonData>(`/insights/${brandId}/languages`)
                setData(response)
            } catch (err: any) {
                console.error('Failed to fetch language comparison:', err)
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
                    {t.languageComparison || 'RENDIMIENTO POR IDIOMA'}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="w-3 h-3 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[200px]">
                            {t.languageComparisonTooltip || "Puntuación de visibilidad IA en cada idioma configurado"}
                        </TooltipContent>
                    </Tooltip>
                </h3>
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    if (error || !data || !data.languages || data.languages.length === 0) {
        return (
            <div className="space-y-3">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    {t.languageComparison || 'RENDIMIENTO POR IDIOMA'}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="w-3 h-3 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[200px]">
                            {t.languageComparisonTooltip || "Puntuación de visibilidad IA en cada idioma configurado"}
                        </TooltipContent>
                    </Tooltip>
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    {t.noLanguageData || 'Sin datos de idioma.'}
                </p>
            </div>
        )
    }

    const sortedLanguages = [...data.languages].sort((a, b) => b.score - a.score).slice(0, 4)

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                {t.languageComparison || 'RENDIMIENTO POR IDIOMA'}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="w-3 h-3 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                        {t.languageComparisonTooltip || "Puntuación de visibilidad IA en cada idioma configurado"}
                    </TooltipContent>
                </Tooltip>
            </h3>
            <div className="space-y-2">
                {sortedLanguages.map((lang) => {
                    const langInfo = LANGUAGE_TO_COUNTRY[lang.language] || { code: 'xx', name: lang.language }
                    return (
                        <div key={lang.language} className="flex items-center gap-3">
                            <FlagIcon code={langInfo.code} size={18} title={langInfo.name} />
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                {langInfo.name}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right tabular-nums">
                                {Math.round(lang.score)}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
