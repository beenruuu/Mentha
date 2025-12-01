'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { useEffect, useState, useRef } from 'react'
import { CheckCircle2, Loader2, Sparkles, AlertCircle, Building2, Users, Settings, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { geoAnalysisService } from '@/lib/services/geo-analysis'

import { fetchAPI } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/lib/i18n'

interface SetupTask {
    id: string
    message: string
    messageEs: string
    status: 'pending' | 'running' | 'completed' | 'error'
    icon: React.ReactNode
}

export default function SetupStep() {
    const {
        userInfo,
        companyInfo,
        brandProfile,
        competitors,
        researchPrompts,
        scheduleConfig,
        setBrandId
    } = useOnboarding()
    const router = useRouter()
    const { lang } = useTranslations()
    const setupStarted = useRef(false)

    const [tasks, setTasks] = useState<SetupTask[]>([
        {
            id: 'org',
            message: 'Creating organization...',
            messageEs: 'Creando organización...',
            status: 'pending',
            icon: <Building2 className="w-4 h-4" />
        },
        {
            id: 'site',
            message: 'Adding website...',
            messageEs: 'Añadiendo sitio web...',
            status: 'pending',
            icon: <Settings className="w-4 h-4" />
        },
        {
            id: 'competitors',
            message: 'Processing competitors...',
            messageEs: 'Procesando competidores...',
            status: 'pending',
            icon: <Users className="w-4 h-4" />
        },
        {
            id: 'analysis',
            message: 'Starting GEO analysis...',
            messageEs: 'Iniciando análisis GEO...',
            status: 'pending',
            icon: <Sparkles className="w-4 h-4" />
        },
        {
            id: 'finalize',
            message: 'Finalizing setup...',
            messageEs: 'Finalizando configuración...',
            status: 'pending',
            icon: <Rocket className="w-4 h-4" />
        },
    ])

    const [overallProgress, setOverallProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const t = {
        title: lang === 'es' ? 'Configurando tu cuenta' : 'Setting up your account',
        subtitle: lang === 'es'
            ? 'Estamos preparando todo para ti. Esto solo tomará un momento.'
            : 'We are preparing everything for you. This will only take a moment.',
        progress: lang === 'es' ? 'Progreso' : 'Progress',
        redirecting: lang === 'es' ? 'Redirigiendo al dashboard...' : 'Redirecting to dashboard...',
        errorMessage: lang === 'es'
            ? 'Hubo un problema con la configuración. Por favor, intenta de nuevo.'
            : 'There was a problem with the setup. Please try again.',
    }

    const updateTaskStatus = (id: string, status: SetupTask['status']) => {
        setTasks(prev => prev.map(task =>
            task.id === id ? { ...task, status } : task
        ))
    }

    const [logs, setLogs] = useState<string[]>([])
    const addLog = (msg: string) => setLogs(prev => [...prev, msg])

    useEffect(() => {
        if (setupStarted.current) return
        setupStarted.current = true

        let isMounted = true
        let redirectTimeout: NodeJS.Timeout | null = null

        const runSetup = async () => {
            try {
                // Task 1: Create organization / Update user profile
                updateTaskStatus('org', 'running')
                setOverallProgress(10)
                addLog(lang === 'es' ? 'Iniciando configuración...' : 'Starting setup...')

                await fetchAPI('/auth/me', {
                    method: 'PUT',
                    body: JSON.stringify({
                        full_name: `${userInfo.firstName} ${userInfo.lastName}`,
                        seo_experience: userInfo.seoExperience || null,
                    })
                })

                updateTaskStatus('org', 'completed')
                setOverallProgress(20)
                addLog(lang === 'es' ? 'Perfil de usuario actualizado' : 'User profile updated')
                await new Promise(resolve => setTimeout(resolve, 500))

                // Task 2: Add website / Create brand
                updateTaskStatus('site', 'running')
                setOverallProgress(30)
                addLog(lang === 'es' ? 'Creando marca y sitio web...' : 'Creating brand and website...')

                const selectedProviders = scheduleConfig.models
                    .filter((m: { enabled: boolean }) => m.enabled)
                    .map((m: { modelId: string }) => m.modelId)

                const selectedPrompts = researchPrompts.map((p: { text: string }) => p.text)

                const brand = await fetchAPI<{ id: string }>('/brands/', {
                    method: 'POST',
                    body: JSON.stringify({
                        domain: companyInfo.websiteUrl,
                        name: brandProfile.name,
                        industry: brandProfile.category,
                        description: brandProfile.description,
                        logo: brandProfile.logo,
                        location: companyInfo.location,
                        discovery_prompts: selectedPrompts,
                        ai_providers: selectedProviders,
                    })
                })

                setBrandId(brand.id)
                updateTaskStatus('site', 'completed')
                setOverallProgress(45)
                addLog(lang === 'es' ? 'Marca creada exitosamente' : 'Brand created successfully')
                await new Promise(resolve => setTimeout(resolve, 500))

                // Task 3: Process competitors
                updateTaskStatus('competitors', 'running')
                setOverallProgress(55)
                addLog(lang === 'es' ? `Procesando ${competitors.length} competidores...` : `Processing ${competitors.length} competitors...`)

                if (competitors.length > 0) {
                    for (const competitor of competitors) {
                        try {
                            await fetchAPI(`/brands/${brand.id}/competitors`, {
                                method: 'POST',
                                body: JSON.stringify({
                                    name: competitor.name,
                                    domain: competitor.domain,
                                })
                            })
                        } catch (e) {
                            console.warn('Failed to add competitor:', competitor.name, e)
                        }
                    }
                }

                updateTaskStatus('competitors', 'completed')
                setOverallProgress(70)
                addLog(lang === 'es' ? 'Competidores procesados' : 'Competitors processed')
                await new Promise(resolve => setTimeout(resolve, 500))

                // Task 4: Start GEO Analysis
                updateTaskStatus('analysis', 'running')
                setOverallProgress(75)
                addLog(lang === 'es' ? 'Iniciando análisis GEO completo...' : 'Starting full GEO analysis...')

                try {
                    const analysis = await geoAnalysisService.analyze({
                        brand_name: brandProfile.name,
                        domain: companyInfo.websiteUrl,
                        industry: brandProfile.category,
                        competitors: competitors.map((c: { domain: string }) => c.domain),
                        topics: selectedPrompts,
                        run_full_analysis: true
                    })

                    // Poll for progress
                    let isComplete = false
                    const processedModules = new Set<string>()

                    while (!isComplete && isMounted) {
                        await new Promise(r => setTimeout(r, 2000))
                        if (!isMounted) break
                        const status = await geoAnalysisService.getAnalysis(analysis.id)

                        // Check modules and add logs
                        if (status.modules.ai_visibility && !processedModules.has('ai_visibility')) {
                            processedModules.add('ai_visibility')
                            addLog(lang === 'es' ? 'Visibilidad IA analizada' : 'AI Visibility analyzed')
                            setOverallProgress(prev => Math.min(prev + 5, 90))
                        }
                        if (status.modules.citations && !processedModules.has('citations')) {
                            processedModules.add('citations')
                            addLog(lang === 'es' ? 'Citas rastreadas' : 'Citations tracked')
                            setOverallProgress(prev => Math.min(prev + 5, 90))
                        }
                        if (status.modules.search_simulator && !processedModules.has('search_simulator')) {
                            processedModules.add('search_simulator')
                            addLog(lang === 'es' ? 'Simulación de búsqueda completada' : 'Search simulation completed')
                            setOverallProgress(prev => Math.min(prev + 5, 90))
                        }
                        if (status.modules.content_structure && !processedModules.has('content_structure')) {
                            processedModules.add('content_structure')
                            addLog(lang === 'es' ? 'Estructura de contenido analizada' : 'Content structure analyzed')
                            setOverallProgress(prev => Math.min(prev + 5, 90))
                        }
                        if (status.modules.knowledge_graph && !processedModules.has('knowledge_graph')) {
                            processedModules.add('knowledge_graph')
                            addLog(lang === 'es' ? 'Gráfico de conocimiento verificado' : 'Knowledge graph checked')
                            setOverallProgress(prev => Math.min(prev + 5, 90))
                        }
                        if (status.modules.eeat && !processedModules.has('eeat')) {
                            processedModules.add('eeat')
                            addLog(lang === 'es' ? 'Señales E-E-A-T analizadas' : 'E-E-A-T signals analyzed')
                            setOverallProgress(prev => Math.min(prev + 5, 90))
                        }

                        if (status.status === 'completed' || status.status === 'failed') {
                            isComplete = true
                        }
                    }
                } catch (e) {
                    console.error('Failed to start GEO analysis:', e)
                    addLog(lang === 'es' ? 'Error en el análisis (continuando...)' : 'Analysis failed (continuing...)')
                    // No bloqueamos el setup por error en análisis
                }

                if (!isMounted) return
                updateTaskStatus('analysis', 'completed')
                setOverallProgress(95)
                addLog(lang === 'es' ? 'Análisis completado' : 'Analysis completed')
                await new Promise(resolve => setTimeout(resolve, 500))

                // Task 5: Finalize
                if (!isMounted) return
                updateTaskStatus('finalize', 'running')
                setOverallProgress(98)
                addLog(lang === 'es' ? 'Finalizando...' : 'Finalizing...')

                await new Promise(resolve => setTimeout(resolve, 800))
                if (!isMounted) return

                updateTaskStatus('finalize', 'completed')
                setOverallProgress(100)
                addLog(lang === 'es' ? '¡Todo listo!' : 'All set!')

                // Redirect to dashboard after a short delay
                await new Promise(resolve => setTimeout(resolve, 1500))
                if (!isMounted) return
                router.push(`/brand/${brand.id}`)

            } catch (err: any) {
                console.error('Setup failed:', err)
                setError(err.message || t.errorMessage)
                addLog(`Error: ${err.message}`)

                // Mark current running task as error
                setTasks(prev => prev.map(task =>
                    task.status === 'running' ? { ...task, status: 'error' } : task
                ))

                // Redirect to dashboard after error
                redirectTimeout = setTimeout(() => {
                    if (isMounted) router.push('/dashboard')
                }, 3000)
            }
        }

        runSetup()

        return () => {
            isMounted = false
            if (redirectTimeout) clearTimeout(redirectTimeout)
        }
    }, [])

    const completedTasks = tasks.filter(t => t.status === 'completed').length

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

                        return (
                            <div
                                key={task.id}
                                className={cn(
                                    "flex items-center gap-3 transition-all duration-500 rounded-lg p-2",
                                    isRunning && "bg-emerald-500/10 border border-emerald-500/20 scale-[1.02]",
                                    isCompleted && "bg-green-500/5 border border-green-500/10",
                                    isError && "bg-red-500/10 border border-red-500/20",
                                    isPending && "opacity-40"
                                )}
                            >
                                {/* Status Icon */}
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                                    isRunning && "bg-emerald-500/20 text-emerald-500",
                                    isCompleted && "bg-green-500/20 text-green-500",
                                    isError && "bg-red-500/20 text-red-500",
                                    isPending && "bg-white/5 text-white/30"
                                )}>
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : isRunning ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : isError ? (
                                        <AlertCircle className="w-3.5 h-3.5" />
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
                                    isPending && "text-white/50"
                                )}>
                                    {lang === 'es' ? task.messageEs : task.message}
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
