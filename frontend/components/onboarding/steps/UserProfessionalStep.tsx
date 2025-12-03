'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslations } from '@/lib/i18n'

const INDUSTRIES = [
    { value: 'technology', labelEs: 'Tecnología', labelEn: 'Technology' },
    { value: 'saas', labelEs: 'SaaS', labelEn: 'SaaS' },
    { value: 'ecommerce', labelEs: 'E-commerce', labelEn: 'E-commerce' },
    { value: 'agency', labelEs: 'Agencia', labelEn: 'Agency' },
    { value: 'finance', labelEs: 'Finanzas', labelEn: 'Finance' },
    { value: 'healthcare', labelEs: 'Salud', labelEn: 'Healthcare' },
    { value: 'education', labelEs: 'Educación', labelEn: 'Education' },
    { value: 'other', labelEs: 'Otro', labelEn: 'Other' },
]

const ROLES = [
    { value: 'founder', labelEs: 'Fundador/CEO', labelEn: 'Founder/CEO' },
    { value: 'marketing', labelEs: 'Marketing', labelEn: 'Marketing' },
    { value: 'seo', labelEs: 'SEO', labelEn: 'SEO' },
    { value: 'developer', labelEs: 'Desarrollador', labelEn: 'Developer' },
    { value: 'product', labelEs: 'Producto', labelEn: 'Product' },
    { value: 'other', labelEs: 'Otro', labelEn: 'Other' },
]

export default function UserProfessionalStep() {
    const { userInfo, setUserInfo, nextStep, prevStep } = useOnboarding()
    const { lang } = useTranslations()

    const t = {
        title: lang === 'es' ? '¿A qué te dedicas?' : 'What do you do?',
        subtitle: lang === 'es' ? 'Cuéntanos sobre tu trabajo' : 'Tell us about your work',
        industry: lang === 'es' ? 'Industria' : 'Industry',
        role: lang === 'es' ? 'Rol' : 'Role',
        selectIndustry: lang === 'es' ? 'Selecciona industria' : 'Select industry',
        selectRole: lang === 'es' ? 'Selecciona rol' : 'Select role',
        next: lang === 'es' ? 'Continuar' : 'Continue',
        back: lang === 'es' ? 'Atrás' : 'Back',
    }

    const canContinue = userInfo.industry && userInfo.role

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>{t.industry}</Label>
                    <Select value={userInfo.industry} onValueChange={(v) => setUserInfo({ ...userInfo, industry: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder={t.selectIndustry} />
                        </SelectTrigger>
                        <SelectContent>
                            {INDUSTRIES.map((i) => (
                                <SelectItem key={i.value} value={i.value}>
                                    {lang === 'es' ? i.labelEs : i.labelEn}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>{t.role}</Label>
                    <Select value={userInfo.role} onValueChange={(v) => setUserInfo({ ...userInfo, role: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder={t.selectRole} />
                        </SelectTrigger>
                        <SelectContent>
                            {ROLES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                    {lang === 'es' ? r.labelEs : r.labelEn}
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
                <Button onClick={nextStep} disabled={!canContinue} className="flex-1">
                    {t.next}
                </Button>
            </div>
        </div>
    )
}
