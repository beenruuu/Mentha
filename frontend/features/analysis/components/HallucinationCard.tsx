"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, HelpCircle, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { fetchAPI } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n"

interface Claim {
    claim_text: string
    claim_type: string
    model: string
    status: "accurate" | "hallucination" | "unverified"
    confidence: number
    fact?: string
    explanation?: string
}

interface HallucinationResults {
    brand_name: string
    analyzed_at: string
    total_claims: number
    accurate: number
    hallucinations: number
    unverified: number
    accuracy_rate: number
    hallucination_rate: number
    claims: Claim[]
    summary: string
}

interface HallucinationCardProps {
    brandId: string
    brandName: string
    domain: string
}

export function HallucinationCard({ brandId, brandName, domain }: HallucinationCardProps) {
    const [results, setResults] = useState<HallucinationResults | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { t } = useTranslations()

    const runCheck = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchAPI<HallucinationResults>(`/hallucinations/check/${brandId}`)
            setResults(data)
        } catch (e: any) {
            setError(e.message || "Error checking hallucinations")
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "accurate": return <CheckCircle className="w-4 h-4 text-emerald-500" />
            case "hallucination": return <AlertTriangle className="w-4 h-4 text-red-500" />
            default: return <HelpCircle className="w-4 h-4 text-amber-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "accurate":
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{t.accurate || "Accurate"}</Badge>
            case "hallucination":
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t.hallucination || "Hallucination"}</Badge>
            default:
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{t.unverified || "Unverified"}</Badge>
        }
    }

    return (
        <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-purple-500" />
                            {t.hallucinationDetection || "Hallucination Detection"}
                        </CardTitle>
                        <CardDescription>
                            {t.hallucinationDesc || "Detect false claims about your brand in AI responses"}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {!results && !loading && !error && (
                    <div className="text-center py-6 text-gray-500">
                        <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{t.clickToAnalyze || "Click 'Check Now' to analyze AI responses for hallucinations"}</p>
                    </div>
                )}

                {results && (
                    <div className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <div className="text-2xl font-bold text-emerald-600">{results.accurate}</div>
                                <div className="text-xs text-gray-500">{t.accurate || "Accurate"}</div>
                            </div>
                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{results.hallucinations}</div>
                                <div className="text-xs text-gray-500">{t.hallucinations || "Hallucinations"}</div>
                            </div>
                            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <div className="text-2xl font-bold text-amber-600">{results.unverified}</div>
                                <div className="text-xs text-gray-500">{t.unverified || "Unverified"}</div>
                            </div>
                        </div>

                        {/* Summary Text */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                            {results.summary}
                        </div>

                        {/* Claims List */}
                        {results.claims.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t.analyzedClaims || "Analyzed Claims"}
                                </h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {results.claims.map((claim, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-lg border ${claim.status === 'hallucination'
                                                ? 'border-red-200 bg-red-50/50'
                                                : claim.status === 'accurate'
                                                    ? 'border-emerald-200 bg-emerald-50/50'
                                                    : 'border-gray-200 bg-gray-50/50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2 flex-1">
                                                    {getStatusIcon(claim.status)}
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{claim.claim_text}</p>
                                                        {claim.explanation && (
                                                            <p className="text-xs text-gray-500 mt-1">{claim.explanation}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[10px]">{claim.model}</Badge>
                                                    {getStatusBadge(claim.status)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-border/40">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={runCheck}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        {loading ? t.analyzing || "Analyzing..." : t.checkNow || "Check Now"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
