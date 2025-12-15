"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, ShieldCheck } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

interface ContentOptimizationCardProps {
    analysis: any // Replace 'any' with proper type if available
}

export function ContentOptimizationCard({ analysis }: ContentOptimizationCardProps) {
    const { t } = useTranslations()
    return (
        <Card className="border-border/50 shadow-sm rounded-xl">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    {t.contentOptimization}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {analysis?.results?.content_analysis?.speakability_analysis ? (
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">{t.speakabilityScore}</span>
                                <span className={`font-medium ${analysis.results.content_analysis.speakability_analysis.quality_score >= 80 ? 'text-emerald-600' :
                                    analysis.results.content_analysis.speakability_analysis.quality_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {analysis.results.content_analysis.speakability_analysis.quality_score >= 80 ? t.excellent :
                                        analysis.results.content_analysis.speakability_analysis.quality_score >= 50 ? t.good : t.needsWork}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className={`h-full w-full transition-all duration-1000 ${analysis.results.content_analysis.speakability_analysis.quality_score >= 80 ? 'bg-emerald-500' :
                                        analysis.results.content_analysis.speakability_analysis.quality_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${analysis.results.content_analysis.speakability_analysis.quality_score}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="flex flex-col gap-1 p-2 bg-secondary/30 rounded-lg">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.readingEase}</span>
                                <span className="text-sm font-semibold">
                                    {Math.round(analysis.results.content_analysis.speakability_analysis.flesch_reading_ease)}
                                    <span className="text-xs font-normal text-muted-foreground ml-1">/ 100</span>
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 p-2 bg-secondary/30 rounded-lg">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.sentenceLen}</span>
                                <span className="text-sm font-semibold">
                                    {Math.round(analysis.results.content_analysis.speakability_analysis.avg_sentence_length)}
                                    <span className="text-xs font-normal text-muted-foreground ml-1">{t.words}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted-foreground text-xs">
                        {t.noContentAnalysis}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
