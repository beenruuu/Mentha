'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
    CheckCircle2,
    XCircle,
    ExternalLink
} from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

// AI Provider metadata - matches dashboard exactly
const AI_PROVIDERS = [
    { id: 'openai', name: 'ChatGPT', icon: '/providers/openai.svg?v=3', color: '#10a37f', invert: true },
    { id: 'anthropic', name: 'Claude', icon: '/providers/claude-color.svg?v=3', color: '#da7756', invert: false },
    { id: 'perplexity', name: 'Perplexity', icon: '/providers/perplexity-color.svg?v=3', color: '#3b82f6', invert: false },
    { id: 'gemini', name: 'Gemini', icon: '/providers/gemini-color.svg?v=3', color: '#f59e0b', invert: false },
]

interface VisibilityTabProps {
    brandId: string
    brandName: string
    citations?: any[]
    hallucinations?: any[]
    sentiment?: any
    prompts?: any[]
    modelSentiments?: Record<string, { positive: number; neutral: number; negative: number }>
}

export function VisibilityTab({
    brandId,
    brandName,
    citations = [],
    hallucinations = [],
    sentiment,
    prompts = [],
    modelSentiments = {}
}: VisibilityTabProps) {
    const { t } = useTranslations()
    const [subTab, setSubTab] = useState('citations')

    const getProviderIcon = (modelName: string) => {
        const provider = AI_PROVIDERS.find(p =>
            p.id === modelName.toLowerCase() ||
            p.name.toLowerCase() === modelName.toLowerCase()
        )
        if (!provider) return null
        return (
            <Image
                src={provider.icon}
                alt={provider.name}
                width={14}
                height={14}
                className={provider.invert ? 'dark:invert' : ''}
            />
        )
    }

    return (
        <div className="space-y-6">
            {/* Header - Minimal */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.brand_visibility}</h2>
                <p className="text-sm text-gray-500">Citas, menciones y sentimiento en modelos LLM</p>
            </div>

            {/* Sub-tabs - Compact style */}
            <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
                <TabsList className="bg-gray-100 dark:bg-gray-900 p-1 rounded-lg h-9">
                    <TabsTrigger value="citations" className="text-xs px-3 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        Citas {citations.length > 0 && <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{citations.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="hallucinations" className="text-xs px-3 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        Alucinaciones {hallucinations.length > 0 && <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[10px]">{hallucinations.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="sentiment" className="text-xs px-3 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        Sentimiento
                    </TabsTrigger>
                    <TabsTrigger value="prompts" className="text-xs px-3 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        Queries {prompts.length > 0 && <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{prompts.length}</Badge>}
                    </TabsTrigger>
                </TabsList>

                {/* Citations Tab */}
                <TabsContent value="citations" className="mt-4">
                    {citations.length === 0 ? (
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardContent className="py-12 text-center">
                                <p className="text-sm text-gray-500">No se detectaron citas esta semana.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {citations.map((cite, i) => (
                                <Card key={i} className="border-gray-200 dark:border-gray-800">
                                    <CardContent className="py-3 px-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    {getProviderIcon(cite.model)}
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        {cite.model}
                                                    </span>
                                                </div>
                                                <span className="text-gray-300 dark:text-gray-700">•</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {cite.source}
                                                </span>
                                            </div>
                                            <a
                                                href={cite.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-gray-400 hover:text-emerald-600 flex items-center gap-1"
                                            >
                                                Ver <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Hallucinations Tab */}
                <TabsContent value="hallucinations" className="mt-4">
                    {hallucinations.length === 0 ? (
                        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10">
                            <CardContent className="py-8 text-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Sin alucinaciones detectadas</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">La información sobre tu marca es precisa</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {hallucinations.map((h, i) => (
                                <Card key={i} className="border-red-200 dark:border-red-800/50">
                                    <CardContent className="py-3 px-4">
                                        <div className="flex items-start gap-3">
                                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900 dark:text-white">"{h.claim}"</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <div className="flex items-center gap-1">
                                                        {getProviderIcon(h.model)}
                                                        <span className="text-xs text-gray-500">{h.model}</span>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-red-200 text-red-600">
                                                        {h.severity}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Sentiment Tab */}
                <TabsContent value="sentiment" className="mt-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        {[
                            { label: 'Positivo', value: sentiment?.positive ?? 0, color: 'emerald' },
                            { label: 'Neutral', value: sentiment?.neutral ?? 100, color: 'gray' },
                            { label: 'Negativo', value: sentiment?.negative ?? 0, color: 'red' },
                        ].map((item, i) => (
                            <Card key={i} className="border-gray-200 dark:border-gray-800">
                                <CardContent className="py-4 text-center">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                                    <p className={`text-3xl font-bold tabular-nums ${item.color === 'emerald' ? 'text-emerald-600' : item.color === 'red' ? 'text-red-500' : 'text-gray-600'}`}>
                                        {item.value}%
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Sentiment by Model */}
                    <Card className="mt-4 border-gray-200 dark:border-gray-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Por Modelo de IA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {AI_PROVIDERS.map(provider => {
                                // Get sentiment data for this provider, fallback to overall sentiment or defaults
                                const providerSentiment = modelSentiments[provider.id] || sentiment || { positive: 0, neutral: 100, negative: 0 }
                                const total = providerSentiment.positive + providerSentiment.neutral + providerSentiment.negative
                                const posWidth = total > 0 ? Math.round((providerSentiment.positive / total) * 100) : 0
                                const neuWidth = total > 0 ? Math.round((providerSentiment.neutral / total) * 100) : 100
                                const negWidth = total > 0 ? Math.round((providerSentiment.negative / total) * 100) : 0
                                const positivePercent = total > 0 ? posWidth : 0
                                
                                return (
                                    <div key={provider.id} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 p-1 flex items-center justify-center">
                                            <Image
                                                src={provider.icon}
                                                alt={provider.name}
                                                width={16}
                                                height={16}
                                                className={provider.invert ? 'dark:invert' : ''}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">{provider.name}</span>
                                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-emerald-500" style={{ width: `${posWidth}%` }} />
                                            <div className="h-full bg-gray-300 dark:bg-gray-600" style={{ width: `${neuWidth}%` }} />
                                            <div className="h-full bg-red-500" style={{ width: `${negWidth}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-400 w-12 text-right">
                                            {positivePercent > 0 ? `${positivePercent}%+` : 'N/A'}
                                        </span>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Prompts Tab */}
                <TabsContent value="prompts" className="mt-4">
                    {prompts.length === 0 ? (
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardContent className="py-12 text-center">
                                <p className="text-sm text-gray-500">Sin queries monitoreados.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {prompts.map((p, i) => (
                                <Card key={i} className="border-gray-200 dark:border-gray-800">
                                    <CardContent className="py-3 px-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    {getProviderIcon(p.model)}
                                                    <span className="text-xs text-gray-500">{p.model}</span>
                                                </div>
                                                <span className="text-sm font-mono text-gray-900 dark:text-white">"{p.query}"</span>
                                            </div>
                                            {p.mentioned ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs h-5">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Mencionado
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-700 border-0 text-xs h-5">
                                                    <XCircle className="h-3 w-3 mr-1" /> No aparece
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
