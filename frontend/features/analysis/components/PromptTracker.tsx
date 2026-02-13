'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Play, Check, X, Clock, ChevronRight, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AiInput } from "@/components/ui/ai-input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslations } from "@/lib/i18n"


interface TrackedPrompt {
    id: string
    prompt_text: string
    category?: string
    is_active: boolean
    check_frequency: string
    last_checked_at?: string
    created_at: string
}

interface PromptCheckResult {
    visibility_rate: number
    models_checked: number
    brand_mentioned_count: number
    results: Array<{
        model: string
        brand_mentioned: boolean
        position?: number
        sentiment?: string
        sentiment_score?: number
    }>
}

interface PromptTrackerProps {
    brandId: string
    brandName: string
    competitors?: string[]
    lastUpdated?: number
}

// Component-level translations
const componentTranslations = {
    es: {
        promptTracking: 'Seguimiento de Prompts',
        monitorSpecificQuestions: 'Monitorea preguntas específicas en modelos de IA',
        addPrompt: 'Añadir Prompt',
        addTrackedPrompt: 'Añadir Prompt a Monitorear',
        enterPromptToMonitor: 'Introduce una pregunta o prompt para monitorear en los modelos de IA.',
        promptText: 'Texto del Prompt',
        promptPlaceholder: 'Ej: ¿Cuáles son las mejores herramientas CRM para startups?',
        categoryOptional: 'Categoría (opcional)',
        selectCategory: 'Selecciona una categoría',
        categoryProduct: 'Producto',
        categoryCompetitor: 'Comparación con Competidores',
        categoryFeature: 'Funcionalidad',
        categoryReview: 'Reseña/Recomendación',
        categoryOther: 'Otro',
        cancel: 'Cancelar',
        noPromptsYet: 'Sin prompts monitoreados aún.',
        addPromptsToMonitor: 'Añade prompts para monitorear la visibilidad de tu marca.',
        runCheck: 'Ejecutar verificación',
        deletePrompt: 'Eliminar prompt',
        viewAll: 'Ver todos los',
        prompts: 'prompts',
        promptCheckResults: 'Resultados de la Verificación',
        visibilityAcross: 'Visibilidad en',
        aiModels: 'modelos de IA',
        mentionedIn: 'Mencionado en',
        of: 'de',
        models: 'modelos',
        position: 'Posición',
        neverChecked: 'Nunca verificado',
        minutesAgo: 'hace {n}m',
        hoursAgo: 'hace {n}h',
        daysAgo: 'hace {n}d',
        quickAddPlaceholder: '¿Qué pregunta quieres monitorear?'
    },
    en: {
        promptTracking: 'Prompt Tracking',
        monitorSpecificQuestions: 'Monitor specific questions across AI models',
        addPrompt: 'Add Prompt',
        addTrackedPrompt: 'Add Tracked Prompt',
        enterPromptToMonitor: 'Enter a question or prompt to monitor across AI models.',
        promptText: 'Prompt Text',
        promptPlaceholder: 'e.g. What are the best CRM tools for startups?',
        categoryOptional: 'Category (optional)',
        selectCategory: 'Select a category',
        categoryProduct: 'Product',
        categoryCompetitor: 'Competitor Comparison',
        categoryFeature: 'Feature',
        categoryReview: 'Review/Recommendation',
        categoryOther: 'Other',
        cancel: 'Cancel',
        noPromptsYet: 'No prompts tracked yet.',
        addPromptsToMonitor: 'Add prompts to monitor your brand visibility.',
        runCheck: 'Run check',
        deletePrompt: 'Delete prompt',
        viewAll: 'View all',
        prompts: 'prompts',
        promptCheckResults: 'Prompt Check Results',
        visibilityAcross: 'Visibility across',
        aiModels: 'AI models',
        mentionedIn: 'Mentioned in',
        of: 'of',
        models: 'models',
        position: 'Position',
        neverChecked: 'Never checked',
        minutesAgo: '{n}m ago',
        hoursAgo: '{n}h ago',
        daysAgo: '{n}d ago',
        quickAddPlaceholder: 'What question do you want to monitor?'
    }
}

export function PromptTracker({ brandId, brandName, competitors = [], lastUpdated }: PromptTrackerProps) {
    const { lang } = useTranslations()
    const texts = componentTranslations[lang as 'es' | 'en'] || componentTranslations.en

    const [prompts, setPrompts] = useState<TrackedPrompt[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newPromptText, setNewPromptText] = useState('')
    const [newPromptCategory, setNewPromptCategory] = useState('')
    const [checkingPromptId, setCheckingPromptId] = useState<string | null>(null)
    const [checkResult, setCheckResult] = useState<PromptCheckResult | null>(null)

    useEffect(() => {
        fetchPrompts()
    }, [brandId, lastUpdated])

    const fetchPrompts = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prompts/${brandId}`)
            if (response.ok) {
                const data = await response.json()
                setPrompts(data.prompts || [])
            }
        } catch (err) {
            console.error('Failed to fetch prompts:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddPrompt = async () => {
        if (!newPromptText.trim()) return

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prompts/${brandId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt_text: newPromptText,
                    category: newPromptCategory || null,
                    check_frequency: 'daily'
                })
            })

            if (response.ok) {
                const data = await response.json()
                setPrompts([data.prompt, ...prompts])
                setNewPromptText('')
                setNewPromptCategory('')
                setIsAddDialogOpen(false)
            }
        } catch (err) {
            console.error('Failed to add prompt:', err)
        }
    }

    const handleQuickAddPrompt = async (promptText: string) => {
        if (!promptText.trim()) return

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prompts/${brandId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt_text: promptText,
                    category: null,
                    check_frequency: 'daily'
                })
            })

            if (response.ok) {
                const data = await response.json()
                setPrompts([data.prompt, ...prompts])
            }
        } catch (err) {
            console.error('Failed to add prompt:', err)
        }
    }

    const handleDeletePrompt = async (promptId: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prompts/${promptId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setPrompts(prompts.filter(p => p.id !== promptId))
            }
        } catch (err) {
            console.error('Failed to delete prompt:', err)
        }
    }

    const handleCheckPrompt = async (promptId: string) => {
        setCheckingPromptId(promptId)
        setCheckResult(null)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prompts/${promptId}/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand_name: brandName,
                    competitors: competitors
                })
            })

            if (response.ok) {
                const data = await response.json()
                setCheckResult(data)

                // Update the prompt's last_checked_at
                setPrompts(prompts.map(p =>
                    p.id === promptId
                        ? { ...p, last_checked_at: new Date().toISOString() }
                        : p
                ))
            }
        } catch (err) {
            console.error('Failed to check prompt:', err)
        } finally {
            setCheckingPromptId(null)
        }
    }

    const getVisibilityColor = (rate: number) => {
        if (rate >= 70) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30'
        if (rate >= 40) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
        return 'text-red-600 bg-red-100 dark:bg-red-900/30'
    }

    const formatTimeAgo = (dateString?: string) => {
        if (!dateString) return texts.neverChecked

        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 60) {
            return lang === 'es' ? `hace ${diffMins}m` : `${diffMins}m ago`
        }
        if (diffHours < 24) {
            return lang === 'es' ? `hace ${diffHours}h` : `${diffHours}h ago`
        }
        return lang === 'es' ? `hace ${diffDays}d` : `${diffDays}d ago`
    }

    const getCategoryLabel = (category?: string) => {
        if (!category) return null
        const categoryMap: Record<string, string> = {
            product: texts.categoryProduct,
            competitor: texts.categoryCompetitor,
            feature: texts.categoryFeature,
            review: texts.categoryReview,
            other: texts.categoryOther
        }
        return categoryMap[category] || category
    }

    if (loading) {
        return (
            <Card className="border-border/50 shadow-sm rounded-xl animate-pulse">
                <CardHeader className="pb-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-border/50 shadow-sm rounded-xl">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Search className="w-4 h-4 text-blue-500" />
                            {texts.promptTracking}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {texts.monitorSpecificQuestions}
                        </CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                <Plus className="w-3 h-3" />
                                {texts.addPrompt}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{texts.addTrackedPrompt}</DialogTitle>
                                <DialogDescription>
                                    {texts.enterPromptToMonitor}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{texts.promptText}</label>
                                    <Input
                                        placeholder={texts.promptPlaceholder}
                                        value={newPromptText}
                                        onChange={(e) => setNewPromptText(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{texts.categoryOptional}</label>
                                    <Select value={newPromptCategory} onValueChange={setNewPromptCategory}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={texts.selectCategory} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="product">{texts.categoryProduct}</SelectItem>
                                            <SelectItem value="competitor">{texts.categoryCompetitor}</SelectItem>
                                            <SelectItem value="feature">{texts.categoryFeature}</SelectItem>
                                            <SelectItem value="review">{texts.categoryReview}</SelectItem>
                                            <SelectItem value="other">{texts.categoryOther}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    {texts.cancel}
                                </Button>
                                <Button onClick={handleAddPrompt} disabled={!newPromptText.trim()}>
                                    {texts.addPrompt}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {prompts.length === 0 ? (
                    <div className="text-center py-4">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">{texts.noPromptsYet}</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">{texts.addPromptsToMonitor}</p>
                        <AiInput
                            placeholder={texts.quickAddPlaceholder}
                            onSubmit={async (value) => handleQuickAddPrompt(value)}
                            showSearchToggle={false}
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {prompts.slice(0, 5).map((prompt) => (
                            <div
                                key={prompt.id}
                                className="group p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-all"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {prompt.prompt_text}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {prompt.category && (
                                                <Badge variant="outline" className="text-[10px]">
                                                    {getCategoryLabel(prompt.category)}
                                                </Badge>
                                            )}
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTimeAgo(prompt.last_checked_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => handleCheckPrompt(prompt.id)}
                                                        disabled={checkingPromptId === prompt.id}
                                                    >
                                                        <Play className={`w-3 h-3 ${checkingPromptId === prompt.id ? 'animate-pulse' : ''}`} />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{texts.runCheck}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-red-500 hover:text-red-600"
                                                        onClick={() => handleDeletePrompt(prompt.id)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{texts.deletePrompt}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {prompts.length > 5 && (
                            <Button variant="ghost" size="sm" className="w-full text-xs">
                                {texts.viewAll} {prompts.length} {texts.prompts}
                                <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        )}
                    </div>
                )}

                {/* Check Result Modal */}
                {checkResult && (
                    <Dialog open={!!checkResult} onOpenChange={() => setCheckResult(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{texts.promptCheckResults}</DialogTitle>
                                <DialogDescription>
                                    {texts.visibilityAcross} {checkResult.models_checked} {texts.aiModels}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold">
                                        <span className={getVisibilityColor(checkResult.visibility_rate).split(' ')[0]}>
                                            {checkResult.visibility_rate}%
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {texts.mentionedIn} {checkResult.brand_mentioned_count} {texts.of} {checkResult.models_checked} {texts.models}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {checkResult.results.map((result, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium capitalize">{result.model}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {result.position && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {texts.position} {result.position}
                                                    </Badge>
                                                )}
                                                {result.brand_mentioned ? (
                                                    <Check className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <X className="w-4 h-4 text-red-500" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </CardContent>
        </Card>
    )
}
