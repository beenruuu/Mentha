'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

interface TopBrand {
    name: string;
    domain?: string;
    shareOfVoice: number;
    totalMentions: number;
}

export function TopBrands() {
    const { selectedProject } = useProject();
    const [brands, setBrands] = useState<TopBrand[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedProject?.id) return;

        async function fetchData() {
            try {
                const response = await fetchFromApi(
                    `/dashboard/top-brands?project_id=${selectedProject?.id}&limit=5`,
                );
                setBrands(response.data || []);
            } catch (error) {
                console.error('Failed to fetch top brands', error);
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
                    <CardTitle>Top Brands (SOV)</CardTitle>
                </CardHeader>
                <div className="space-y-4 p-6">
                    <div className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded" />
                    <div className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded" />
                    <div className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded" />
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Brands (SOV)</CardTitle>
            </CardHeader>
            <CardContent>
                {brands.length === 0 ? (
                    <p className="text-sm text-mentha-forest/60 dark:text-mentha-beige/60 text-center py-4">
                        No competitor data yet
                    </p>
                ) : (
                    <div className="space-y-6">
                        {brands.map((brand, index) => (
                            <div key={brand.name} className="flex items-center">
                                {brand.domain ? (
                                    <div className="size-8 rounded-lg bg-mentha-mint/10 border border-mentha-mint/20 flex items-center justify-center mr-4 shadow-sm">
                                        <span className="font-mono font-semibold text-[10px] uppercase text-mentha-mint">
                                            {brand.name.substring(0, 2)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="size-8 rounded-lg bg-mentha-forest/10 dark:bg-white/10 flex items-center justify-center font-mono font-semibold text-[10px] mr-4 opacity-40">
                                        #{index + 1}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-sm">{brand.name}</span>
                                        <span className="font-mono text-xs">
                                            {brand.shareOfVoice}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-mentha-forest/10 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-mentha-sage dark:bg-mentha-beige transition-all duration-500"
                                            style={{ width: `${brand.shareOfVoice}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-mentha-forest/60 dark:text-mentha-beige/60 mt-1">
                                        {brand.totalMentions} mentions
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
