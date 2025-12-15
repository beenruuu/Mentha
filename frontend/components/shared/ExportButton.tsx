'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Archive, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/lib/i18n"

interface ExportButtonProps {
    brandId: string
    brandName?: string
    size?: 'sm' | 'default' | 'lg'
    variant?: 'default' | 'outline' | 'ghost'
}

type ExportType = 'keywords' | 'competitors' | 'visibility' | 'mentions' | 'prompts' | 'sentiment' | 'all'

// Component-level translations
const componentTranslations = {
    es: {
        export: 'Exportar',
        exportData: 'Exportar Datos',
        keywords: 'Palabras Clave',
        keywordsDesc: 'Todas las keywords trackeadas con métricas',
        competitors: 'Competidores',
        competitorsDesc: 'Lista de competidores y puntuaciones',
        visibilityHistory: 'Historial de Visibilidad',
        visibilityDesc: 'Datos de visibilidad IA (últimos 90 días)',
        brandMentions: 'Menciones de Marca',
        mentionsDesc: 'Todas las menciones detectadas',
        trackedPrompts: 'Prompts Monitoreados',
        promptsDesc: 'Configuración de seguimiento de prompts',
        sentimentHistory: 'Historial de Sentimiento',
        sentimentDesc: 'Análisis de sentimiento a lo largo del tiempo',
        exportAll: 'Exportar Todo (ZIP)',
        exportAllDesc: 'Descargar todo como ZIP',
        exportSuccessful: 'Exportación exitosa',
        downloaded: 'Descargado',
        exportFailed: 'Error en la exportación',
        couldNotExport: 'No se pudieron exportar los datos. Inténtalo de nuevo.'
    },
    en: {
        export: 'Export',
        exportData: 'Export Data',
        keywords: 'Keywords',
        keywordsDesc: 'All tracked keywords with metrics',
        competitors: 'Competitors',
        competitorsDesc: 'Competitor list and visibility scores',
        visibilityHistory: 'Visibility History',
        visibilityDesc: 'AI visibility data (last 90 days)',
        brandMentions: 'Brand Mentions',
        mentionsDesc: 'All detected brand mentions',
        trackedPrompts: 'Tracked Prompts',
        promptsDesc: 'Prompt tracking configuration',
        sentimentHistory: 'Sentiment History',
        sentimentDesc: 'Sentiment analysis over time',
        exportAll: 'Export All (ZIP)',
        exportAllDesc: 'Download everything as ZIP',
        exportSuccessful: 'Export successful',
        downloaded: 'Downloaded',
        exportFailed: 'Export failed',
        couldNotExport: 'Could not export data. Please try again.'
    }
}

export function ExportButton({ brandId, brandName, size = 'sm', variant = 'outline' }: ExportButtonProps) {
    const { lang } = useTranslations()
    const texts = componentTranslations[lang as 'es' | 'en'] || componentTranslations.en

    const [exporting, setExporting] = useState<ExportType | null>(null)
    const { toast } = useToast()

    const handleExport = async (type: ExportType) => {
        setExporting(type)

        try {
            const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/export/${brandId}/${type}`
            const response = await fetch(endpoint)

            if (!response.ok) {
                throw new Error('Export failed')
            }

            // Get filename from Content-Disposition header or generate one
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = `mentha_${type}_export.csv`

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
                if (filenameMatch) {
                    filename = filenameMatch[1]
                }
            }

            if (type === 'all') {
                filename = `mentha_export_${new Date().toISOString().split('T')[0]}.zip`
            }

            // Create blob and download
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast({
                title: texts.exportSuccessful,
                description: `${texts.downloaded} ${filename}`,
            })
        } catch (error) {
            console.error('Export failed:', error)
            toast({
                title: texts.exportFailed,
                description: texts.couldNotExport,
                variant: "destructive",
            })
        } finally {
            setExporting(null)
        }
    }

    const exportOptions: { type: ExportType; label: string; icon: React.ReactNode; description: string }[] = [
        {
            type: 'keywords',
            label: texts.keywords,
            icon: <FileSpreadsheet className="w-4 h-4" />,
            description: texts.keywordsDesc
        },
        {
            type: 'competitors',
            label: texts.competitors,
            icon: <FileSpreadsheet className="w-4 h-4" />,
            description: texts.competitorsDesc
        },
        {
            type: 'visibility',
            label: texts.visibilityHistory,
            icon: <FileSpreadsheet className="w-4 h-4" />,
            description: texts.visibilityDesc
        },
        {
            type: 'mentions',
            label: texts.brandMentions,
            icon: <FileSpreadsheet className="w-4 h-4" />,
            description: texts.mentionsDesc
        },
        {
            type: 'prompts',
            label: texts.trackedPrompts,
            icon: <FileSpreadsheet className="w-4 h-4" />,
            description: texts.promptsDesc
        },
        {
            type: 'sentiment',
            label: texts.sentimentHistory,
            icon: <FileSpreadsheet className="w-4 h-4" />,
            description: texts.sentimentDesc
        },
    ]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className="gap-2">
                    {exporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                    {texts.export}
                    <ChevronDown className="w-3 h-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{texts.exportData}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {exportOptions.map((option) => (
                    <DropdownMenuItem
                        key={option.type}
                        onClick={() => handleExport(option.type)}
                        disabled={exporting !== null}
                        className="flex items-start gap-2 py-2"
                    >
                        <span className="mt-0.5 text-muted-foreground">
                            {exporting === option.type ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                option.icon
                            )}
                        </span>
                        <div className="flex-1">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => handleExport('all')}
                    disabled={exporting !== null}
                    className="flex items-start gap-2 py-2"
                >
                    <span className="mt-0.5 text-emerald-600">
                        {exporting === 'all' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Archive className="w-4 h-4" />
                        )}
                    </span>
                    <div className="flex-1">
                        <div className="font-medium text-emerald-600">{texts.exportAll}</div>
                        <div className="text-xs text-muted-foreground">{texts.exportAllDesc}</div>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
