import {
    AreaChart,
    Area,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import Image from 'next/image'
import { useTranslations } from "@/lib/i18n"

export const AI_PROVIDER_META = [
    { id: 'chatgpt', name: 'ChatGPT', icon: '/providers/openai.svg?v=3', color: '#10a37f' },
    { id: 'claude', name: 'Claude', icon: '/providers/claude-color.svg?v=3', color: '#da7756' },
    { id: 'perplexity', name: 'Perplexity', icon: '/providers/perplexity-color.svg?v=3', color: '#3b82f6' },
    { id: 'gemini', name: 'Gemini', icon: '/providers/gemini-color.svg?v=3', color: '#4b5563' },
] as const

interface DashboardChartProps {
    data: any[]
    chartType: 'line' | 'area'
    showGrid: boolean
    activeMetric: 'rank' | 'position' | 'inclusion'
    visibleModels: Record<string, boolean>
    loading: boolean
}

export function DashboardChart({
    data,
    chartType,
    showGrid,
    activeMetric,
    visibleModels,
    loading
}: DashboardChartProps) {
    const { t } = useTranslations()

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-border/50 text-sm ring-1 ring-black/5 dark:ring-white/10">
                    <p className="font-medium text-foreground mb-2">{label}</p>
                    <div className="flex flex-col gap-2">
                        {payload.map((entry: any, index: number) => {
                            let displayName = entry.name
                            let value = entry.value
                            let isPercentage = true
                            let provider: typeof AI_PROVIDER_META[number] | undefined

                            if (activeMetric === 'rank') {
                                if (entry.name === 'rank') displayName = t.dashboardRankScore
                                provider = AI_PROVIDER_META.find(p => p.id === entry.name)
                                if (provider) displayName = provider.name
                            } else if (activeMetric === 'position') {
                                if (entry.name === 'position') displayName = t.dashboardAvgPosition
                                if (entry.name.endsWith('_position')) {
                                    const modelId = entry.name.replace('_position', '')
                                    provider = AI_PROVIDER_META.find(p => p.id === modelId)
                                    if (provider) displayName = provider.name
                                }
                                isPercentage = false
                            } else if (activeMetric === 'inclusion') {
                                if (entry.name === 'inclusion') displayName = t.dashboardInclusionRate
                                if (entry.name.endsWith('_inclusion')) {
                                    const modelId = entry.name.replace('_inclusion', '')
                                    provider = AI_PROVIDER_META.find(p => p.id === modelId)
                                    if (provider) displayName = provider.name
                                }
                            }

                            if (['rank', 'position', 'inclusion'].includes(entry.name)) return null

                            return (
                                <div key={index} className="flex items-center justify-between gap-8">
                                    <div className="flex items-center gap-2">
                                        {provider ? (
                                            <div
                                                className="w-5 h-5 rounded-full flex items-center justify-center"
                                                style={{ backgroundColor: provider.color }}
                                            >
                                                <Image
                                                    src={provider.icon}
                                                    alt={provider.name}
                                                    width={12}
                                                    height={12}
                                                    className="brightness-0 invert"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                        )}
                                        <span className="text-muted-foreground">
                                            {displayName}
                                        </span>
                                    </div>
                                    <span className="font-mono font-medium text-foreground">
                                        {isPercentage ? `${Math.round(value)}%` : `#${Math.round(value)}`}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )
        }
        return null
    }

    if (data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm bg-gray-50/50 dark:bg-[#111114] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                {loading ? 'Loading chart data...' : t.dashboardNoHistoricalData}
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    {showGrid && (
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                    )}
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        tickFormatter={(value) => activeMetric === 'position' ? `#${Math.round(value)}` : `${Math.round(value)}%`}
                        domain={activeMetric === 'position' ? [1, 5] : [0, 100]}
                        ticks={activeMetric === 'position' ? [1, 2, 3, 4, 5] : undefined}
                        reversed={activeMetric === 'position'}
                        allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <defs>
                        {AI_PROVIDER_META.map((provider) => (
                            <linearGradient key={provider.id} id={`gradient-${provider.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={provider.color} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={provider.color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    {AI_PROVIDER_META.map((provider) => {
                        if (!visibleModels[provider.id]) return null
                        let dataKey: string = provider.id
                        if (activeMetric === 'position') dataKey = `${provider.id}_position`
                        if (activeMetric === 'inclusion') dataKey = `${provider.id}_inclusion`
                        return (
                            <Area
                                key={provider.id}
                                type="monotone"
                                dataKey={dataKey}
                                stroke={provider.color}
                                strokeWidth={2}
                                fill={`url(#gradient-${provider.id})`}
                                dot={false}
                                connectNulls
                            />
                        )
                    })}
                </AreaChart>
            ) : (
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    {showGrid && (
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                    )}
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        tickFormatter={(value) => activeMetric === 'position' ? `#${Math.round(value)}` : `${Math.round(value)}%`}
                        domain={activeMetric === 'position' ? [1, 5] : [0, 100]}
                        ticks={activeMetric === 'position' ? [1, 2, 3, 4, 5] : undefined}
                        reversed={activeMetric === 'position'}
                        allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {AI_PROVIDER_META.map((provider) => {
                        if (!visibleModels[provider.id]) return null
                        let dataKey: string = provider.id
                        if (activeMetric === 'position') dataKey = `${provider.id}_position`
                        if (activeMetric === 'inclusion') dataKey = `${provider.id}_inclusion`
                        return (
                            <Line
                                key={provider.id}
                                type="monotone"
                                dataKey={dataKey}
                                stroke={provider.color}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                                connectNulls
                            />
                        )
                    })}
                </LineChart>
            )}
        </ResponsiveContainer>
    )
}
