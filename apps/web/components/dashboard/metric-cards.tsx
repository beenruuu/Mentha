'use client';

import { useEffect, useState } from 'react';

import { MetricCard } from '@/components/ui/metric-card';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

interface DashboardSummary {
    totalScans: number;
    visibleCount: number;
    visibilityRate: number;
    avgSentiment: number;
    period: string;
}

export function MetricCards() {
    const { selectedProject } = useProject();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedProject?.id) return;

        async function fetchData() {
            try {
                const response = await fetchFromApi(
                    `/dashboard/share-of-model?project_id=${selectedProject?.id}`,
                );
                setSummary(response.data?.summary || null);
            } catch (error) {
                console.error('Failed to fetch dashboard metrics', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [selectedProject?.id]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-32 rounded-2xl bg-mentha-forest/5 dark:bg-white/5 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    const sentimentDelta = summary?.avgSentiment
        ? summary.avgSentiment > 0.5
            ? '+Positive'
            : summary.avgSentiment < 0.3
              ? 'Needs Work'
              : 'Neutral'
        : 'N/A';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
                label="Engine Visibility"
                value={summary?.visibilityRate ? `${summary.visibilityRate}%` : '0%'}
                delta="+5%"
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
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                }
            />
            <MetricCard
                label="Total Scans"
                value={summary?.totalScans || 0}
                delta="+23"
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
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                }
            />
            <MetricCard
                label="Avg Sentiment"
                value={summary?.avgSentiment ? summary.avgSentiment.toFixed(2) : '0.00'}
                delta={sentimentDelta}
                trend={summary?.avgSentiment && summary.avgSentiment > 0.5 ? 'up' : 'neutral'}
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
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                }
            />
            <MetricCard
                label="Brand Mentions"
                value={summary?.visibleCount || 0}
                delta="+8"
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
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                }
            />
        </div>
    );
}
