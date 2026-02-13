'use client'

import { useOnboarding, Competitor } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, X, Globe, Building2, ExternalLink } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { fetchAPI } from '@/lib/api-client'

interface DiscoveredCompetitor {
    name: string
    domain: string
    favicon?: string
    snippet?: string
    sources?: string[]
    source?: string // Legacy fallback
    confidence?: string
}

export default function CompetitorsStep() {
    const { competitors, setCompetitors, nextStep, prevStep, brandProfile, companyInfo } = useOnboarding()
    const { lang } = useTranslations()

    const [newCompetitor, setNewCompetitor] = useState({ name: '', domain: '' })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({ name: '', domain: '' })
    const [showAddForm, setShowAddForm] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const t = {
        title: lang === 'es' ? 'Competidores' : 'Competitors',
        subtitle: lang === 'es'
            ? 'Hemos detectado estos competidores. Puedes añadir, editar o eliminar según necesites.'
            : 'We detected these competitors. You can add, edit or remove as needed.',
        detected: lang === 'es' ? 'Competidores detectados' : 'Detected competitors',
        addNew: lang === 'es' ? 'Añadir competidor' : 'Add competitor',
        name: lang === 'es' ? 'Nombre' : 'Name',
        domain: lang === 'es' ? 'Dominio' : 'Domain',
        add: lang === 'es' ? 'Añadir' : 'Add',
        cancel: lang === 'es' ? 'Cancelar' : 'Cancel',
        save: lang === 'es' ? 'Guardar' : 'Save',
        noCompetitors: lang === 'es'
            ? 'No se detectaron competidores. Añade algunos manualmente.'
            : 'No competitors detected. Add some manually.',
        next: lang === 'es' ? 'Continuar' : 'Continue',
        back: lang === 'es' ? 'Atrás' : 'Back',
        step: lang === 'es' ? 'Paso 4 de 7' : 'Step 4 of 7',
        skip: lang === 'es' ? 'Saltar por ahora' : 'Skip for now',
        analyzing: lang === 'es' ? 'Analizando competidores...' : 'Analyzing competitors...',
        almostReady: lang === 'es' ? 'Casi listo...' : 'Almost ready...',
    }

    const [analysisStage, setAnalysisStage] = useState<'searching' | 'filtering' | 'idle'>('idle')

    // Discover competitors using web search (fast, no full analysis)
    useEffect(() => {
        // Initial discovery - only run if empty to avoid overwriting user edits
        if (competitors.length > 0) {
            setIsLoading(false)
            return
        }

        if (!brandProfile.name || !brandProfile.domain) {
            setIsLoading(false)
            return
        }

        let isMounted = true

        const discoverCompetitors = async () => {
            try {
                setError('')
                setAnalysisStage('searching')

                // Call the discover endpoint directly (fast web search + AI filter)
                // Now with scope-aware fields for better local/regional competitor detection
                const data = await fetchAPI<DiscoveredCompetitor[]>('/competitors/discover', {
                    method: 'POST',
                    body: JSON.stringify({
                        brand_name: brandProfile.name,
                        industry: brandProfile.category || 'Technology', // Fallback to generic to ensure discovery runs
                        domain: brandProfile.domain,
                        description: brandProfile.description || '',
                        services: [],
                        country: companyInfo.location || 'ES',
                        language: lang || 'es',
                        // New scope-aware fields
                        business_scope: brandProfile.businessScope || 'national',
                        city: brandProfile.city || ''
                    })
                })


                setAnalysisStage('filtering')

                if (data && data.length > 0) {
                    // Map discovered competitors to context format
                    const mappedCompetitors: Competitor[] = data.map((c, index) => ({
                        id: `discovered-${index}`,
                        name: c.name,
                        domain: c.domain,
                        logo: c.favicon,
                        sources: c.sources || (c.source ? [c.source as any] : []),
                        confidence: c.confidence as Competitor['confidence']
                    }))
                    setCompetitors(mappedCompetitors)
                }

                setAnalysisStage('idle')
                setIsLoading(false)
            } catch (err: any) {
                console.error('Failed to discover competitors:', err)
                if (isMounted) {
                    setError(err.message || 'Error discovering competitors')
                    setIsLoading(false)
                    setAnalysisStage('idle')
                }
            }
        }

        discoverCompetitors()

        return () => {
            isMounted = false
        }
    }, [brandProfile.name, brandProfile.domain])

    const handleAddCompetitor = () => {
        if (newCompetitor.name && newCompetitor.domain) {
            const normalizedDomain = newCompetitor.domain
                .toLowerCase()
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .replace(/\/$/, '')

            // Prevent duplicates
            const isDuplicate = competitors.some(c =>
                c.domain.toLowerCase().replace(/^www\./, '') === normalizedDomain
            )

            if (isDuplicate) {
                setError(lang === 'es' ? 'Este competidor ya está en la lista' : 'This competitor is already in the list')
                return
            }

            const competitor: Competitor = {
                id: `comp-${Date.now()}`,
                name: newCompetitor.name,
                domain: normalizedDomain,
                sources: ['manual'],
                confidence: 'high'
            }
            setCompetitors([...competitors, competitor])
            setNewCompetitor({ name: '', domain: '' })
            setShowAddForm(false)
            setError('') // Clear error
        }
    }

    const handleRemoveCompetitor = (id: string) => {
        setCompetitors(competitors.filter(c => c.id !== id))
    }

    const handleStartEdit = (competitor: Competitor) => {
        setEditingId(competitor.id)
        setEditData({ name: competitor.name, domain: competitor.domain })
    }

    const handleSaveEdit = () => {
        if (editingId && editData.name && editData.domain) {
            setCompetitors(competitors.map(c =>
                c.id === editingId
                    ? { ...c, name: editData.name, domain: editData.domain }
                    : c
            ))
            setEditingId(null)
            setEditData({ name: '', domain: '' })
        }
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditData({ name: '', domain: '' })
    }

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl p-6 md:p-8 space-y-4 shadow-2xl border-border bg-card/50 dark:bg-black/40 backdrop-blur-xl">
                {/* Step indicator */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {t.step}
                    </span>
                </div>

                <div className="space-y-2 text-left">
                    <h1 className="text-2xl font-bold text-foreground">
                        {t.title}
                    </h1>
                    <p className="text-muted-foreground">{t.subtitle}</p>
                </div>

                <div className="space-y-3">
                    {/* Loading State */}
                    {isLoading ? (
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
                                    {analysisStage === 'searching' ? (lang === 'es' ? 'Buscando competidores...' : 'Searching for competitors...') :
                                        analysisStage === 'filtering' ? (lang === 'es' ? 'Analizando resultados...' : 'Analyzing results...') :
                                            t.analyzing}
                                </p>
                                <p className="text-xs text-muted-foreground/60 max-w-[250px]">
                                    {analysisStage === 'searching' && (lang === 'es' ? 'Consultando múltiples fuentes de IA y búsqueda en tiempo real.' : 'Consulting multiple AI sources and real-time search.')}
                                    {analysisStage === 'filtering' && (lang === 'es' ? 'Identificando empresas reales y extrayendo dominios.' : 'Identifying real companies and extracting domains.')}
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Competitor list */
                        competitors.length > 0 ? (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">{t.detected}</Label>
                                {competitors.map((competitor) => (
                                    <div
                                        key={competitor.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border transition-all",
                                            editingId === competitor.id
                                                ? "bg-primary/10 border-primary/30"
                                                : "bg-white/5 border-white/10 hover:border-white/20"
                                        )}
                                    >
                                        {/* Logo placeholder */}
                                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                            {competitor.logo ? (
                                                <img
                                                    src={competitor.logo}
                                                    alt={competitor.name}
                                                    className="w-full h-full object-contain p-1"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?sz=64&domain=${competitor.domain}`
                                                    }}
                                                />
                                            ) : (
                                                <Building2 className="w-5 h-5 text-muted-foreground" />
                                            )}
                                        </div>

                                        {editingId === competitor.id ? (
                                            // Edit mode
                                            <div className="flex-1 flex items-center gap-3">
                                                <Input
                                                    value={editData.name}
                                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                    placeholder={t.name}
                                                    className="h-9 bg-white/5 border-white/10 text-sm"
                                                />
                                                <Input
                                                    value={editData.domain}
                                                    onChange={(e) => setEditData({ ...editData, domain: e.target.value })}
                                                    placeholder={t.domain}
                                                    className="h-9 bg-white/5 border-white/10 text-sm"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleSaveEdit}
                                                    className="h-9 w-9 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleCancelEdit}
                                                    className="h-9 w-9 p-0 text-muted-foreground hover:text-white"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            // View mode
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-foreground truncate">{competitor.name}</p>
                                                        {competitor.confidence === 'high' && (
                                                            <div className="w-3.5 h-3.5 bg-green-500/20 rounded-full flex items-center justify-center" title="Alta confianza">
                                                                <Check className="w-2.5 h-2.5 text-green-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <a
                                                            href={`https://${competitor.domain}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-muted-foreground truncate hover:text-primary transition-colors flex items-center gap-1 group/link"
                                                        >
                                                            <Globe className="w-3 h-3" />
                                                            {competitor.domain}
                                                            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                        </a>
                                                        {competitor.sources && competitor.sources.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                {competitor.sources.map((source, sIdx) => (
                                                                    <span key={sIdx} className={cn(
                                                                        "text-[10px] px-1.5 py-0.5 rounded-sm flex items-center gap-1.5 border leading-none h-5",
                                                                        source === 'firecrawl' ? "bg-orange-500/5 text-orange-500/80 border-orange-500/20" :
                                                                            source === 'openai' || source === 'llm_knowledge' ? "bg-emerald-500/5 text-emerald-500/80 border-emerald-500/20" :
                                                                                "bg-blue-500/5 text-blue-500/80 border-blue-500/20"
                                                                    )}>
                                                                        {(source === 'openai' || source === 'llm_knowledge') && (
                                                                            <img src="/providers/openai.svg" alt="OpenAI" className="w-3 h-3 brightness-0 dark:invert opacity-80" />
                                                                        )}
                                                                        {(source === 'google' || source === 'gemini') && (
                                                                            <img src="/providers/gemini-color.svg" alt="Gemini" className="w-3 h-3 grayscale brightness-0 dark:invert opacity-80" />
                                                                        )}
                                                                        {(source === 'anthropic' || source === 'claude') && (
                                                                            <img src="/providers/claude-color.svg" alt="Claude" className="w-3 h-3 grayscale brightness-0 dark:invert opacity-80" />
                                                                        )}
                                                                        {(source === 'perplexity') && (
                                                                            <img src="/providers/perplexity-color.svg" alt="Perplexity" className="w-3 h-3 grayscale brightness-0 dark:invert opacity-80" />
                                                                        )}
                                                                        {source === 'firecrawl' && (
                                                                            <Globe className="w-2.5 h-2.5 opacity-80" />
                                                                        )}
                                                                        {source === 'openai' || source === 'llm_knowledge' ? 'ChatGPT' :
                                                                            (source === 'google' || source === 'gemini') ? 'Gemini' :
                                                                                (source === 'anthropic' || source === 'claude') ? 'Claude' :
                                                                                    source === 'perplexity' ? 'Perplexity' :
                                                                                        source === 'firecrawl' ? (lang === 'es' ? 'Búsqueda' : 'Search') :
                                                                                            source === 'manual' ? (lang === 'es' ? 'Manual' : 'Manual') :
                                                                                                (lang === 'es' ? 'Análisis' : 'Analysis')}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleStartEdit(competitor)}
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRemoveCompetitor(competitor.id)}
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">{t.noCompetitors}</p>
                            </div>
                        )
                    )}

                    {/* Add new competitor form */}
                    {showAddForm ? (
                        <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-sm text-muted-foreground">{t.name}</Label>
                                    <Input
                                        value={newCompetitor.name}
                                        onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                                        placeholder="Competitor Inc."
                                        className="h-9 bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-sm text-muted-foreground">{t.domain}</Label>
                                    <Input
                                        value={newCompetitor.domain}
                                        onChange={(e) => setNewCompetitor({ ...newCompetitor, domain: e.target.value })}
                                        placeholder="competitor.com"
                                        className="h-9 bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowAddForm(false)
                                        setNewCompetitor({ name: '', domain: '' })
                                    }}
                                    className="text-muted-foreground"
                                >
                                    {t.cancel}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAddCompetitor}
                                    disabled={!newCompetitor.name || !newCompetitor.domain}
                                    className="bg-primary text-primary-foreground"
                                >
                                    {t.add}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => setShowAddForm(true)}
                            className="w-full h-10 border-dashed border-white/20 hover:border-white/40 text-muted-foreground hover:text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t.addNew}
                        </Button>
                    )}
                </div>

                <div className="flex justify-between pt-2">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={isLoading}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        {t.back}
                    </Button>
                    <div className="flex gap-3">
                        {competitors.length === 0 && !isLoading && (
                            <Button
                                variant="ghost"
                                onClick={nextStep}
                                className="text-muted-foreground hover:text-white"
                            >
                                {t.skip}
                            </Button>
                        )}
                        <Button
                            onClick={nextStep}
                            disabled={isLoading}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10 font-medium"
                        >
                            {t.next}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
