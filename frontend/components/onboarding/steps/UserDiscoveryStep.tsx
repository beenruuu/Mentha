'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslations } from '@/lib/i18n'

const DISCOVERY_SOURCES = [
    { value: 'google', labelEs: 'Búsqueda en Google', labelEn: 'Google search' },
    { value: 'twitter', labelEs: 'Twitter/X', labelEn: 'Twitter/X' },
    { value: 'linkedin', labelEs: 'LinkedIn', labelEn: 'LinkedIn' },
    { value: 'friend', labelEs: 'Recomendación', labelEn: 'Recommendation' },
    { value: 'blog', labelEs: 'Blog/Artículo', labelEn: 'Blog/Article' },
    { value: 'other', labelEs: 'Otro', labelEn: 'Other' },
]

export default function UserDiscoveryStep() {
    const { userInfo, setUserInfo, nextStep, prevStep } = useOnboarding()
    const { lang } = useTranslations()

    const t = {
        title: lang === 'es' ? '¿Cómo nos encontraste?' : 'How did you find us?',
        subtitle: lang === 'es' ? 'Nos ayuda a mejorar' : 'Helps us improve',
        source: lang === 'es' ? 'Fuente' : 'Source',
        selectSource: lang === 'es' ? 'Selecciona fuente' : 'Select source',
        next: lang === 'es' ? 'Continuar' : 'Continue',
        back: lang === 'es' ? 'Atrás' : 'Back',
        skip: lang === 'es' ? 'Omitir' : 'Skip',
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>{t.source}</Label>
                    <Select value={userInfo.discoverySource} onValueChange={(v) => setUserInfo({ ...userInfo, discoverySource: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder={t.selectSource} />
                        </SelectTrigger>
                        <SelectContent>
                            {DISCOVERY_SOURCES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {lang === 'es' ? s.labelEs : s.labelEn}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                    {t.back}
                </Button>
                <Button onClick={nextStep} className="flex-1">
                    {userInfo.discoverySource ? t.next : t.skip}
                </Button>
            </div>
        </div>
    )
}
