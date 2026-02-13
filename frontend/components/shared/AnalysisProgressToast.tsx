'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, AlertCircle, X, Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchAPI } from '@/lib/api-client'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

interface AnalysisStatus {
    status: 'none' | 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    phase: string | null
    started_at: string | null
    completed_at: string | null
    has_data: boolean
    analysis_id?: string
    error_message?: string | null
}

interface AnalysisProgressToastProps {
    brandId: string
    onComplete?: () => void
    onDataAvailable?: () => void
    analysisTrigger?: number | null
}

export function AnalysisProgressToast({
    brandId,
    onComplete,
    onDataAvailable,
    analysisTrigger
}: AnalysisProgressToastProps) {
    const [status, setStatus] = useState<AnalysisStatus | null>(null)
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [lastCompletedId, setLastCompletedId] = useState<string | null>(null)
    const [isPolling, setIsPolling] = useState(false)

    const checkStatus = useCallback(async () => {
        if (dismissed) return

        try {
            const data = await fetchAPI<AnalysisStatus>(`/analysis/status/${brandId}`)
            setStatus(data)

            // Show toast if there's an active analysis
            if (data.status === 'pending' || data.status === 'processing') {
                setVisible(true)
                setDismissed(false)
                setIsPolling(true)
            } else {
                setIsPolling(false)
            }

            // Handle completion
            if (data.status === 'completed' && data.analysis_id !== lastCompletedId) {
                setLastCompletedId(data.analysis_id || null)
                setVisible(true)
                setIsPolling(false)

                // Notify parent to refresh data
                if (onComplete) {
                    onComplete()
                }
                if (onDataAvailable) {
                    onDataAvailable()
                }

                // Auto-hide after 5 seconds on completion
                setTimeout(() => {
                    setVisible(false)
                }, 5000)
            }

            // Handle failure
            if (data.status === 'failed') {
                setVisible(true)
                // Keep visible for errors until dismissed
                setIsPolling(false)
            }

        } catch (error) {
            console.error('Error checking analysis status:', error)
            setIsPolling(false)
        }
    }, [brandId, dismissed, lastCompletedId, onComplete, onDataAvailable])

    // Poll for status updates
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (isPolling) {
            // Check immediately
            checkStatus()

            // Then poll
            interval = setInterval(checkStatus, 3000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isPolling, checkStatus])

    // Start polling when trigger changes
    useEffect(() => {
        if (analysisTrigger) {
            setDismissed(false)
            setIsPolling(true)
            checkStatus()
        }
    }, [analysisTrigger, checkStatus])

    const handleDismiss = () => {
        setDismissed(true)
        setVisible(false)
    }

    const handleRefresh = () => {
        if (onDataAvailable) {
            onDataAvailable()
        }
    }

    if (!visible || !status) return null

    const isActive = status.status === 'pending' || status.status === 'processing'
    const isCompleted = status.status === 'completed'
    const isFailed = status.status === 'failed'

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={cn(
                        "fixed bottom-4 right-4 z-50",
                        "w-80 rounded-xl shadow-2xl border",
                        "bg-white dark:bg-zinc-900",
                        "border-zinc-200 dark:border-zinc-800",
                        "overflow-hidden"
                    )}
                >
                    {/* Header */}
                    <div className={cn(
                        "flex items-center justify-between px-4 py-3",
                        isActive && "bg-emerald-50 dark:bg-emerald-950/30",
                        isCompleted && "bg-green-50 dark:bg-green-950/30",
                        isFailed && "bg-red-50 dark:bg-red-950/30"
                    )}>
                        <div className="flex items-center gap-2">
                            {isActive && (
                                <div className="relative">
                                    <Loader2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                                    <div className="absolute inset-0 h-5 w-5 rounded-full bg-emerald-400/20 animate-ping" />
                                </div>
                            )}
                            {isCompleted && (
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            )}
                            {isFailed && (
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            )}
                            <span className={cn(
                                "font-semibold text-sm",
                                isActive && "text-emerald-700 dark:text-emerald-300",
                                isCompleted && "text-green-700 dark:text-green-300",
                                isFailed && "text-red-700 dark:text-red-300"
                            )}>
                                {isActive && "Analizando marca..."}
                                {isCompleted && "¡Análisis completado!"}
                                {isFailed && "Error en el análisis"}
                            </span>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <X className="h-4 w-4 text-zinc-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-4 py-3 space-y-3">
                        {isActive && (
                            <>
                                {/* Progress bar */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">{status.phase}</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                            {status.progress}%
                                        </span>
                                    </div>
                                    <Progress
                                        value={status.progress}
                                        className="h-1.5"
                                    />
                                </div>

                                {/* Info message */}
                                <p className="text-xs text-muted-foreground">
                                    El análisis puede tardar 1-3 minutos. Los datos se actualizarán automáticamente cuando termine.
                                </p>
                            </>
                        )}

                        {isCompleted && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                    <Sparkles className="h-4 w-4" />
                                    <span>Tus datos están listos</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleRefresh}
                                    className="w-full gap-2"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Actualizar vista
                                </Button>
                            </div>
                        )}

                        {isFailed && (
                            <div className="space-y-2">
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    {status.error_message || 'Hubo un problema durante el análisis. Intenta de nuevo.'}
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleDismiss}
                                    className="w-full"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Animated bottom bar for active state */}
                    {isActive && (
                        <div className="h-0.5 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500"
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                    ease: 'linear'
                                }}
                                style={{ width: '50%' }}
                            />
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
