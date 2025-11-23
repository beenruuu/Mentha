'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

const LOGS = [
    { message: "Making sense of the data we got…", delay: 600 },
    { message: "Checking your brand (we're very nosy)…", delay: 600 },
    { message: "Creating prompts (stuff your buyers ask)…", delay: 200 },
    { message: "Asking AI if it knows you…", delay: 1100 },
    { message: "Ranking your presence across ChatGPT, Gemini, Claude and others…", delay: 700 },
]

export default function AnalysisWizardStep() {
    const { nextStep } = useOnboarding()
    const [currentLogIndex, setCurrentLogIndex] = useState(-1)
    const [completedLogs, setCompletedLogs] = useState<number[]>([])

    useEffect(() => {
        let timeoutId: NodeJS.Timeout

        const processLogs = async () => {
            for (let i = 0; i < LOGS.length; i++) {
                setCurrentLogIndex(i)
                await new Promise(resolve => {
                    timeoutId = setTimeout(resolve, LOGS[i].delay)
                })
                setCompletedLogs(prev => [...prev, i])
            }
            // Wait a bit after the last log before moving on
            setTimeout(nextStep, 1000)
        }

        processLogs()

        return () => clearTimeout(timeoutId)
    }, [nextStep])

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-3xl p-10 space-y-12 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="text-center space-y-6">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping opacity-20 duration-3000"></div>
                        <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin duration-1000"></div>
                        <div className="absolute inset-2 border-4 border-b-purple-500/50 rounded-full animate-spin direction-reverse duration-2000"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Analyzing your brand footprint
                    </h2>
                </div>

                <div className="space-y-4">
                    {LOGS.map((log, index) => {
                        const isActive = index === currentLogIndex
                        const isCompleted = completedLogs.includes(index)
                        const isPending = index > currentLogIndex

                        if (isPending && index > currentLogIndex + 1) return null // Only show next pending

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-center gap-4 transition-all duration-500",
                                    isActive ? "opacity-100 scale-105 translate-x-2 bg-white/5 p-3 rounded-lg border border-white/10" : "opacity-40 p-2",
                                    isCompleted && "opacity-60 text-green-400"
                                )}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                ) : isActive ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-white/20 shrink-0" />
                                )}
                                <span className={cn("text-base", isActive && "font-semibold text-white")}>{log.message}</span>
                            </div>
                        )
                    })}
                </div>
            </Card>
        </div>
    )
}
