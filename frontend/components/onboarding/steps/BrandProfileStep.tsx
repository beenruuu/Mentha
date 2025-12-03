'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Globe, Building2, ImageIcon, Loader2, ChevronDown, X, Plus, Check } from 'lucide-react'
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
        userInfo,
        setBrandId
    } = useOnboarding()
    const { lang } = useTranslations()
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [customCategories, setCustomCategories] = useState<string[]>([])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [newCategory, setNewCategory] = useState('')
    const [isInitialized, setIsInitialized] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

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

    // Initialize categories from brandProfile only once after mount
    useEffect(() => {
        if (!isInitialized && brandProfile.category) {
            const cats = brandProfile.category.split(',').map(c => c.trim()).filter(Boolean)
            // Separate known categories from custom ones
            const knownIds = cats.filter(c => DEFAULT_CATEGORIES.some(dc => dc.id === c || dc.name_es === c || dc.name_en === c))
            const custom = cats.filter(c => !DEFAULT_CATEGORIES.some(dc => dc.id === c || dc.name_es === c || dc.name_en === c))
            setSelectedCategories(knownIds)
            // Apply title case to custom categories
            setCustomCategories(custom.map(c => toTitleCase(c)))
            setIsInitialized(true)
        } else if (!isInitialized) {
            setIsInitialized(true)
        }
    }, [brandProfile.category, isInitialized])

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
        step: lang === 'es' ? 'Paso 3 de 6' : 'Step 3 of 6',
        errorCreating: lang === 'es' ? 'Error al crear la marca' : 'Error creating brand',
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
        if (trimmed && !customCategories.includes(trimmed)) {
            setCustomCategories(prev => [...prev, trimmed])
            setNewCategory('')
        }
    }

    const handleNext = async () => {
        if (!brandProfile.name || !brandProfile.domain) return
        
        setIsCreating(true)
        setError('')
        
        try {
            // Update user profile first
            await fetchAPI('/auth/me', {
                method: 'PUT',
                body: JSON.stringify({
                    full_name: `${userInfo.firstName} ${userInfo.lastName}`,
                    seo_experience: userInfo.seoExperience || null,
                })
            })
            
            // Create brand WITHOUT triggering analysis (that happens in SetupStep)
            const brand = await fetchAPI<{ id: string }>('/brands/', {
                method: 'POST',
                body: JSON.stringify({
                    domain: companyInfo.websiteUrl,
                    name: brandProfile.name,
                    industry: brandProfile.category,
                    description: brandProfile.description,
                    logo: brandProfile.logo,
                    location: companyInfo.location,
                })
            })
            
            setBrandId(brand.id)
            nextStep()
        } catch (err: any) {
            console.error('Failed to create brand:', err)
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
            <Card className="w-full max-w-2xl p-6 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
                        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {t.step}
                    </span>
                </div>

                <div className="space-y-4">
                    {/* Row 1: Logo + Name + Domain */}
                    <div className="flex gap-4 items-end">
                        <div className="w-14 h-14 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                            {brandProfile.logo ? (
                                <img src={brandProfile.logo} alt="Logo" className="w-full h-full object-contain p-1.5" />
                            ) : (
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex-1">
                            <Label className="text-xs text-gray-400">{t.companyName} *</Label>
                            <div className="relative">
                                <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={brandProfile.name}
                                    onChange={(e) => setBrandProfile({ ...brandProfile, name: e.target.value })}
                                    className="h-10 pl-9 bg-white/5 border-white/10"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <Label className="text-xs text-gray-400">{t.domain} *</Label>
                            <div className="relative">
                                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={brandProfile.domain}
                                    onChange={(e) => setBrandProfile({ ...brandProfile, domain: e.target.value })}
                                    className="h-10 pl-9 bg-white/5 border-white/10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Categories Dropdown */}
                    <div ref={dropdownRef} className="relative">
                        <Label className="text-xs text-gray-400 mb-1.5 block">{t.category}</Label>
                        
                        {/* Dropdown trigger */}
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full h-10 px-3 flex items-center justify-between bg-white/5 border border-white/10 rounded-md hover:border-white/20 transition-colors"
                        >
                            <span className="text-sm text-gray-400">
                                {allSelected.length > 0 
                                    ? `${allSelected.length} ${lang === 'es' ? 'seleccionadas' : 'selected'}`
                                    : t.categoryPlaceholder
                                }
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Selected tags */}
                        {allSelected.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {allSelected.map(({ id, name, isCustom }) => (
                                    <span
                                        key={id}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                            isCustom 
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                : 'bg-primary/20 text-primary border border-primary/30'
                                        }`}
                                    >
                                        {name}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeCategory(id, isCustom) }}
                                            className="hover:text-white"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Dropdown menu */}
                        {isDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 p-3 bg-black border border-white/10 rounded-lg shadow-xl">
                                {/* Categories grid - 3 columns */}
                                <div className="grid grid-cols-3 gap-1 mb-3">
                                    {DEFAULT_CATEGORIES.map((cat) => {
                                        const isSelected = selectedCategories.includes(cat.id)
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => toggleCategory(cat.id)}
                                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-left transition-all ${
                                                    isSelected
                                                        ? 'bg-primary/20 text-primary'
                                                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                                                }`}
                                            >
                                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                                    isSelected ? 'bg-primary border-primary' : 'border-gray-500'
                                                }`}>
                                                    {isSelected && <Check className="w-2.5 h-2.5 text-black" />}
                                                </div>
                                                {lang === 'es' ? cat.name_es : cat.name_en}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Add custom category */}
                                <div className="flex gap-2 pt-2 border-t border-white/10">
                                    <Input
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        placeholder={t.addCategoryPlaceholder}
                                        className="h-8 text-xs bg-white/5 border-white/10 flex-1"
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
                        <Label className="text-xs text-gray-400">{t.description}</Label>
                        <Textarea
                            value={brandProfile.description}
                            onChange={(e) => setBrandProfile({ ...brandProfile, description: e.target.value })}
                            placeholder={t.descriptionPlaceholder}
                            rows={2}
                            className="bg-white/5 border-white/10 text-sm resize-none mt-1.5"
                        />
                    </div>
                </div>

                {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

                {/* Actions */}
                <div className="flex justify-between mt-5">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={isCreating}
                        className="text-muted-foreground hover:text-white h-10"
                    >
                        {t.back}
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!brandProfile.name || !brandProfile.domain || isCreating}
                        className="bg-white text-black hover:bg-white/90 px-8 h-10 font-medium"
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
