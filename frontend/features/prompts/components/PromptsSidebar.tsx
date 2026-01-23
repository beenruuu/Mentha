'use client'

import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { fetchAPI } from "@/lib/api-client"
import { MessageSquare, Plus, Clock, Loader2, Sparkles } from "lucide-react"

interface PromptCheck {
    id: string
    prompt: string
    providers: string[]
    results: any[]
    created_at: string
}

interface PromptsSidebarProps {
    brandId: string
    currentCheckId: string | null
    onSelectCheck: (check: PromptCheck) => void
    onNewChat: () => void
    className?: string
}

export function PromptsSidebar({ brandId, currentCheckId, onSelectCheck, onNewChat, className }: PromptsSidebarProps) {
    const [history, setHistory] = useState<PromptCheck[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadHistory = async () => {
        try {
            setIsLoading(true)
            const data = await fetchAPI<{ checks: PromptCheck[] }>(`/prompts/${brandId}/checks?limit=50`)
            if (data.checks) {
                setHistory(data.checks)
            }
        } catch (error) {
            console.error("Error loading chat history:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Refresh history when brand changes
    useEffect(() => {
        if (brandId) {
            loadHistory()
        }
    }, [brandId])

    // Expose a refresh method if needed, or just auto-update when a new chat is created (handled by parent typically, or optimistically updated)
    // For now, we'll just rely on initial load + parent updates if we were to lift state, but simpler for now to just re-fetch or manual trigger
    // Let's add an effect to reload if we moved from "New Chat" to "History" (handled by parent causing re-render?)
    // Actually, when a new chat is sent in parent, we might want to refresh this list. 
    // We can add a simple interval or just let it be for now.

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (days === 0) {
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        } else if (days === 1) {
            return 'Ayer'
        } else {
            return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
        }
    }

    return (
        <div className={cn("flex flex-col h-full border-r bg-muted/10", className)}>
            {/* Header */}
            <div className="p-4 border-b">
                <button
                    onClick={onNewChat}
                    className={cn(
                        "w-full flex items-center gap-2 px-4 py-3 rounded-xl",
                        "bg-primary text-primary-foreground font-medium",
                        "hover:opacity-90 transition-opacity",
                        "shadow-sm"
                    )}
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Chat</span>
                </button>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 mt-2">
                    Historial
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-8 px-4 text-muted-foreground text-sm">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p>No tienes historial aún</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {history.map((check) => (
                            <button
                                key={check.id}
                                onClick={() => onSelectCheck(check)}
                                className={cn(
                                    "w-full text-left px-3 py-3 rounded-lg text-sm transition-colors",
                                    "flex items-start gap-3",
                                    "group",
                                    currentCheckId === check.id
                                        ? "bg-secondary text-foreground font-medium"
                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                )}
                            >
                                <MessageSquare className={cn(
                                    "w-4 h-4 mt-0.5 shrink-0",
                                    currentCheckId === check.id ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary/70"
                                )} />
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate pr-2">{check.prompt}</p>
                                    <span className="text-[10px] opacity-70 block mt-0.5">
                                        {formatDate(check.created_at)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}
