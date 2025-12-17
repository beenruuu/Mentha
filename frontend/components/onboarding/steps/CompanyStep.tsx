'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Globe, Building2 } from 'lucide-react'
import { fetchAPI } from '@/lib/api-client'
import { useTranslations } from '@/lib/i18n'
import FlagIcon from '@/components/shared/flag-icon'

const COUNTRIES = [
    { code: 'ES', name: 'Spain', nameEs: 'España' },
    { code: 'US', name: 'United States', nameEs: 'Estados Unidos' },
    { code: 'GB', name: 'United Kingdom', nameEs: 'Reino Unido' },
    { code: 'DE', name: 'Germany', nameEs: 'Alemania' },
    { code: 'FR', name: 'France', nameEs: 'Francia' },
    { code: 'IT', name: 'Italy', nameEs: 'Italia' },
    { code: 'PT', name: 'Portugal', nameEs: 'Portugal' },
    { code: 'NL', name: 'Netherlands', nameEs: 'Países Bajos' },
    { code: 'MX', name: 'Mexico', nameEs: 'México' },
    { code: 'AR', name: 'Argentina', nameEs: 'Argentina' },
    { code: 'CO', name: 'Colombia', nameEs: 'Colombia' },
    { code: 'CL', name: 'Chile', nameEs: 'Chile' },
    { code: 'BR', name: 'Brazil', nameEs: 'Brasil' },
]

export default function CompanyStep() {
    const {
        companyInfo,
        setCompanyInfo,
        setBrandProfile,
        setCompetitors,
        setResearchPrompts,
        isAnalyzing,
        setIsAnalyzing,
        nextStep,
        prevStep
    } = useOnboarding()
    const { lang } = useTranslations()
    const [error, setError] = useState('')
    const [favicon, setFavicon] = useState<string | null>(null)
    const [allowAutoJoin, setAllowAutoJoin] = useState(false)
    const [urlWithoutProtocol, setUrlWithoutProtocol] = useState('')
    const [companyName, setCompanyName] = useState('')

    const t = {
        title: lang === 'es' ? 'Tu empresa' : 'Your company',
        subtitle: lang === 'es' ? 'Introduce los datos de tu empresa para comenzar el análisis' : 'Enter your company details to start the analysis',
        companyName: lang === 'es' ? 'Nombre de la empresa' : 'Company name',
        websiteUrl: lang === 'es' ? 'URL del sitio web' : 'Website URL',
        location: lang === 'es' ? 'Ubicación' : 'Location',
        selectLocation: lang === 'es' ? 'Selecciona país' : 'Select country',
        analyzing: lang === 'es' ? 'Analizando sitio web...' : 'Analyzing website...',
        next: lang === 'es' ? 'Analizar y continuar' : 'Analyze & Continue',
        back: lang === 'es' ? 'Atrás' : 'Back',
        step: lang === 'es' ? 'Paso 2 de 7' : 'Step 2 of 7',
        invalidUrl: lang === 'es' ? 'Por favor, introduce una URL válida' : 'Please enter a valid URL',
        corporateOnly: lang === 'es' ? 'Usuarios con el mismo dominio corporativo podrán unirse automáticamente' : 'Users with the same corporate domain can join automatically',
    }

    // Función para obtener el favicon de una URL
    const getFavicon = useCallback((url: string): string => {
        try {
            const domain = new URL(url).hostname
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
        } catch {
            return ''
        }
    }, [])

    // Efecto para cargar el favicon cuando cambia la URL
    useEffect(() => {
        if (urlWithoutProtocol.length > 3 && urlWithoutProtocol.includes('.')) {
            const fullUrl = `https://${urlWithoutProtocol}`
            const faviconUrl = getFavicon(fullUrl)
            // Verificar si el favicon existe
            const img = new Image()
            img.onload = () => setFavicon(faviconUrl)
            img.onerror = () => setFavicon(null)
            img.src = faviconUrl
        } else {
            setFavicon(null)
        }
    }, [urlWithoutProtocol, getFavicon])

    // Inicializar urlWithoutProtocol desde companyInfo si existe
    useEffect(() => {
        if (companyInfo.websiteUrl) {
            const url = companyInfo.websiteUrl.replace(/^https?:\/\//, '')
            setUrlWithoutProtocol(url)
        }
    }, [])

    const normalizeUrl = (url: string): string => {
        let normalized = url.trim()
        // Siempre usar https://
        normalized = normalized.replace(/^https?:\/\//, '')
        return 'https://' + normalized
    }

    const extractDomain = (url: string): string => {
        try {
            const urlObj = new URL(normalizeUrl(url))
            return urlObj.hostname.replace('www.', '')
        } catch {
            return ''
        }
    }

    const handleAnalyze = async () => {
        if (!companyName || !urlWithoutProtocol || !companyInfo.location) {
            setError(t.invalidUrl)
            return
        }

        const normalizedUrl = normalizeUrl(urlWithoutProtocol)
        setCompanyInfo({ ...companyInfo, websiteUrl: normalizedUrl })
        setIsAnalyzing(true)
        setError('')

        try {
            // Llamar al endpoint de análisis de marca
            const data = await fetchAPI<{
                url: string
                domain: string
                title: string
                description: string
                favicon: string
                image: string
                industry: string
                location: string
                services: string[]
                businessModel: string
                competitors?: Array<{ name: string; domain: string; logo?: string }>
                // New scope-aware fields
                businessScope?: string
                city?: string
                industrySpecific?: string
            }>(`/utils/brand-info?url=${encodeURIComponent(normalizedUrl)}`)

            // Establecer el perfil de marca with new scope-aware fields
            setBrandProfile({
                logo: data.image || data.favicon || '',
                name: companyName, // Usar el nombre introducido por el usuario
                domain: data.domain || extractDomain(normalizedUrl),
                category: data.industry || 'Other',
                description: data.description || '',
                businessScope: (data.businessScope as 'local' | 'regional' | 'national' | 'international') || 'national',
                city: data.city || '',
                industrySpecific: data.industrySpecific || ''
            })

            // If category is "Other" or empty, trigger a silent re-analysis or prompt user
            if (!data.industry || data.industry === 'Other') {
                console.warn('Category detection low confidence, defaulting to Other')
            }


            // Establecer dominio corporativo
            const domain = extractDomain(normalizedUrl)
            setCompanyInfo({
                ...companyInfo,
                websiteUrl: normalizedUrl,
                corporateDomain: domain
            })

            // Establecer competidores si existen
            if (data.competitors && data.competitors.length > 0) {
                setCompetitors(data.competitors.map((c, i) => ({
                    id: `comp-${i}`,
                    name: c.name,
                    domain: c.domain,
                    logo: c.logo
                })))
            }

            // NOTE: Research prompts are now handled in the dedicated ResearchPromptsStep
            // Users can add prompts manually or optionally generate them with AI
            // No automatic prompts are pre-generated here

            nextStep()
        } catch (err) {
            console.error('Analysis failed:', err)
            setError(lang === 'es'
                ? 'No se pudo analizar el sitio web. Por favor, verifica la URL.'
                : 'Failed to analyze website. Please verify the URL.')
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl p-6 md:p-8 space-y-5 shadow-2xl border-border bg-card/50 dark:bg-black/40 backdrop-blur-xl">
                {/* Step indicator */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {t.step}
                    </span>
                </div>

                <div className="space-y-2 text-left">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {t.title}
                    </h1>
                    <p className="text-muted-foreground">{t.subtitle}</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="companyName" className="text-sm font-medium text-foreground">
                            {t.companyName} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder={lang === 'es' ? 'Acme Inc.' : 'Acme Inc.'}
                            className="h-10 bg-background/50 dark:bg-white/5 border-input focus:border-primary/50 transition-all text-foreground"
                            disabled={isAnalyzing}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="websiteUrl" className="text-sm font-medium text-foreground">
                            {t.websiteUrl} <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative flex">
                            <div className="flex items-center h-10 px-4 bg-background/50 dark:bg-white/10 border border-r-0 border-input rounded-l-md text-sm min-w-[120px]">
                                <span className="flex items-center gap-2.5 text-foreground">
                                    {favicon ? (
                                        <img
                                            src={favicon}
                                            alt="Site favicon"
                                            className="w-4 h-4"
                                            onError={() => setFavicon(null)}
                                        />
                                    ) : (
                                        <Globe className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    <span className="font-medium">https://</span>
                                </span>
                            </div>
                            <div className="relative flex-1">
                                <Input
                                    id="websiteUrl"
                                    value={urlWithoutProtocol}
                                    onChange={(e) => setUrlWithoutProtocol(e.target.value.replace(/^https?:\/\//, ''))}
                                    placeholder="example.com"
                                    className="h-10 rounded-l-none rounded-r-md bg-background/50 dark:bg-white/5 border-input focus:border-primary/50 transition-all pr-10 text-foreground"
                                    disabled={isAnalyzing}
                                />
                                {favicon && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <Label
                            htmlFor="allowAutoJoin"
                            className="text-sm text-muted-foreground cursor-pointer leading-tight flex items-center gap-2"
                        >
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span>{t.corporateOnly}</span>
                        </Label>
                        <Checkbox
                            id="allowAutoJoin"
                            checked={allowAutoJoin}
                            onCheckedChange={(checked) => setAllowAutoJoin(checked === true)}
                            disabled={isAnalyzing}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="location" className="text-sm font-medium text-foreground">
                            {t.location} <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={companyInfo.location}
                            onValueChange={(value) => setCompanyInfo({ ...companyInfo, location: value })}
                            disabled={isAnalyzing}
                        >
                            <SelectTrigger className="h-10 bg-background/50 dark:bg-white/5 border-input focus:border-primary/50 text-foreground">
                                <SelectValue placeholder={t.selectLocation} />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRIES.map((country) => (
                                    <SelectItem key={country.code} value={country.code}>
                                        <span className="flex items-center gap-2">
                                            <FlagIcon code={country.code} size={16} title={country.name} />
                                            {lang === 'es' ? country.nameEs : country.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>

                <div className="flex justify-between pt-2">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={isAnalyzing}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        {t.back}
                    </Button>
                    <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !companyName || !urlWithoutProtocol || !companyInfo.location}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10 rounded-md font-medium transition-all disabled:opacity-50"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                {t.analyzing}
                            </>
                        ) : (
                            t.next
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
