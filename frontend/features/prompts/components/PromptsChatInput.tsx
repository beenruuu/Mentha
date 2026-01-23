'use client'

import React, { useState, useRef, useEffect } from "react"
import { ArrowUp, ChevronDown, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

// Provider configuration with logos
const AI_PROVIDERS = [
    { id: 'openai', name: 'ChatGPT', logo: '/providers/openai.svg', color: '#10a37f' },
    { id: 'anthropic', name: 'Claude', logo: '/providers/claude-color.svg', color: '#d97706' },
    { id: 'perplexity', name: 'Perplexity', logo: '/providers/perplexity-color.svg', color: '#6366f1' },
    { id: 'gemini', name: 'Gemini', logo: '/providers/gemini-color.svg', color: '#4285f4' },
]

interface PromptsChatInputProps {
    onSend: (message: string, providers: string[]) => void
    isLoading?: boolean
    disabled?: boolean
    selectedProviders: string[]
    onSelectedProvidersChange: (providers: string[]) => void
}

export function PromptsChatInput({
    onSend,
    isLoading = false,
    disabled = false,
    selectedProviders,
    onSelectedProvidersChange
}: PromptsChatInputProps) {
    const [message, setMessage] = useState("")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px"
        }
    }, [message])

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const toggleProvider = (providerId: string) => {
        if (selectedProviders.includes(providerId)) {
            // Don't allow deselecting all
            if (selectedProviders.length === 1) return
            onSelectedProvidersChange(selectedProviders.filter(id => id !== providerId))
        } else {
            onSelectedProvidersChange([...selectedProviders, providerId])
        }
    }

    const selectAll = () => {
        onSelectedProvidersChange(AI_PROVIDERS.map(p => p.id))
    }

    const handleSend = () => {
        if (!message.trim() || selectedProviders.length === 0 || isLoading) return
        onSend(message.trim(), selectedProviders)
        setMessage("")
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const hasContent = message.trim().length > 0

    // Get display text for button
    const getProviderDisplay = () => {
        if (selectedProviders.length === AI_PROVIDERS.length) {
            return "Todos"
        }
        if (selectedProviders.length === 1) {
            return AI_PROVIDERS.find(p => p.id === selectedProviders[0])?.name || ""
        }
        return `${selectedProviders.length} modelos`
    }

    return (
        <div className="relative w-full">
            {/* Main Container */}
            <div className={cn(
                "flex flex-col rounded-2xl border transition-all duration-200",
                "bg-white dark:bg-zinc-900",
                "border-border/50 dark:border-zinc-800",
                "shadow-lg hover:shadow-xl focus-within:shadow-xl",
                "focus-within:border-primary/30"
            )}>
                <div className="flex flex-col px-4 pt-4 pb-3 gap-3">
                    {/* Textarea */}
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="¿Qué quieres preguntar a los modelos de IA?"
                            disabled={disabled || isLoading}
                            className={cn(
                                "w-full bg-transparent border-0 outline-none resize-none",
                                "text-foreground text-[15px] placeholder:text-muted-foreground/60",
                                "leading-relaxed min-h-[24px] max-h-[200px]",
                                "disabled:opacity-50"
                            )}
                            rows={1}
                        />
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-3">
                        {/* Model Selector */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                disabled={isLoading}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm",
                                    "bg-secondary/50 hover:bg-secondary",
                                    "border border-border/50",
                                    "transition-colors",
                                    isDropdownOpen && "bg-secondary border-primary/30"
                                )}
                            >
                                {/* Provider Avatars Stack */}
                                <div className="flex -space-x-1.5">
                                    {selectedProviders.slice(0, 3).map((providerId) => {
                                        const provider = AI_PROVIDERS.find(p => p.id === providerId)
                                        if (!provider) return null
                                        return (
                                            <div
                                                key={providerId}
                                                className="w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center overflow-hidden"
                                            >
                                                <Image
                                                    src={provider.logo}
                                                    alt={provider.name}
                                                    width={14}
                                                    height={14}
                                                    className={cn(
                                                        "w-3.5 h-3.5 object-contain",
                                                        provider.id === 'openai' && "dark:invert"
                                                    )}
                                                />
                                            </div>
                                        )
                                    })}
                                    {selectedProviders.length > 3 && (
                                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                            +{selectedProviders.length - 3}
                                        </div>
                                    )}
                                </div>
                                <span className="text-muted-foreground font-medium">{getProviderDisplay()}</span>
                                <ChevronDown className={cn(
                                    "w-4 h-4 text-muted-foreground transition-transform",
                                    isDropdownOpen && "rotate-180"
                                )} />
                            </button>

                            {/* Dropdown */}
                            {isDropdownOpen && (
                                <div className={cn(
                                    "absolute bottom-full left-0 mb-2 w-64",
                                    "bg-white dark:bg-zinc-900 border border-border/50 dark:border-zinc-800",
                                    "rounded-xl shadow-xl overflow-hidden z-50",
                                    "animate-in fade-in slide-in-from-bottom-2 duration-200"
                                )}>
                                    <div className="p-2">
                                        {/* Select All */}
                                        <button
                                            onClick={selectAll}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 rounded-lg",
                                                "hover:bg-secondary/50 transition-colors text-sm",
                                                selectedProviders.length === AI_PROVIDERS.length && "bg-primary/5"
                                            )}
                                        >
                                            <span className="font-medium">Todos los modelos</span>
                                            {selectedProviders.length === AI_PROVIDERS.length && (
                                                <Check className="w-4 h-4 text-primary" />
                                            )}
                                        </button>

                                        <div className="h-px bg-border/50 my-1" />

                                        {/* Individual Providers */}
                                        {AI_PROVIDERS.map((provider) => (
                                            <button
                                                key={provider.id}
                                                onClick={() => toggleProvider(provider.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                                                    "hover:bg-secondary/50 transition-colors",
                                                    selectedProviders.includes(provider.id) && "bg-primary/5"
                                                )}
                                            >
                                                <div className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 border border-border/30 flex items-center justify-center">
                                                    <Image
                                                        src={provider.logo}
                                                        alt={provider.name}
                                                        width={18}
                                                        height={18}
                                                        className={cn(
                                                            "w-4 h-4 object-contain",
                                                            provider.id === 'openai' && "dark:invert"
                                                        )}
                                                    />
                                                </div>
                                                <span className="flex-1 text-left text-sm font-medium">{provider.name}</span>
                                                {selectedProviders.includes(provider.id) && (
                                                    <Check className="w-4 h-4 text-primary" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={!hasContent || selectedProviders.length === 0 || isLoading || disabled}
                            className={cn(
                                "flex items-center justify-center w-9 h-9 rounded-xl transition-all",
                                hasContent && !isLoading
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ArrowUp className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    )
}
