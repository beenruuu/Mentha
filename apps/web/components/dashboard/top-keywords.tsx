'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

interface KeywordData {
    id: string;
    keyword: string;
    visibilityRate: number;
    lastScanned: string;
    intent?: string;
    scan_frequency?: string;
    engines?: string[];
    totalScans: number;
    avgSentiment?: number;
}

export function TopKeywords() {
    const { selectedProject } = useProject();
    const [keywords, setKeywords] = useState<KeywordData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedProject?.id) return;

        async function fetchData() {
            try {
                const response = await fetchFromApi(
                    `/dashboard/keywords?project_id=${selectedProject?.id}&limit=5`,
                );
                setKeywords(response.data || []);
            } catch (error) {
                console.error('Failed to fetch keywords', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [selectedProject?.id]);

    if (loading) {
        return (
            <Card className="animate-pulse">
                <CardHeader>
                    <CardTitle>Top Keywords</CardTitle>
                </CardHeader>
                <div className="gap-y-3">
                    <div className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded" />
                    <div className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded" />
                    <div className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded" />
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top Keywords</CardTitle>
                <Link
                    href="/keywords"
                    className="font-mono text-xs text-mentha-mint hover:underline uppercase tracking-wider"
                >
                    View All
                </Link>
            </CardHeader>
            <CardContent>
                {keywords.length === 0 ? (
                    <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 text-center py-8">
                        No keywords tracked yet
                    </p>
                ) : (
                    <div className="space-y-2">
                        {keywords.map((kw) => (
                            <div key={kw.id}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setExpandedId(expandedId === kw.id ? null : kw.id)
                                    }
                                    className="w-full p-3 rounded-lg hover:bg-mentha-forest/5 dark:hover:bg-white/5 transition-colors text-left border border-transparent hover:border-mentha-mint/20 cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-serif text-sm text-mentha-forest dark:text-mentha-beige truncate">
                                                {kw.keyword}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-2">
                                            <Badge
                                                variant={
                                                    kw.visibilityRate > 50 ? 'success' : 'default'
                                                }
                                            >
                                                {kw.visibilityRate}%
                                            </Badge>
                                            <span className="text-xs text-mentha-forest/40 dark:text-mentha-beige/40">
                                                {expandedId === kw.id ? '▼' : '▶'}
                                            </span>
                                        </div>
                                    </div>
                                </button>

                                {expandedId === kw.id && (
                                    <div className="ml-3 mt-2 p-3 rounded-lg bg-mentha-forest/5 dark:bg-white/5 border border-mentha-forest/10 dark:border-white/10 space-y-2 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="font-mono text-xs uppercase opacity-60">
                                                    Intent
                                                </p>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] uppercase font-mono py-0 opacity-70"
                                                >
                                                    {kw.intent || 'Info'}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="font-mono text-xs uppercase opacity-60">
                                                    Total Scans
                                                </p>
                                                <p className="font-mono text-sm text-mentha-forest/70 dark:text-mentha-beige/70">
                                                    {kw.totalScans}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-mono text-xs uppercase opacity-60">
                                                    Sentiment
                                                </p>
                                                <p className="font-mono text-sm text-mentha-forest/70 dark:text-mentha-beige/70">
                                                    {kw.avgSentiment?.toFixed(2) || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-mono text-xs uppercase opacity-60">
                                                    Last Scanned
                                                </p>
                                                <p
                                                    className="font-mono text-xs text-mentha-forest/70 dark:text-mentha-beige/70"
                                                    suppressHydrationWarning
                                                >
                                                    {kw.lastScanned
                                                        ? new Date(
                                                              kw.lastScanned,
                                                          ).toLocaleDateString()
                                                        : 'Never'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-mentha-forest/10 dark:border-white/10">
                                            <Link
                                                href={`/keywords?keyword=${encodeURIComponent(kw.keyword)}`}
                                                className="text-xs text-mentha-mint hover:underline font-mono uppercase"
                                            >
                                                View Full Details →
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
