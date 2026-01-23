'use client'

import React, { useState, useRef, useEffect } from "react"
import { PromptsChatInput } from "./PromptsChatInput"
import { PromptsChatMessage } from "./PromptsChatMessage"
import { PromptsSidebar } from "./PromptsSidebar"
import { cn } from "@/lib/utils"
// import { MessageSquare, Sparkles } from "lucide-react" // Replaced by AlertTriangle and Menu
import { MessageSquare, Sparkles, AlertTriangle, Menu, Clock } from "lucide-react"
import { fetchAPI } from "@/lib/api-client"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"

interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content?: string
    responses?: {
        provider: string
        content: string
        isLoading?: boolean
        error?: string
        mentioned?: boolean
    }[]
    timestamp: Date
}

interface PromptCheck {
    id: string
    prompt: string
    providers: string[]
    results: any[]
    created_at: string
}

interface PromptsChatProps {
    brandId: string
    brandName: string
    brandDomain?: string
}

export function PromptsChat({ brandId, brandName, brandDomain }: PromptsChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    // Default: Select all providers
    const [selectedProviders, setSelectedProviders] = useState<string[]>(['openai', 'anthropic', 'perplexity', 'gemini'])

    // Sidebar state
    const [currentCheckId, setCurrentCheckId] = useState<string | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Mobile sidebar state
    const [refreshTrigger, setRefreshTrigger] = useState(0) // To trigger sidebar refresh

    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Load a specific check into chat
    const handleSelectCheck = (check: any) => {
        setCurrentCheckId(check.id)

        // Convert to chat messages
        const historyMessages: ChatMessage[] = []

        // 1. User Message
        historyMessages.push({
            id: `user-${check.id}`,
            role: 'user',
            content: check.prompt,
            timestamp: new Date(check.created_at)
        })

        // 2. Assistant Response
        if (check.results && check.results.length > 0) {
            historyMessages.push({
                id: `assistant-${check.id}`,
                role: 'assistant',
                responses: check.results.map((r: any) => ({
                    provider: r.provider,
                    content: r.content || '',
                    mentioned: r.mentioned,
                    error: r.error,
                    isLoading: false
                })),
                timestamp: new Date(check.created_at)
            })
        }

        setMessages(historyMessages)
        setIsSidebarOpen(false) // Close mobile sidebar on selection
    }

    const handleNewChat = () => {
        setCurrentCheckId(null)
        setMessages([])
        setIsSidebarOpen(false)
    }

    // Auto-refresh sidebar when a new message is sent
    const triggerSidebarRefresh = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    const handleSend = async (message: string, providersOverride?: string[]) => {
        const providersToUse = providersOverride || selectedProviders
        const userMessageId = `user-${Date.now()}`
        const assistantMessageId = `assistant-${Date.now()}`

        // Add user message immediately
        const userMsg: ChatMessage = {
            id: userMessageId,
            role: 'user',
            content: message,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])

        // Add placeholder for AI responses (loading state)
        setMessages(prev => [...prev, {
            id: assistantMessageId,
            role: 'assistant',
            responses: providersToUse.map(provider => ({
                provider,
                content: '',
                isLoading: true
            })),
            timestamp: new Date()
        }])

        setIsLoading(true)

        try {
            // Call backend to query all selected providers
            const results = await fetchAPI<{
                responses?: {
                    provider: string
                    content: string
                    mentioned: boolean
                    error?: string
                }[],
                error?: string
            }>('/prompts/debug-query', {
                method: 'POST',
                body: JSON.stringify({
                    brand_id: brandId,
                    prompt: message,
                    providers: providersToUse
                })
            })

            if (results.error && (!results.responses || results.responses.length === 0)) {
                // Backend returned specific error (e.g. No valid providers)
                throw new Error(results.error)
            }

            // Update with actual responses
            setMessages(prev => prev.map(msg => {
                if (msg.id === assistantMessageId) {
                    return {
                        ...msg,
                        responses: results.responses?.map(r => ({
                            provider: r.provider,
                            content: r.content,
                            mentioned: r.mentioned,
                            error: r.error,
                            isLoading: false
                        })) || []
                    }
                }
                return msg
            }))

            // Refresh sidebar to show new chat
            triggerSidebarRefresh()

        } catch (error) {
            console.error("Error asking AI:", error)
            const errorMessage = error instanceof Error ? error.message : 'Error al consultar el modelo'

            // Update with error state
            setMessages(prev => prev.map(msg => {
                if (msg.id === assistantMessageId) {
                    return {
                        ...msg,
                        responses: providersToUse.map(provider => ({
                            provider,
                            content: '',
                            error: errorMessage,
                            isLoading: false
                        }))
                    }
                }
                return msg
            }))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex h-full min-h-[500px] lg:min-h-0 bg-background overflow-hidden rounded-xl border border-border/50">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-56 shrink-0 h-full border-r border-border/40">
                <PromptsSidebar
                    brandId={brandId}
                    currentCheckId={currentCheckId}
                    onSelectCheck={handleSelectCheck}
                    onNewChat={handleNewChat}
                    key={refreshTrigger} // Force re-render to refresh list
                />
            </div>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetContent side="right" className="p-0 w-80">
                    <PromptsSidebar
                        brandId={brandId}
                        currentCheckId={currentCheckId}
                        onSelectCheck={handleSelectCheck}
                        onNewChat={handleNewChat}
                        key={refreshTrigger}
                    />
                </SheetContent>
            </Sheet>

            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 h-full min-w-0 bg-background/50 relative overflow-hidden">
                {/* Mobile Header - Unified and clean */}
                <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border/40 shrink-0 bg-background/80 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-2">
                        {brandDomain && (
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${brandDomain}&sz=32`}
                                alt=""
                                className="w-5 h-5 rounded-full"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                        )}
                        <span className="font-semibold text-sm truncate max-w-[150px]">{brandName}</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                        <Clock className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>
                {/* Header / Disclaimer */}
                {/* Header / Disclaimer removed as per feedback */}

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-2 scroll-smooth">
                    {messages.length === 0 ? (
                        // Empty State
                        <div className="h-full flex flex-col items-center justify-start sm:justify-center text-center p-4 pt-6 sm:pt-4 animate-in fade-in zoom-in duration-300">

                            <div className="text-muted-foreground text-xs sm:text-sm max-w-2xl leading-relaxed mb-6 text-center flex flex-col gap-2 sm:gap-3">
                                {/* Line 1: Intro + Brand */}
                                <div className="flex flex-wrap items-center justify-center gap-1.5">
                                    <span>Descubre qué saben realmente sobre</span>

                                    {/* Brand */}
                                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                                        {brandDomain && (
                                            <span className="w-4 h-4 rounded-full bg-gray-100 dark:bg-zinc-800 inline-flex items-center justify-center overflow-hidden border border-border/50">
                                                <img
                                                    src={`https://www.google.com/s2/favicons?domain=${brandDomain}&sz=32`}
                                                    alt=""
                                                    className="w-3 h-3 object-contain"
                                                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                                                />
                                            </span>
                                        )}
                                        {brandName}
                                    </span>
                                </div>

                                {/* Line 2: Providers */}
                                <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                                    <span>en</span>
                                    {/* ChatGPT */}
                                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                        <Image src="/providers/openai.svg" alt="ChatGPT" width={14} height={14} className="w-3.5 h-3.5 object-contain dark:invert" />
                                        ChatGPT,
                                    </span>

                                    {/* Claude */}
                                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                        <Image src="/providers/claude-color.svg" alt="Claude" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                                        Claude,
                                    </span>

                                    {/* Perplexity */}
                                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                        <Image src="/providers/perplexity-color.svg" alt="Perplexity" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                                        Perplexity
                                    </span>

                                    <span>y</span>

                                    {/* Gemini */}
                                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                        <Image src="/providers/gemini-color.svg" alt="Gemini" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                                        Gemini
                                    </span>
                                </div>

                                {/* Line 3: Footer context */}
                                <div className="text-[10px] sm:text-xs">
                                    basándose únicamente en su entrenamiento.
                                </div>
                            </div>

                            {/* Suggested Prompts */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                                {[
                                    `¿Qué es ${brandName}?`,
                                    `¿Cuáles son las características de ${brandName}?`,
                                    `¿Es ${brandName} confiable?`,
                                    `Comparar ${brandName} vs competidores`
                                ].map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(suggestion, selectedProviders)}
                                        className={cn(
                                            "px-4 py-3 rounded-xl text-sm text-left transition-all",
                                            "bg-secondary/40 hover:bg-secondary border border-transparent hover:border-border/50",
                                            "text-muted-foreground hover:text-foreground",
                                            "flex items-center justify-between group"
                                        )}
                                    >
                                        <span>{suggestion}</span>
                                        <MessageSquare className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Chat Messages
                        <div className="max-w-3xl mx-auto pb-4">
                            {messages.map((msg) => (
                                <PromptsChatMessage
                                    key={msg.id}
                                    role={msg.role}
                                    content={msg.content}
                                    responses={msg.responses}
                                    timestamp={msg.timestamp}
                                    brandName={brandName}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area (Fixed at Bottom) */}
                <div className="shrink-0 px-2 sm:px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent z-10 w-full max-w-4xl mx-auto">
                    <PromptsChatInput
                        onSend={(msg, providers) => handleSend(msg, providers)}
                        isLoading={isLoading}
                        selectedProviders={selectedProviders}
                        onSelectedProvidersChange={setSelectedProviders}
                    />
                    <div className="text-center mt-3 space-y-1">
                        <p className="text-[10px] text-muted-foreground/60">
                            Las respuestas de IA pueden contener errores. Verifica la información importante.
                        </p>
                        <p className="text-[10px] text-muted-foreground/50">
                            Estas respuestas se basan en el conocimiento de entrenamiento del modelo, no en búsquedas web en tiempo real.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
