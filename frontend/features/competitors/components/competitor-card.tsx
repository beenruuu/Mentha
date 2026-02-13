"use client"

import { ArrowRight, Globe, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface CompetitorCardProps {
    name: string
    domain: string
    score: number
    overlap: number
    strengths: string[]
}

export function CompetitorCard({ name, domain, score, overlap, strengths }: CompetitorCardProps) {
    return (
        <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm group">
            <CardContent className="p-0">
                <div className="p-5 border-b border-border/40 bg-secondary/10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center text-lg font-bold text-primary shadow-sm">
                                {name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">{name}</h3>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Globe className="w-3 h-3" />
                                    {domain}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-bold text-foreground">{score}%</span>
                            <span className="text-xs text-muted-foreground">Visibility</span>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Keyword Overlap</span>
                            <span className="font-medium text-foreground">{overlap}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${overlap}%` }}
                            />
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Key Strengths</p>
                        <div className="flex flex-wrap gap-2">
                            {strengths.map((strength, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    {strength}
                                </span>
                            ))}
                        </div>
                    </div>

                    <Button variant="outline" className="w-full h-8 text-xs bg-transparent border-border/40 hover:bg-secondary/50 group-hover:border-primary/30 transition-colors">
                        Analyze Head-to-Head
                        <ArrowRight className="w-3 h-3 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
