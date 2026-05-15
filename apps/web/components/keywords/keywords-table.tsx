'use client';

import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    trend?: number[];
}

export function KeywordsTable() {
    const { selectedProject } = useProject();
    const [keywords, setKeywords] = useState<KeywordData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const loadKeywords = useCallback(async () => {
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
    }, [selectedProject?.id]);

    useEffect(() => {
        loadKeywords();
    }, [loadKeywords]);

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
                            id="search-keywords"
                            name="search-keywords"
                            type="text"
                            placeholder="Search keywords..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-mentha-forest/10 dark:border-mentha-beige/10 bg-white dark:bg-mentha-dark/60 text-mentha-forest dark:text-mentha-beige font-sans placeholder:text-mentha-forest/40 dark:placeholder:text-mentha-beige/40 focus:outline-none focus:ring-2 focus:ring-mentha-mint/20"
                        />
                    </div>

                    {loading ? (
                        <div className="gap-y-3">
                            <div className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded animate-pulse" />
                            <div className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded animate-pulse" />
                            <div className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded animate-pulse" />
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
                        <div className="space-y-2">
                            {filteredKeywords.map((kw) => (
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
                                                        kw.visibilityRate > 50
                                                            ? 'success'
                                                            : 'default'
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
                                        <div className="ml-3 mt-2 p-3 rounded-lg bg-mentha-forest/5 dark:bg-white/5 border border-mentha-forest/10 dark:border-white/10 gap-y-3 text-sm">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="font-mono text-xs uppercase opacity-60">
                                                        Intent
                                                    </p>
                                                    {kw.intent && (
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] uppercase font-mono py-0 opacity-70 ${intentColors[kw.intent] || ''}`}
                                                        >
                                                            {kw.intent}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-mono text-xs uppercase opacity-60">
                                                        Frequency
                                                    </p>
                                                    <p className="font-mono text-sm text-mentha-forest/70 dark:text-mentha-beige/70 capitalize">
                                                        {kw.scan_frequency || 'Not set'}
                                                    </p>
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

                                            {kw.engines && kw.engines.length > 0 && (
                                                <div>
                                                    <p className="font-mono text-xs uppercase opacity-60 mb-2">
                                                        Neural Engines
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {kw.engines.map((engine) => (
                                                            <span
                                                                key={engine}
                                                                className="inline-flex items-center px-2 py-1 rounded-lg bg-mentha-mint/10 text-mentha-mint text-xs font-mono uppercase"
                                                            >
                                                                {engine}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-mentha-forest/10 dark:border-white/10">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(kw.id)}
                                                    className="font-sans text-sm text-red-500 hover:text-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
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
