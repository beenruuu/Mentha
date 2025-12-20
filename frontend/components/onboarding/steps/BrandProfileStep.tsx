'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Globe, Building2, ImageIcon, Loader2, ChevronDown, X, Plus, Check, MapPin } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAPI } from '@/lib/api-client'

// TODO: Move to database table `categories` for admin management
// Helper to capitalize each word (Title Case)
const toTitleCase = (str: string) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase())

const DEFAULT_CATEGORIES = [
    { id: 'technology', name_es: 'Tecnología', name_en: 'Technology' },
    { id: 'saas', name_es: 'SaaS', name_en: 'SaaS' },
    { id: 'ecommerce', name_es: 'E-commerce', name_en: 'E-commerce' },
    { id: 'agency', name_es: 'Agencia', name_en: 'Agency' },
    { id: 'finance', name_es: 'Finanzas', name_en: 'Finance' },
    { id: 'healthcare', name_es: 'Salud', name_en: 'Healthcare' },
    { id: 'education', name_es: 'Educación', name_en: 'Education' },
    { id: 'consulting', name_es: 'Consultoría', name_en: 'Consulting' },
    { id: 'facility', name_es: 'Facility Management', name_en: 'Facility Management' },
    { id: 'logistics', name_es: 'Logística', name_en: 'Logistics' },
    { id: 'hospitality', name_es: 'Hostelería', name_en: 'Hospitality' },
    { id: 'retail', name_es: 'Retail', name_en: 'Retail' },
    { id: 'real-estate', name_es: 'Inmobiliaria', name_en: 'Real Estate' },
    { id: 'manufacturing', name_es: 'Manufactura', name_en: 'Manufacturing' },
    { id: 'legal', name_es: 'Legal', name_en: 'Legal' },
    { id: 'marketing', name_es: 'Marketing', name_en: 'Marketing' },
    { id: 'media', name_es: 'Medios', name_en: 'Media' },
    { id: 'hr', name_es: 'RRHH', name_en: 'HR' },
    { id: 'security', name_es: 'Seguridad', name_en: 'Security' },
    { id: 'cleaning', name_es: 'Limpieza', name_en: 'Cleaning' },
]

export default function BrandProfileStep() {
    const {
        brandProfile,
        setBrandProfile,
        nextStep,
        prevStep,
        companyInfo,
        userInfo
    } = useOnboarding()
    const { lang } = useTranslations()
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [customCategories, setCustomCategories] = useState<string[]>([])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [newCategory, setNewCategory] = useState('')
    const [isInitialized, setIsInitialized] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisStage, setAnalysisStage] = useState<'idle' | 'crawling' | 'analyzing'>('idle')
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Business scope state - default from brandProfile or 'national'
    const [scope, setScope] = useState<'local' | 'regional' | 'national' | 'international'>(brandProfile.businessScope || 'national')
    const [city, setCity] = useState(brandProfile.city || '')

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Brand Analysis - Triggered once when entering the step if domain is available
    useEffect(() => {
        if (!brandProfile.domain || brandProfile.description) {
            return
        }

        let isMounted = true

        const analyzeBrand = async () => {
            setIsAnalyzing(true)
            setAnalysisStage('crawling')
            setError('')

            try {
                const data = await fetchAPI<any>(`/utils/brand-info?url=${encodeURIComponent(brandProfile.domain)}`)
                if (!isMounted) return

                setAnalysisStage('analyzing')

                // Populate profile with extracted data
                setBrandProfile({
                    ...brandProfile,
                    category: data.industry || brandProfile.category,
                    description: data.description || brandProfile.description,
                    logo: data.image || data.favicon || brandProfile.logo,
                    businessScope: data.businessScope || brandProfile.businessScope,
                    city: data.city || brandProfile.city,
                    industrySpecific: data.industrySpecific || brandProfile.industrySpecific
                })

                // If specific categories were found, initialize them
                if (data.industry) {
                    const cats = data.industry.split(',').map((c: string) => c.trim()).filter(Boolean)
                    const matchedIds: string[] = []
                    const customCats: string[] = []

                    for (const cat of cats) {
                        const match = DEFAULT_CATEGORIES.find(dc =>
                            dc.id.toLowerCase() === cat.toLowerCase() ||
                            dc.name_es.toLowerCase() === cat.toLowerCase() ||
                            dc.name_en.toLowerCase() === cat.toLowerCase()
                        )
                        if (match) {
                            if (!matchedIds.includes(match.id)) matchedIds.push(match.id)
                        } else {
                            const titleCased = toTitleCase(cat)
                            if (!customCats.includes(titleCased)) customCats.push(titleCased)
                        }
                    }
                    setSelectedCategories(matchedIds)
                    setCustomCategories(customCats)
                }

            } catch (err: any) {
                console.error('Brand analysis failed:', err)
                // We don't block the user, just let them fill it manually
            } finally {
                if (isMounted) {
                    setIsAnalyzing(false)
                    setAnalysisStage('idle')
                }
            }
        }

        analyzeBrand()

        return () => {
            isMounted = false
        }
    }, [brandProfile.domain])

    // Initialize categories from brandProfile only once after mount (if not already analyzing)
    useEffect(() => {
        if (!isInitialized && brandProfile.category && !isAnalyzing) {
            const cats = brandProfile.category.split(',').map(c => c.trim()).filter(Boolean)
            const matchedIds: string[] = []
            const customCats: string[] = []

            for (const cat of cats) {
                // Try to find matching default category by id, name_es, or name_en
                const match = DEFAULT_CATEGORIES.find(dc =>
                    dc.id.toLowerCase() === cat.toLowerCase() ||
                    dc.name_es.toLowerCase() === cat.toLowerCase() ||
                    dc.name_en.toLowerCase() === cat.toLowerCase()
                )
                if (match) {
                    // Use the ID, not the name (avoid duplicates)
                    if (!matchedIds.includes(match.id)) {
                        matchedIds.push(match.id)
                    }
                } else {
                    // It's a custom category
                    const titleCased = toTitleCase(cat)
                    if (!customCats.includes(titleCased)) {
                        customCats.push(titleCased)
                    }
                }
            }

            setSelectedCategories(matchedIds)
            setCustomCategories(customCats)
            setIsInitialized(true)
        } else if (!isInitialized && !isAnalyzing) {
            setIsInitialized(true)
        }
    }, [brandProfile.category, isInitialized, isAnalyzing])

    const t = {
        title: lang === 'es' ? 'Perfil de marca' : 'Brand profile',
        subtitle: lang === 'es' ? 'Revisa y edita la información de tu marca' : 'Review and edit your brand information',
        companyName: lang === 'es' ? 'Nombre' : 'Name',
        domain: lang === 'es' ? 'Dominio' : 'Domain',
        category: lang === 'es' ? 'Sector' : 'Industry',
        categoryPlaceholder: lang === 'es' ? 'Selecciona categorías...' : 'Select categories...',
        addCategory: lang === 'es' ? 'Añadir categoría' : 'Add category',
        addCategoryPlaceholder: lang === 'es' ? 'Nueva categoría...' : 'New category...',
        description: lang === 'es' ? 'Descripción' : 'Description',
        descriptionPlaceholder: lang === 'es' ? 'Describe brevemente tu empresa...' : 'Briefly describe your company...',
        next: lang === 'es' ? 'Continuar' : 'Continue',
        creating: lang === 'es' ? 'Creando...' : 'Creating...',
        back: lang === 'es' ? 'Atrás' : 'Back',
        step: lang === 'es' ? 'Paso 3 de 7' : 'Step 3 of 7',
        errorCreating: lang === 'es' ? 'Error al crear la marca' : 'Error creating brand',
        // Scope translations
        scopeLabel: lang === 'es' ? 'Alcance del negocio' : 'Business scope',
        scopeLocal: lang === 'es' ? 'Local - Una ubicación/ciudad' : 'Local - Single location/city',
        scopeRegional: lang === 'es' ? 'Regional - Varias ubicaciones en una región' : 'Regional - Multiple locations in a region',
        scopeNational: lang === 'es' ? 'Nacional - Presencia en todo el país' : 'National - Presence across the country',
        scopeInternational: lang === 'es' ? 'Internacional - Múltiples países' : 'International - Multiple countries',
        cityLabel: lang === 'es' ? 'Ciudad o zona principal' : 'Main city or area',
        cityPlaceholder: lang === 'es' ? 'Ej: Madrid, Barcelona...' : 'E.g: Madrid, Barcelona...',
    }

    // Get display name for a category
    const getCategoryName = (id: string) => {
        const cat = DEFAULT_CATEGORIES.find(c => c.id === id)
        if (cat) return lang === 'es' ? cat.name_es : cat.name_en
        return id // Custom category
    }

    // Sync categories to brandProfile when they change
    useEffect(() => {
        if (!isInitialized) return

        const allLabels = [
            ...selectedCategories.map(id => getCategoryName(id)),
            ...customCategories
        ]

        const newCategory = allLabels.join(', ')
        if (newCategory !== brandProfile.category) {
            setBrandProfile({ ...brandProfile, category: newCategory })
        }
    }, [selectedCategories, customCategories, isInitialized])

    const toggleCategory = useCallback((id: string) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }, [])

    const removeCategory = (id: string, isCustom: boolean) => {
        if (isCustom) {
            setCustomCategories(prev => prev.filter(c => c !== id))
        } else {
            setSelectedCategories(prev => prev.filter(c => c !== id))
        }
    }

    const addCustomCategory = () => {
        const trimmed = newCategory.trim()
        if (!trimmed) return

        // Check if it matches a default category (case-insensitive)
        const matchingDefault = DEFAULT_CATEGORIES.find(dc =>
            dc.id.toLowerCase() === trimmed.toLowerCase() ||
            dc.name_es.toLowerCase() === trimmed.toLowerCase() ||
            dc.name_en.toLowerCase() === trimmed.toLowerCase()
        )

        if (matchingDefault) {
            // Select the default category instead of adding as custom
            if (!selectedCategories.includes(matchingDefault.id)) {
                setSelectedCategories(prev => [...prev, matchingDefault.id])
            }
        } else {
            // Add as custom category
            const titleCased = toTitleCase(trimmed)
            if (!customCategories.includes(titleCased)) {
                setCustomCategories(prev => [...prev, titleCased])
            }
        }
        setNewCategory('')
    }

    const handleNext = async () => {
        if (!brandProfile.name || !brandProfile.domain) return

        setIsCreating(true)
        setError('')

        // Update brandProfile with scope and city before proceeding
        setBrandProfile({
            ...brandProfile,
            businessScope: scope,
            city: (scope === 'local' || scope === 'regional') ? city : ''
        })

        try {
            // Update user profile first; brand creation is deferred to SetupStep
            await fetchAPI('/auth/me', {
                method: 'PUT',
                body: JSON.stringify({
                    full_name: `${userInfo.firstName} ${userInfo.lastName}`,
                    seo_experience: userInfo.seoExperience || null,
                })
            })

            nextStep()
        } catch (err: any) {
            console.error('Failed to update user profile:', err)
            setError(err.message || t.errorCreating)
        } finally {
            setIsCreating(false)
        }
    }

    // All selected items (both predefined and custom)
    const allSelected = [
        ...selectedCategories.map(id => ({ id, name: getCategoryName(id), isCustom: false })),
        ...customCategories.map(name => ({ id: name, name, isCustom: true }))
    ]

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl p-6 shadow-2xl border-border bg-card/50 dark:bg-black/40 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
                        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {t.step}
                    </span>
                </div>

                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                            <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
                                <Globe className="w-6 h-6 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium text-foreground">
                                {analysisStage === 'crawling' ? (lang === 'es' ? 'Analizando tu sitio web...' : 'Analyzing your website...') :
                                    lang === 'es' ? 'Extrayendo contexto de tu página...' : 'Extracting context from your page...'}
                            </p>
                            <p className="text-xs text-muted-foreground/60 max-w-[250px]">
                                {lang === 'es' ? 'Estamos preparando la información para que sea más precisa.' : 'We are preparing the information for better accuracy.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Row 1: Logo + Name + Domain */}
                        <div className="flex gap-4 items-end">
                            <div className="w-14 h-14 shrink-0 rounded-lg bg-background/50 dark:bg-white/5 border border-border flex items-center justify-center overflow-hidden">
                                {brandProfile.logo ? (
                                    <img src={brandProfile.logo} alt="Logo" className="w-full h-full object-contain p-1.5" />
                                ) : (
                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">{t.companyName} *</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={brandProfile.name}
                                        onChange={(e) => setBrandProfile({ ...brandProfile, name: e.target.value })}
                                        className="h-10 pl-9 bg-background/50 dark:bg-white/5 border-input text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">{t.domain} *</Label>
                                <div className="relative">
                                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={brandProfile.domain}
                                        onChange={(e) => setBrandProfile({ ...brandProfile, domain: e.target.value })}
                                        className="h-10 pl-9 bg-background/50 dark:bg-white/5 border-input text-foreground"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Categories Dropdown */}
                        <div ref={dropdownRef} className="relative">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">{t.category}</Label>

                            {/* Dropdown trigger */}
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full h-10 px-3 flex items-center justify-between bg-background/50 dark:bg-white/5 border border-input rounded-md hover:border-ring transition-colors"
                            >
                                <span className="text-sm text-muted-foreground">
                                    {allSelected.length > 0
                                        ? `${allSelected.length} ${lang === 'es' ? 'seleccionadas' : 'selected'}`
                                        : t.categoryPlaceholder
                                    }
                                </span>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Selected tags */}
                            {allSelected.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {allSelected.map(({ id, name, isCustom }) => (
                                        <span
                                            key={id}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${isCustom
                                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                                : 'bg-primary/20 text-primary border border-primary/30'
                                                }`}
                                        >
                                            {name}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeCategory(id, isCustom) }}
                                                className="hover:text-foreground"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Dropdown menu */}
                            {isDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 p-3 bg-popover border border-border rounded-lg shadow-xl">
                                    {/* Categories grid - 3 columns */}
                                    <div className="grid grid-cols-3 gap-1 mb-3">
                                        {DEFAULT_CATEGORIES.map((cat) => {
                                            const isSelected = selectedCategories.includes(cat.id)
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => toggleCategory(cat.id)}
                                                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-left transition-all ${isSelected
                                                        ? 'bg-primary/20 text-primary'
                                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                                        }`}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-input'
                                                        }`}>
                                                        {isSelected && <Check className="w-2.5 h-2.5 text-black" />}
                                                    </div>
                                                    {lang === 'es' ? cat.name_es : cat.name_en}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Add custom category */}
                                    <div className="flex gap-2 pt-2 border-t border-border">
                                        <Input
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            placeholder={t.addCategoryPlaceholder}
                                            className="h-8 text-xs bg-background/50 dark:bg-white/5 border-input flex-1 text-foreground"
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCategory())}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={addCustomCategory}
                                            disabled={!newCategory.trim()}
                                            className="h-8 px-2 bg-primary/20 hover:bg-primary/30 text-primary"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Row 3: Description */}
                        <div>
                            <Label className="text-xs text-muted-foreground">{t.description}</Label>
                            <Textarea
                                value={brandProfile.description}
                                onChange={(e) => setBrandProfile({ ...brandProfile, description: e.target.value })}
                                placeholder={t.descriptionPlaceholder}
                                rows={2}
                                className="bg-background/50 dark:bg-white/5 border-input text-sm resize-none mt-1.5 text-foreground"
                            />
                        </div>

                        {/* Row 4: Business Scope */}
                        <div className="space-y-3 pt-2 border-t border-border">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                {t.scopeLabel}
                            </Label>
                            <RadioGroup
                                value={scope}
                                onValueChange={(val) => setScope(val as typeof scope)}
                                className="grid grid-cols-2 gap-2"
                            >
                                {[
                                    { value: 'local', label: t.scopeLocal },
                                    { value: 'regional', label: t.scopeRegional },
                                    { value: 'national', label: t.scopeNational },
                                    { value: 'international', label: t.scopeInternational },
                                ].map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs ${scope === option.value
                                            ? 'bg-primary/10 border-primary/30 text-foreground'
                                            : 'bg-background/50 dark:bg-white/5 border-input text-muted-foreground hover:border-ring'
                                            }`}
                                    >
                                        <RadioGroupItem value={option.value} className="sr-only" />
                                        <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 ${scope === option.value ? 'border-primary' : 'border-input'
                                            }`}>
                                            {scope === option.value && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            )}
                                        </div>
                                        {option.label}
                                    </label>
                                ))}
                            </RadioGroup>

                            {/* Conditional city field for local/regional */}
                            {(scope === 'local' || scope === 'regional') && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Label className="text-xs text-muted-foreground">{t.cityLabel}</Label>
                                    <Input
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder={t.cityPlaceholder}
                                        className="h-9 mt-1 bg-background/50 dark:bg-white/5 border-input text-sm text-foreground"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {error && <p className="text-sm text-destructive mt-3">{error}</p>}

                {/* Actions */}
                <div className="flex justify-between mt-5">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={isCreating}
                        className="text-muted-foreground hover:text-foreground h-10"
                    >
                        {t.back}
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!brandProfile.name || !brandProfile.domain || isCreating}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10 font-medium"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                {t.creating}
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
