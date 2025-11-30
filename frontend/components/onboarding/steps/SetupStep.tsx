'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { useEffect, useState, useRef } from 'react'
import { CheckCircle2, Loader2, Sparkles, AlertCircle, Building2, Users, MessageSquare, Settings, Rocket } from 'lucide-react'
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
            id: 'prompts', 
            message: 'Registering prompts...', 
            messageEs: 'Registrando prompts...',
            status: 'pending', 
            icon: <MessageSquare className="w-4 h-4" /> 
        },
        { 
            id: 'config', 
            message: 'Applying configuration...', 
            messageEs: 'Aplicando configuración...',
            status: 'pending', 
            icon: <Settings className="w-4 h-4" /> 
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

    useEffect(() => {
        if (setupStarted.current) return
        setupStarted.current = true

        const runSetup = async () => {
            try {
                // Task 1: Create organization / Update user profile
                updateTaskStatus('org', 'running')
                setOverallProgress(10)
                
                await fetchAPI('/auth/me', {
                    method: 'PUT',
                    body: JSON.stringify({
                        full_name: `${userInfo.firstName} ${userInfo.lastName}`,
                        seo_experience: userInfo.seoExperience || null,
                    })
                })
                
                updateTaskStatus('org', 'completed')
                setOverallProgress(20)
                await new Promise(resolve => setTimeout(resolve, 500))

                // Task 2: Add website / Create brand
                updateTaskStatus('site', 'running')
                setOverallProgress(30)

                const selectedProviders = scheduleConfig.models
                    .filter(m => m.enabled)
                    .map(m => m.modelId)

                const selectedPrompts = researchPrompts.map(p => p.text)

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
                await new Promise(resolve => setTimeout(resolve, 500))

                // Task 3: Process competitors
                updateTaskStatus('competitors', 'running')
                setOverallProgress(55)

                if (competitors.length > 0) {
                    // Add competitors to the brand
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
                await new Promise(resolve => setTimeout(resolve, 500))

                // Task 4: Register prompts
                updateTaskStatus('prompts', 'running')
                setOverallProgress(80)

                // Prompts are already sent with brand creation, but we can update if needed
                // This is a placeholder for future prompt-specific API calls

                updateTaskStatus('prompts', 'completed')
                setOverallProgress(85)
                await new Promise(resolve => setTimeout(resolve, 500))

                // Task 5: Apply configuration
                updateTaskStatus('config', 'running')
                setOverallProgress(90)

                // Apply schedule configuration if needed
                // This is a placeholder for future schedule-specific API calls

                updateTaskStatus('config', 'completed')
                setOverallProgress(95)
                await new Promise(resolve => setTimeout(resolve, 500))

                // Task 6: Finalize
                updateTaskStatus('finalize', 'running')
                setOverallProgress(98)

                await new Promise(resolve => setTimeout(resolve, 800))

                updateTaskStatus('finalize', 'completed')
                setOverallProgress(100)

                // Redirect to dashboard after a short delay
                await new Promise(resolve => setTimeout(resolve, 1500))
                router.push(`/brand/${brand.id}`)

            } catch (err: any) {
                console.error('Setup failed:', err)
                setError(err.message || t.errorMessage)
                
                // Mark current running task as error
                setTasks(prev => prev.map(task => 
                    task.status === 'running' ? { ...task, status: 'error' } : task
                ))

                // Redirect to dashboard after error
                setTimeout(() => {
                    router.push('/dashboard')
                }, 3000)
            }
        }

        runSetup()
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
