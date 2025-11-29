'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { useEffect, useState, useRef } from 'react'
import { CheckCircle2, Loader2, Sparkles, AlertCircle, Globe, Brain, Search, BarChart3, Users, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { fetchAPI } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

interface AnalysisLog {
    id: string
    message: string
    status: 'pending' | 'running' | 'completed' | 'error'
    icon: React.ReactNode
    detail?: string
}

export default function AnalysisProgressStep() {
    const { brandInfo, userInfo } = useOnboarding()
    const router = useRouter()
    const [logs, setLogs] = useState<AnalysisLog[]>([
        { id: 'search', message: 'Buscando información del mercado...', status: 'pending', icon: <Globe className="w-4 h-4" /> },
        { id: 'technical', message: 'Auditoría técnica AEO...', status: 'pending', icon: <Search className="w-4 h-4" /> },
        { id: 'keywords', message: 'Analizando keywords relevantes...', status: 'pending', icon: <FileText className="w-4 h-4" /> },
        { id: 'visibility', message: 'Midiendo visibilidad en IA...', status: 'pending', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'competitors', message: 'Identificando competidores...', status: 'pending', icon: <Users className="w-4 h-4" /> },
        { id: 'analysis', message: 'Generando análisis con IA...', status: 'pending', icon: <Brain className="w-4 h-4" /> },
        { id: 'recommendations', message: 'Preparando recomendaciones...', status: 'pending', icon: <Sparkles className="w-4 h-4" /> },
    ])
    const [overallProgress, setOverallProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const pollingStarted = useRef(false)
    const pollCount = useRef(0)

    const lang = userInfo?.preferredLanguage === 'es' ? 'es' : 'en'

    const updateLogStatus = (id: string, status: AnalysisLog['status'], detail?: string) => {
        setLogs(prev => prev.map(log => 
            log.id === id ? { ...log, status, detail } : log
        ))
    }

    useEffect(() => {
        if (pollingStarted.current || !brandInfo.id) return
        pollingStarted.current = true

        const pollAnalysisStatus = async () => {
            const brandId = brandInfo.id
            if (!brandId) {
                setError('No brand ID available')
                return
            }

            try {
                // Start progress animation
                updateLogStatus('search', 'running')
                setOverallProgress(5)

                // Poll for analysis status
                const checkStatus = async (): Promise<boolean> => {
                    pollCount.current++
                    
                    try {
                        const analyses = await fetchAPI(`/analysis/?brand_id=${brandId}`) as any[]
                        const latestAnalysis = Array.isArray(analyses) && analyses.length > 0 ? analyses[0] : null
                        
                        if (!latestAnalysis) {
                            return false
                        }

                        const status = latestAnalysis.status
                        const results = latestAnalysis.results || {}

                        // Update progress based on analysis status
                        if (status === 'pending') {
                            setOverallProgress(10)
                            updateLogStatus('search', 'running')
                            return false
                        }

                        if (status === 'processing') {
                            const progress = Math.min(85, 10 + pollCount.current * 10)
                            setOverallProgress(progress)
                            
                            if (progress >= 15) {
                                updateLogStatus('search', 'completed', lang === 'es' ? 'Datos del mercado obtenidos' : 'Market data gathered')
                                updateLogStatus('technical', 'running')
                            }
                            if (progress >= 30) {
                                updateLogStatus('technical', 'completed', lang === 'es' ? 'Auditoría técnica completada' : 'Technical audit complete')
                                updateLogStatus('keywords', 'running')
                            }
                            if (progress >= 45) {
                                updateLogStatus('keywords', 'completed', lang === 'es' ? 'Keywords analizados' : 'Keywords analyzed')
                                updateLogStatus('visibility', 'running')
                            }
                            if (progress >= 55) {
                                updateLogStatus('visibility', 'completed', lang === 'es' ? 'Visibilidad medida' : 'Visibility measured')
                                updateLogStatus('competitors', 'running')
                            }
                            if (progress >= 70) {
                                updateLogStatus('competitors', 'completed', lang === 'es' ? 'Competidores identificados' : 'Competitors identified')
                                updateLogStatus('analysis', 'running')
                            }
                            if (progress >= 80) {
                                updateLogStatus('analysis', 'completed', lang === 'es' ? 'Análisis generado' : 'Analysis generated')
                                updateLogStatus('recommendations', 'running')
                            }
                            
                            return false
                        }

                        if (status === 'completed') {
                            setOverallProgress(100)
                            
                            // Mark all as completed with results
                            updateLogStatus('search', 'completed', lang === 'es' ? 'Datos del mercado obtenidos' : 'Market data gathered')
                            updateLogStatus('technical', 'completed', results.score ? `Score: ${Math.round(results.score)}%` : (lang === 'es' ? 'Completado' : 'Complete'))
                            updateLogStatus('keywords', 'completed', results.keywords ? `${results.keywords.length} keywords` : (lang === 'es' ? 'Analizados' : 'Analyzed'))
                            updateLogStatus('visibility', 'completed', results.visibility_findings?.visibility_score ? `${Math.round(results.visibility_findings.visibility_score)}%` : (lang === 'es' ? 'Medida' : 'Measured'))
                            updateLogStatus('competitors', 'completed', results.competitors ? `${results.competitors.length} ${lang === 'es' ? 'competidores' : 'competitors'}` : (lang === 'es' ? 'Identificados' : 'Identified'))
                            updateLogStatus('analysis', 'completed', lang === 'es' ? 'Análisis completo' : 'Analysis complete')
                            updateLogStatus('recommendations', 'completed', results.recommendations ? `${results.recommendations.length} ${lang === 'es' ? 'recomendaciones' : 'recommendations'}` : (lang === 'es' ? 'Preparadas' : 'Ready'))
                            
                            return true
                        }

                        if (status === 'failed') {
                            setError(lang === 'es' 
                                ? 'El análisis encontró algunos problemas, pero continuamos con los datos disponibles.' 
                                : 'Analysis encountered some issues, but we continue with available data.')
                            setOverallProgress(100)
                            
                            logs.forEach(log => {
                                if (log.status === 'pending' || log.status === 'running') {
                                    updateLogStatus(log.id, 'completed')
                                }
                            })
                            
                            return true
                        }

                        return false
                    } catch (e) {
                        console.warn('Error checking analysis status:', e)
                        return false
                    }
                }

                // Poll every 2 seconds, max 60 times (2 minutes)
                const maxPolls = 60
                let completed = false
                
                while (!completed && pollCount.current < maxPolls) {
                    completed = await checkStatus()
                    
                    if (!completed) {
                        await new Promise(resolve => setTimeout(resolve, 2000))
                    }
                }

                // If we hit the max polls, just continue anyway
                if (!completed) {
                    setOverallProgress(100)
                    logs.forEach(log => {
                        if (log.status === 'pending' || log.status === 'running') {
                            updateLogStatus(log.id, 'completed')
                        }
                    })
                }

                // Wait a moment then redirect to brand page
                setTimeout(() => {
                    router.push(`/brand/${brandId}`)
                }, 1500)

            } catch (err: any) {
                console.error('Analysis progress error:', err)
                setError(err.message || (lang === 'es' ? 'Error durante el análisis' : 'Error during analysis'))
                
                setLogs(prev => prev.map(log => 
                    log.status === 'running' ? { ...log, status: 'error' } : log
                ))
                
                // Continue anyway after a delay
                setTimeout(() => {
                    if (brandInfo.id) {
                        router.push(`/brand/${brandInfo.id}`)
                    } else {
                        router.push('/dashboard')
                    }
                }, 3000)
            }
        }

        pollAnalysisStatus()
    }, [brandInfo.id, router, lang])

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-3xl p-10 space-y-10 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                {/* Header with animated spinner */}
                <div className="text-center space-y-6">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
                        <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
                        <div className="absolute inset-2 border-4 border-b-purple-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white">
                            Analizando tu marca
                        </h2>
                        <p className="text-muted-foreground mt-2">
                            {brandInfo.title || brandInfo.domain || 'tu sitio web'}
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso del análisis</span>
                        <span className="text-primary font-medium">{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                </div>

                {/* Analysis steps */}
                <div className="space-y-2">
                    {logs.map((log) => {
                        const isRunning = log.status === 'running'
                        const isCompleted = log.status === 'completed'
                        const isError = log.status === 'error'
                        const isPending = log.status === 'pending'

                        return (
                            <div
                                key={log.id}
                                className={cn(
                                    "flex items-center gap-3 transition-all duration-500 rounded-lg p-2.5",
                                    isRunning && "bg-primary/10 border border-primary/20 scale-[1.02]",
                                    isCompleted && "bg-green-500/5 border border-green-500/10",
                                    isError && "bg-red-500/10 border border-red-500/20",
                                    isPending && "opacity-40"
                                )}
                            >
                                {/* Status Icon */}
                                <div className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                                    isRunning && "bg-primary/20 text-primary",
                                    isCompleted && "bg-green-500/20 text-green-500",
                                    isError && "bg-red-500/20 text-red-500",
                                    isPending && "bg-white/5 text-white/30"
                                )}>
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : isRunning ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isError ? (
                                        <AlertCircle className="w-4 h-4" />
                                    ) : (
                                        log.icon
                                    )}
                                </div>

                                {/* Message */}
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-sm font-medium",
                                        isRunning && "text-white",
                                        isCompleted && "text-green-400",
                                        isError && "text-red-400",
                                        isPending && "text-white/50"
                                    )}>
                                        {log.message}
                                    </p>
                                    {log.detail && (
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {log.detail}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                        <p className="text-sm text-yellow-400">
                            {error}
                        </p>
                    </div>
                )}

                {/* Footer note */}
                <p className="text-xs text-center text-muted-foreground">
                    El análisis completo puede tardar unos segundos. Los resultados aparecerán en tu dashboard.
                </p>
            </Card>
        </div>
    )
}
