"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Loader2,
    Search,
    Lightbulb,
    CheckCircle2,
    XCircle,
    Sparkles,
    TrendingUp,
    Copy,
    Plus
} from "lucide-react"
import { fetchAPI } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n"
import { toast } from "sonner"

interface PromptResult {
    prompt: string
    category: string
    effectiveness: number
    mentions: number
    tests: number
}

interface DiscoveryResults {
    brand_name: string
    prompts_tested: number
    effective_prompts: PromptResult[]
    ineffective_prompts: PromptResult[]
    effectiveness_by_category: Record<string, { rate: number; effective: number; total: number }>
    recommendations: string[]
}

interface PromptDiscoveryProps {
    brandName: string
    industry?: string
}

export function PromptDiscovery({ brandName, industry }: PromptDiscoveryProps) {
    const [results, setResults] = useState<DiscoveryResults | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [testCount, setTestCount] = useState(10)
    const { t } = useTranslations()

    const runDiscovery = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchAPI<DiscoveryResults>("/prompts/discover", {
                method: "POST",
                body: JSON.stringify({
                    brand_name: brandName,
                    industry: industry || "",
                    test_count: testCount
                })
            })
            setResults(data)
        } catch (e: any) {
            setError(e.message || "Error discovering prompts")
        } finally {
            setLoading(false)
        }
    }

    const copyPrompt = (prompt: string) => {
        navigator.clipboard.writeText(prompt)
        toast.success(t.promptCopied || "Prompt copied!")
    }

    const getCategoryBadge = (category: string) => {
        const colors: Record<string, string> = {
            direct: "bg-blue-100 text-blue-700",
            comparative: "bg-purple-100 text-purple-700",
            review: "bg-amber-100 text-amber-700",
            expert: "bg-emerald-100 text-emerald-700",
            problem_solving: "bg-rose-100 text-rose-700"
        }
        return <Badge className={colors[category] || "bg-gray-100 text-gray-700"}>{category}</Badge>
    }

    return (
        <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Search className="w-5 h-5 text-amber-500" />
                            {t.promptDiscovery || "Prompt Discovery"}
                        </CardTitle>
                        <CardDescription>
                            {t.promptDiscoveryDesc || "Discover which prompts trigger your brand in AI responses"}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm text-gray-500">{t.testPrompts || "Test prompts"}:</span>
                            <Input
                                type="number"
                                value={testCount}
                                onChange={(e) => setTestCount(parseInt(e.target.value) || 10)}
                                className="w-20"
                                min={5}
                                max={20}
                            />
                        </div>
                        <Button
                            onClick={runDiscovery}
                            disabled={loading}
                            className="bg-amber-500 hover:bg-amber-600"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Lightbulb className="w-4 h-4 mr-2" />
                            )}
                            {loading ? t.discovering || "Discovering..." : t.discover || "Discover"}
                        </Button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 rounded-lg text-red-700 text-sm">{error}</div>
                    )}

                    {!results && !loading && (
                        <div className="text-center py-8 text-gray-500">
                            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">{t.discoverInfo || "Find out which AI prompts mention your brand"}</p>
                        </div>
                    )}

                    {results && (
                        <div className="space-y-4">
                            {/* Recommendations */}
                            {results.recommendations.length > 0 && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg space-y-1">
                                    {results.recommendations.map((rec, idx) => (
                                        <p key={idx} className="text-sm">{rec}</p>
                                    ))}
                                </div>
                            )}

                            {/* Category Breakdown */}
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(results.effectiveness_by_category).map(([cat, stats]) => (
                                    <div
                                        key={cat}
                                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                                    >
                                        <span className="capitalize">{cat}</span>
                                        <span className={stats.rate >= 50 ? "text-emerald-600 font-medium" : "text-gray-500"}>
                                            {stats.rate}%
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Effective Prompts */}
                            {results.effective_prompts.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium flex items-center gap-2 text-emerald-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {t.effectivePrompts || "Effective Prompts"} ({results.effective_prompts.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {results.effective_prompts.slice(0, 5).map((p, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-200"
                                            >
                                                <div className="flex items-center gap-2 flex-1">
                                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-sm">{p.prompt}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getCategoryBadge(p.category)}
                                                    <Badge className="bg-emerald-500">{p.effectiveness}%</Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyPrompt(p.prompt)}
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ineffective Prompts */}
                            {results.ineffective_prompts.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium flex items-center gap-2 text-gray-500">
                                        <XCircle className="w-4 h-4" />
                                        {t.ineffectivePrompts || "Low Visibility Prompts"} ({results.ineffective_prompts.length})
                                    </h4>
                                    <div className="space-y-1">
                                        {results.ineffective_prompts.slice(0, 3).map((p, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-500"
                                            >
                                                <span>{p.prompt}</span>
                                                <Badge variant="outline">{p.effectiveness}%</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
