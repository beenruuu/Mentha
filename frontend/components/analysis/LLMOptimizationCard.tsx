'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BrainCircuit, MessageSquare, BookOpen, AlertCircle } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LLMOptimizationCardProps {
    analysis: any
}

export function LLMOptimizationCard({ analysis }: LLMOptimizationCardProps) {
    const { t } = useTranslations()

    // Safely extract scores with fallbacks
    const neeat = analysis?.llm_readiness?.neeat_scores || {
        notability: 0,
        experience: 0,
        expertise: 0,
        authority: 0,
        trust: 0
    }

    // Calculate average E-E-A-T score
    const eeatScore = Math.round(
        Object.values(neeat).reduce((a: any, b: any) => a + b, 0) / 5
    )

    const conversationReady = analysis?.llm_readiness?.conversation_readiness?.score || 0
    const kgCompleteness = analysis?.knowledge_graph?.completeness_score || 0

    return (
        <Card className="border-border/50 shadow-sm rounded-xl">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-purple-500" />
                        {t.llmOptimization || "LLM Intelligence"}
                    </CardTitle>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                            E-E-A-T {eeatScore}%
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* E-E-A-T Grid */}
                <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        {t.eeatSignals || "Signal Authority (E-E-A-T)"}
                    </div>
                    <div className="grid grid-cols-5 gap-1 h-24 items-end">
                        {Object.entries(neeat).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex flex-col items-center gap-1 group">
                                <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    {Math.round(value)}
                                </span>
                                <div className="w-full bg-secondary rounded-t-sm relative h-16 w-8 overflow-hidden">
                                    <div
                                        className={cn(
                                            "absolute bottom-0 w-full transition-all duration-1000",
                                            value > 80 ? "bg-emerald-500" : value > 50 ? "bg-blue-500" : "bg-amber-500"
                                        )}
                                        style={{ height: `${value}%` }}
                                    />
                                </div>
                                <span className="text-[9px] uppercase font-medium text-muted-foreground truncate w-full text-center" title={key}>
                                    {key.substring(0, 3)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Conversation Readiness */}
                    <div className="p-3 rounded-lg border bg-card/50">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">{t.conversationReady || "Chat Ready"}</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold">{Math.round(conversationReady)}%</span>
                            <Progress value={conversationReady} className="w-16 h-2 mb-1.5" />
                        </div>
                    </div>

                    {/* Knowledge Graph */}
                    <div className="p-3 rounded-lg border bg-card/50">
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-medium">{t.knowledgeGraph || "Knowledge Graph"}</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold">{Math.round(kgCompleteness)}%</span>
                            <Progress value={kgCompleteness} className="w-16 h-2 mb-1.5" />
                        </div>
                    </div>
                </div>

                {/* Recommendations specific to LLMO */}
                {analysis?.llm_readiness?.gaps?.length > 0 && (
                    <div className="pt-2 border-t border-border/40">
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mb-2">
                            <AlertCircle className="w-3 h-3" />
                            <span className="font-medium">{t.priorityFixes || "Priority Improvements"}</span>
                        </div>
                        <ul className="space-y-1">
                            {analysis.llm_readiness.gaps.slice(0, 2).map((gap: string, i: number) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <span className="mt-1 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                                    {gap}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
