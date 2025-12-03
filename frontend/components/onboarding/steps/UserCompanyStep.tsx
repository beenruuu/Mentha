'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/lib/i18n'

export default function UserCompanyStep() {
    const { userInfo, setUserInfo, nextStep, prevStep } = useOnboarding()
    const { lang } = useTranslations()

    const t = {
        title: lang === 'es' ? '¿Cuál es tu empresa?' : 'What is your company?',
        subtitle: lang === 'es' ? 'Nombre de tu organización' : 'Your organization name',
        companyName: lang === 'es' ? 'Nombre de la empresa' : 'Company name',
        next: lang === 'es' ? 'Continuar' : 'Continue',
        back: lang === 'es' ? 'Atrás' : 'Back',
    }

    const canContinue = userInfo.companyName.trim()

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="companyName">{t.companyName}</Label>
                    <Input
                        id="companyName"
                        value={userInfo.companyName}
                        onChange={(e) => setUserInfo({ ...userInfo, companyName: e.target.value })}
                        placeholder={t.companyName}
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                    {t.back}
                </Button>
                <Button onClick={nextStep} disabled={!canContinue} className="flex-1">
                    {t.next}
                </Button>
            </div>
        </div>
    )
}
