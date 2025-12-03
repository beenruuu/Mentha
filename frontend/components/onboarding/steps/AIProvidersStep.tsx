'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useTranslations } from '@/lib/i18n'
import Image from 'next/image'

const PROVIDERS = [
    { id: 'chatgpt', name: 'ChatGPT', model: 'gpt-4o', logo: '/providers/openai.svg' },
    { id: 'claude', name: 'Claude', model: 'claude-3.5-sonnet', logo: '/providers/claude-color.svg' },
    { id: 'gemini', name: 'Gemini', model: 'gemini-pro', logo: '/providers/gemini-color.svg' },
    { id: 'perplexity', name: 'Perplexity', model: 'sonar', logo: '/providers/perplexity-color.svg' },
]

export default function AIProvidersStep() {
    const { aiProviders, setAIProviders, nextStep, prevStep } = useOnboarding()
    const { lang } = useTranslations()

    const t = {
        title: lang === 'es' ? '¿Qué IAs quieres monitorizar?' : 'Which AIs do you want to monitor?',
        subtitle: lang === 'es' ? 'Selecciona los proveedores de IA a trackear' : 'Select AI providers to track',
        next: lang === 'es' ? 'Continuar' : 'Continue',
        back: lang === 'es' ? 'Atrás' : 'Back',
    }

    const toggleProvider = (id: string) => {
        setAIProviders(
            aiProviders.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
        )
    }

    const selectedCount = aiProviders.filter((p) => p.selected).length

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            <div className="grid gap-3">
                {PROVIDERS.map((provider) => {
                    const isSelected = aiProviders.find((p) => p.id === provider.id)?.selected ?? false
                    return (
                        <div
                            key={provider.id}
                            onClick={() => toggleProvider(provider.id)}
                            className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                                isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                        >
                            <Checkbox checked={isSelected} />
                            <Image src={provider.logo} alt={provider.name} width={32} height={32} className="rounded" />
                            <div className="flex-1">
                                <Label className="font-medium cursor-pointer">{provider.name}</Label>
                                <p className="text-xs text-muted-foreground">{provider.model}</p>
                            </div>
                        </div>
                    )
                })}
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
