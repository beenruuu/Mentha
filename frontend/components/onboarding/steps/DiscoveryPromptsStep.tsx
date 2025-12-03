'use client'

import { useState } from 'react'
import { useOnboarding } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

export default function DiscoveryPromptsStep() {
    const { discoveryPrompts, setDiscoveryPrompts, nextStep, prevStep } = useOnboarding()
    const { lang } = useTranslations()
    const [newPrompt, setNewPrompt] = useState('')

    const t = {
        title: lang === 'es' ? 'Prompts de investigación' : 'Research prompts',
        subtitle: lang === 'es' ? 'Selecciona o añade los prompts que usaremos para analizar tu visibilidad' : 'Select or add prompts we will use to analyze your visibility',
        addPrompt: lang === 'es' ? 'Añadir prompt' : 'Add prompt',
        placeholder: lang === 'es' ? 'Escribe un prompt...' : 'Write a prompt...',
        next: lang === 'es' ? 'Continuar' : 'Continue',
        back: lang === 'es' ? 'Atrás' : 'Back',
    }

    const togglePrompt = (id: string) => {
        setDiscoveryPrompts(
            discoveryPrompts.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
        )
    }

    const addPrompt = () => {
        if (!newPrompt.trim()) return
        const newP = {
            id: `custom-${Date.now()}`,
            text: newPrompt.trim(),
            selected: true,
            isCustom: true,
        }
        setDiscoveryPrompts([...discoveryPrompts, newP])
        setNewPrompt('')
    }

    const removePrompt = (id: string) => {
        setDiscoveryPrompts(discoveryPrompts.filter((p) => p.id !== id))
    }

    const selectedCount = discoveryPrompts.filter((p) => p.selected).length

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            <div className="flex gap-2">
                <Input
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder={t.placeholder}
                    onKeyDown={(e) => e.key === 'Enter' && addPrompt()}
                />
                <Button variant="outline" size="icon" onClick={addPrompt}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
                {discoveryPrompts.map((prompt) => (
                    <div
                        key={prompt.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            prompt.selected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                        onClick={() => togglePrompt(prompt.id)}
                    >
                        <Checkbox checked={prompt.selected} />
                        <Label className="flex-1 cursor-pointer text-sm">{prompt.text}</Label>
                        {prompt.isCustom && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removePrompt(prompt.id)
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                    {t.back}
                </Button>
                <Button onClick={nextStep} disabled={selectedCount === 0} className="flex-1">
                    {t.next}
                </Button>
            </div>
        </div>
    )
}
