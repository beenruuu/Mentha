'use client'

import React, { useState } from "react"
import { ChevronDown, ChevronUp, Copy, Check, User } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

// Provider configuration
const AI_PROVIDERS: Record<string, { name: string; logo: string; color: string }> = {
    openai: { name: 'ChatGPT', logo: '/providers/openai.svg', color: '#10a37f' },
    anthropic: { name: 'Claude', logo: '/providers/claude-color.svg', color: '#d97706' },
    perplexity: { name: 'Perplexity', logo: '/providers/perplexity-color.svg', color: '#6366f1' },
    gemini: { name: 'Gemini', logo: '/providers/gemini-color.svg', color: '#4285f4' },
}

interface ProviderResponse {
    provider: string
    content: string
    isLoading?: boolean
    error?: string
    mentioned?: boolean
}

interface PromptsChatMessageProps {
    role: 'user' | 'assistant'
    content?: string  // For user messages
    responses?: ProviderResponse[]  // For AI responses
    timestamp?: Date
    brandName?: string
}

export function PromptsChatMessage({ role, content, responses, timestamp, brandName }: PromptsChatMessageProps) {
    const [expandedProviders, setExpandedProviders] = useState<string[]>(responses?.map(r => r.provider) || [])
    const [copiedProvider, setCopiedProvider] = useState<string | null>(null)

    const toggleProvider = (provider: string) => {
        setExpandedProviders(prev =>
            prev.includes(provider)
                ? prev.filter(p => p !== provider)
                : [...prev, provider]
        )
    }

    const toggleAll = () => {
        if (expandedProviders.length === responses?.length) {
            setExpandedProviders([])
        } else {
            setExpandedProviders(responses?.map(r => r.provider) || [])
        }
    }

    const copyToClipboard = async (text: string, provider: string) => {
        await navigator.clipboard.writeText(text)
        setCopiedProvider(provider)
        setTimeout(() => setCopiedProvider(null), 2000)
    }

    // User Message
    if (role === 'user') {
        return (
            <div className="flex justify-end mb-4">
                <div className={cn(
                    "max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md",
                    "bg-primary text-primary-foreground",
                    "shadow-sm"
                )}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                    {timestamp && (
                        <p className="text-[10px] opacity-70 mt-1.5 text-right">
                            {timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ml-2 shrink-0">
                    <User className="w-4 h-4 text-primary" />
                </div>
            </div>
        )
    }

    // AI Responses (Collapsible Accordion)
    return (
        <div className="mb-6">
            {/* Header with toggle all */}
            {responses && responses.length > 1 && (
                <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs text-muted-foreground">
                        {responses.length} respuestas de IA
                    </span>
                    <button
                        onClick={toggleAll}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                        {expandedProviders.length === responses.length ? 'Colapsar todo' : 'Expandir todo'}
                    </button>
                </div>
            )}

            {/* Response Cards */}
            <div className="space-y-2">
                {responses?.map((response) => {
                    const provider = AI_PROVIDERS[response.provider] || { name: response.provider, logo: '', color: '#666' }
                    const isExpanded = expandedProviders.includes(response.provider)

                    return (
                        <div
                            key={response.provider}
                            className={cn(
                                "rounded-xl border transition-all duration-200",
                                "bg-white dark:bg-zinc-900",
                                "border-border/50 dark:border-zinc-800",
                                isExpanded && "shadow-md",
                                response.mentioned && "ring-2 ring-primary/20"
                            )}
                        >
                            {/* Accordion Header */}
                            <button
                                onClick={() => toggleProvider(response.provider)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3",
                                    "hover:bg-secondary/30 transition-colors",
                                    "rounded-xl",
                                    isExpanded && "border-b border-border/50"
                                )}
                            >
                                {/* Provider Logo */}
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                    "bg-white dark:bg-zinc-800 border border-border/30",
                                    "shadow-sm"
                                )}>
                                    {provider.logo ? (
                                        <Image
                                            src={provider.logo}
                                            alt={provider.name}
                                            width={20}
                                            height={20}
                                            className="w-5 h-5 object-contain"
                                        />
                                    ) : (
                                        <span className="text-xs font-bold">{provider.name[0]}</span>
                                    )}
                                </div>

                                {/* Provider Name */}
                                <div className="flex-1 text-left">
                                    <span className="font-medium text-sm">{provider.name}</span>
                                    {response.mentioned && (
                                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                            Menciona a {brandName}
                                        </span>
                                    )}
                                    {response.isLoading && (
                                        <span className="ml-2 text-xs text-muted-foreground animate-pulse">
                                            Pensando...
                                        </span>
                                    )}
                                    {response.error && (
                                        <span className="ml-2 text-xs text-destructive">
                                            Error
                                        </span>
                                    )}
                                </div>

                                {/* Preview (when collapsed) */}
                                {!isExpanded && !response.isLoading && !response.error && (
                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                        {response.content.slice(0, 60)}...
                                    </span>
                                )}

                                {/* Expand Icon */}
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                            </button>

                            {/* Content (Expanded) */}
                            {isExpanded && (
                                <div className="px-4 py-3">
                                    {response.isLoading ? (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-xs">Generando respuesta...</span>
                                        </div>
                                    ) : response.error ? (
                                        <p className="text-sm text-destructive">{response.error}</p>
                                    ) : (
                                        <>
                                            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                                {response.content}
                                            </p>

                                            {/* Copy Button */}
                                            <div className="flex justify-end mt-3 pt-2 border-t border-border/30">
                                                <button
                                                    onClick={() => copyToClipboard(response.content, response.provider)}
                                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {copiedProvider === response.provider ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-primary" />
                                                            <span>Copiado</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5" />
                                                            <span>Copiar</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
