'use client'

import React, { useState, useRef, useEffect } from "react"
import { PromptsChatInput } from "./PromptsChatInput"
import { PromptsChatMessage } from "./PromptsChatMessage"
import { cn } from "@/lib/utils"
import { MessageSquare, Sparkles } from "lucide-react"
import { fetchAPI } from "@/lib/api-client"

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

interface PromptsChatProps {
    brandId: string
    brandName: string
}

export function PromptsChat({ brandId, brandName }: PromptsChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedProviders, setSelectedProviders] = useState<string[]>(['openai', 'anthropic', 'perplexity']) // Default selection
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (message: string, providersOverride?: string[]) => {
        const providersToUse = providersOverride || selectedProviders
        const userMessageId = `user-${Date.now()}`
        const assistantMessageId = `assistant-${Date.now()}`

        console.log("Sending prompt:", message)
        console.log("Providers:", providersToUse)
        console.log("Brand ID:", brandId)

        // Add user message
        setMessages(prev => [...prev, {
            id: userMessageId,
            role: 'user',
            content: message,
            timestamp: new Date()
        }])

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

            console.log("Backend response:", results) // Debug

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
        <div className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                {messages.length === 0 ? (
                    // Empty State
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
                            "bg-primary/10 text-primary"
                        )}>
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            Consulta a los modelos de IA
                        </h3>
                        <p className="text-muted-foreground text-sm max-w-md">
                            Escribe un prompt para ver cómo responden ChatGPT, Claude, Perplexity y Gemini
                            sobre <span className="font-medium text-foreground">{brandName}</span>.
                        </p>

                        {/* Suggested Prompts */}
                        <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg">
                            {[
                                `¿Qué es ${brandName}?`,
                                `¿Cuáles son las mejores alternativas a ${brandName}?`,
                                `¿Qué opinan los usuarios de ${brandName}?`,
                            ].map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(suggestion, selectedProviders)}
                                    className={cn(
                                        "px-3 py-2 rounded-xl text-sm",
                                        "bg-secondary/50 hover:bg-secondary border border-border/50",
                                        "transition-colors"
                                    )}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Chat Messages
                    <div className="max-w-3xl mx-auto">
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
            <div className="shrink-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
                <div className="max-w-2xl mx-auto">
                    <PromptsChatInput
                        onSend={(msg, providers) => handleSend(msg, providers)}
                        isLoading={isLoading}
                        selectedProviders={selectedProviders}
                        onSelectedProvidersChange={setSelectedProviders}
                    />
                </div>
            </div>
        </div>
    )
}
