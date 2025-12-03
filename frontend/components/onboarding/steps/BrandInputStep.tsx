'use client'

import { useState } from 'react'
import { useOnboarding } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Globe } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

export default function BrandInputStep() {
    const { brandInfo, setBrandInfo, nextStep, prevStep } = useOnboarding()
    const { lang } = useTranslations()
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const t = {
        title: lang === 'es' ? '¿Cuál es tu sitio web?' : 'What is your website?',
        subtitle: lang === 'es' ? 'Analizaremos tu marca automáticamente' : 'We will analyze your brand automatically',
        url: lang === 'es' ? 'URL del sitio web' : 'Website URL',
        placeholder: 'https://example.com',
        next: lang === 'es' ? 'Analizar' : 'Analyze',
        back: lang === 'es' ? 'Atrás' : 'Back',
        analyzing: lang === 'es' ? 'Analizando...' : 'Analyzing...',
    }

    const handleAnalyze = async () => {
        if (!brandInfo.url.trim()) return
        setIsAnalyzing(true)
        // Simulate analysis delay
        await new Promise((resolve) => setTimeout(resolve, 1500))
        // Extract domain from URL
        try {
            const url = new URL(brandInfo.url.startsWith('http') ? brandInfo.url : `https://${brandInfo.url}`)
            setBrandInfo({ ...brandInfo, domain: url.hostname })
        } catch {
            setBrandInfo({ ...brandInfo, domain: brandInfo.url })
        }
        setIsAnalyzing(false)
        nextStep()
    }

    const canContinue = brandInfo.url.trim()

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="url">{t.url}</Label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="url"
                            value={brandInfo.url}
                            onChange={(e) => setBrandInfo({ ...brandInfo, url: e.target.value })}
                            placeholder={t.placeholder}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                    {t.back}
                </Button>
                <Button onClick={handleAnalyze} disabled={!canContinue || isAnalyzing} className="flex-1">
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.analyzing}
                        </>
                    ) : (
                        t.next
                    )}
                </Button>
            </div>
        </div>
    )
}
