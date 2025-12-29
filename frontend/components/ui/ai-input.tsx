"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Globe, Sparkles, Send, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

interface UseAutoResizeTextareaProps {
    minHeight: number
    maxHeight?: number
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current
            if (!textarea) return

            if (reset) {
                textarea.style.height = `${minHeight}px`
                return
            }

            textarea.style.height = `${minHeight}px`
            const newHeight = Math.max(
                minHeight,
                Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
            )

            textarea.style.height = `${newHeight}px`
        },
        [minHeight, maxHeight]
    )

    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = `${minHeight}px`
        }
    }, [minHeight])

    useEffect(() => {
        const handleResize = () => adjustHeight()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [adjustHeight])

    return { textareaRef, adjustHeight }
}

const MIN_HEIGHT = 52
const MAX_HEIGHT = 180

interface AiInputProps {
    placeholder?: string
    searchPlaceholder?: string
    onSubmit?: (value: string, isSearch: boolean) => Promise<void> | void
    showSearchToggle?: boolean
    disabled?: boolean
    className?: string
}

const AnimatedPlaceholder = ({
    showSearch,
    placeholder,
    searchPlaceholder
}: {
    showSearch: boolean
    placeholder: string
    searchPlaceholder: string
}) => (
    <AnimatePresence mode="wait">
        <motion.p
            key={showSearch ? "search" : "ask"}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.1 }}
            className="pointer-events-none text-sm absolute text-muted-foreground"
        >
            {showSearch ? searchPlaceholder : placeholder}
        </motion.p>
    </AnimatePresence>
)

export function AiInput({
    placeholder = "Escribe un prompt para analizar...",
    searchPlaceholder = "Buscar en la web...",
    onSubmit,
    showSearchToggle = true,
    disabled = false,
    className
}: AiInputProps) {
    const [value, setValue] = useState("")
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: MIN_HEIGHT,
        maxHeight: MAX_HEIGHT,
    })
    const [showSearch, setShowSearch] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!value.trim() || isSubmitting || disabled) return

        setIsSubmitting(true)
        try {
            await onSubmit?.(value.trim(), showSearch)
            setValue("")
            adjustHeight(true)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className={cn("w-full py-3", className)}>
            <div className="relative max-w-2xl border rounded-2xl border-border/50 p-1 w-full mx-auto bg-background/50 backdrop-blur-sm shadow-lg">
                <div className="relative rounded-xl border border-border/30 bg-muted/30 flex flex-col overflow-hidden">
                    <div
                        className="overflow-y-auto"
                        style={{ maxHeight: `${MAX_HEIGHT}px` }}
                    >
                        <div className="relative">
                            <Textarea
                                id="ai-input"
                                value={value}
                                placeholder=""
                                disabled={disabled || isSubmitting}
                                className="w-full rounded-xl rounded-b-none px-4 py-3.5 bg-transparent border-none text-foreground resize-none focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed min-h-0 shadow-none"
                                ref={textareaRef}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSubmit()
                                    }
                                }}
                                onChange={(e) => {
                                    setValue(e.target.value)
                                    adjustHeight()
                                }}
                            />
                            {!value && (
                                <div className="absolute left-4 top-3.5">
                                    <AnimatedPlaceholder
                                        showSearch={showSearch}
                                        placeholder={placeholder}
                                        searchPlaceholder={searchPlaceholder}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-12 bg-muted/50 rounded-b-xl border-t border-border/20">
                        <div className="absolute left-3 bottom-2.5 flex items-center gap-2">
                            {/* AI Sparkle indicator */}
                            <div className="rounded-full p-2 bg-primary/10 text-primary">
                                <Sparkles className="w-4 h-4" />
                            </div>

                            {/* Search toggle */}
                            {showSearchToggle && (
                                <button
                                    type="button"
                                    onClick={() => setShowSearch(!showSearch)}
                                    disabled={disabled || isSubmitting}
                                    className={cn(
                                        "rounded-full transition-all flex items-center gap-2 px-2 py-1.5 border h-8",
                                        showSearch
                                            ? "bg-primary/15 border-primary text-primary"
                                            : "bg-muted border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                    )}
                                >
                                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                        <motion.div
                                            animate={{
                                                rotate: showSearch ? 180 : 0,
                                                scale: showSearch ? 1.1 : 1,
                                            }}
                                            whileHover={{
                                                rotate: showSearch ? 180 : 15,
                                                scale: 1.1,
                                                transition: {
                                                    type: "spring",
                                                    stiffness: 300,
                                                    damping: 10,
                                                },
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 260,
                                                damping: 25,
                                            }}
                                        >
                                            <Globe
                                                className={cn(
                                                    "w-4 h-4",
                                                    showSearch ? "text-primary" : "text-inherit"
                                                )}
                                            />
                                        </motion.div>
                                    </div>
                                    <AnimatePresence>
                                        {showSearch && (
                                            <motion.span
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{
                                                    width: "auto",
                                                    opacity: 1,
                                                }}
                                                exit={{ width: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-xs font-medium overflow-hidden whitespace-nowrap text-primary flex-shrink-0"
                                            >
                                                Web
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>
                            )}
                        </div>

                        <div className="absolute right-3 bottom-2.5">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!value.trim() || disabled || isSubmitting}
                                className={cn(
                                    "rounded-full p-2 transition-all duration-200",
                                    value.trim() && !disabled && !isSubmitting
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                                        : "bg-muted text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AiInput
