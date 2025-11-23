'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'

const COUNTRIES = [
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
]

export default function UserIdentityStep() {
    const { userInfo, setUserInfo, nextStep } = useOnboarding()
    const [lang, setLang] = useState<'en' | 'es'>('en')

    useEffect(() => {
        if (userInfo.country === 'ES') {
            setLang('es')
        } else {
            setLang('en')
        }
    }, [userInfo.country])

    const t = {
        title: lang === 'es' ? 'Empecemos por lo básico' : 'Let\'s start with the basics',
        subtitle: lang === 'es' ? '¿Cómo deberíamos llamarte?' : 'What should we call you?',
        firstName: lang === 'es' ? 'Nombre' : 'First name',
        lastName: lang === 'es' ? 'Apellidos' : 'Last name',
        country: lang === 'es' ? 'País' : 'Country',
        next: lang === 'es' ? 'Siguiente' : 'Next',
        select: lang === 'es' ? 'Seleccionar' : 'Select',
    }

    const handleNext = () => {
        if (userInfo.firstName && userInfo.lastName && userInfo.country) {
            nextStep()
        }
    }

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-3xl p-10 space-y-8 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="space-y-2 text-left">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        {t.title}
                    </h1>
                    <p className="text-muted-foreground">{t.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-300">{t.firstName}</Label>
                        <Input
                            id="firstName"
                            value={userInfo.firstName}
                            onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                            placeholder="John"
                            className="h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium text-gray-300">{t.lastName}</Label>
                        <Input
                            id="lastName"
                            value={userInfo.lastName}
                            onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                            placeholder="Doe"
                            className="h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-gray-300">{t.country}</Label>
                    <Select
                        value={userInfo.country}
                        onValueChange={(value) => setUserInfo({ ...userInfo, country: value })}
                    >
                        <SelectTrigger className="h-11 bg-white/5 border-white/10 focus:border-primary/50 text-white">
                            <SelectValue placeholder={t.select} />
                        </SelectTrigger>
                        <SelectContent>
                            {COUNTRIES.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                    <span className="mr-2">{c.flag}</span> {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleNext}
                        className="bg-white text-black hover:bg-white/90 px-8 h-11 rounded-md font-medium transition-all"
                    >
                        {t.next}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
