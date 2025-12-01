'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PieChart as PieChartIcon, TrendingUp, AlertTriangle } from 'lucide-react'
import { fetchAPI } from "@/lib/api-client"

interface ShareOfModelProps {
    brandName: string
    brandId: string
}

interface ShareOfModelData {
    brand_mentions: number
    competitor_mentions: Record<string, number>
    total_mentions: number
    share_of_voice: number
    last_updated: string
}

export function ShareOfModel({ brandName, brandId }: ShareOfModelProps) {
    const [data, setData] = useState<ShareOfModelData | null>(null)
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
                const response = await fetchAPI<ShareOfModelData>(`/analysis/share_of_model/${brandId}`)
                setData(response)
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
        return <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading Share of Model...</div>
    }

    if (!data || data.total_mentions === 0) {
        return (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <PieChartIcon className="w-8 h-8 opacity-20" />
                <p className="text-sm">No mention data available yet.</p>
                <p className="text-xs opacity-70">Run an analysis to see your Share of Model.</p>
            </div>
        )
    }

    // Prepare chart data
    const chartData = [
        { name: brandName, value: data.brand_mentions, color: '#3b82f6' }, // Blue for brand
        ...Object.entries(data.competitor_mentions).map(([name, value], index) => ({
            name,
            value,
            color: `hsl(${index * 45}, 70%, 50%)` // Generate colors
        }))
    ]

    // Sort by value desc
    chartData.sort((a, b) => b.value - a.value)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Chart */}
            <div className="h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mb-8">
                    <div className="text-3xl font-bold text-foreground">{data.share_of_voice}%</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Share</div>
                </div>
            </div>

            {/* Metrics & Insights */}
            <div className="flex flex-col justify-center gap-4">
                <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Brand Mentions</div>
                            <div className="text-2xl font-bold text-foreground">{data.brand_mentions}</div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Top Competitors</h4>
                    {Object.entries(data.competitor_mentions)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([name, count], i) => (
                            <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-secondary/30">
                                <span>{name}</span>
                                <span className="font-mono font-medium">{count} mentions</span>
                            </div>
                        ))}
                    {Object.keys(data.competitor_mentions).length === 0 && (
                        <div className="text-sm text-muted-foreground italic">No competitor mentions found.</div>
                    )}
                </div>

                {data.share_of_voice < 20 && (
                    <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/20">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <p>Your Share of Model is low. Focus on increasing citations and creating high-authority content to improve AI visibility.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
