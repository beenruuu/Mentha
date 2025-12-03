'use client'

import { useOnboarding, ResearchPrompt } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, Search, Sparkles, AlertCircle, Loader2, RefreshCw, Check } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { fetchAPI } from '@/lib/api-client'

const MAX_PROMPTS = 10

interface SuggestedPrompt {
    text: string
    type: 'branded' | 'non-branded'
    selected: boolean
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
    const [suggestedPrompts, setSuggestedPrompts] = useState<SuggestedPrompt[]>([])
    const [hasGenerated, setHasGenerated] = useState(false)

    const t = {
        title: lang === 'es' ? 'Prompts de investigación' : 'Research Prompts',
        subtitle: lang === 'es' 
            ? 'La IA ha generado prompts personalizados basándose en tu marca, sector y competidores.' 
            : 'AI has generated personalized prompts based on your brand, industry and competitors.',
        branded: lang === 'es' ? 'Branded' : 'Branded',
        nonBranded: lang === 'es' ? 'Non-branded' : 'Non-branded',
        brandedDesc: lang === 'es' ? 'Incluyen el nombre de tu marca' : 'Include your brand name',
        nonBrandedDesc: lang === 'es' ? 'Consultas genéricas del sector' : 'Generic industry queries',
        addPrompt: lang === 'es' ? 'Añadir prompt personalizado' : 'Add custom prompt',
        placeholder: lang === 'es' ? 'Escribe tu prompt personalizado...' : 'Write your custom prompt...',
        add: lang === 'es' ? 'Añadir' : 'Add',
        limitReached: lang === 'es' ? `Límite de ${MAX_PROMPTS} prompts alcanzado` : `${MAX_PROMPTS} prompts limit reached`,
        next: lang === 'es' ? 'Continuar' : 'Continue',
        back: lang === 'es' ? 'Atrás' : 'Back',
        step: lang === 'es' ? 'Paso 5 de 6' : 'Step 5 of 6',
        custom: lang === 'es' ? 'Personalizado' : 'Custom',
        generating: lang === 'es' ? 'Generando prompts...' : 'Generating prompts...',
        regenerate: lang === 'es' ? 'Regenerar' : 'Regenerate',
        suggestions: lang === 'es' ? 'Sugerencias de la IA' : 'AI Suggestions',
        selectToAdd: lang === 'es' ? 'Selecciona los que quieras añadir' : 'Select the ones you want to add',
        addSelected: lang === 'es' ? 'Añadir seleccionados' : 'Add selected',
        yourPrompts: lang === 'es' ? 'Tus prompts' : 'Your prompts',
    }

    // Generate prompts with AI on mount
    useEffect(() => {
        if (!hasGenerated && brandProfile.name) {
            generatePrompts()
        }
    }, [])

    const generatePrompts = async () => {
        setIsGenerating(true)
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

            setSuggestedPrompts(response.prompts.map(p => ({ ...p, selected: true })))
            setHasGenerated(true)
        } catch (err) {
            console.error('Failed to generate prompts:', err)
            // Fallback to basic prompts
            const fallbackPrompts: SuggestedPrompt[] = [
                { text: `${brandProfile.name} opiniones`, type: 'branded', selected: true },
                { text: `${brandProfile.name} precios`, type: 'branded', selected: true },
                { text: `${brandProfile.name} vs competencia`, type: 'branded', selected: true },
                { text: `mejores empresas de ${brandProfile.category?.split(',')[0] || 'servicios'}`, type: 'non-branded', selected: true },
                { text: `${brandProfile.category?.split(',')[0] || 'servicios'} cerca de mi`, type: 'non-branded', selected: true },
            ]
            setSuggestedPrompts(fallbackPrompts)
            setHasGenerated(true)
        } finally {
            setIsGenerating(false)
        }
    }

    const toggleSuggestion = (index: number) => {
        setSuggestedPrompts(prev => prev.map((p, i) => 
            i === index ? { ...p, selected: !p.selected } : p
        ))
    }

    const addSelectedPrompts = () => {
        const selected = suggestedPrompts.filter(p => p.selected)
        const newPrompts: ResearchPrompt[] = selected.map((p, i) => ({
            id: `ai-${Date.now()}-${i}`,
            text: p.text,
            type: p.type,
            isCustom: false
        }))
        
        // Add only up to the limit
        const available = MAX_PROMPTS - researchPrompts.length
        const toAdd = newPrompts.slice(0, available)
        
        setResearchPrompts([...researchPrompts, ...toAdd])
        // Clear added suggestions
        setSuggestedPrompts(prev => prev.filter(p => !p.selected))
    }

    const brandedPrompts = researchPrompts.filter(p => p.type === 'branded')
    const nonBrandedPrompts = researchPrompts.filter(p => p.type === 'non-branded')
    const selectedCount = suggestedPrompts.filter(p => p.selected).length

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
        <div className="space-y-1">
            {prompts.map((prompt) => (
                <div 
                    key={prompt.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 group"
                >
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        type === 'branded' ? "bg-primary" : "bg-blue-500"
                    )} />
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
    )

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl p-6 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {t.step}
                    </span>
                </div>

                {/* AI Suggestions */}
                {isGenerating ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mr-3" />
                        <span>{t.generating}</span>
                    </div>
                ) : suggestedPrompts.length > 0 ? (
                    <div className="mb-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-medium text-white">{t.suggestions}</span>
                                <span className="text-xs text-muted-foreground">— {t.selectToAdd}</span>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={generatePrompts}
                                className="h-7 text-xs text-muted-foreground hover:text-white"
                            >
                                <RefreshCw className="w-3 h-3 mr-1.5" />
                                {t.regenerate}
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            {suggestedPrompts.map((prompt, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => toggleSuggestion(index)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all",
                                        prompt.selected
                                            ? "bg-primary/15 ring-1 ring-primary/30"
                                            : "bg-white/5 hover:bg-white/8"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                        prompt.selected 
                                            ? "border-primary bg-primary" 
                                            : "border-gray-600"
                                    )}>
                                        {prompt.selected && <Check className="w-2.5 h-2.5 text-black" />}
                                    </div>
                                    <span className="flex-1 text-sm text-gray-300 line-clamp-1">{prompt.text}</span>
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded shrink-0",
                                        prompt.type === 'branded' 
                                            ? "text-primary/80 bg-primary/10" 
                                            : "text-blue-400/80 bg-blue-500/10"
                                    )}>
                                        {prompt.type === 'branded' ? 'B' : 'NB'}
                                    </span>
                                </button>
                            ))}
                        </div>
                        
                        {selectedCount > 0 && researchPrompts.length < MAX_PROMPTS && (
                            <Button
                                onClick={addSelectedPrompts}
                                className="w-full mt-3 h-9 bg-primary hover:bg-primary/90"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t.addSelected} ({selectedCount})
                            </Button>
                        )}
                    </div>
                ) : null}

                {/* Your Prompts */}
                {researchPrompts.length > 0 && (
                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-white">{t.yourPrompts}</span>
                            <span className="text-xs text-muted-foreground">{researchPrompts.length}/{MAX_PROMPTS}</span>
                        </div>
                        <div className="space-y-2">
                            {nonBrandedPrompts.length > 0 && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-blue-400/70 mb-1.5 pl-1">{t.nonBranded}</p>
                                    {renderPromptList(nonBrandedPrompts, 'non-branded')}
                                </div>
                            )}
                            {brandedPrompts.length > 0 && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-primary/70 mb-1.5 pl-1">{t.branded}</p>
                                    {renderPromptList(brandedPrompts, 'branded')}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Add custom */}
                {researchPrompts.length < MAX_PROMPTS && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                        <button
                            type="button"
                            onClick={() => setNewPromptType(newPromptType === 'branded' ? 'non-branded' : 'branded')}
                            className={cn(
                                "h-8 w-8 rounded flex items-center justify-center shrink-0 transition-colors",
                                newPromptType === 'branded' ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-400"
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
                            className="h-8 bg-transparent border-0 focus-visible:ring-0 text-sm flex-1 px-0"
                        />
                        <Button
                            onClick={handleAddPrompt}
                            disabled={!newPrompt.trim()}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white disabled:opacity-30"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {researchPrompts.length >= MAX_PROMPTS && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {t.limitReached}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        className="text-muted-foreground hover:text-white h-10"
                    >
                        {t.back}
                    </Button>
                    <Button
                        onClick={nextStep}
                        className="bg-white text-black hover:bg-white/90 px-8 h-10 font-medium"
                    >
                        {t.next}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
