'use client'

import { useState } from 'react'
import { Network, ExternalLink, Shield, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"

interface AuthorityNexusProps {
    brandName: string
    citations?: any[]
    score?: number
}

export function AuthorityNexus({ brandName, citations = [], score = 0 }: AuthorityNexusProps) {
    // Calculate score if not provided
    const authorityScore = score || Math.round((citations.filter(c => c.status === 'present').length / Math.max(citations.length, 1)) * 100)

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Score Card */}
            <div className="md:col-span-1 space-y-4">
                <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-none shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Authority Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-purple-600">{authorityScore}</span>
                            <span className="text-sm text-muted-foreground mb-1">/ 100</span>
                        </div>
                        <Progress value={authorityScore} className="h-2 mt-3" />
                        <p className="text-xs text-muted-foreground mt-3">
                            Your brand authority is <span className="font-medium text-emerald-600">Good</span>, but missing key citations limits your AI visibility.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-none shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Citation Health</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span>Present</span>
                            <span className="font-medium text-emerald-600">{citations.filter(c => c.status === 'present').length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Missing</span>
                            <span className="font-medium text-red-600">{citations.filter(c => c.status === 'missing').length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Citations List */}
            <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Network className="w-4 h-4 text-blue-500" />
                        Citation Opportunities
                    </h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50">
                        {citations.filter(c => c.status === 'missing').length} Opportunities
                    </Badge>
                </div>

                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-3">
                        {citations.map((citation, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border rounded-lg hover:border-purple-200 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${citation.status === 'present' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <div>
                                        <div className="font-medium text-sm flex items-center gap-2">
                                            {citation.source}
                                            {citation.status === 'missing' && citation.impact === 'high' && (
                                                <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    High Impact
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            {citation.type} • DA: {citation.authority}
                                        </div>
                                    </div>
                                </div>

                                {citation.status === 'missing' ? (
                                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Get Listed <ExternalLink className="w-3 h-3" />
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                        <Shield className="w-3 h-3" /> Verified
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
