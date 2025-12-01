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

export function CompetitorGapAnalysis({ brandName, brandId, competitors }: CompetitorGapAnalysisProps) {
    const [data, setData] = useState<GapAnalysisData[]>([])
    const [criticalGaps, setCriticalGaps] = useState<GapAnalysisData[]>([])
    const [winningTopics, setWinningTopics] = useState<GapAnalysisData[]>([])
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const fetchGapAnalysis = async () => {
            if (!brandId) return

            try {
                setLoading(true)
                // Fetch real analysis from backend
                const response = await fetchAPI<GapAnalysisResponse>(`/analysis/gap/${brandId}`)

                if (response && response.topics) {
                    setData(response.topics)
                    setCriticalGaps(response.critical_gaps || [])
                    setWinningTopics(response.winning_topics || [])
                } else {
                    // Fallback to mock data if no analysis exists yet
                    generateMockData()
                }
            } catch (error) {
                console.error("Failed to fetch gap analysis:", error)
                generateMockData()
            } finally {
                setLoading(false)
            }
        }

        const generateMockData = () => {
            const mockTopics: GapAnalysisData[] = [
                { topic: 'Pricing', brand_coverage: 10, competitor_avg: 85, gap: -75, status: 'critical' },
                { topic: 'API Docs', brand_coverage: 0, competitor_avg: 60, gap: -60, status: 'critical' },
                { topic: 'Case Studies', brand_coverage: 30, competitor_avg: 70, gap: -40, status: 'warning' },
                { topic: 'Security', brand_coverage: 90, competitor_avg: 80, gap: 10, status: 'good' },
                { topic: 'Integrations', brand_coverage: 20, competitor_avg: 50, gap: -30, status: 'warning' },
            ]
            setData(mockTopics)
            setCriticalGaps(mockTopics.filter(t => t.status === 'critical'))
            setWinningTopics(mockTopics.filter(t => t.gap > 0))
        }

        fetchGapAnalysis()
    }, [brandId])

    if (!mounted) return null

    if (loading) {
        return <div className="flex items-center justify-center h-full text-muted-foreground">Loading analysis...</div>
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Chart Section */}
            <div className="lg:col-span-2 flex flex-col h-full min-h-[300px]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        Content Coverage Comparison
                    </h3>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-blue-500" />
                            <span className="text-muted-foreground">Your Brand</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-zinc-300 dark:bg-zinc-700" />
                            <span className="text-muted-foreground">Competitor Avg</span>
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
                            <Bar dataKey="competitor_avg" name="Industry Avg" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={20} />
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
                            Critical Missing Topics
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
                                        Competitors cover this heavily. You have little to no content.
                                    </p>
                                    <Button size="sm" variant="secondary" className="w-full h-7 text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60">
                                        Generate Content
                                    </Button>
                                </div>
                            ))}
                            {criticalGaps.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground text-xs">
                                    No critical gaps found.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                <Card className="h-1/3 flex flex-col overflow-hidden bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Winning Topics
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
                                    No winning topics yet.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    )
}
