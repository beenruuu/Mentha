import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { subDays, isAfter, startOfDay, format } from "date-fns"
import { brandsService, type Brand } from "@/features/brand/api/brands"
import { analysisService, type Analysis } from "@/features/analysis/api/analysis"
import { competitorsService, type Competitor } from "@/features/competitors/api/competitors"
import { geoAnalysisService, type VisibilitySnapshot, type EnhancedGEOData } from "@/features/geo-analysis/api/geo-analysis"

const MODEL_ID_MAP: Record<string, string> = {
    'openai': 'chatgpt',
    'anthropic': 'claude',
    'perplexity': 'perplexity',
    'gemini': 'gemini'
}

interface UseDashboardDataProps {
    initialBrands: Brand[]
    initialBrand: Brand
    initialCompetitors: Competitor[]
}

export function useDashboardData({ initialBrands, initialBrand, initialCompetitors }: UseDashboardDataProps) {
    const router = useRouter()
    
    // Core State
    const [brands, setBrands] = useState<Brand[]>(initialBrands)
    const [selectedBrand, setSelectedBrand] = useState<Brand>(initialBrand)
    
    // Data State
    const [competitors, setCompetitors] = useState<Competitor[]>(initialCompetitors)
    const [analysis, setAnalysis] = useState<Analysis | null>(null)
    const [chartData, setChartData] = useState<any[]>([])
    const [modelPerformance, setModelPerformance] = useState<Record<string, number>>({})
    const [enhancedGEO, setEnhancedGEO] = useState<EnhancedGEOData | null>(null)
    
    // UI State
    const [loading, setLoading] = useState(false)
    const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null)

    // Fetch Logic
    const fetchDataForBrand = async (brand: Brand, days: number) => {
        setLoading(true)
        try {
            // Parallelize requests for better performance
            const [analyses, comps, visibilityData, enhancedData] = await Promise.all([
                analysisService.getAll(brand.id),
                competitorsService.getAll(brand.id),
                geoAnalysisService.getVisibilityData(brand.id, undefined, days).catch(() => ({ latest_scores: [], history: [] })),
                geoAnalysisService.getEnhancedGEO(brand.id).catch(() => null)
            ])

            // Set Enhanced GEO Data
            setEnhancedGEO(enhancedData)

            // 1. Process Analysis (Chart Data)
            const startDate = subDays(new Date(), days)
            const filteredAnalyses = analyses.filter(a => {
                const date = new Date(a.created_at)
                return isAfter(date, startOfDay(startDate)) || date.toDateString() === startDate.toDateString()
            })

            const processedChartData = filteredAnalyses
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map(a => ({
                    date: format(new Date(a.created_at), 'MM/dd'),
                    rank: a.score ? Math.round(a.score) : 0,
                    position: a.avg_position ? Math.round(a.avg_position) : 0,
                    inclusion: a.inclusion_rate ? Math.round(a.inclusion_rate) : 0,
                }))

            // 2. Set Analysis State
            if (analyses.length > 0) {
                setAnalysis(analyses[analyses.length - 1])
            } else {
                setAnalysis(null)
            }

            // 3. Set Competitors State
            setCompetitors(comps)

            // 4. Process Metric & Model Performance (Geo Analysis)
            if (visibilityData.latest_scores?.length > 0) {
                const scores: Record<string, number> = {}
                visibilityData.latest_scores.forEach((snapshot: VisibilitySnapshot) => {
                    const frontendId = MODEL_ID_MAP[snapshot.ai_model] || snapshot.ai_model
                    scores[frontendId] = snapshot.visibility_score
                })
                setModelPerformance(scores)
            } else {
                setModelPerformance({})
            }

            // 5. Merge History into Chart Data
            if (visibilityData.history && visibilityData.history.length > 0) {
                const historyMap = new Map<string, Record<string, number>>()

                visibilityData.history.forEach((snapshot: any) => {
                    const dateKey = format(new Date(snapshot.measured_at || new Date().toISOString()), 'MM/dd')
                    if (!historyMap.has(dateKey)) {
                        historyMap.set(dateKey, {})
                    }
                    const dayData = historyMap.get(dateKey)!
                    const frontendId = MODEL_ID_MAP[snapshot.ai_model] || snapshot.ai_model

                    dayData[frontendId] = snapshot.visibility_score ?? 0
                    dayData[`${frontendId}_position`] = snapshot.average_position ?? 0
                    dayData[`${frontendId}_inclusion`] = (snapshot.inclusion_rate ?? 0) * 100
                })

                // Merge history with existing chart data or create new
                setChartData(prevData => {
                    // Start with history data map
                    const mergedDataMap = new Map<string, any>()
                    
                    // Add processed analysis data first
                    processedChartData.forEach(item => {
                         mergedDataMap.set(item.date, item)
                    })

                    // Merge geo history
                    historyMap.forEach((scores, date) => {
                        const existing = mergedDataMap.get(date) || { date, rank: 0, position: 0, inclusion: 0 }
                        mergedDataMap.set(date, { ...existing, ...scores })
                    })

                    return Array.from(mergedDataMap.values()).sort((a, b) => 
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                })
            } else {
                setChartData(processedChartData)
            }

        } catch (error) {
            console.error('Error loading brand data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleBrandChange = async (brand: Brand, days: number) => {
        setSelectedBrand(brand)
        await fetchDataForBrand(brand, days)
    }

    const handleDeleteBrand = async (brandId: string, days: number) => {
        setDeletingBrandId(brandId)
        try {
            await brandsService.delete(brandId)
            const updatedBrands = brands.filter(b => b.id !== brandId)
            setBrands(updatedBrands)

            if (selectedBrand?.id === brandId) {
                if (updatedBrands.length > 0) {
                    setSelectedBrand(updatedBrands[0])
                    await fetchDataForBrand(updatedBrands[0], days)
                } else {
                    router.push('/onboarding')
                }
            }
        } catch (error) {
            console.error('Failed to delete brand:', error)
        } finally {
            setDeletingBrandId(null)
        }
    }

    // Effect to load initial data for chart/models if needed.
    // Since we have basic data passed as props, we only need to fetch detailed chart/geo data on client mount
    // to keep the initial page load generic and fast.
    useEffect(() => {
        if (initialBrand) {
             fetchDataForBrand(initialBrand, 30)
        }
    }, [])

    return {
        brands,
        selectedBrand,
        competitors,
        analysis,
        chartData,
        modelPerformance,
        enhancedGEO,
        loading,
        deletingBrandId,
        handleBrandChange,
        handleDeleteBrand,
        fetchDataForBrand
    }
}
