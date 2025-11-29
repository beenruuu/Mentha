'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, Sparkles, MessageSquare } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { fetchAPI } from '@/lib/api-client'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export default function DiscoveryPromptsStep() {
    const {
        discoveryPrompts,
        setDiscoveryPrompts,
        userInfo,
        brandInfo,
        setBrandInfo,
        aiProviders,
        prevStep,
        nextStep
    } = useOnboarding()
    const [customPrompt, setCustomPrompt] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const lang = userInfo.preferredLanguage === 'es' ? 'es' : 'en'
    const t = {
        title: lang === 'es' ? 'Elige prompts de descubrimiento' : 'Choose discovery prompts',
        subtitle: lang === 'es' 
            ? 'Estas son preguntas que la gente hace en herramientas de IA donde tu marca podría aparecer.'
            : 'These are questions people ask in AI tools where your brand might show up.',
        addPlaceholder: lang === 'es' ? 'Añade tu propio prompt personalizado...' : 'Add your own custom prompt...',
        add: lang === 'es' ? 'Añadir' : 'Add',
        back: lang === 'es' ? 'Atrás' : 'Back',
        selected: lang === 'es' ? 'seleccionados' : 'selected',
        startAnalysis: lang === 'es' ? 'Iniciar Análisis' : 'Start Analysis',
        saving: lang === 'es' ? 'Creando marca...' : 'Creating brand...',
        customPrompt: lang === 'es' ? 'Prompt personalizado' : 'Custom prompt',
        suggested: lang === 'es' ? 'Sugerido' : 'Suggested',
    }

    const togglePrompt = (id: string) => {
        setDiscoveryPrompts(discoveryPrompts.map(p =>
            p.id === id ? { ...p, selected: !p.selected } : p
        ))
    }

    const addCustomPrompt = () => {
        if (!customPrompt.trim()) return
        const newPrompt = {
            id: `custom-${Date.now()}`,
            text: customPrompt,
            selected: true,
            isCustom: true
        }
        setDiscoveryPrompts([...discoveryPrompts, newPrompt])
        setCustomPrompt('')
    }

    const handleFinish = async () => {
        setIsSubmitting(true)
        
        try {
            // 1. Update User Profile - include preferred language
            await fetchAPI('/auth/me', {
                method: 'PUT',
                body: JSON.stringify({
                    full_name: `${userInfo.firstName} ${userInfo.lastName}`,
                    country: userInfo.country,
                    industry: userInfo.industry,
                    role: userInfo.role,
                    company_name: userInfo.companyName,
                    discovery_source: userInfo.discoverySource,
                    preferred_language: userInfo.preferredLanguage || 'en'
                })
            })

            // Get selected providers and prompts for the analysis
            const selectedProviders = aiProviders.filter(p => p.selected).map(p => p.id)
            const selectedPrompts = discoveryPrompts.filter(p => p.selected).map(p => p.text)

            // 2. Create Brand - this triggers the initial analysis with all data
            const brand = await fetchAPI<{ id: string }>('/brands/', {
                method: 'POST',
                body: JSON.stringify({
                    domain: brandInfo.url || brandInfo.domain,
                    name: brandInfo.title || brandInfo.domain || userInfo.companyName,
                    industry: brandInfo.industry || userInfo.industry,
                    description: brandInfo.description || `${userInfo.companyName} - ${userInfo.industry}`,
                    discovery_prompts: selectedPrompts,
                    ai_providers: selectedProviders,
                    services: brandInfo.services || []
                })
            })

            // Store brand ID in context for the progress step
            setBrandInfo({ ...brandInfo, id: brand.id })

            // Move to analysis progress step
            nextStep()

        } catch (error) {
            console.error('Onboarding failed:', error)
            toast({
                title: lang === 'es' ? 'Algo salió mal' : 'Something went wrong',
                description: lang === 'es' 
                    ? 'No se pudo crear tu marca. Por favor, intenta de nuevo.'
                    : 'Failed to create your brand. Please try again.',
                variant: "destructive"
            })
            setIsSubmitting(false)
        }
    }

    const selectedCount = discoveryPrompts.filter(p => p.selected).length

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-3xl p-10 space-y-8 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="space-y-2 text-left">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        {t.title}
                    </h1>
                    <p className="text-muted-foreground">{t.subtitle}</p>
                </div>

                <div className="grid gap-3">
                    {discoveryPrompts.map((prompt) => (
                        <div
                            key={prompt.id}
                            className={cn(
                                "flex items-start space-x-4 p-4 rounded-lg border transition-all duration-200 cursor-pointer group",
                                prompt.selected
                                    ? "bg-primary/10 border-primary/50 shadow-sm shadow-primary/5"
                                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                            )}
                            onClick={() => togglePrompt(prompt.id)}
                        >
                            <Checkbox
                                checked={prompt.selected}
                                onCheckedChange={() => togglePrompt(prompt.id)}
                                id={prompt.id}
                                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <div className="grid gap-1 leading-none flex-1">
                                <Label
                                    htmlFor={prompt.id}
                                    className="text-base font-medium leading-relaxed cursor-pointer text-white"
                                >
                                    {prompt.text}
                                </Label>
                                <div className="flex items-center gap-2">
                                    {prompt.isCustom ? (
                                        <span className="text-[10px] text-primary flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> {t.customPrompt}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3" /> {t.suggested}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                    <Input
                        placeholder={t.addPlaceholder}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomPrompt()}
                        className="h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                    />
                    <Button
                        variant="secondary"
                        onClick={addCustomPrompt}
                        className="h-11 px-6"
                    >
                        <Plus className="w-4 h-4 mr-2" /> {t.add}
                    </Button>
                </div>

                <div className="flex justify-between pt-4 items-center">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        className="text-muted-foreground hover:text-white"
                    >
                        {t.back}
                    </Button>
                    
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            <span className="text-primary font-bold">{selectedCount}</span> {t.selected}
                        </span>
                        <Button
                            onClick={handleFinish}
                            disabled={isSubmitting}
                            className="bg-white text-black hover:bg-white/90 px-8 h-11 rounded-md font-medium transition-all"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> {t.saving}
                                </>
                            ) : t.startAnalysis}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
