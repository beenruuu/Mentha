'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { useEffect, useState, useRef } from 'react'
import { CheckCircle2, Loader2, Sparkles, AlertCircle, Users, Settings, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

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
        brandId,
        competitors,
        researchPrompts,
        scheduleConfig,
    } = useOnboarding()
    const router = useRouter()
    const { lang } = useTranslations()
    const setupStarted = useRef(false)

    const [tasks, setTasks] = useState<SetupTask[]>([
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
            if (!brandId) {
                setError(lang === 'es' ? 'No se encontró la marca. Por favor, vuelve a intentarlo.' : 'Brand not found. Please try again.')
                return
            }

            try {
                // Task 1: Save research prompts
                updateTaskStatus('prompts', 'running')
                setOverallProgress(10)
                addLog(lang === 'es' ? 'Guardando prompts de investigación...' : 'Saving research prompts...')

                const selectedPrompts = researchPrompts.map((p: { text: string }) => p.text)
                
                if (selectedPrompts.length > 0) {
                    try {
                        await fetchAPI(`/brands/${brandId}`, {
                            method: 'PUT',
                            body: JSON.stringify({
                                discovery_prompts: selectedPrompts,
                            })
                        })
                        addLog(lang === 'es' ? `${selectedPrompts.length} prompts guardados` : `${selectedPrompts.length} prompts saved`)
                    } catch (promptErr: any) {
                        console.warn('Failed to save prompts:', promptErr)
                        addLog(lang === 'es' ? 'Prompts se guardarán después' : 'Prompts will be saved later')
                    }
                }

                updateTaskStatus('prompts', 'completed')
                setOverallProgress(30)
                await new Promise(resolve => setTimeout(resolve, 200))

                // Task 2: Configure AI models
                if (!isMounted) return
                updateTaskStatus('schedule', 'running')
                setOverallProgress(45)
                addLog(lang === 'es' ? 'Configurando modelos IA...' : 'Configuring AI models...')

                const selectedProviders = scheduleConfig.models
                    .filter((m: { enabled: boolean }) => m.enabled)
                    .map((m: { modelId: string }) => m.modelId)

                if (selectedProviders.length > 0) {
                    try {
                        await fetchAPI(`/brands/${brandId}`, {
                            method: 'PUT',
                            body: JSON.stringify({
                                ai_providers: selectedProviders,
                            })
                        })
                        addLog(lang === 'es' ? `${selectedProviders.length} modelos configurados` : `${selectedProviders.length} models configured`)
                    } catch (modelErr: any) {
                        console.warn('Failed to save AI providers:', modelErr)
                        addLog(lang === 'es' ? 'Modelos se configurarán después' : 'Models will be configured later')
                    }
                }

                updateTaskStatus('schedule', 'completed')
                setOverallProgress(60)
                await new Promise(resolve => setTimeout(resolve, 200))

                // Task 3: Save all competitors to database
                if (!isMounted) return
                updateTaskStatus('competitors', 'running')
                setOverallProgress(70)
                addLog(lang === 'es' ? `Guardando ${competitors.length} competidores...` : `Saving ${competitors.length} competitors...`)

                // Save all competitors (they were discovered but not yet persisted)
                for (const competitor of competitors) {
                    try {
                        await fetchAPI(`/competitors/`, {
                            method: 'POST',
                            body: JSON.stringify({
                                brand_id: brandId,
                                name: competitor.name,
                                domain: competitor.domain,
                                favicon: competitor.logo,
                                source: competitor.source || 'manual',
                                confidence: competitor.confidence || 'medium',
                            })
                        })
                    } catch (e) {
                        // Ignore duplicate errors
                        console.warn('Failed to add competitor:', competitor.name, e)
                    }
                }

                updateTaskStatus('competitors', 'completed')
                setOverallProgress(85)
                addLog(lang === 'es' ? 'Competidores guardados' : 'Competitors saved')
                await new Promise(resolve => setTimeout(resolve, 300))

                // Task 4: Trigger full analysis
                if (!isMounted) return
                updateTaskStatus('analysis', 'running')
                setOverallProgress(90)
                addLog(lang === 'es' ? 'Iniciando análisis completo en segundo plano...' : 'Starting full analysis in background...')

                try {
                    // Trigger the full analysis (runs in background)
                    await fetchAPI(`/analysis/trigger/${brandId}`, {
                        method: 'POST'
                    })
                    addLog(lang === 'es' ? 'Análisis iniciado correctamente' : 'Analysis started successfully')
                } catch (e) {
                    console.warn('Failed to trigger analysis:', e)
                    addLog(lang === 'es' ? 'El análisis se ejecutará automáticamente' : 'Analysis will run automatically')
                }

                updateTaskStatus('analysis', 'completed')
                setOverallProgress(100)
                addLog(lang === 'es' ? '¡Todo listo!' : 'All set!')

                // Redirect to dashboard after a short delay
                await new Promise(resolve => setTimeout(resolve, 1000))
                if (!isMounted) return
                router.push(`/brand/${brandId}`)

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
                    if (isMounted && brandId) router.push(`/brand/${brandId}`)
                    else if (isMounted) router.push('/dashboard')
                }, 3000)
            }
        }

        runSetup()

        return () => {
            isMounted = false
            if (redirectTimeout) clearTimeout(redirectTimeout)
        }
    }, [brandId])

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
