'use client'

import { useMemo } from 'react'
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ModelScore {
    model: string
    score: number
    mentions: number
    sentiment: 'positive' | 'neutral' | 'negative'
}

interface MultiEngineRadarProps {
    brandName: string
    scores: {
        openai?: ModelScore
        anthropic?: ModelScore
        perplexity?: ModelScore
        gemini?: ModelScore
    }
    loading?: boolean
}

const MODEL_CONFIG = {
    openai: { name: 'ChatGPT', color: '#10B981', icon: '🤖' },
    anthropic: { name: 'Claude', color: '#8B5CF6', icon: '🧠' },
    perplexity: { name: 'Perplexity', color: '#3B82F6', icon: '🔍' },
    gemini: { name: 'Gemini', color: '#F59E0B', icon: '✨' }
}

export function MultiEngineRadar({ brandName, scores, loading }: MultiEngineRadarProps) {
    const radarData = useMemo(() => {
        return [
            {
                metric: 'Visibility',
                ChatGPT: scores.openai?.score ?? 0,
                Claude: scores.anthropic?.score ?? 0,
                Perplexity: scores.perplexity?.score ?? 0,
                Gemini: scores.gemini?.score ?? 0,
            },
            {
                metric: 'Mentions',
                ChatGPT: Math.min((scores.openai?.mentions ?? 0) * 10, 100),
                Claude: Math.min((scores.anthropic?.mentions ?? 0) * 10, 100),
                Perplexity: Math.min((scores.perplexity?.mentions ?? 0) * 10, 100),
                Gemini: Math.min((scores.gemini?.mentions ?? 0) * 10, 100),
            },
            {
                metric: 'Sentiment',
                ChatGPT: getSentimentScore(scores.openai?.sentiment),
                Claude: getSentimentScore(scores.anthropic?.sentiment),
                Perplexity: getSentimentScore(scores.perplexity?.sentiment),
                Gemini: getSentimentScore(scores.gemini?.sentiment),
            }
        ]
    }, [scores])

    const averageScore = useMemo(() => {
        const validScores = Object.values(scores).filter(s => s?.score)
        if (validScores.length === 0) return 0
        return Math.round(validScores.reduce((sum, s) => sum + (s?.score ?? 0), 0) / validScores.length)
    }, [scores])

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-80">
                    <div className="animate-pulse text-muted-foreground">Cargando datos...</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Visibilidad Multi-Motor</CardTitle>
                        <CardDescription>
                            Presencia de {brandName} en los principales motores de IA
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-emerald-600">{averageScore}</div>
                        <div className="text-xs text-muted-foreground">Score promedio</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Radar Chart */}
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis
                                dataKey="metric"
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                            />
                            <PolarRadiusAxis
                                angle={30}
                                domain={[0, 100]}
                                tick={{ fill: '#9ca3af', fontSize: 10 }}
                            />
                            <Radar
                                name="ChatGPT"
                                dataKey="ChatGPT"
                                stroke={MODEL_CONFIG.openai.color}
                                fill={MODEL_CONFIG.openai.color}
                                fillOpacity={0.2}
                                strokeWidth={2}
                            />
                            <Radar
                                name="Claude"
                                dataKey="Claude"
                                stroke={MODEL_CONFIG.anthropic.color}
                                fill={MODEL_CONFIG.anthropic.color}
                                fillOpacity={0.2}
                                strokeWidth={2}
                            />
                            <Radar
                                name="Perplexity"
                                dataKey="Perplexity"
                                stroke={MODEL_CONFIG.perplexity.color}
                                fill={MODEL_CONFIG.perplexity.color}
                                fillOpacity={0.2}
                                strokeWidth={2}
                            />
                            <Radar
                                name="Gemini"
                                dataKey="Gemini"
                                stroke={MODEL_CONFIG.gemini.color}
                                fill={MODEL_CONFIG.gemini.color}
                                fillOpacity={0.2}
                                strokeWidth={2}
                            />
                            <Legend />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Model Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {Object.entries(MODEL_CONFIG).map(([key, config]) => {
                        const score = scores[key as keyof typeof scores]
                        return (
                            <div
                                key={key}
                                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{config.icon}</span>
                                    <span className="font-medium text-sm">{config.name}</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span
                                        className="text-2xl font-bold"
                                        style={{ color: config.color }}
                                    >
                                        {score?.score ?? 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground">/100</span>
                                </div>
                                {score?.sentiment && (
                                    <Badge
                                        variant="outline"
                                        className={`mt-1 text-xs ${getSentimentClass(score.sentiment)}`}
                                    >
                                        {getSentimentLabel(score.sentiment)}
                                    </Badge>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

function getSentimentScore(sentiment?: string): number {
    switch (sentiment) {
        case 'positive': return 100
        case 'neutral': return 50
        case 'negative': return 0
        default: return 50
    }
}

function getSentimentClass(sentiment: string): string {
    switch (sentiment) {
        case 'positive': return 'border-emerald-500 text-emerald-600'
        case 'negative': return 'border-red-500 text-red-600'
        default: return 'border-gray-500 text-gray-600'
    }
}

function getSentimentLabel(sentiment: string): string {
    switch (sentiment) {
        case 'positive': return 'Positivo'
        case 'negative': return 'Negativo'
        default: return 'Neutral'
    }
}
