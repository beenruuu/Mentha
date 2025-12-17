'use client'

import { useOnboarding, ResearchPrompt } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { Plus, Trash2, Tag, Search, Sparkles, AlertCircle, Loader2, Check } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { fetchAPI } from '@/lib/api-client'

const MAX_PROMPTS = 10

interface SuggestedPrompt {
    text: string
    type: 'branded' | 'non-branded'
}

export default function ResearchPromptsStep() {
    const {
        researchPrompts,
        setResearchPrompts,
        brandProfile,
        competitors,
        companyInfo,
        nextStep,
        prevStep
    } = useOnboarding()
    const { lang } = useTranslations()

    const [newPrompt, setNewPrompt] = useState('')
    const [newPromptType, setNewPromptType] = useState<'branded' | 'non-branded'>('non-branded')
    const [isGenerating, setIsGenerating] = useState(false)
    const [suggestions, setSuggestions] = useState<SuggestedPrompt[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)

    const t = {
        title: lang === 'es' ? 'Prompts de investigación' : 'Research Prompts',
        subtitle: lang === 'es'
            ? 'Define las consultas que usaremos para analizar tu presencia en motores de IA. Este paso es opcional.'
            : 'Define the queries we will use to analyze your AI presence. This step is optional.',
        branded: lang === 'es' ? 'Branded' : 'Branded',
        nonBranded: lang === 'es' ? 'Non-branded' : 'Non-branded',
        brandedDesc: lang === 'es' ? 'Incluyen el nombre de tu marca' : 'Include your brand name',
        nonBrandedDesc: lang === 'es' ? 'Consultas genéricas del sector' : 'Generic industry queries',
        addPrompt: lang === 'es' ? 'Añadir prompt' : 'Add prompt',
        placeholder: lang === 'es' ? 'Escribe tu prompt de búsqueda...' : 'Write your search prompt...',
        add: lang === 'es' ? 'Añadir' : 'Add',
        limitReached: lang === 'es' ? `Límite de ${MAX_PROMPTS} prompts alcanzado` : `${MAX_PROMPTS} prompts limit reached`,
        next: lang === 'es' ? 'Continuar' : 'Continue',
        back: lang === 'es' ? 'Atrás' : 'Back',
        step: lang === 'es' ? 'Paso 5 de 7' : 'Step 5 of 7',
        generating: lang === 'es' ? 'Generando sugerencias...' : 'Generating suggestions...',
        getSuggestions: lang === 'es' ? 'Obtener sugerencias con IA' : 'Get AI suggestions',
        hideSuggestions: lang === 'es' ? 'Ocultar sugerencias' : 'Hide suggestions',
        yourPrompts: lang === 'es' ? 'Tus prompts' : 'Your prompts',
        noPrompts: lang === 'es' ? 'No has añadido ningún prompt aún' : 'You have not added any prompts yet',
        skipInfo: lang === 'es'
            ? 'Puedes continuar sin prompts. El análisis usará consultas automáticas basadas en tu industria y competidores.'
            : 'You can continue without prompts. The analysis will use automatic queries based on your industry and competitors.',
        addSuggestion: lang === 'es' ? 'Añadir' : 'Add',
    }

    // Generate suggestions with AI (only when user clicks button)
    const generateSuggestions = async () => {
        setIsGenerating(true)
        setSuggestions([])
        setShowSuggestions(true)
        try {
            const competitorNames = competitors.map(c => c.name).join(', ')

            const response = await fetchAPI<{ prompts: Array<{ text: string; type: 'branded' | 'non-branded' }> }>(
                '/utils/generate-research-prompts',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        brand_name: brandProfile.name,
                        domain: brandProfile.domain,
                        industry: brandProfile.category,
                        description: brandProfile.description,
                        competitors: competitorNames,
                        location: companyInfo.location,
                        language: lang
                    })
                }
            )

            setSuggestions(response.prompts)
        } catch (err) {
            console.error('Failed to generate suggestions:', err)
            // Fallback to basic suggestions
            const fallback: SuggestedPrompt[] = [
                { text: `${brandProfile.name} opiniones`, type: 'branded' },
                { text: `${brandProfile.name} precios`, type: 'branded' },
                { text: `mejores empresas de ${brandProfile.category?.split(',')[0] || 'servicios'}`, type: 'non-branded' },
            ]
            setSuggestions(fallback)
        } finally {
            setIsGenerating(false)
        }
    }

    const addSuggestion = (suggestion: SuggestedPrompt) => {
        if (researchPrompts.length >= MAX_PROMPTS) return

        // Check for duplicates
        const exists = researchPrompts.some(p => p.text.toLowerCase() === suggestion.text.toLowerCase())
        if (exists) return

        const prompt: ResearchPrompt = {
            id: `ai-${Date.now()}`,
            text: suggestion.text,
            type: suggestion.type,
            isCustom: false
        }
        setResearchPrompts([...researchPrompts, prompt])
        // Remove from suggestions
        setSuggestions(prev => prev.filter(s => s.text !== suggestion.text))
    }

    const handleAddPrompt = () => {
        const currentPrompts = Array.isArray(researchPrompts) ? researchPrompts : []

        if (newPrompt.trim() && currentPrompts.length < MAX_PROMPTS) {
            // Check for duplicates
            const exists = currentPrompts.some(p => p.text.toLowerCase() === newPrompt.trim().toLowerCase())
            if (exists) {
                setNewPrompt('')
                return
            }

            const prompt: ResearchPrompt = {
                id: `custom-${Date.now()}`,
                text: newPrompt.trim(),
                type: newPromptType,
                isCustom: true
            }
            setResearchPrompts([...currentPrompts, prompt])
            setNewPrompt('')
        }
    }

    const handleRemovePrompt = (id: string) => {
        setResearchPrompts(researchPrompts.filter(p => p.id !== id))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddPrompt()
        }
    }

    const brandedPrompts = researchPrompts.filter(p => p.type === 'branded')
    const nonBrandedPrompts = researchPrompts.filter(p => p.type === 'non-branded')

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl p-6 shadow-2xl border-border bg-card/50 dark:bg-black/40 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {t.step}
                    </span>
                </div>

                {/* Add custom prompt - PRIMARY ACTION */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <button
                            type="button"
                            onClick={() => setNewPromptType(newPromptType === 'branded' ? 'non-branded' : 'branded')}
                            className={cn(
                                "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all",
                                newPromptType === 'branded'
                                    ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                                    : "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                            )}
                            title={newPromptType === 'branded' ? t.branded : t.nonBranded}
                        >
                            {newPromptType === 'branded' ? <Tag className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                        </button>
                        <Input
                            value={newPrompt}
                            onChange={(e) => setNewPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t.placeholder}
                            className="h-9 bg-transparent border-0 focus-visible:ring-0 text-sm flex-1"
                            disabled={researchPrompts.length >= MAX_PROMPTS}
                        />
                        <Button
                            onClick={handleAddPrompt}
                            disabled={!newPrompt.trim() || researchPrompts.length >= MAX_PROMPTS}
                            size="sm"
                            className="h-9 px-4 bg-primary hover:bg-primary/90 disabled:opacity-30"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            {t.add}
                        </Button>
                    </div>
                    <div className="flex items-center gap-4 mt-2 px-1">
                        <span className="text-[10px] text-muted-foreground">
                            {newPromptType === 'branded' ? t.brandedDesc : t.nonBrandedDesc}
                        </span>
                    </div>
                </div>

                {/* Your Prompts */}
                {researchPrompts.length > 0 ? (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                                <Search className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-white">{t.yourPrompts}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{researchPrompts.length}/{MAX_PROMPTS}</span>
                        </div>
                        <div className="space-y-3">
                            {nonBrandedPrompts.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[10px] uppercase tracking-wider text-blue-400/80 font-medium pl-1">{t.nonBranded}</p>
                                    <div className="space-y-1">
                                        {nonBrandedPrompts.map((prompt) => (
                                            <div
                                                key={prompt.id}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 group"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-500" />
                                                <p className="flex-1 text-sm text-gray-300">{prompt.text}</p>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleRemovePrompt(prompt.id)}
                                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {brandedPrompts.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[10px] uppercase tracking-wider text-primary/80 font-medium pl-1">{t.branded}</p>
                                    <div className="space-y-1">
                                        {brandedPrompts.map((prompt) => (
                                            <div
                                                key={prompt.id}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 group"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-primary" />
                                                <p className="flex-1 text-sm text-gray-300">{prompt.text}</p>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleRemovePrompt(prompt.id)}
                                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 border-dashed text-center">
                        <p className="text-sm text-muted-foreground">{t.noPrompts}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">{t.skipInfo}</p>
                    </div>
                )}

                {researchPrompts.length >= MAX_PROMPTS && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 text-amber-400 text-sm mb-6">
                        <AlertCircle className="w-4 h-4" />
                        {t.limitReached}
                    </div>
                )}

                {/* AI Suggestions - SECONDARY ACTION */}
                <div className="mb-6">
                    {!showSuggestions ? (
                        <Button
                            variant="outline"
                            onClick={generateSuggestions}
                            disabled={isGenerating || researchPrompts.length >= MAX_PROMPTS}
                            className="w-full h-10 border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white"
                        >
                            <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
                            {t.getSuggestions}
                        </Button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm font-medium text-white">
                                        {lang === 'es' ? 'Sugerencias IA' : 'AI Suggestions'}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowSuggestions(false)}
                                    className="h-7 text-xs text-muted-foreground hover:text-white"
                                >
                                    {t.hideSuggestions}
                                </Button>
                            </div>

                            {isGenerating ? (
                                <div className="flex items-center justify-center py-8 text-muted-foreground">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    <span className="text-sm">{t.generating}</span>
                                </div>
                            ) : suggestions.length > 0 ? (
                                <div className="space-y-1.5">
                                    {suggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10"
                                        >
                                            <span className={cn(
                                                "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
                                                suggestion.type === 'branded'
                                                    ? "text-primary bg-primary/15"
                                                    : "text-blue-400 bg-blue-500/15"
                                            )}>
                                                {suggestion.type === 'branded' ? 'B' : 'NB'}
                                            </span>
                                            <span className="flex-1 text-sm text-gray-300">{suggestion.text}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => addSuggestion(suggestion)}
                                                disabled={researchPrompts.length >= MAX_PROMPTS}
                                                className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                {t.addSuggestion}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-4 text-muted-foreground">
                                    <Check className="w-4 h-4 mr-2 text-green-500" />
                                    <span className="text-sm">
                                        {lang === 'es' ? 'Todas las sugerencias añadidas' : 'All suggestions added'}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t border-white/10">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        {t.back}
                    </Button>
                    <Button
                        onClick={nextStep}
                        disabled={researchPrompts.length === 0}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10 font-medium transition-all disabled:opacity-50"
                    >
                        {t.next}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
