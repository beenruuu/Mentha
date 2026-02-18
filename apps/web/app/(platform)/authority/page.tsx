'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

interface DomainData {
    domain: string;
    count: number;
    isBrand: boolean;
    isCompetitor: boolean;
}

interface CitationData {
    id: string;
    url: string;
    domain: string;
    title: string;
    snippet?: string;
    is_brand_domain: boolean;
    is_competitor_domain: boolean;
}

export default function AuthorityPage() {
    const { selectedProject } = useProject();
    const [domains, setDomains] = useState<DomainData[]>([]);
    const [citations, setCitations] = useState<CitationData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedProject?.id) return;

        async function loadData() {
            setLoading(true);
            try {
                const response = await fetchFromApi(
                    `/dashboard/citations?project_id=${selectedProject?.id}`,
                );
                setDomains(response.data || []);
                setCitations(response.raw || []);
            } catch (error) {
                console.error('Failed to load citations', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [selectedProject?.id]);

    const brandPresence =
        domains.length > 0
            ? Math.round((domains.filter((d) => d.isBrand).length / domains.length) * 100)
            : 0;

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-light text-mentha-forest dark:text-mentha-beige">
                    Citation Authority
                </h1>
                <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 mt-1">
                    Track how AI engines cite your brand and competitors
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    label="Total Citations"
                    value={citations.length}
                    delta="Reference links"
                    trend="up"
                    icon={
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                    }
                />
                <MetricCard
                    label="Unique Domains"
                    value={domains.length}
                    delta="Sources"
                    trend="up"
                    icon={
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                    }
                />
                <MetricCard
                    label="Brand Presence"
                    value={`${brandPresence}%`}
                    delta="Owned vs Earned"
                    trend="neutral"
                    icon={
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    }
                />
                <MetricCard
                    label="Competitor Mentions"
                    value={domains.filter((d) => d.isCompetitor).length}
                    delta="Rivals cited"
                    trend="neutral"
                    icon={
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    }
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Cited Domains</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="h-8 bg-mentha-forest/10 dark:bg-white/5 rounded animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : domains.length === 0 ? (
                            <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 text-center py-8">
                                No domains recorded yet
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {domains.slice(0, 10).map((domain) => (
                                    <div
                                        key={domain.domain}
                                        className="flex items-center justify-between py-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`w-2 h-2 rounded-full ${domain.isBrand ? 'bg-blue-500' : domain.isCompetitor ? 'bg-red-500' : 'bg-mentha-mint'}`}
                                            />
                                            <span className="font-serif text-sm text-mentha-forest dark:text-mentha-beige">
                                                {domain.domain}
                                            </span>
                                        </div>
                                        <Badge
                                            variant={
                                                domain.isBrand
                                                    ? 'brand'
                                                    : domain.isCompetitor
                                                      ? 'competitor'
                                                      : 'default'
                                            }
                                        >
                                            {domain.count}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Latest Citations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-20 bg-mentha-forest/10 dark:bg-white/5 rounded animate-pulse"
                                        />
                                    ))}
                                </div>
                            ) : citations.length === 0 ? (
                                <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 text-center py-8">
                                    No citations found yet
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {citations.slice(0, 10).map((citation) => (
                                        <div
                                            key={citation.id}
                                            className="p-4 rounded-xl bg-mentha-forest/[0.02] dark:bg-white/[0.02] border border-mentha-forest/10 dark:border-mentha-beige/10"
                                        >
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <a
                                                    href={citation.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-serif text-mentha-mint hover:underline line-clamp-1"
                                                >
                                                    {citation.title || citation.domain}
                                                </a>
                                                <span className="font-mono text-xs text-mentha-forest/50 dark:text-mentha-beige/50 whitespace-nowrap">
                                                    {citation.domain}
                                                </span>
                                            </div>
                                            {citation.snippet && (
                                                <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 italic line-clamp-2 mb-2">
                                                    &quot;{citation.snippet}&quot;
                                                </p>
                                            )}
                                            <div className="flex gap-2">
                                                {citation.is_brand_domain && (
                                                    <Badge variant="brand">Your Brand</Badge>
                                                )}
                                                {citation.is_competitor_domain && (
                                                    <Badge variant="competitor">Competitor</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
