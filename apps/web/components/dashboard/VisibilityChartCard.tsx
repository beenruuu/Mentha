'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisibilityChart } from '@/components/ui/VisibilityChart';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

interface TimelineData {
    date: string;
    scans: number;
    visible: number;
    sentiment: number;
}

export function VisibilityChartCard() {
    const { selectedProject } = useProject();
    const [timeline, setTimeline] = useState<TimelineData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedProject?.id) return;

        async function fetchData() {
            try {
                const response = await fetchFromApi(
                    `/dashboard/share-of-model?project_id=${selectedProject?.id}`,
                );
                setTimeline(response.data?.timeline || []);
            } catch (error) {
                console.error('Failed to fetch timeline data', error);
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
                    <CardTitle>Visibility Trend</CardTitle>
                </CardHeader>
                <div className="h-64 bg-mentha-forest/10 dark:bg-white/5 rounded" />
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Visibility Trend</CardTitle>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="px-3 py-1 font-mono text-xs rounded-full bg-mentha-mint/10 text-mentha-mint uppercase tracking-wider"
                    >
                        7 Days
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1 font-mono text-xs rounded-full text-mentha-forest/50 dark:text-mentha-beige/50 hover:bg-mentha-forest/5 dark:hover:bg-white/5 uppercase tracking-wider"
                    >
                        30 Days
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                {timeline.length === 0 ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60">
                            No data available yet
                        </p>
                    </div>
                ) : (
                    <div className="h-64">
                        <VisibilityChart data={timeline} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
