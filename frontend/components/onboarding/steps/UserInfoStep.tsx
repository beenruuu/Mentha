'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const INDUSTRIES = [
    'SaaS', 'E-commerce', 'Agency', 'Finance', 'Healthcare', 'Education', 'Real Estate', 'Other'
]

const ROLES = [
    'Founder', 'CEO', 'CMO', 'Marketing Manager', 'SEO Specialist', 'Content Manager', 'Other'
]

const DISCOVERY_SOURCES = [
    'Linkedin', 'Product Hunt', 'Google', 'A friend/colleague', 'X', 'At an event', 'Reddit', 'Instagram', 'Facebook', 'Other'
]

const COUNTRIES = [
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    // Add more as needed
]

export default function UserInfoStep() {
    const { userInfo, setUserInfo, nextStep } = useOnboarding()
    const [lang, setLang] = useState<'en' | 'es'>('en')

    useEffect(() => {
        // Simple language detection logic based on country
        if (userInfo.country === 'ES') {
            setLang('es')
        } else {
            setLang('en')
        }
    }, [userInfo.country])

    const t = {
        title: lang === 'es' ? 'Cuéntanos sobre ti' : 'Tell us about yourself',
        firstName: lang === 'es' ? 'Nombre' : 'First name',
        lastName: lang === 'es' ? 'Apellidos' : 'Last name',
        country: lang === 'es' ? 'País' : 'Country',
        industry: lang === 'es' ? 'Selecciona tu industria' : 'Select your industry',
        role: lang === 'es' ? 'Selecciona tu rol' : 'Select your role',
        company: lang === 'es' ? 'Nombre de la empresa' : 'Company name',
        discovery: lang === 'es' ? '¿Cómo descubriste Mentha?' : 'How did you discover Mentha?',
        next: lang === 'es' ? 'Siguiente' : 'Next',
        select: lang === 'es' ? 'Seleccionar' : 'Select',
    }

    const handleNext = () => {
        // Basic validation
        if (!userInfo.firstName || !userInfo.lastName || !userInfo.companyName) {
            // In a real app, show error. For now, just proceed or maybe alert.
            // alert('Please fill in all fields')
            // return
        }
        nextStep()
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl p-8 space-y-8 shadow-xl border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">{t.firstName}</Label>
                        <Input
                            id="firstName"
                            value={userInfo.firstName}
                            onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                            placeholder="Rubén"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">{t.lastName}</Label>
                        <Input
                            id="lastName"
                            value={userInfo.lastName}
                            onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                            placeholder="González Muñoz"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="country">{t.country}</Label>
                    <Select
                        value={userInfo.country}
                        onValueChange={(value) => setUserInfo({ ...userInfo, country: value })}
                    >
                        <SelectTrigger>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="industry">{t.industry}</Label>
                        <Select
                            value={userInfo.industry}
                            onValueChange={(value) => setUserInfo({ ...userInfo, industry: value })}
                        >
                            <SelectTrigger>
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
                        <Label htmlFor="role">{t.role}</Label>
                        <Select
                            value={userInfo.role}
                            onValueChange={(value) => setUserInfo({ ...userInfo, role: value })}
                        >
                            <SelectTrigger>
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

                <div className="space-y-2">
                    <Label htmlFor="company">{t.company}</Label>
                    <Input
                        id="company"
                        value={userInfo.companyName}
                        onChange={(e) => setUserInfo({ ...userInfo, companyName: e.target.value })}
                        placeholder="Company Name"
                    />
                </div>

                <div className="space-y-4">
                    <Label>{t.discovery}</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {DISCOVERY_SOURCES.map((source) => (
                            <button
                                key={source}
                                onClick={() => setUserInfo({ ...userInfo, discoverySource: source })}
                                className={cn(
                                    "px-4 py-2 text-sm rounded-lg border transition-all duration-200",
                                    userInfo.discoverySource === source
                                        ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20"
                                        : "bg-background hover:bg-muted border-input"
                                )}
                            >
                                {source}
                            </button>
                        ))}
                    </div>
                </div>

                <Button onClick={handleNext} className="w-full text-lg h-12 mt-4">
                    {t.next}
                </Button>
            </Card>
        </div>
    )
}
