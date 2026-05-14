import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EngineIcon } from '@/components/ui/engine-icon';
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
import { getEngineDisplayName } from '@/lib/engines';

interface ScanData {
    id: string;
    engine: string;
    query: string;
    raw_response?: string;
    analysis_json?: any;
    brand_visibility: boolean;
    sentiment_score: number;
    created_at: string;
}

export function RecentScans() {
    const { selectedProject } = useProject();
    const [scans, setScans] = useState<ScanData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedScan, setExpandedScan] = useState<string | null>(null);

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
        claude: 'bg-orange-100/50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
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

    const toggleExpand = (id: string) => {
        setExpandedScan(expandedScan === id ? null : id);
    };

    if (loading) {
        return (
            <Card className="animate-pulse">
                <CardHeader>
                    <CardTitle>Recent AI Answers</CardTitle>
                </CardHeader>
                <div className="space-y-3 p-6">
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
                <CardTitle>Recent AI Answers & Competitor Mentions</CardTitle>
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
                                <TableHead>AI Engine</TableHead>
                                <TableHead>Mentioned</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scans.map((scan) => (
                                <React.Fragment key={scan.id}>
                                    <TableRow
                                        className="cursor-pointer hover:bg-mentha-forest/5 dark:hover:bg-white/5 transition-colors"
                                        onClick={() => toggleExpand(scan.id)}
                                    >
                                        <TableCell className="font-serif max-w-xs truncate">
                                            {scan.query}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <EngineIcon
                                                    engine={scan.engine}
                                                    size={14}
                                                    className="text-mentha-forest/60 dark:text-mentha-beige/60"
                                                />
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase ${engineColors[scan.engine] || 'bg-mentha-forest/5 dark:bg-white/5'}`}
                                                >
                                                    {getEngineDisplayName(scan.engine)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    scan.brand_visibility ? 'success' : 'default'
                                                }
                                            >
                                                {scan.brand_visibility ? 'Yes' : 'No'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-mentha-forest/70 dark:text-mentha-beige/70">
                                            {formatTime(scan.created_at)}
                                        </TableCell>
                                    </TableRow>
                                    {expandedScan === scan.id && (
                                        <TableRow className="bg-mentha-forest/5 dark:bg-white/5 border-b border-mentha-forest/10 dark:border-white/10">
                                            <TableCell colSpan={4} className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    <div className="md:col-span-2 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-[10px] font-bold opacity-40 uppercase tracking-widest font-mono">
                                                                Raw Answer
                                                            </h4>
                                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-mentha-forest/5 dark:bg-white/5">
                                                                <EngineIcon
                                                                    engine={scan.engine}
                                                                    size={12}
                                                                />
                                                                <span className="text-[10px] font-mono uppercase opacity-60">
                                                                    {getEngineDisplayName(
                                                                        scan.engine,
                                                                    )}{' '}
                                                                    Response
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="p-5 bg-white dark:bg-mentha-dark rounded-xl border border-mentha-forest/10 dark:border-white/10 text-[13px] max-h-80 overflow-y-auto font-sans leading-relaxed shadow-inner">
                                                            {scan.raw_response ? (
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkGfm]}
                                                                    components={{
                                                                        p: ({ children }) => (
                                                                            <p className="mb-4 last:mb-0">
                                                                                {children}
                                                                            </p>
                                                                        ),
                                                                        ul: ({ children }) => (
                                                                            <ul className="list-disc pl-4 mb-4">
                                                                                {children}
                                                                            </ul>
                                                                        ),
                                                                        ol: ({ children }) => (
                                                                            <ol className="list-decimal pl-4 mb-4">
                                                                                {children}
                                                                            </ol>
                                                                        ),
                                                                        li: ({ children }) => (
                                                                            <li className="mb-1">
                                                                                {children}
                                                                            </li>
                                                                        ),
                                                                        strong: ({ children }) => (
                                                                            <strong className="font-bold text-mentha-forest dark:text-mentha-beige">
                                                                                {children}
                                                                            </strong>
                                                                        ),
                                                                        h1: ({ children }) => (
                                                                            <h1 className="text-lg font-serif mb-2">
                                                                                {children}
                                                                            </h1>
                                                                        ),
                                                                        h2: ({ children }) => (
                                                                            <h2 className="text-md font-serif mb-2">
                                                                                {children}
                                                                            </h2>
                                                                        ),
                                                                        h3: ({ children }) => (
                                                                            <h3 className="text-sm font-serif mb-1">
                                                                                {children}
                                                                            </h3>
                                                                        ),
                                                                        table: ({ children }) => (
                                                                            <div className="overflow-x-auto mb-4">
                                                                                <table className="min-w-full divide-y divide-mentha-forest/10 border border-mentha-forest/10">
                                                                                    {children}
                                                                                </table>
                                                                            </div>
                                                                        ),
                                                                        th: ({ children }) => (
                                                                            <th className="px-3 py-2 bg-mentha-forest/5 text-left text-[10px] font-mono uppercase tracking-wider">
                                                                                {children}
                                                                            </th>
                                                                        ),
                                                                        td: ({ children }) => (
                                                                            <td className="px-3 py-2 border-t border-mentha-forest/10 text-[11px]">
                                                                                {children}
                                                                            </td>
                                                                        ),
                                                                    }}
                                                                >
                                                                    {scan.raw_response}
                                                                </ReactMarkdown>
                                                            ) : (
                                                                'No raw response recorded.'
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h4 className="text-[10px] font-bold opacity-40 uppercase tracking-widest font-mono mb-3">
                                                                Intelligence Insights
                                                            </h4>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <p className="text-[10px] opacity-60 mb-2 font-mono uppercase">
                                                                        Competitors Mentioned
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {scan.analysis_json
                                                                            ?.competitor_mentions &&
                                                                        Object.keys(
                                                                            scan.analysis_json
                                                                                .competitor_mentions,
                                                                        ).length > 0 ? (
                                                                            Object.entries(
                                                                                scan.analysis_json
                                                                                    .competitor_mentions,
                                                                            ).map(
                                                                                (
                                                                                    [
                                                                                        comp,
                                                                                        mentioned,
                                                                                    ],
                                                                                    i,
                                                                                ) =>
                                                                                    mentioned && (
                                                                                        <Badge
                                                                                            key={i}
                                                                                            variant="outline"
                                                                                            className="text-[10px] bg-white dark:bg-mentha-dark border-red-500/20 text-red-500"
                                                                                        >
                                                                                            {comp}
                                                                                        </Badge>
                                                                                    ),
                                                                            )
                                                                        ) : (
                                                                            <span className="text-xs opacity-60">
                                                                                None identified
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="pt-4 border-t border-mentha-forest/10 dark:border-white/10">
                                                                    <p className="text-[10px] opacity-60 mb-2 font-mono uppercase">
                                                                        Sentiment Score
                                                                    </p>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full transition-all duration-1000 ${scan.sentiment_score != null && scan.sentiment_score > 0.3 ? 'bg-green-500' : scan.sentiment_score != null && scan.sentiment_score < -0.3 ? 'bg-red-500' : 'bg-yellow-500'}`}
                                                                                style={{
                                                                                    width: `${(((scan.sentiment_score ?? 0) + 1) / 2) * 100}%`,
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[10px] font-mono font-bold">
                                                                            {scan.sentiment_score !=
                                                                            null
                                                                                ? (
                                                                                      scan.sentiment_score *
                                                                                      100
                                                                                  ).toFixed(0)
                                                                                : '0'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="pt-4 border-t border-mentha-forest/10 dark:border-white/10">
                                                                    <p className="text-[10px] opacity-60 mb-2 font-mono uppercase">
                                                                        Positioning
                                                                    </p>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="font-mono text-[10px] uppercase"
                                                                    >
                                                                        {scan.analysis_json
                                                                            ?.recommendation_type ||
                                                                            'N/A'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
