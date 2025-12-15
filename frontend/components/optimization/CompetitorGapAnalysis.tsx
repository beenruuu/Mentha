'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ArrowRight, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchAPI } from "@/lib/api-client"
import { Competitor } from "@/lib/services/competitors"
import { useTranslations } from "@/lib/i18n"

interface CompetitorGapAnalysisProps {
    brandName: string
    brandId: string
    competitors: Competitor[]
}

interface GapAnalysisData {
    topic: string
    brand_coverage: number
    competitor_avg: number
    gap: number
    status: 'critical' | 'warning' | 'good' | 'winning'
}

interface GapAnalysisResponse {
    topics: GapAnalysisData[]
    critical_gaps: GapAnalysisData[]
    winning_topics: GapAnalysisData[]
}

// Inline translations for this component
const componentTranslations = {
    es: {
        loadingAnalysis: 'Cargando análisis...',
        contentCoverageComparison: 'Comparación de Cobertura de Contenido',
        yourBrand: 'Tu Marca',
        competitorAvg: 'Promedio Competidores',
        criticalMissingTopics: 'Temas Críticos Faltantes',
        competitorsCoverHeavily: 'Los competidores cubren esto ampliamente. Tienes poco o ningún contenido.',
        generateContent: 'Generar Contenido',
        noCriticalGaps: 'No se encontraron brechas críticas.',
        winningTopics: 'Temas Ganadores',
        noWinningTopics: 'Aún no hay temas ganadores.',
        gap: 'Brecha',
        industryAvg: 'Promedio Industria',
        noDataAvailable: 'No hay datos de análisis disponibles',
        runAnalysisFirst: 'Ejecuta un análisis de visibilidad para ver las brechas de contenido con tus competidores.',
        backendUnavailable: 'No se pudo conectar con el servidor de análisis.',
        retryLater: 'Intenta de nuevo más tarde o verifica que el backend esté activo.',
        noCompetitors: 'Añade competidores para ver el análisis comparativo.'
    },
    en: {
        loadingAnalysis: 'Loading analysis...',
        contentCoverageComparison: 'Content Coverage Comparison',
        yourBrand: 'Your Brand',
        competitorAvg: 'Competitor Avg',
        criticalMissingTopics: 'Critical Missing Topics',
        competitorsCoverHeavily: 'Competitors cover this heavily. You have little to no content.',
        generateContent: 'Generate Content',
        noCriticalGaps: 'No critical gaps found.',
        winningTopics: 'Winning Topics',
        noWinningTopics: 'No winning topics yet.',
        gap: 'Gap',
        industryAvg: 'Industry Avg',
        noDataAvailable: 'No analysis data available',
        runAnalysisFirst: 'Run a visibility analysis to see content gaps with your competitors.',
        backendUnavailable: 'Could not connect to the analysis server.',
        retryLater: 'Try again later or verify that the backend is running.',
        noCompetitors: 'Add competitors to see comparative analysis.'
    }
}

export function CompetitorGapAnalysis({ brandName, brandId, competitors }: CompetitorGapAnalysisProps) {
    const { lang } = useTranslations()
    const texts = componentTranslations[lang as 'es' | 'en'] || componentTranslations.en
    const [data, setData] = useState<GapAnalysisData[]>([])
    const [criticalGaps, setCriticalGaps] = useState<GapAnalysisData[]>([])
    const [winningTopics, setWinningTopics] = useState<GapAnalysisData[]>([])
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [noData, setNoData] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const fetchGapAnalysis = async () => {
            if (!brandId) return

            // If no competitors, show appropriate message
            if (!competitors || competitors.length === 0) {
                setNoData(true)
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError(null)
                setNoData(false)

                // Fetch real analysis from backend
                const response = await fetchAPI<GapAnalysisResponse>(`/analysis/gap/${brandId}`)

                if (response && response.topics && response.topics.length > 0) {
                    setData(response.topics)
                    setCriticalGaps(response.critical_gaps || [])
                    setWinningTopics(response.winning_topics || [])
                } else {
                    // No data available yet - show empty state
                    setNoData(true)
                    setData([])
                    setCriticalGaps([])
                    setWinningTopics([])
                }
            } catch (error: any) {
                console.error("Failed to fetch gap analysis:", error)
                // Check if it's a connection error
                if (error.message?.includes('backend') || error.message?.includes('connect')) {
                    setError('connection')
                } else {
                    // Just show empty state for other errors
                    setNoData(true)
                }
                setData([])
                setCriticalGaps([])
                setWinningTopics([])
            } finally {
                setLoading(false)
            }
        }

        fetchGapAnalysis()
    }, [brandId, competitors, lang])

    if (!mounted) return null

    if (loading) {
        return <div className="flex items-center justify-center h-full text-muted-foreground">{texts.loadingAnalysis}</div>
    }

    // Show error state if backend unavailable
    if (error === 'connection') {
        return (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
                <h3 className="text-sm font-medium text-foreground mb-2">{texts.backendUnavailable}</h3>
                <p className="text-xs text-muted-foreground max-w-sm">{texts.retryLater}</p>
            </div>
        )
    }

    // Show empty state if no data
    if (noData || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-sm font-medium text-foreground mb-2">{texts.noDataAvailable}</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                    {!competitors || competitors.length === 0 ? texts.noCompetitors : texts.runAnalysisFirst}
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Chart Section */}
            <div className="lg:col-span-2 flex flex-col h-full min-h-[300px]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        {texts.contentCoverageComparison}
                    </h3>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-blue-500" />
                            <span className="text-muted-foreground">{texts.yourBrand}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-zinc-300 dark:bg-zinc-700" />
                            <span className="text-muted-foreground">{texts.competitorAvg}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20, top: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="topic"
                                type="category"
                                width={120}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                            <Bar dataKey="brand_coverage" name={brandName} fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            <Bar dataKey="competitor_avg" name={texts.industryAvg} fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Insights Section */}
            <div className="md:col-span-1 flex flex-col gap-4 h-full overflow-hidden">
                <Card className="flex-1 flex flex-col overflow-hidden bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {texts.criticalMissingTopics}
                        </CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1 px-4 pb-4">
                        <div className="space-y-3">
                            {criticalGaps.map((item, i) => (
                                <div key={i} className="bg-background/80 backdrop-blur p-3 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-sm">{item.topic}</span>
                                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] h-5">
                                            {Math.abs(item.gap)}% Gap
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {texts.competitorsCoverHeavily}
                                    </p>
                                    <Button size="sm" variant="secondary" className="w-full h-7 text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60">
                                        {texts.generateContent}
                                    </Button>
                                </div>
                            ))}
                            {criticalGaps.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground text-xs">
                                    {texts.noCriticalGaps}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                <Card className="h-1/3 flex flex-col overflow-hidden bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {texts.winningTopics}
                        </CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1 px-4 pb-4">
                        <div className="space-y-2">
                            {winningTopics.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span>{item.topic}</span>
                                    <span className="text-emerald-600 font-medium">+{item.gap}%</span>
                                </div>
                            ))}
                            {winningTopics.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground text-xs">
                                    {texts.noWinningTopics}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    )
}
