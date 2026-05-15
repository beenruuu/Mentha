'use client';

import { useEffect, useState } from 'react';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { EngineIcon } from '@/components/ui/engine-icon';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';
import { getEngineDisplayName } from '@/lib/engines';

interface EngineData {
    total: number;
    visible: number;
    rate: number;
}

interface ByEngine {
    perplexity?: EngineData;
    openai?: EngineData;
    gemini?: EngineData;
    claude?: EngineData;
}

export function EngineBreakdown() {
    const { selectedProject } = useProject();
    const [byEngine, setByEngine] = useState<ByEngine>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedProject?.id) return;

        async function fetchData() {
            try {
                const response = await fetchFromApi(
                    `/dashboard/share-of-model?project_id=${selectedProject?.id}`,
                );
                setByEngine(response.data?.byEngine || {});
            } catch (error) {
                console.error('Failed to fetch engine breakdown', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [selectedProject?.id]);

    const engines = [
        { name: getEngineDisplayName('perplexity'), key: 'perplexity' as const, color: '#20B2AA' },
        { name: getEngineDisplayName('openai'), key: 'openai' as const, color: '#10a37f' },
        { name: getEngineDisplayName('gemini'), key: 'gemini' as const, color: '#4285f4' },
        { name: getEngineDisplayName('claude'), key: 'claude' as const, color: '#d97757' },
    ];

    if (loading) {
        return (
            <Card className="animate-pulse">
                <CardHeader>
                    <CardTitle>Engine Performance</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                    <div className="h-8 bg-mentha-forest/10 dark:bg-white/5 rounded" />
                    <div className="h-8 bg-mentha-forest/10 dark:bg-white/5 rounded" />
                    <div className="h-8 bg-mentha-forest/10 dark:bg-white/5 rounded" />
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Engine Performance</CardTitle>
            </CardHeader>
            <div className="space-y-4">
                {engines.map((engine) => {
                    const data = byEngine[engine.key];
                    const rate = data?.rate || 0;
                    const total = data?.total || 0;

                    return (
                        <div key={engine.key} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 font-sans text-mentha-forest/70 dark:text-mentha-beige/70">
                                    <span
                                        className="flex size-6 items-center justify-center rounded-lg bg-mentha-forest/5 dark:bg-mentha-mint/10"
                                        style={{ color: engine.color }}
                                    >
                                        <EngineIcon engine={engine.key} size={14} invert="auto" />
                                    </span>
                                    {engine.name}
                                </span>
                                <span className="font-mono text-xs text-mentha-forest/70 dark:text-mentha-beige/70">
                                    {rate}% ({total} scans)
                                </span>
                            </div>
                            <div className="h-2 bg-mentha-forest/5 dark:bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${rate}%`,
                                        backgroundColor: engine.color,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
