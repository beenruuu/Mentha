'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap, Brain, Eye, MessageSquare, FileText, AlertTriangle, Link, BarChart3, Settings2 } from 'lucide-react'
import { getFeatureFlags, getFeatureDescriptions, type FeatureFlags, type FeatureDescriptions } from '@/lib/services/features'

interface Props {
    t: any
}

const featureIcons: Record<string, any> = {
    ai_visibility: Eye,
    insights: BarChart3,
    knowledge_graph: Brain,
    hallucination_detection: AlertTriangle,
    citation_tracking: Link,
    sentiment_analysis: MessageSquare,
    prompt_tracking: Zap,
    content_structure: FileText,
    eeat_analysis: Settings2,
    technical_aeo: Settings2,
    platform_detection: Settings2,
    visual_assets: Settings2,
}

export function FeaturesTab({ t }: Props) {
    const [flags, setFlags] = useState<FeatureFlags | null>(null)
    const [descriptions, setDescriptions] = useState<FeatureDescriptions | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadFeatures()
    }, [])

    const loadFeatures = async () => {
        try {
            const [flagsData, descriptionsData] = await Promise.all([
                getFeatureFlags(),
                getFeatureDescriptions()
            ])
            setFlags(flagsData)
            setDescriptions(descriptionsData)
        } catch (err) {
            setError('No se pudieron cargar las features')
            console.error('Failed to load features:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        )
    }

    if (error || !flags || !descriptions) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                {error || 'Error al cargar las características'}
            </div>
        )
    }

    const renderFeatureSection = (
        title: string,
        sectionKey: 'core' | 'advanced' | 'optional',
        badge: { text: string; variant: 'default' | 'secondary' | 'outline' }
    ) => {
        const sectionDescriptions = descriptions[sectionKey]

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <Badge variant={badge.variant}>{badge.text}</Badge>
                    </div>
                    <CardDescription>
                        {sectionKey === 'core' && 'Funcionalidades esenciales siempre activas'}
                        {sectionKey === 'advanced' && 'Características avanzadas de análisis'}
                        {sectionKey === 'optional' && 'Características opcionales (desactivadas por rendimiento)'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(sectionDescriptions).map(([key, description]) => {
                        const Icon = featureIcons[key] || Settings2
                        const isEnabled = flags[key as keyof FeatureFlags]
                        const isCore = sectionKey === 'core'

                        return (
                            <div
                                key={key}
                                className="flex items-center justify-between py-3 border-b last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        <Icon className={`h-4 w-4 ${isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <Label className="font-medium">{formatFeatureName(key)}</Label>
                                        <p className="text-sm text-muted-foreground">{description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={isEnabled}
                                        disabled={true}
                                        className="cursor-not-allowed opacity-70"
                                    />
                                    {isCore && (
                                        <span className="text-xs text-muted-foreground">Requerido</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Características de Análisis</h2>
                <p className="text-muted-foreground">
                    Configura qué funcionalidades de análisis están activas en tu instalación.
                    <br />
                    <span className="text-xs">Los cambios se realizan en el archivo .env del servidor.</span>
                </p>
            </div>

            {renderFeatureSection('Core', 'core', { text: 'Siempre activo', variant: 'default' })}
            {renderFeatureSection('Avanzadas', 'advanced', { text: 'Recomendado', variant: 'secondary' })}
            {renderFeatureSection('Opcionales', 'optional', { text: 'Rendimiento', variant: 'outline' })}

            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Settings2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">Configuración del servidor</p>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                Para activar/desactivar features, edita el archivo <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">.env</code> del backend:
                            </p>
                            <pre className="mt-2 text-xs bg-amber-100 dark:bg-amber-900/50 p-2 rounded overflow-x-auto">
                                {`# Activar/desactivar features
FEATURE_EEAT_ANALYSIS=True
FEATURE_TECHNICAL_AEO=True`}
                            </pre>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function formatFeatureName(key: string): string {
    const names: Record<string, string> = {
        ai_visibility: 'Visibilidad en IA',
        insights: 'Insights del Dashboard',
        knowledge_graph: 'Knowledge Graph',
        hallucination_detection: 'Detección de Alucinaciones',
        citation_tracking: 'Seguimiento de Citas',
        sentiment_analysis: 'Análisis de Sentimiento',
        prompt_tracking: 'Descubrimiento de Prompts',
        content_structure: 'Estructura de Contenido',
        eeat_analysis: 'Análisis E-E-A-T',
        technical_aeo: 'AEO Técnico',
        platform_detection: 'Detección de Plataforma',
        visual_assets: 'Assets Visuales',
    }
    return names[key] || key
}
