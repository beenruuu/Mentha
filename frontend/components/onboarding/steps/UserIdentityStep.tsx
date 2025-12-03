'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/lib/i18n'

export default function UserIdentityStep() {
    const { userInfo, setUserInfo, nextStep } = useOnboarding()
    const { lang } = useTranslations()

    const t = {
        title: lang === 'es' ? '¿Cómo te llamas?' : 'What is your name?',
        subtitle: lang === 'es' ? 'Personaliza tu experiencia' : 'Personalize your experience',
        firstName: lang === 'es' ? 'Nombre' : 'First name',
        lastName: lang === 'es' ? 'Apellidos' : 'Last name',
        next: lang === 'es' ? 'Continuar' : 'Continue',
    }

    const canContinue = userInfo.firstName.trim() && userInfo.lastName.trim()

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">{t.firstName}</Label>
                    <Input
                        id="firstName"
                        value={userInfo.firstName}
                        onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                        placeholder={t.firstName}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">{t.lastName}</Label>
                    <Input
                        id="lastName"
                        value={userInfo.lastName}
                        onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                        placeholder={t.lastName}
                    />
                </div>
            </div>

            <Button onClick={nextStep} disabled={!canContinue} className="w-full">
                {t.next}
            </Button>
        </div>
    )
}
