'use client'

import { useOnboarding, ResearchPrompt } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { Plus, Trash2, Tag, Search, Sparkles, AlertCircle } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const MAX_PROMPTS = 10 // Límite de prompts

export default function ResearchPromptsStep() {
    const { researchPrompts, setResearchPrompts, brandProfile, nextStep, prevStep } = useOnboarding()
    const { lang } = useTranslations()
    
    const [newPrompt, setNewPrompt] = useState('')
    const [newPromptType, setNewPromptType] = useState<'branded' | 'non-branded'>('non-branded')

    const t = {
        title: lang === 'es' ? 'Prompts de investigación' : 'Research Prompts',
        subtitle: lang === 'es' 
            ? 'Estos prompts se usan como semillas para analizar intención. Puedes añadir los tuyos propios.' 
            : 'These prompts are used as seeds for intent analysis. You can add your own.',
        branded: lang === 'es' ? 'Branded' : 'Branded',
        nonBranded: lang === 'es' ? 'Non-branded' : 'Non-branded',
        brandedDesc: lang === 'es' ? 'Incluyen el nombre de tu marca' : 'Include your brand name',
        nonBrandedDesc: lang === 'es' ? 'Consultas genéricas del sector' : 'Generic industry queries',
        addPrompt: lang === 'es' ? 'Añadir prompt' : 'Add prompt',
        placeholder: lang === 'es' ? 'Escribe tu prompt personalizado...' : 'Write your custom prompt...',
        add: lang === 'es' ? 'Añadir' : 'Add',
        limitReached: lang === 'es' ? `Has alcanzado el límite de ${MAX_PROMPTS} prompts` : `You've reached the limit of ${MAX_PROMPTS} prompts`,
        next: lang === 'es' ? 'Continuar' : 'Continue',
        back: lang === 'es' ? 'Atrás' : 'Back',
        step: lang === 'es' ? 'Paso 5 de 6' : 'Step 5 of 6',
        examples: lang === 'es' ? 'Ejemplos' : 'Examples',
        custom: lang === 'es' ? 'Personalizado' : 'Custom',
    }

    const brandedPrompts = researchPrompts.filter(p => p.type === 'branded')
    const nonBrandedPrompts = researchPrompts.filter(p => p.type === 'non-branded')

    const handleAddPrompt = () => {
        if (newPrompt.trim() && researchPrompts.length < MAX_PROMPTS) {
            const prompt: ResearchPrompt = {
                id: `custom-${Date.now()}`,
                text: newPrompt.trim(),
                type: newPromptType,
                isCustom: true
            }
            setResearchPrompts([...researchPrompts, prompt])
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

    const renderPromptList = (prompts: ResearchPrompt[], type: 'branded' | 'non-branded') => (
        <div className="space-y-1.5">
            {prompts.map((prompt) => (
                <div 
                    key={prompt.id}
                    className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border transition-all group",
                        "bg-white/5 border-white/10 hover:border-white/20"
                    )}
                >
                    <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        type === 'branded' ? "bg-primary" : "bg-blue-500"
                    )} />
                    <p className="flex-1 text-sm text-white">{prompt.text}</p>
                    {prompt.isCustom && (
                        <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {t.custom}
                        </span>
                    )}
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleRemovePrompt(prompt.id)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            ))}
            {prompts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">
                    {lang === 'es' ? 'No hay prompts en esta categoría' : 'No prompts in this category'}
                </p>
            )}
        </div>
    )

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl p-6 md:p-8 space-y-4 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                {/* Step indicator */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {t.step}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {researchPrompts.length}/{MAX_PROMPTS}
                    </span>
                </div>

                <div className="space-y-1 text-left">
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        {t.title}
                    </h1>
                    <p className="text-muted-foreground text-sm">{t.subtitle}</p>
                </div>

                <div className="space-y-4">
                    {/* Non-branded section */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-blue-500" />
                            <Label className="text-sm font-medium text-white">{t.nonBranded}</Label>
                            <span className="text-xs text-muted-foreground">— {t.nonBrandedDesc}</span>
                        </div>
                        {renderPromptList(nonBrandedPrompts, 'non-branded')}
                    </div>

                    {/* Branded section */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-primary" />
                            <Label className="text-sm font-medium text-white">{t.branded}</Label>
                            <span className="text-xs text-muted-foreground">— {t.brandedDesc}</span>
                        </div>
                        {renderPromptList(brandedPrompts, 'branded')}
                    </div>

                    {/* Add new prompt */}
                    {researchPrompts.length < MAX_PROMPTS ? (
                        <div className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <Label className="text-sm font-medium text-white">{t.addPrompt}</Label>
                                </div>
                                {/* Type selector */}
                                <div className="flex gap-1.5">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={newPromptType === 'non-branded' ? 'default' : 'outline'}
                                        onClick={() => setNewPromptType('non-branded')}
                                        className={cn(
                                            "h-7 text-xs px-2.5",
                                            newPromptType === 'non-branded' 
                                                ? "bg-blue-500 hover:bg-blue-600 text-white" 
                                                : "border-white/20 text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        <Search className="w-3 h-3 mr-1" />
                                        {t.nonBranded}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={newPromptType === 'branded' ? 'default' : 'outline'}
                                        onClick={() => setNewPromptType('branded')}
                                        className={cn(
                                            "h-7 text-xs px-2.5",
                                            newPromptType === 'branded' 
                                                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                                                : "border-white/20 text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        <Tag className="w-3 h-3 mr-1" />
                                        {t.branded}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    value={newPrompt}
                                    onChange={(e) => setNewPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={t.placeholder}
                                    className="h-9 bg-white/5 border-white/10 flex-1"
                                />
                                <Button
                                    onClick={handleAddPrompt}
                                    disabled={!newPrompt.trim()}
                                    size="sm"
                                    className="h-9 px-3 bg-primary hover:bg-primary/90"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    {t.add}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p className="text-sm">{t.limitReached}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-between pt-2">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        className="text-muted-foreground hover:text-white"
                    >
                        {t.back}
                    </Button>
                    <Button
                        onClick={nextStep}
                        className="bg-white text-black hover:bg-white/90 px-8 h-10 rounded-md font-medium transition-all"
                    >
                        {t.next}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
