'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Plus, X, Lightbulb, Loader2 } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import { useState, useEffect } from 'react'

// Industry-specific suggested prompts
const SUGGESTED_PROMPTS_BY_INDUSTRY: Record<string, { es: string[], en: string[] }> = {
    'saas': {
        es: ['mejores herramientas CRM para pymes', 'alternativas a Salesforce', 'software de gestión empresarial recomendado'],
        en: ['best CRM tools for SMBs', 'Salesforce alternatives', 'recommended business management software']
    },
    'ecommerce': {
        es: ['dónde comprar {producto} online', 'mejores tiendas online de {categoría}', 'opiniones sobre {marca}'],
        en: ['where to buy {product} online', 'best online {category} stores', 'reviews about {brand}']
    },
    'agency': {
        es: ['mejores agencias de marketing en {ciudad}', 'agencia de branding recomendada', 'cómo elegir una agencia digital'],
        en: ['best marketing agencies in {city}', 'recommended branding agency', 'how to choose a digital agency']
    },
    'consulting': {
        es: ['consultores de {especialidad} en {país}', 'cómo mejorar {proceso} en mi empresa', 'qué consultor contratar para {problema}'],
        en: ['{specialty} consultants in {country}', 'how to improve {process} in my company', 'which consultant to hire for {problem}']
    },
    'facility': {
        es: ['empresas de servicios integrales en {ciudad}', 'mejores servicios de mantenimiento industrial', 'empresas de limpieza profesional recomendadas'],
        en: ['integrated services companies in {city}', 'best industrial maintenance services', 'recommended professional cleaning services']
    },
    'default': {
        es: ['qué hace {tu empresa}', 'alternativas a {competidor}', 'opiniones sobre {tu marca}'],
        en: ['what does {yourcompany} do', 'alternatives to {competitor}', 'reviews about {yourbrand}']
    }
}

export default function DiscoveryPromptsStep() {
    const { researchPrompts, setResearchPrompts, nextStep, prevStep, brandProfile } = useOnboarding()
    const { lang } = useTranslations()

    const [prompts, setPrompts] = useState<string[]>([])
    const [newPrompt, setNewPrompt] = useState('')
    const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])

    const t = {
        title: lang === 'es' ? 'Búsquedas a monitorear' : 'Searches to monitor',
        subtitle: lang === 'es'
            ? 'Selecciona o añade las consultas que los usuarios podrían hacer para encontrar empresas como la tuya'
            : 'Select or add queries that users might search to find businesses like yours',
        suggested: lang === 'es' ? 'Sugerencias para tu sector' : 'Suggestions for your industry',
        addOwn: lang === 'es' ? 'Añade tu propia consulta' : 'Add your own query',
        addOwnPlaceholder: lang === 'es' ? 'Ej: "mejores servicios de..."' : 'E.g: "best services for..."',
        add: lang === 'es' ? 'Añadir' : 'Add',
        selected: lang === 'es' ? 'Consultas seleccionadas' : 'Selected queries',
        next: lang === 'es' ? 'Continuar' : 'Continue',
        skip: lang === 'es' ? 'Omitir por ahora' : 'Skip for now',
        back: lang === 'es' ? 'Atrás' : 'Back',
        step: lang === 'es' ? 'Paso 5 de 7' : 'Step 5 of 7',
        tip: lang === 'es'
            ? 'Estas consultas se usarán para medir tu visibilidad en modelos IA'
            : 'These queries will be used to measure your visibility in AI models',
        min: lang === 'es' ? 'Mínimo 3 consultas' : 'Minimum 3 queries',
    }

    // Generate suggested prompts based on industry
    useEffect(() => {
        const category = brandProfile.category?.toLowerCase() || ''
        const industry = Object.keys(SUGGESTED_PROMPTS_BY_INDUSTRY).find(key => category.includes(key)) || 'default'

        let suggestions = SUGGESTED_PROMPTS_BY_INDUSTRY[industry][lang] || SUGGESTED_PROMPTS_BY_INDUSTRY['default'][lang]

        // Replace placeholders with actual brand info
        suggestions = suggestions.map(s =>
            s.replace('{tu empresa}', brandProfile.name || 'tu empresa')
                .replace('{yourcompany}', brandProfile.name || 'your company')
                .replace('{tu marca}', brandProfile.name || 'tu marca')
                .replace('{yourbrand}', brandProfile.name || 'your brand')
                .replace('{producto}', 'productos')
                .replace('{product}', 'products')
                .replace('{categoría}', brandProfile.category?.split(',')[0]?.trim() || 'servicios')
                .replace('{category}', brandProfile.category?.split(',')[0]?.trim() || 'services')
                .replace('{ciudad}', brandProfile.city || 'España')
                .replace('{city}', brandProfile.city || 'Spain')
                .replace('{país}', 'España')
                .replace('{country}', 'Spain')
        )

        setSuggestedPrompts(suggestions)

        // Pre-select first 3 if nothing selected yet
        if (prompts.length === 0) {
            setPrompts(suggestions.slice(0, 3))
        }
    }, [brandProfile, lang])

    // Sync to context
    useEffect(() => {
        setResearchPrompts(prompts.map(text => ({ text, selected: true })))
    }, [prompts, setResearchPrompts])

    const togglePrompt = (prompt: string) => {
        setPrompts(prev =>
            prev.includes(prompt)
                ? prev.filter(p => p !== prompt)
                : [...prev, prompt]
        )
    }

    const addCustomPrompt = () => {
        const trimmed = newPrompt.trim()
        if (!trimmed) return
        if (prompts.includes(trimmed)) return

        setPrompts(prev => [...prev, trimmed])
        setNewPrompt('')
    }

    const removePrompt = (prompt: string) => {
        setPrompts(prev => prev.filter(p => p !== prompt))
    }

    const handleNext = () => {
        nextStep()
    }

    const handleSkip = () => {
        setPrompts([])
        setResearchPrompts([])
        nextStep()
    }

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl p-6 md:p-8 space-y-5 shadow-2xl border-border bg-card/50 dark:bg-black/40 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {t.step}
                    </span>
                </div>

                <div className="space-y-4">
                    {/* Suggested prompts */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-medium text-muted-foreground">{t.suggested}</span>
                        </div>
                        <div className="grid gap-2">
                            {suggestedPrompts.map((prompt, index) => {
                                const isSelected = prompts.includes(prompt)
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => togglePrompt(prompt)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all text-sm ${isSelected
                                                ? 'bg-primary/10 border-primary/30 text-foreground'
                                                : 'bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 border-input text-muted-foreground hover:border-ring hover:text-foreground'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-input'
                                            }`}>
                                            {isSelected && (
                                                <div className="w-2 h-2 rounded-sm bg-white" />
                                            )}
                                        </div>
                                        <span className="flex-1 text-foreground">"{prompt}"</span>
                                        {isSelected && <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Add custom prompt */}
                    <div className="pt-2 border-t border-border space-y-2">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                            <Plus className="w-3.5 h-3.5" />
                            {t.addOwn}
                        </span>
                        <div className="flex gap-2">
                            <Textarea
                                value={newPrompt}
                                onChange={(e) => setNewPrompt(e.target.value)}
                                placeholder={t.addOwnPlaceholder}
                                rows={1}
                                className="bg-background/50 dark:bg-white/5 border-input text-sm resize-none text-foreground flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        addCustomPrompt()
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                onClick={addCustomPrompt}
                                disabled={!newPrompt.trim()}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Selected prompts */}
                    {prompts.length > 0 && (
                        <div className="pt-2 border-t border-border space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">{t.selected}</span>
                                <Badge variant="secondary" className="text-xs">
                                    {prompts.length}
                                </Badge>
                            </div>
                            <div className="space-y-1.5">
                                {prompts.map((prompt, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20"
                                    >
                                        <span className="text-sm text-foreground flex-1">"{prompt}"</span>
                                        <button
                                            type="button"
                                            onClick={() => removePrompt(prompt)}
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tip */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-300">{t.tip}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-2">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        {t.back}
                    </Button>
                    <div className="flex gap-2">
                        {prompts.length === 0 && (
                            <Button
                                variant="ghost"
                                onClick={handleSkip}
                                className="text-muted-foreground hover:text-white"
                            >
                                {t.skip}
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            disabled={prompts.length < 3}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10 font-medium"
                        >
                            {t.next}
                            {prompts.length < 3 && (
                                <span className="ml-2 text-xs opacity-70">({prompts.length}/3)</span>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
