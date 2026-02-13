"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, CheckCircle2, XCircle } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ContentOptimizationCardProps {
    analysis: any // Replace 'any' with proper type if available
}

export function ContentOptimizationCard({ analysis }: ContentOptimizationCardProps) {
    const { t } = useTranslations()

    // Safely access nested properties
    // Use real AEO snippet optimization data if available
    const snippetOptimization = analysis?.results?.content_analysis?.snippet_optimization
    const speakability = analysis?.results?.content_analysis?.speakability_analysis
    const snippetPotential = snippetOptimization?.quality_score ||
        (speakability?.quality_score ? speakability.quality_score * 0.9 : 45)

    // Check for optimal answer length (40-60 words) - use real data or heuristic fallback
    const avgSentenceLength = speakability?.avg_sentence_length || 0
    const hasOptimalAnswerLength = snippetOptimization?.optimal_answer_length ??
        ((avgSentenceLength > 15 && avgSentenceLength < 25) && (speakability?.flesch_reading_ease > 50))

    return (
        <Card className="border-border/50 shadow-sm rounded-xl">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        {t.contentOptimization}
                    </CardTitle>
                    <Badge variant="outline" className="font-normal text-xs">
                        {analysis ? t.analyzed : t.dashboardNoData}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* AEO Snippet Potential */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground flex items-center gap-1.5">
                            {t.snippetPotential || "Snippet Potential"}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className="w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">?</div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {t.snippetPotentialDesc || "Probability of being featured as a direct answer"}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </span>
                        <span className={cn(
                            "font-bold",
                            snippetPotential >= 80 ? "text-emerald-600" :
                                snippetPotential >= 60 ? "text-amber-600" : "text-red-600"
                        )}>
                            {Math.round(snippetPotential)}/100
                        </span>
                    </div>
                    <Progress value={snippetPotential} className="h-2" />
                </div>

                {/* Content Heuristics Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className={cn(
                        "p-3 rounded-lg border flex flex-col items-center justify-center text-center gap-1",
                        hasOptimalAnswerLength
                            ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                            : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                    )}>
                        {hasOptimalAnswerLength ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            {t.answerLength || "Answer Length"}
                        </span>
                        <span className={cn(
                            "text-xs font-medium",
                            hasOptimalAnswerLength ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                        )}>
                            {hasOptimalAnswerLength ? "40-60 words" : t.needsOptimization}
                        </span>
                    </div>

                    <div className={cn(
                        "p-3 rounded-lg border flex flex-col items-center justify-center text-center gap-1",
                        (speakability?.flesch_reading_ease || 0) > 60
                            ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                    )}>
                        <div className="text-xl font-bold text-foreground">
                            {Math.round(speakability?.flesch_reading_ease || 0)}
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            {t.readability}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {t.fleschScore}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
