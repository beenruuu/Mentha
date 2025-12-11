'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { useEffect, useState, useRef } from 'react'
import { CheckCircle2, Loader2, Sparkles, AlertCircle, Users, Settings, Rocket, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

import { fetchAPI } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/lib/i18n'

interface SetupTask {
    id: string
    message: string
    messageEs: string
    status: 'pending' | 'running' | 'completed' | 'error' | 'skipped'
    icon: React.ReactNode
}

export default function SetupStep() {
    const {
        brandId,
        setBrandId,
        brandProfile,
        companyInfo,
        competitors,
        researchPrompts,
        scheduleConfig,
        prevStep,
    } = useOnboarding()
    const router = useRouter()
    const { lang } = useTranslations()
    const setupStarted = useRef(false)
    
    // Use ref to store brandId during async operations to avoid re-renders
    const brandIdRef = useRef<string | undefined>(brandId)

    // Validation check
    const missingData = !brandProfile.name || !companyInfo.websiteUrl || !brandProfile.domain

    const [tasks, setTasks] = useState<SetupTask[]>([
        {
            id: 'brand',
            message: 'Creating brand...',
            messageEs: 'Creando marca...',
            status: 'pending',
            icon: <Settings className="w-4 h-4" />
        },
        {
            id: 'prompts',
            message: 'Saving research prompts...',
            messageEs: 'Guardando prompts de investigación...',
            status: 'pending',
            icon: <Settings className="w-4 h-4" />
        },
        {
            id: 'schedule',
            message: 'Configuring AI models...',
            messageEs: 'Configurando modelos IA...',
            status: 'pending',
            icon: <Sparkles className="w-4 h-4" />
        },
        {
            id: 'competitors',
            message: 'Saving competitors...',
            messageEs: 'Guardando competidores...',
            status: 'pending',
            icon: <Users className="w-4 h-4" />
        },
        {
            id: 'analysis',
            message: 'Starting full analysis...',
            messageEs: 'Iniciando análisis completo...',
            status: 'pending',
            icon: <Rocket className="w-4 h-4" />
        },
    ])

    const [overallProgress, setOverallProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const t = {
        title: lang === 'es' ? 'Finalizando configuración' : 'Finalizing setup',
        subtitle: lang === 'es'
            ? 'Estamos guardando tus preferencias. Esto solo tomará un momento.'
            : 'We are saving your preferences. This will only take a moment.',
        progress: lang === 'es' ? 'Progreso' : 'Progress',
        redirecting: lang === 'es' ? 'Redirigiendo al dashboard...' : 'Redirecting to dashboard...',
        errorMessage: lang === 'es'
            ? 'Hubo un problema con la configuración. Por favor, intenta de nuevo.'
            : 'There was a problem with the setup. Please try again.',
        missingDataTitle: lang === 'es' ? 'Datos incompletos' : 'Incomplete data',
        missingDataMessage: lang === 'es'
            ? 'Faltan algunos datos obligatorios para crear tu marca. Por favor, vuelve atrás y completa el formulario.'
            : 'Some required data is missing to create your brand. Please go back and complete the form.',
        goBack: lang === 'es' ? 'Volver atrás' : 'Go back',
        skipped: lang === 'es' ? 'Omitido' : 'Skipped',
    }

    const updateTaskStatus = (id: string, status: SetupTask['status']) => {
        setTasks(prev => prev.map(task =>
            task.id === id ? { ...task, status } : task
        ))
    }

    const [logs, setLogs] = useState<string[]>([])
    const addLog = (msg: string) => setLogs(prev => [...prev, msg])

    useEffect(() => {
        // Don't start if missing data
        if (missingData) return

        console.log('[SetupStep] useEffect triggered, setupStarted.current:', setupStarted.current)
        
        if (setupStarted.current) {
            console.log('[SetupStep] Setup already started, skipping')
            return
        }
        setupStarted.current = true
        console.log('[SetupStep] Starting setup, set setupStarted.current = true')

        let isMounted = true
        let redirectTimeout: NodeJS.Timeout | null = null

        const runSetup = async () => {
            // Add initial delay for UX so progress bar starts at 0
            await new Promise(resolve => setTimeout(resolve, 800))

            try {
                // Use ref value to avoid re-render issues
                let resolvedBrandId = brandIdRef.current

                // ──────────────────────────────────────────────
                // FASE 1: CREACIÓN DE MARCA
                // ──────────────────────────────────────────────
                addLog(lang === 'es' ? '📍 FASE 1: Creación de marca' : '📍 PHASE 1: Brand Creation')
                updateTaskStatus('brand', 'running')
                setOverallProgress(10)

                if (!resolvedBrandId) {
                    addLog(lang === 'es' ? '🔍 Verificando marca...' : '🔍 Checking brand...')
                    
                    // Normalize domain helper
                    const normalizeDomain = (input?: string | null) => {
                        if (!input) return ''
                        try {
                            const u = new URL(input)
                            return u.hostname.replace(/^www\./i, '').toLowerCase()
                        } catch (e) {
                            // If it's not a full URL, strip protocol/path and www
                            return input.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/^www\./i, '').toLowerCase()
                        }
                    }

                    const candidateDomain = brandProfile.domain || companyInfo.websiteUrl || ''
                    const normalizedCandidate = normalizeDomain(candidateDomain)

                    // Buscar si ya existe la marca y, si existe, usarla en lugar de fallar
                    let foundExistingId: string | null = null
                    try {
                        const existing = await fetchAPI<any[]>('/brands/')
                        const match = existing.find(b => {
                            const existingDomain = normalizeDomain(b.domain)
                            return existingDomain && existingDomain === normalizedCandidate
                        })
                        if (match?.id) {
                            foundExistingId = match.id
                        }
                    } catch (e) {
                        // Si listar falla, continuamos e intentamos crear
                        console.warn('Could not verify existing brands before create:', e)
                    }

                    if (foundExistingId) {
                        resolvedBrandId = foundExistingId
                        brandIdRef.current = foundExistingId  // Store in ref, don't trigger re-render
                        addLog(lang === 'es' ? '✅ Marca existente detectada' : '✅ Existing brand detected')
                        console.log('[SetupStep] Found existing brand:', foundExistingId, 'isMounted:', isMounted)
                    } else {
                        try {
                            addLog(lang === 'es' ? '➕ Creando nueva marca...' : '➕ Creating new brand...')
                            const created = await fetchAPI<{ id: string }>('/brands/', {
                                method: 'POST',
                                body: JSON.stringify({
                                    domain: normalizedCandidate,
                                    name: brandProfile.name,
                                    industry: brandProfile.category,
                                    description: brandProfile.description,
                                    logo_url: brandProfile.logo,
                                    location: companyInfo.location,
                                    business_scope: brandProfile.businessScope || 'national',
                                    city: (brandProfile.businessScope === 'local' || brandProfile.businessScope === 'regional') ? (brandProfile.city || null) : null,
                                })
                            })
                            resolvedBrandId = created.id
                            brandIdRef.current = created.id  // Store in ref, don't trigger re-render
                            addLog(lang === 'es' ? '✅ Marca creada exitosamente' : '✅ Brand created successfully')
                        } catch (brandErr: any) {
                            // Si hay conflicto, intentar recuperar la marca y continuar
                            const errMsg = (brandErr?.message || '').toLowerCase()
                            const looksLikeConflict = errMsg.includes('ya tienes una marca') || errMsg.includes('conflict') || errMsg.includes('409')
                            if (looksLikeConflict) {
                                try {
                                    addLog(lang === 'es' ? '🔄 Recuperando marca existente...' : '🔄 Recovering existing brand...')
                                    const brands = await fetchAPI<any[]>('/brands/')
                                    const match = brands.find(b => normalizeDomain(b.domain) === normalizedCandidate)
                                    if (match?.id) {
                                        resolvedBrandId = match.id
                                        brandIdRef.current = match.id  // Store in ref, don't trigger re-render
                                        addLog(lang === 'es' ? '✅ Marca recuperada' : '✅ Brand recovered')
                                    } else {
                                        throw new Error('no_match')
                                    }
                                } catch (recoverErr) {
                                    console.error('Failed to recover existing brand:', recoverErr)
                                    setError(lang === 'es' ? 'No se pudo crear o recuperar la marca. Revisa los datos.' : 'Could not create or recover the brand. Please review the data.')
                                    updateTaskStatus('brand', 'error')
                                    return
                                }
                            } else {
                                console.error('Failed to create brand:', brandErr)
                                setError(lang === 'es' ? 'No se pudo crear la marca. Vuelve atrás y revisa los datos.' : 'Failed to create brand. Please go back and review the data.')
                                updateTaskStatus('brand', 'error')
                                return
                            }
                        }
                    }
                } else {
                    addLog(lang === 'es' ? '✅ Marca ya existe, continuando...' : '✅ Brand already exists, continuing...')
                }

                if (!resolvedBrandId) {
                    setError(lang === 'es' ? 'No se pudo crear la marca.' : 'Failed to create brand.')
                    updateTaskStatus('brand', 'error')
                    return
                }

                console.log('[SetupStep] Brand resolved, checking isMounted:', isMounted, 'resolvedBrandId:', resolvedBrandId)
                if (!isMounted) {
                    console.warn('[SetupStep] ❌ Component unmounted before FASE 2!')
                    return
                }
                updateTaskStatus('brand', 'completed')
                setOverallProgress(25)
                addLog('')  // Blank line for readability
                console.log('[SetupStep] Starting FASE 2...')
                await new Promise(resolve => setTimeout(resolve, 200))

                // ──────────────────────────────────────────────
                // FASE 2: CONFIGURACIÓN DE ANÁLISIS
                // ──────────────────────────────────────────────
                addLog(lang === 'es' ? '📍 FASE 2: Configuración de análisis' : '📍 PHASE 2: Analysis Configuration')
                
                // Step 2a: Save research prompts
                const promptsToProcess = Array.isArray(researchPrompts) ? researchPrompts : []

                if (promptsToProcess.length > 0) {
                    if (!isMounted) return
                    updateTaskStatus('prompts', 'running')
                    setOverallProgress(35)
                    addLog(lang === 'es' ? `📝 Guardando ${promptsToProcess.length} prompts...` : `📝 Saving ${promptsToProcess.length} prompts...`)

                    const selectedPrompts = promptsToProcess.map((p: any) => p?.text || '').filter(t => t)

                    if (selectedPrompts.length > 0) {
                        try {
                            await fetchAPI(`/brands/${resolvedBrandId}`, {
                                method: 'PUT',
                                body: JSON.stringify({
                                    discovery_prompts: selectedPrompts,
                                })
                            })
                            addLog(lang === 'es' ? `✅ ${selectedPrompts.length} prompts guardados` : `✅ ${selectedPrompts.length} prompts saved`)
                        } catch (promptErr: any) {
                            console.warn('Failed to save prompts:', promptErr)
                            addLog(lang === 'es' ? '⚠️  Error guardando prompts (continuando...)' : '⚠️  Error saving prompts (continuing...)')
                        }
                    }
                    updateTaskStatus('prompts', 'completed')
                } else {
                    addLog(lang === 'es' ? '🔄 Sin prompts personalizados - usaremos consultas automáticas' : '🔄 No custom prompts - using automatic queries')
                    updateTaskStatus('prompts', 'completed')
                }

                if (!isMounted) return
                setOverallProgress(45)
                await new Promise(resolve => setTimeout(resolve, 200))

                // Step 2b: Configure AI models
                if (!isMounted) return
                updateTaskStatus('schedule', 'running')
                setOverallProgress(55)
                addLog(lang === 'es' ? '🤖 Configurando modelos IA...' : '🤖 Configuring AI models...')

                const safeModels = Array.isArray(scheduleConfig?.models) ? scheduleConfig.models : []
                const selectedProviders = safeModels
                    .filter((m: { enabled: boolean }) => m.enabled)
                    .map((m: { modelId: string }) => m.modelId)

                if (selectedProviders.length > 0) {
                    try {
                        await fetchAPI(`/brands/${resolvedBrandId}`, {
                            method: 'PUT',
                            body: JSON.stringify({
                                ai_providers: selectedProviders,
                            })
                        })
                        addLog(lang === 'es' ? `✅ ${selectedProviders.length} modelos habilitados` : `✅ ${selectedProviders.length} models enabled`)
                    } catch (modelErr: any) {
                        console.warn('Failed to save AI providers:', modelErr)
                        addLog(lang === 'es' ? '⚠️  Error configurando modelos (continuando...)' : '⚠️  Error configuring models (continuing...)')
                    }
                } else {
                    addLog(lang === 'es' ? '⚠️  Sin modelos seleccionados (se usarán valores por defecto)' : '⚠️  No models selected (using defaults)')
                }

                if (!isMounted) return
                updateTaskStatus('schedule', 'completed')
                setOverallProgress(70)
                addLog('')  // Blank line for readability
                await new Promise(resolve => setTimeout(resolve, 200))

                // Task 3: Save all competitors to database
                if (!isMounted) return
                addLog('📍 FASE 3: Guardando competidores')
                const safeCompetitors = Array.isArray(competitors) ? competitors : []

                if (safeCompetitors.length > 0) {
                    updateTaskStatus('competitors', 'running')
                    setOverallProgress(80)
                    addLog(lang === 'es' ? `💾 Guardando ${safeCompetitors.length} competidores...` : `💾 Saving ${safeCompetitors.length} competitors...`)

                    let savedCount = 0
                    for (let i = 0; i < safeCompetitors.length; i++) {
                        const competitor = safeCompetitors[i]
                        console.log(`[SetupStep] Saving competitor ${i + 1}/${safeCompetitors.length}:`, competitor.name)
                        
                        try {
                            await fetchAPI(`/competitors/`, {
                                method: 'POST',
                                body: JSON.stringify({
                                    brand_id: resolvedBrandId,
                                    name: competitor.name,
                                    domain: competitor.domain,
                                    favicon: competitor.logo,
                                    source: competitor.source || 'manual',
                                    confidence: competitor.confidence || 'medium',
                                })
                            })
                            savedCount++
                            console.log(`[SetupStep] Competitor saved (${savedCount}/${safeCompetitors.length})`)
                        } catch (e) {
                            // Ignore duplicate errors
                            console.warn('Failed to add competitor:', competitor.name, e)
                        }
                        
                        if (!isMounted) {
                            console.warn('[SetupStep] Component unmounted during competitor saving')
                            return
                        }
                    }
                    addLog(lang === 'es' ? `✅ ${savedCount} competidores guardados` : `✅ ${savedCount} competitors saved`)
                    updateTaskStatus('competitors', 'completed')
                } else {
                    addLog(lang === 'es' ? '⚠️  Sin competidores (omitido)' : '⚠️  No competitors (skipped)')
                    updateTaskStatus('competitors', 'skipped')
                }

                if (!isMounted) return
                setOverallProgress(90)
                addLog('')  // Blank line for readability
                await new Promise(resolve => setTimeout(resolve, 200))

                // Task 4: Trigger full analysis
                if (!isMounted) return
                addLog('📍 FASE 4: Iniciando análisis')
                updateTaskStatus('analysis', 'running')
                setOverallProgress(95)
                addLog(lang === 'es' ? '🚀 Iniciando análisis en segundo plano...' : '🚀 Starting background analysis...')

                try {
                    await fetchAPI(`/analysis/trigger/${resolvedBrandId}`, {
                        method: 'POST'
                    })
                    addLog(lang === 'es' ? '✅ Análisis iniciado correctamente' : '✅ Analysis started successfully')
                } catch (e) {
                    console.warn('Failed to trigger analysis:', e)
                    addLog(lang === 'es' ? '⚠️  El análisis se ejecutará automáticamente' : '⚠️  Analysis will run automatically')
                }

                if (!isMounted) return
                updateTaskStatus('analysis', 'completed')
                setOverallProgress(100)
                addLog('')  // Blank line for readability
                addLog(lang === 'es' ? '✨ ¡Onboarding completado!' : '✨ Onboarding complete!')
                addLog(lang === 'es' ? '⏳ Redirigiendo al dashboard...' : '⏳ Redirecting to dashboard...')

                // Sync brandId to context before redirect (safe now, we're done with async work)
                if (resolvedBrandId) {
                    setBrandId(resolvedBrandId)
                }

                // Redirect to dashboard after a short delay
                await new Promise(resolve => setTimeout(resolve, 1000))
                if (!isMounted) return
                router.push(`/brand/${resolvedBrandId}`)

            } catch (err: any) {
                console.error('Setup failed:', err)
                setError(err?.message || t.errorMessage)
                addLog(`Error: ${err?.message || 'unknown'}`)

                // Mark current running task as error
                setTasks(prev => prev.map(task =>
                    task.status === 'running' ? { ...task, status: 'error' } : task
                ))

                // Still try to redirect to dashboard after error
                const fallbackBrandId = brandIdRef.current
                redirectTimeout = setTimeout(() => {
                    if (isMounted && fallbackBrandId) router.push(`/brand/${fallbackBrandId}`)
                    else if (isMounted) router.push('/dashboard')
                }, 3000)
            }
        }

        runSetup()

        return () => {
            console.log('[SetupStep] Cleanup called, setting isMounted = false')
            isMounted = false
            if (redirectTimeout) clearTimeout(redirectTimeout)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const completedTasks = tasks.filter(t => t.status === 'completed').length

    // Show validation error if missing data
    if (missingData) {
        return (
            <div className="w-full flex justify-center animate-in fade-in duration-500">
                <Card className="w-full max-w-2xl p-6 md:p-8 space-y-6 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white">
                                {t.missingDataTitle}
                            </h2>
                            <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
                                {t.missingDataMessage}
                            </p>
                        </div>
                        <div className="pt-2">
                            <p className="text-xs text-muted-foreground mb-4">
                                {lang === 'es' ? 'Datos faltantes:' : 'Missing data:'}
                                {!brandProfile.name && <span className="text-red-400 ml-2">• Nombre de marca</span>}
                                {!companyInfo.websiteUrl && <span className="text-red-400 ml-2">• URL del sitio</span>}
                                {!brandProfile.domain && <span className="text-red-400 ml-2">• Dominio</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <Button
                            onClick={prevStep}
                            className="bg-white text-black hover:bg-white/90 px-6 h-10"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t.goBack}
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl p-6 md:p-8 space-y-6 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                {/* Header with animated spinner */}
                <div className="text-center space-y-4">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
                        <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
                        <div className="absolute inset-2 border-4 border-b-emerald-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">
                            {t.title}
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {t.subtitle}
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t.progress}</span>
                        <span className="text-primary font-medium">{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                </div>

                {/* Setup tasks */}
                <div className="space-y-1.5">
                    {tasks.map((task) => {
                        const isRunning = task.status === 'running'
                        const isCompleted = task.status === 'completed'
                        const isError = task.status === 'error'
                        const isPending = task.status === 'pending'
                        const isSkipped = task.status === 'skipped'

                        return (
                            <div
                                key={task.id}
                                className={cn(
                                    "flex items-center gap-3 transition-all duration-500 rounded-lg p-2",
                                    isRunning && "bg-emerald-500/10 border border-emerald-500/20 scale-[1.02]",
                                    isCompleted && "bg-green-500/5 border border-green-500/10",
                                    isError && "bg-red-500/10 border border-red-500/20",
                                    isSkipped && "bg-white/5 border border-white/5",
                                    isPending && "opacity-40"
                                )}
                            >
                                {/* Status Icon */}
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                                    isRunning && "bg-emerald-500/20 text-emerald-500",
                                    isCompleted && "bg-green-500/20 text-green-500",
                                    isError && "bg-red-500/20 text-red-500",
                                    isSkipped && "bg-white/10 text-white/50",
                                    isPending && "bg-white/5 text-white/30"
                                )}>
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : isRunning ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : isError ? (
                                        <AlertCircle className="w-3.5 h-3.5" />
                                    ) : isSkipped ? (
                                        <span className="text-[10px]">—</span>
                                    ) : (
                                        task.icon
                                    )}
                                </div>

                                {/* Message */}
                                <p className={cn(
                                    "text-sm font-medium flex-1",
                                    isRunning && "text-white",
                                    isCompleted && "text-green-400",
                                    isError && "text-red-400",
                                    isSkipped && "text-white/50",
                                    isPending && "text-white/50"
                                )}>
                                    {lang === 'es' ? task.messageEs : task.message}
                                    {isSkipped && <span className="text-xs text-muted-foreground ml-2">({t.skipped})</span>}
                                </p>
                            </div>
                        )
                    })}
                </div>

                {/* Logs Section */}
                <div className="mt-4 p-3 bg-black/50 rounded-lg border border-white/5 h-32 overflow-y-auto font-mono text-xs text-muted-foreground">
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 last:mb-0">
                            <span className="text-emerald-500/50 mr-2">{'>'}</span>
                            {log}
                        </div>
                    ))}
                    <div ref={(el) => { if (el && logs.length > 0) el.scrollIntoView({ behavior: 'smooth' }) }} />
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                        <p className="text-sm text-red-400">
                            {error}
                        </p>
                    </div>
                )}

                {/* Completion message */}
                {overallProgress === 100 && !error && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                        <p className="text-sm text-green-400">
                            {t.redirecting}
                        </p>
                    </div>
                )}
            </Card>
        </div>
    )
}
