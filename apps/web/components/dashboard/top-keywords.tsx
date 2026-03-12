'use client';

import Link from 'next/link';
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

interface KeywordData {
    id: string;
    keyword: string;
    lastScanned: string;
    totalScans: number;
    visibilityRate: number;
    avgSentiment: number;
}

export function TopKeywords() {
    const { selectedProject } = useProject();
    const [keywords, setKeywords] = useState<KeywordData[]>([]);
    const [loading, setLoading] = useState(true);

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
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded" />
                    ))}
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Keyword</TableHead>
                                <TableHead>Visibility</TableHead>
                                <TableHead>Scans</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {keywords.map((kw) => (
                                <TableRow key={kw.id}>
                                    <TableCell className="font-serif">{kw.keyword}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={kw.visibilityRate > 50 ? 'success' : 'default'}
                                        >
                                            {kw.visibilityRate}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-mentha-forest/50 dark:text-mentha-beige/50">
                                        {kw.totalScans}
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
