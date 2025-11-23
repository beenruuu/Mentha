'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'

const INDUSTRIES = [
    'SaaS', 'E-commerce', 'Agency', 'Finance', 'Healthcare', 'Education', 'Real Estate', 'Other'
]

const ROLES = [
    'Founder', 'CEO', 'CMO', 'Marketing Manager', 'SEO Specialist', 'Content Manager', 'Other'
]

export default function UserProfessionalStep() {
    const { userInfo, setUserInfo, nextStep, prevStep } = useOnboarding()
    const [lang, setLang] = useState<'en' | 'es'>('en')

    useEffect(() => {
        if (userInfo.country === 'ES') {
            setLang('es')
        } else {
            setLang('en')
        }
    }, [userInfo.country])

    const t = {
        title: lang === 'es' ? 'Tu perfil profesional' : 'Your professional profile',
        subtitle: lang === 'es' ? 'Para personalizar tu experiencia' : 'To customize your experience',
        industry: lang === 'es' ? 'Industria' : 'Industry',
        role: lang === 'es' ? 'Rol' : 'Role',
        next: lang === 'es' ? 'Siguiente' : 'Next',
        back: lang === 'es' ? 'Atrás' : 'Back',
        select: lang === 'es' ? 'Seleccionar' : 'Select',
    }

    const handleNext = () => {
        if (userInfo.industry && userInfo.role) {
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
                        <Label htmlFor="industry" className="text-sm font-medium text-gray-300">{t.industry}</Label>
                        <Select
                            value={userInfo.industry}
                            onValueChange={(value) => setUserInfo({ ...userInfo, industry: value })}
                        >
                            <SelectTrigger className="h-11 bg-white/5 border-white/10 focus:border-primary/50 text-white">
                                <SelectValue placeholder={t.select} />
                            </SelectTrigger>
                            <SelectContent>
                                {INDUSTRIES.map((ind) => (
                                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-medium text-gray-300">{t.role}</Label>
                        <Select
                            value={userInfo.role}
                            onValueChange={(value) => setUserInfo({ ...userInfo, role: value })}
                        >
                            <SelectTrigger className="h-11 bg-white/5 border-white/10 focus:border-primary/50 text-white">
                                <SelectValue placeholder={t.select} />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map((role) => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-between pt-4">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        className="text-muted-foreground hover:text-white"
                    >
                        {t.back}
                    </Button>
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
