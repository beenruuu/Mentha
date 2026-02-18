'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
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

interface EntityData {
    id: string;
    entity_type: string;
    name: string;
    slug: string;
    description?: string;
    url?: string;
    is_primary: boolean;
}

export default function OptimizationPage() {
    const { selectedProject } = useProject();
    const [entities, setEntities] = useState<EntityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntity, setSelectedEntity] = useState<EntityData | null>(null);
    const [jsonLd, setJsonLd] = useState<unknown>(null);

    useEffect(() => {
        async function loadEntities() {
            setLoading(true);
            try {
                const response = await fetchFromApi('/kg/entities');
                setEntities(response.data || []);
            } catch (error) {
                console.error('Failed to load entities', error);
            } finally {
                setLoading(false);
            }
        }
        loadEntities();
    }, []);

    const handleViewSchema = async (entity: EntityData) => {
        setSelectedEntity(entity);
        try {
            const response = await fetchFromApi(`/kg/entities/${entity.slug}/jsonld`);
            setJsonLd(response);
        } catch (error) {
            console.error('Failed to load JSON-LD', error);
        }
    };

    const primaryEntity = entities.find((e) => e.is_primary);

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-light text-mentha-forest dark:text-mentha-beige">
                    Knowledge Graph
                </h1>
                <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 mt-1">
                    Manage entities and optimize your structured data for AI search
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    label="Entities"
                    value={entities.length}
                    delta="Detected in KG"
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
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                        </svg>
                    }
                />
                <MetricCard
                    label="Primary Entity"
                    value={primaryEntity?.name || 'None'}
                    delta={primaryEntity ? 'Verified' : 'Not set'}
                    trend={primaryEntity ? 'up' : 'neutral'}
                    icon={
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                    }
                />
                <MetricCard
                    label="KG Coverage"
                    value={entities.length > 0 ? 'High' : 'None'}
                    delta="Schema.org ready"
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
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                    }
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Entity Relationship Map</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded animate-pulse"
                                        />
                                    ))}
                                </div>
                            ) : entities.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="font-sans text-mentha-forest/60 dark:text-mentha-beige/60 mb-4">
                                        No entities detected yet
                                    </p>
                                    <p className="font-sans text-sm text-mentha-forest/40 dark:text-mentha-beige/40">
                                        Entities are created when your content is analyzed by AI
                                        systems
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Entity Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entities.map((entity) => (
                                            <TableRow key={entity.id}>
                                                <TableCell className="font-serif">
                                                    {entity.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {entity.entity_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {entity.is_primary && (
                                                        <Badge variant="success">Primary</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewSchema(entity)}
                                                        className="font-mono text-xs text-mentha-mint hover:underline uppercase tracking-wider"
                                                    >
                                                        View Schema
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>JSON-LD Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedEntity ? (
                                <div>
                                    <p className="font-serif text-sm text-mentha-forest/70 dark:text-mentha-beige/70 mb-2">
                                        {selectedEntity.name}
                                    </p>
                                    <pre className="font-mono text-xs bg-mentha-forest/5 dark:bg-white/5 p-3 rounded-xl overflow-auto max-h-64 text-mentha-forest/80 dark:text-mentha-beige/80">
                                        {jsonLd ? JSON.stringify(jsonLd, null, 2) : 'Loading...'}
                                    </pre>
                                </div>
                            ) : (
                                <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 text-center py-8">
                                    Select an entity to view its JSON-LD schema
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
