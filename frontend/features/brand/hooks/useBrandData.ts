import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { fetchAPI } from '@/lib/api-client'
import { competitorsService, type Competitor } from '@/features/competitors/api/competitors'
import { geoAnalysisService } from '@/features/geo-analysis/api/geo-analysis'
import { insightsService } from '@/features/dashboard/api/insights'
import { brandsService, type Brand } from '@/features/brand/api/brands'

export interface UseBrandDataProps {
    brandId: string
    initialBrand: Brand
    isDemo?: boolean
}

export function useBrandData({
    brandId,
    initialBrand,
    isDemo = false
}: UseBrandDataProps) {
    const router = useRouter()
    
    // State
    const [loading, setLoading] = useState(true)
    const [analyzing, setAnalyzing] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [analysisTrigger, setAnalysisTrigger] = useState<number | null>(null)

    const [brand, setBrand] = useState<Brand>(initialBrand)
    const [brands, setBrands] = useState<Brand[]>([initialBrand])
    const [competitors, setCompetitors] = useState<Competitor[]>([])
    
    // Analysis Data
    const [visibility, setVisibility] = useState<any>(null)
    const [insights, setInsights] = useState<any[]>([])
    const [citations, setCitations] = useState<any[]>([])
    const [recommendations, setRecommendations] = useState<any[]>([])
    const [technicalAeo, setTechnicalAeo] = useState<any>(null)
    const [sentiment, setSentiment] = useState<any>(null)
    const [hallucinations, setHallucinations] = useState<any[]>([])
    const [prompts, setPrompts] = useState<any[]>([])

    // Data Loading Logic - runs client-side for fast initial render
    const loadBrandData = useCallback(async () => {
        try {
            setLoading(true)

            const [
                brandsResult,
                insightsResult,
                competitorsResult,
                visibilityResult,
                citationsResult,
                technicalAeoResult,
                latestAnalysisResult
            ] = await Promise.allSettled([
                brandsService.getAll(),
                insightsService.getInsights(brandId),
                competitorsService.getAll(brandId),
                geoAnalysisService.getVisibilityData(brandId),
                geoAnalysisService.getCitations(brandId),
                geoAnalysisService.getTechnicalAEO(brandId),
                geoAnalysisService.getLatestAnalysis(brandId)
            ])

            // Process results
            if (brandsResult.status === 'fulfilled' && brandsResult.value) {
                setBrands(brandsResult.value)
            }

            if (insightsResult.status === 'fulfilled' && insightsResult.value) {
                setInsights(insightsResult.value.insights || [])
            }

            if (competitorsResult.status === 'fulfilled') {
                const comps = competitorsResult.value || []
                setCompetitors(comps.map(c => ({
                    ...c,
                    score: c.visibility_score || 0
                })))
            }

            if (visibilityResult.status === 'fulfilled' && visibilityResult.value) {
                const visData = visibilityResult.value
                if (visData.latest_scores && visData.latest_scores.length > 0) {
                    const scores = visData.latest_scores.map((s: any) => s.visibility_score)
                    const avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)

                    const models: Record<string, any> = {}
                    visData.latest_scores.forEach((s: any) => {
                        models[s.ai_model] = {
                            score: s.visibility_score,
                            mentions: s.mention_count,
                            sentiment: s.sentiment || 'neutral'
                        }
                    })

                    setVisibility({
                        overall_score: avgScore,
                        trend: 0,
                        last_updated: visData.latest_scores[0]?.measured_at || new Date().toISOString(),
                        models
                    })
                }
            }

            if (citationsResult.status === 'fulfilled' && citationsResult.value) {
                setCitations(citationsResult.value.citations || [])
            }

            let newRecommendations: any[] = []
            
            if (technicalAeoResult.status === 'fulfilled' && technicalAeoResult.value) {
                const aeoData = technicalAeoResult.value
                if (aeoData && aeoData.length > 0) {
                    setTechnicalAeo(aeoData[0])
                    if (aeoData[0].recommendations) {
                        // recommendations can be Recommendation[] objects or string[] (legacy)
                        const aeoRecs = aeoData[0].recommendations.map((rec: any, i: number) => {
                            // Handle both formats: string or Recommendation object
                            if (typeof rec === 'string') {
                                return {
                                    title: rec,
                                    description: '',
                                    priority: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
                                    category: 'technical'
                                }
                            }
                            return {
                                title: rec.title || '',
                                description: rec.description || '',
                                priority: rec.priority || (i < 2 ? 'high' : i < 4 ? 'medium' : 'low'),
                                category: rec.category || 'technical'
                            }
                        })
                        newRecommendations = [...newRecommendations, ...aeoRecs]
                    }
                }
            }

            if (latestAnalysisResult.status === 'fulfilled' && latestAnalysisResult.value) {
                const geoData = latestAnalysisResult.value
                if (geoData && geoData.recommendations) {
                    newRecommendations = [...geoData.recommendations, ...newRecommendations]
                }

                if (geoData && geoData.modules?.ai_visibility?.models) {
                    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
                    Object.values(geoData.modules.ai_visibility.models).forEach((model: any) => {
                        if (model.sentiment === 'positive') sentimentCounts.positive++
                        else if (model.sentiment === 'negative') sentimentCounts.negative++
                        else sentimentCounts.neutral++
                    })
                    const total = Object.values(sentimentCounts).reduce((a, b) => a + b, 0)
                    if (total > 0) {
                        setSentiment({
                            positive: Math.round((sentimentCounts.positive / total) * 100),
                            neutral: Math.round((sentimentCounts.neutral / total) * 100),
                            negative: Math.round((sentimentCounts.negative / total) * 100)
                        })
                    }
                }
            }
            
            setRecommendations(newRecommendations)

            // Load prompts
            try {
                const promptsData = await fetchAPI<{ prompts: any[] }>(`/prompts/${brandId}`)
                const brandQueries = promptsData?.prompts || []
                setPrompts(brandQueries.map((q: any) => ({
                    query: q.prompt_text,
                    model: Object.keys(q.results || {})[0] || 'Unknown',
                    mentioned: Object.values(q.results || {}).some((r: any) => r?.mentioned)
                })))
            } catch (e) {
                console.log('No queries available')
            }

        } catch (error) {
            console.error('Error loading brand:', error)
        } finally {
            setLoading(false)
        }
    }, [brandId])

    // Load data on mount and when refreshKey changes
    useEffect(() => {
        if (!isDemo) {
            loadBrandData()
        } else {
            setLoading(false)
        }
    }, [loadBrandData, isDemo, refreshKey])

    // Handlers
    const handleAnalysisComplete = useCallback(() => {
        toast.success('¡Análisis completado! Actualizando datos...')
        setRefreshKey(prev => prev + 1)
    }, [])

    const handleDataRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1)
    }, [])

    const handleRunAnalysis = async () => {
        if (!brand) return

        setAnalyzing(true)
        toast.info('Iniciando análisis... El progreso aparecerá abajo.')

        try {
            await fetchAPI<any>(`/analysis/trigger/${brandId}`, {
                method: 'POST'
            })
            setAnalysisTrigger(Date.now())
        } catch (error) {
            console.error('Analysis error:', error)
            toast.error('Error al iniciar el análisis')
        } finally {
            setAnalyzing(false)
        }
    }

    const handleExport = () => {
        toast.info('Exportando datos...')
    }

    const handleAddCompetitor = () => {
        router.push(`/brand/${brandId}?tab=competitors`)
    }

    return {
        brand,
        brands,
        competitors,
        visibility,
        insights,
        citations,
        hallucinations,
        sentiment,
        prompts,
        recommendations,
        technicalAeo,
        loading,
        analyzing,
        analysisTrigger,
        handleAnalysisComplete,
        handleDataRefresh,
        handleRunAnalysis,
        handleExport,
        handleAddCompetitor
    }
}
