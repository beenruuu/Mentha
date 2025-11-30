'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslations } from '@/lib/i18n'

const SEO_EXPERIENCE_OPTIONS = [
    { value: 'none', labelEs: 'Sin experiencia', labelEn: 'No experience' },
    { value: 'beginner', labelEs: 'Principiante (< 1 año)', labelEn: 'Beginner (< 1 year)' },
    { value: 'intermediate', labelEs: 'Intermedio (1-3 años)', labelEn: 'Intermediate (1-3 years)' },
    { value: 'advanced', labelEs: 'Avanzado (3-5 años)', labelEn: 'Advanced (3-5 years)' },
    { value: 'expert', labelEs: 'Experto (5+ años)', labelEn: 'Expert (5+ years)' },
]

export default function AboutYouStep() {
    const { userInfo, setUserInfo, nextStep } = useOnboarding()
    const { lang } = useTranslations()

    const t = {
        title: lang === 'es' ? 'Acerca de ti' : 'About you',
        subtitle: lang === 'es' ? 'Cuéntanos un poco sobre ti para personalizar tu experiencia' : 'Tell us a bit about yourself to personalize your experience',
        firstName: lang === 'es' ? 'Nombre' : 'First name',
        lastName: lang === 'es' ? 'Apellidos' : 'Last name',
        seoExperience: lang === 'es' ? 'Experiencia en SEO/IA (opcional)' : 'SEO/AI experience (optional)',
        selectExperience: lang === 'es' ? 'Selecciona tu nivel' : 'Select your level',
        next: lang === 'es' ? 'Continuar' : 'Continue',
        step: lang === 'es' ? 'Paso 1 de 6' : 'Step 1 of 6',
    }

    const handleNext = () => {
        if (userInfo.firstName && userInfo.lastName) {
            nextStep()
        }
    }

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl p-6 md:p-8 space-y-5 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                {/* Step indicator */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {t.step}
                    </span>
                </div>

                <div className="space-y-2 text-left">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        {t.title}
                    </h1>
                    <p className="text-muted-foreground">{t.subtitle}</p>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="firstName" className="text-sm font-medium text-gray-300">
                                {t.firstName} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="firstName"
                                value={userInfo.firstName}
                                onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                                placeholder="John"
                                className="h-10 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="lastName" className="text-sm font-medium text-gray-300">
                                {t.lastName} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="lastName"
                                value={userInfo.lastName}
                                onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                                placeholder="Doe"
                                className="h-10 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="seoExperience" className="text-sm font-medium text-gray-300">
                            {t.seoExperience}
                        </Label>
                        <Select
                            value={userInfo.seoExperience || ''}
                            onValueChange={(value) => setUserInfo({ ...userInfo, seoExperience: value })}
                        >
                            <SelectTrigger className="h-10 bg-white/5 border-white/10 focus:border-primary/50 text-white">
                                <SelectValue placeholder={t.selectExperience} />
                            </SelectTrigger>
                            <SelectContent>
                                {SEO_EXPERIENCE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {lang === 'es' ? option.labelEs : option.labelEn}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        onClick={handleNext}
                        disabled={!userInfo.firstName || !userInfo.lastName}
                        className="bg-white text-black hover:bg-white/90 px-8 h-10 rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t.next}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
