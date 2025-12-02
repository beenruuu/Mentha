'use client'

import { useOnboarding, Competitor } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, X, Globe, Building2 } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export default function CompetitorsStep() {
    const { competitors, setCompetitors, nextStep, prevStep, brandProfile, companyInfo } = useOnboarding()
    const { lang } = useTranslations()

    const [newCompetitor, setNewCompetitor] = useState({ name: '', domain: '' })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({ name: '', domain: '' })
    const [showAddForm, setShowAddForm] = useState(false)
    const [isDiscovering, setIsDiscovering] = useState(false)
    const [hasDiscovered, setHasDiscovered] = useState(false)

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
        step: lang === 'es' ? 'Paso 4 de 6' : 'Step 4 of 6',
        skip: lang === 'es' ? 'Saltar por ahora' : 'Skip for now',
        discovering: lang === 'es' ? 'Detectando competidores...' : 'Detecting competitors...',
    }

    // Auto-discover competitors on mount if list is empty
    useEffect(() => {
        const discoverCompetitors = async () => {
            if (competitors.length === 0 && !hasDiscovered && brandProfile.name) {
                setIsDiscovering(true)
                try {
                    const response = await fetch('/api/competitors/discover', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            brand_name: brandProfile.name,
                            industry: brandProfile.category,
                            domain: brandProfile.domain,
                            description: brandProfile.description,
                            country: companyInfo.location || 'ES',
                            language: lang
                        })
                    })

                    if (response.ok) {
                        const data = await response.json()
                        // Map API response to Competitor interface
                        const mappedCompetitors: Competitor[] = data.map((c: any, index: number) => ({
                            id: `comp-auto-${Date.now()}-${index}`,
                            name: c.name,
                            domain: c.domain,
                            logo: c.favicon
                        }))
                        setCompetitors(mappedCompetitors)
                    }
                } catch (error) {
                    console.error('Failed to discover competitors:', error)
                } finally {
                    setIsDiscovering(false)
                    setHasDiscovered(true)
                }
            }
        }

        discoverCompetitors()
    }, [brandProfile.name, competitors.length, hasDiscovered, brandProfile.category, brandProfile.domain, brandProfile.description, companyInfo.location, lang, setCompetitors])

    const handleAddCompetitor = () => {
        if (newCompetitor.name && newCompetitor.domain) {
            const competitor: Competitor = {
                id: `comp-${Date.now()}`,
                name: newCompetitor.name,
                domain: newCompetitor.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
            }
            setCompetitors([...competitors, competitor])
            setNewCompetitor({ name: '', domain: '' })
            setShowAddForm(false)
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
            <Card className="w-full max-w-2xl p-6 md:p-8 space-y-4 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
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

                <div className="space-y-3">
                    {/* Loading State */}
                    {isDiscovering ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="relative w-12 h-12">
                                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-sm text-muted-foreground animate-pulse">{t.discovering}</p>
                        </div>
                    ) : (
                        /* Competitor list */
                        competitors.length > 0 ? (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-300">{t.detected}</Label>
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
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                            {competitor.logo ? (
                                                <img src={competitor.logo} alt={competitor.name} className="w-full h-full object-contain rounded-lg" />
                                            ) : (
                                                <Building2 className="w-4 h-4 text-muted-foreground" />
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
                                                    <p className="font-medium text-white truncate">{competitor.name}</p>
                                                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />
                                                        {competitor.domain}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleStartEdit(competitor)}
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-white"
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
                                    <Label className="text-sm text-gray-300">{t.name}</Label>
                                    <Input
                                        value={newCompetitor.name}
                                        onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                                        placeholder="Competitor Inc."
                                        className="h-9 bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-sm text-gray-300">{t.domain}</Label>
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
                        className="text-muted-foreground hover:text-white"
                    >
                        {t.back}
                    </Button>
                    <div className="flex gap-3">
                        {competitors.length === 0 && !isDiscovering && (
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
                            disabled={isDiscovering}
                            className="bg-white text-black hover:bg-white/90 px-8 h-10 rounded-md font-medium transition-all"
                        >
                            {t.next}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
