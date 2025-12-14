"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Image, Copy, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface VisualOpportunity {
    type: string
    location: string
    context: string
    suggested_prompt: string
    reason: string
}

interface VisualOpportunitiesCardProps {
    opportunities: VisualOpportunity[]
}

export function VisualOpportunitiesCard({ opportunities }: VisualOpportunitiesCardProps) {
    if (!opportunities || opportunities.length === 0) return null

    const handleCopyPrompt = (prompt: string) => {
        navigator.clipboard.writeText(prompt)
        toast.success("Prompt copied to clipboard!")
    }

    return (
        <Card className="h-full border-border/50 shadow-sm rounded-xl border-l-4 border-l-yellow-500">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-yellow-500" />
                    <CardTitle>SGE Visual Opportunities</CardTitle>
                </div>
                <CardDescription>
                    Add these visuals to improve your chances of appearing in AI snapshots.
                    Prompts optimized for <strong>Nano Banana</strong> (Gemini 2.5 Flash Image).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {opportunities.map((opp, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border/50 space-y-3">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="bg-background">
                                {opp.location || "General Section"}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                Missing Visual
                            </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                            "{opp.context}"
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Sparkles className="h-3 w-3 text-yellow-500" />
                                <span>Suggested Prompt (Nano Banana):</span>
                            </div>
                            <div className="relative group">
                                <div className="p-3 bg-background border rounded-md text-sm font-mono text-muted-foreground pr-10">
                                    {opp.suggested_prompt}
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleCopyPrompt(opp.suggested_prompt)}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
