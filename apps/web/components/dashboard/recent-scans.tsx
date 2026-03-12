'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

interface ScanData {
    id: string;
    engine: string;
    query: string;
    summary?: string;
    brand_visibility: boolean;
    sentiment_score: number;
    created_at: string;
}

export function RecentScans() {
    const { selectedProject } = useProject();
    const [scans, setScans] = useState<ScanData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedProject?.id) return;

        async function fetchData() {
            try {
                const response = await fetchFromApi(
                    `/scans?project_id=${selectedProject?.id}&limit=10`,
                );
                setScans(response.data || []);
            } catch (error) {
                console.error('Failed to fetch scans', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [selectedProject?.id]);

    const engineColors: Record<string, string> = {
        perplexity: 'bg-teal-100/50 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400',
        openai: 'bg-green-100/50 text-green-700 dark:bg-green-500/20 dark:text-green-400',
        gemini: 'bg-blue-100/50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <Card className="animate-pulse">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-mentha-forest/10 dark:bg-white/5 rounded" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                {scans.length === 0 ? (
                    <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 text-center py-8">
                        No scans performed yet
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Query</TableHead>
                                <TableHead>Engine</TableHead>
                                <TableHead>Visibility</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scans.map((scan) => (
                                <TableRow key={scan.id}>
                                    <TableCell className="font-serif max-w-xs truncate">
                                        {scan.query}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono uppercase ${engineColors[scan.engine] || 'bg-mentha-forest/5 dark:bg-white/5'}`}
                                        >
                                            {scan.engine}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={scan.brand_visibility ? 'success' : 'default'}
                                        >
                                            {scan.brand_visibility ? 'Visible' : 'Not Found'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-mentha-forest/50 dark:text-mentha-beige/50">
                                        {formatTime(scan.created_at)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
