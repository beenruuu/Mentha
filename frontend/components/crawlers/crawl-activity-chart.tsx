"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const data = [
    { date: "Mon", requests: 240, blocked: 12 },
    { date: "Tue", requests: 139, blocked: 8 },
    { date: "Wed", requests: 980, blocked: 45 },
    { date: "Thu", requests: 390, blocked: 15 },
    { date: "Fri", requests: 480, blocked: 20 },
    { date: "Sat", requests: 380, blocked: 18 },
    { date: "Sun", requests: 430, blocked: 24 },
]

export function CrawlActivityChart() {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-white/50 dark:bg-white/5 border-gray-200/50 dark:border-white/5 backdrop-blur-sm shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Crawl Activity</CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    Weekly overview of AI bot requests and blocks
                </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    )
}
