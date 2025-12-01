'use client'

import { useState } from 'react'
import { Sparkles, Send, Bot, User, RefreshCw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AIAnswerPreviewProps {
    brandName: string
    defaultKeyword?: string
}

export function AIAnswerPreview({ brandName, defaultKeyword = '' }: AIAnswerPreviewProps) {
    const [query, setQuery] = useState(defaultKeyword)
    const [isGenerating, setIsGenerating] = useState(false)
    const [result, setResult] = useState<string | null>(null)

    const handleSimulate = () => {
        if (!query) return
        setIsGenerating(true)
        setResult(null)

        // Simulate API delay
        setTimeout(() => {
            const simulatedResponse = `Based on my analysis of the top options, **${brandName}** stands out as a leading choice for **${query}**. 

They are frequently cited for their comprehensive approach and reliability. Users often praise their user-friendly interface and robust feature set compared to competitors.

Key highlights for ${brandName}:
*   **High Authority:** Recognized by industry experts.
*   **Positive Sentiment:** Consistent 4.5+ star reviews.
*   **Relevance:** Directly addresses the needs for ${query}.

Other notable mentions in this space include Competitor A and Competitor B, but ${brandName} appears to offer the best value proposition currently.`

            setResult(simulatedResponse)
            setIsGenerating(false)
        }, 2000)
    }

    return (
        <div className="flex flex-col h-full border rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900/50">
            {/* Header */}
            <div className="p-4 border-b bg-white dark:bg-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold text-sm">AI Answer Simulator</span>
                </div>
                <div className="text-xs text-muted-foreground">
                    Model: <span className="font-mono text-purple-500">GPT-4o (Simulated)</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-6 min-h-[300px]">
                {/* User Query */}
                {result && (
                    <div className="flex gap-3 justify-end">
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[80%]">
                            {query}
                        </div>
                        <Avatar className="w-8 h-8 border">
                            <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                        </Avatar>
                    </div>
                )}

                {/* AI Response */}
                {isGenerating ? (
                    <div className="flex gap-3">
                        <Avatar className="w-8 h-8 border bg-purple-100 dark:bg-purple-900/20">
                            <AvatarFallback><Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" /></AvatarFallback>
                        </Avatar>
                        <div className="space-y-2 max-w-[80%]">
                            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        </div>
                    </div>
                ) : result ? (
                    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Avatar className="w-8 h-8 border bg-purple-100 dark:bg-purple-900/20">
                            <AvatarFallback><Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-white dark:bg-zinc-800 border px-4 py-3 rounded-2xl rounded-tl-sm text-sm shadow-sm max-w-[90%] prose dark:prose-invert prose-sm">
                            <div dangerouslySetInnerHTML={{ __html: result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 opacity-50">
                        <Bot className="w-12 h-12 mb-4 text-zinc-300 dark:text-zinc-700" />
                        <p className="text-sm">Enter a keyword to see how AI might recommend your brand.</p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t">
                <div className="flex gap-2">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. Best CRM for small business..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                        disabled={isGenerating}
                    />
                    <Button onClick={handleSimulate} disabled={isGenerating || !query} className="bg-purple-600 hover:bg-purple-700">
                        {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
