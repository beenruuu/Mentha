"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAPI } from "@/lib/api-client"

interface ActivityDataPoint {
    date: string
    fullDate?: string
    requests: number
    blocked: number
}

interface CrawlActivityResponse {
    activity: ActivityDataPoint[]
    totalRequests: number
    totalBlocked: number
    periodDays: number
}

// Fallback data for when API fails or brand not specified
const fallbackData: ActivityDataPoint[] = [
    { date: "Mon", requests: 0, blocked: 0 },
    { date: "Tue", requests: 0, blocked: 0 },
    { date: "Wed", requests: 0, blocked: 0 },
    { date: "Thu", requests: 0, blocked: 0 },
    { date: "Fri", requests: 0, blocked: 0 },
    { date: "Sat", requests: 0, blocked: 0 },
    { date: "Sun", requests: 0, blocked: 0 },
]

interface CrawlActivityChartProps {
    brandId?: string
    days?: number
}

export function CrawlActivityChart({ brandId, days = 7 }: CrawlActivityChartProps) {
    const [data, setData] = useState<ActivityDataPoint[]>(fallbackData)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!brandId) {
            setData(fallbackData)
            return
        }

        const fetchActivity = async () => {
            setLoading(true)
            setError(null)
            
            try {
                const response = await fetchAPI<CrawlActivityResponse>(
                    `/crawler-logs/${brandId}/activity?days=${days}`
                )
                
                if (response.activity && response.activity.length > 0) {
                    setData(response.activity)
                } else {
                    setData(fallbackData)
                }
            } catch (err) {
                console.error('Failed to fetch crawler activity:', err)
                setError('Failed to load activity data')
                setData(fallbackData)
            } finally {
                setLoading(false)
            }
        }

        fetchActivity()
    }, [brandId, days])

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-white/50 dark:bg-white/5 border-gray-200/50 dark:border-white/5 backdrop-blur-sm shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Crawl Activity</CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    {days === 7 ? 'Weekly' : `Last ${days} days`} overview of AI bot requests and blocks
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-[300px] w-full" />
                ) : (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md border border-gray-200/50 dark:border-white/10 p-3 rounded-lg shadow-xl">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Requests:</span>
                                                            <span className="text-xs font-bold text-gray-900 dark:text-white">{payload[0].value}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Blocked:</span>
                                                            <span className="text-xs font-bold text-gray-900 dark:text-white">{payload[1].value}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="requests"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRequests)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="blocked"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorBlocked)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
                {error && (
                    <p className="text-xs text-red-500 mt-2">{error}</p>
                )}
            </CardContent>
        </Card>
    )
}
