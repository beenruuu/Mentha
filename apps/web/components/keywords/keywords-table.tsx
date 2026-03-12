'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { AddKeywordModal } from './add-keyword-modal';

interface KeywordData {
    id: string;
    keyword: string;
    intent?: string;
    scan_frequency?: string;
    engines?: string[];
    lastScanned: string;
    totalScans: number;
    visibilityRate: number;
}

export function KeywordsTable() {
    const { selectedProject } = useProject();
    const [keywords, setKeywords] = useState<KeywordData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    const loadKeywords = async () => {
        if (!selectedProject?.id) return;

        setLoading(true);
        try {
            const response = await fetchFromApi(
                `/dashboard/keywords?project_id=${selectedProject?.id}`,
            );
            setKeywords(response.data || []);
        } catch (error) {
            console.error('Failed to fetch keywords', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadKeywords();
    }, [selectedProject?.id]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this keyword?')) return;

        try {
            await fetchFromApi(`/keywords/${id}`, { method: 'DELETE' });
            setKeywords(keywords.filter((kw) => kw.id !== id));
        } catch (error) {
            console.error('Failed to delete keyword', error);
        }
    };

    const handleKeywordAdded = () => {
        setShowAddModal(false);
        loadKeywords();
    };

    const filteredKeywords = keywords.filter((kw) =>
        kw.keyword.toLowerCase().includes(search.toLowerCase()),
    );

    const intentColors: Record<string, string> = {
        informational: 'bg-blue-100/50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        transactional: 'bg-green-100/50 text-green-700 dark:bg-green-500/20 dark:text-green-400',
        navigational: 'bg-purple-100/50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
        commercial: 'bg-orange-100/50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>All Keywords</CardTitle>
                    <Button onClick={() => setShowAddModal(true)} size="sm">
                        + Add Keyword
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search keywords..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-mentha-forest/10 dark:border-mentha-beige/10 bg-white dark:bg-mentha-dark/60 text-mentha-forest dark:text-mentha-beige font-sans placeholder:text-mentha-forest/40 dark:placeholder:text-mentha-beige/40 focus:outline-none focus:ring-2 focus:ring-mentha-mint/20"
                        />
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded animate-pulse"
                                />
                            ))}
                        </div>
                    ) : filteredKeywords.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="font-sans text-mentha-forest/60 dark:text-mentha-beige/60 mb-4">
                                {search
                                    ? 'No keywords found matching your search'
                                    : 'No keywords tracked yet'}
                            </p>
                            {!search && (
                                <Button onClick={() => setShowAddModal(true)} variant="outline">
                                    Add your first keyword
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Keyword</TableHead>
                                    <TableHead>Intent</TableHead>
                                    <TableHead>Visibility</TableHead>
                                    <TableHead>Scans</TableHead>
                                    <TableHead>Last Scanned</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredKeywords.map((kw) => (
                                    <TableRow key={kw.id}>
                                        <TableCell className="font-serif">{kw.keyword}</TableCell>
                                        <TableCell>
                                            {kw.intent && (
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono uppercase ${intentColors[kw.intent] || ''}`}
                                                >
                                                    {kw.intent}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    kw.visibilityRate > 50 ? 'success' : 'default'
                                                }
                                            >
                                                {kw.visibilityRate}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-mentha-forest/50 dark:text-mentha-beige/50">
                                            {kw.totalScans}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-mentha-forest/50 dark:text-mentha-beige/50">
                                            {kw.lastScanned
                                                ? new Date(kw.lastScanned).toLocaleDateString()
                                                : 'Never'}
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(kw.id)}
                                                className="font-sans text-sm text-red-500 hover:text-red-700"
                                            >
                                                Delete
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {showAddModal && (
                <AddKeywordModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={handleKeywordAdded}
                />
            )}
        </>
    );
}
