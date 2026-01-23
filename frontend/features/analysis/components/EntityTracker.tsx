"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Loader2,
    RefreshCw,
    Package,
    Wrench,
    User,
    Sparkles,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronUp
} from "lucide-react"
import { fetchAPI } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n"

interface EntityResult {
    name: string
    type: string
    mention_count: number
    visibility_rate: number
    by_model: Record<string, { queries: number; mentions: number }>
}

interface EntityTrackingResults {
    brand_name: string
    discovered: {
        products: string[]
        services: string[]
        people: string[]
        features: string[]
    }
    tracking: {
        entities: EntityResult[]
        summary: {
            total_mentions: number
            by_type: Record<string, { count: number; visibility: number }>
        }
    } | null
}

interface EntityTrackerProps {
    brandId: string
    brandName: string
}

export function EntityTracker({ brandId, brandName }: EntityTrackerProps) {
    const [results, setResults] = useState<EntityTrackingResults | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState(false)
    const { t } = useTranslations()

    const runTracking = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchAPI<EntityTrackingResults>(`/entities/track/${brandId}`)
            setResults(data)
        } catch (e: any) {
            setError(e.message || "Error tracking entities")
        } finally {
            setLoading(false)
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "product": return <Package className="w-4 h-4 text-blue-500" />
            case "service": return <Wrench className="w-4 h-4 text-green-500" />
            case "person": return <User className="w-4 h-4 text-purple-500" />
            default: return <Sparkles className="w-4 h-4 text-amber-500" />
        }
    }

    const getVisibilityBadge = (rate: number) => {
        if (rate >= 70) {
            return <Badge className="bg-emerald-500 text-white">{rate}%</Badge>
        } else if (rate >= 40) {
            return <Badge className="bg-amber-500 text-white">{rate}%</Badge>
        } else {
            return <Badge className="bg-red-500 text-white">{rate}%</Badge>
        }
    }

    return (
        <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500" />
                            {t.entityTracking || "Entity Tracking"}
                        </CardTitle>
                        <CardDescription>
                            {t.entityTrackingDesc || "Track products, services & people visibility in AI"}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {!results && !loading && !error && (
                    <div className="text-center py-6 text-gray-500">
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{t.clickToTrack || "Click to discover and track entities"}</p>
                    </div>
                )}

                {results && (
                    <div className="space-y-4">
                        {/* Discovered Entities Summary */}
                        <div className="grid grid-cols-4 gap-2">
                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="text-lg font-bold text-blue-600">
                                    {results.discovered?.products?.length || 0}
                                </div>
                                <div className="text-[10px] text-gray-500">{t.products || "Products"}</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="text-lg font-bold text-green-600">
                                    {results.discovered?.services?.length || 0}
                                </div>
                                <div className="text-[10px] text-gray-500">{t.services || "Services"}</div>
                            </div>
                            <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <div className="text-lg font-bold text-purple-600">
                                    {results.discovered?.people?.length || 0}
                                </div>
                                <div className="text-[10px] text-gray-500">{t.people || "People"}</div>
                            </div>
                            <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <div className="text-lg font-bold text-amber-600">
                                    {results.discovered?.features?.length || 0}
                                </div>
                                <div className="text-[10px] text-gray-500">{t.features || "Features"}</div>
                            </div>
                        </div>

                        {/* Tracking Results */}
                        {results.tracking?.entities && results.tracking.entities.length > 0 && (
                            <div className="space-y-2">
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpanded(!expanded)}
                                >
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t.visibilityByEntity || "Visibility by Entity"}
                                    </h4>
                                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>

                                {expanded && (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {results.tracking.entities.map((entity, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {getTypeIcon(entity.type)}
                                                    <div>
                                                        <p className="text-sm font-medium">{entity.name}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{entity.type}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {entity.visibility_rate > 0 ? (
                                                        <Eye className="w-4 h-4 text-emerald-500" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4 text-gray-400" />
                                                    )}
                                                    {getVisibilityBadge(entity.visibility_rate)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* No entities tracked */}
                        {(!results.tracking || results.tracking.entities.length === 0) && (
                            <div className="text-center p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                                {t.noEntitiesFound || "No entities found to track"}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={runTracking}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    {loading ? t.analyzing || "Analyzing..." : t.trackEntities || "Track Entities"}
                </Button>
            </div>
        </Card>
    )
}
