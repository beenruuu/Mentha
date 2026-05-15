'use client';

import { Download, FileText, ShieldCheck } from 'lucide-react';
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
import { API_BASE_URL, fetchFromApi } from '@/lib/api';

interface EntityData {
    id: string;
    entity_type: string;
    name: string;
    slug: string;
    description?: string;
    url?: string;
    is_primary: boolean;
}

interface ArtifactData {
    name: string;
    mimeType: string;
    bytes: number;
}

interface ReadinessReport {
    score: {
        url: string;
        overallScore: number;
        pillars: Record<string, number>;
        recommendations: string[];
    };
    events: Array<{
        type: string;
        severity: string;
        title: string;
        evidence: string;
        action: string;
    }>;
    artifacts: Array<{ name: string; bytes: number; status: string }>;
}

interface FrameworkAdapter {
    name: string;
    files: string[];
    instructions: string[];
}

const AEO_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, '');

export default function OptimizationPage() {
    const { selectedProject } = useProject();
    const [entities, setEntities] = useState<EntityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntity, setSelectedEntity] = useState<EntityData | null>(null);
    const [jsonLd, setJsonLd] = useState<unknown>(null);
    const [artifacts, setArtifacts] = useState<ArtifactData[]>([]);
    const [report, setReport] = useState<ReadinessReport | null>(null);
    const [adapters, setAdapters] = useState<FrameworkAdapter[]>([]);

    const loadEntities = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetchFromApi('/kg/entities');
            setEntities(response.data || []);
        } catch (error) {
            console.error('Failed to load entities', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEntities();
    }, [loadEntities]);

    useEffect(() => {
        async function loadAeoData() {
            try {
                const [artifactRes, adapterRes] = await Promise.all([
                    fetch(`${AEO_BASE_URL}/llms.txt/artifacts`),
                    fetch(`${AEO_BASE_URL}/llms.txt/adapters`),
                ]);
                if (artifactRes.ok) {
                    const data = await artifactRes.json();
                    setArtifacts(data.data || []);
                }
                if (adapterRes.ok) {
                    const data = await adapterRes.json();
                    setAdapters(data.data || []);
                }

                if (selectedProject?.domain) {
                    const reportRes = await fetch(
                        `${AEO_BASE_URL}/llms.txt/report?url=${encodeURIComponent(selectedProject.domain)}`,
                    );
                    if (reportRes.ok) {
                        const data = await reportRes.json();
                        setReport(data.data || null);
                    }
                }
            } catch (error) {
                console.error('Failed to load AEO optimization data', error);
            }
        }

        if (selectedProject?.domain) {
            loadAeoData();
        }
    }, [selectedProject?.domain]);

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
                            aria-hidden="true"
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
                            aria-hidden="true"
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
                            aria-hidden="true"
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
                <Card>
                    <CardHeader>
                        <CardTitle>AI Readiness</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-3">
                            <span className="font-serif text-5xl text-mentha-forest dark:text-mentha-beige">
                                {report?.score.overallScore ?? '--'}
                            </span>
                            <span className="pb-2 font-mono text-xs uppercase tracking-widest text-mentha-forest/50 dark:text-mentha-beige/50">
                                / 100
                            </span>
                        </div>
                        <div className="mt-4 space-y-2">
                            {Object.entries(report?.score.pillars || {}).map(([pillar, score]) => (
                                <div key={pillar}>
                                    <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-mentha-forest/50 dark:text-mentha-beige/50">
                                        <span>{pillar}</span>
                                        <span>{score}/100</span>
                                    </div>
                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-mentha-forest/10 dark:bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-mentha-mint"
                                            style={{ width: `${score}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI-readable Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a
                            href={`${AEO_BASE_URL}/llms.txt/artifacts.zip`}
                            className="mb-4 inline-flex items-center gap-2 rounded-full border border-mentha-mint/30 px-3 py-2 font-mono text-xs uppercase tracking-widest text-mentha-mint hover:bg-mentha-mint/10"
                        >
                            <Download size={14} />
                            Download ZIP
                        </a>
                        <div className="space-y-2">
                            {artifacts.map((artifact) => (
                                <a
                                    key={artifact.name}
                                    href={`${AEO_BASE_URL}/llms.txt/artifacts/${artifact.name}`}
                                    className="flex items-center justify-between rounded-xl border border-mentha-forest/10 p-2 text-sm hover:border-mentha-mint/40 dark:border-mentha-beige/10"
                                >
                                    <span className="flex items-center gap-2 font-mono text-xs">
                                        <FileText size={14} />
                                        {artifact.name}
                                    </span>
                                    <span className="text-xs text-mentha-forest/50 dark:text-mentha-beige/50">
                                        {artifact.bytes}b
                                    </span>
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Operational Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="gap-y-3">
                            {(report?.events || []).length === 0 ? (
                                <div className="flex items-center gap-2 text-sm text-mentha-forest/60 dark:text-mentha-beige/60">
                                    <ShieldCheck size={16} className="text-mentha-mint" />
                                    No active AEO events.
                                </div>
                            ) : (
                                report?.events.map((event) => (
                                    <div
                                        key={`${event.type}-${event.title}`}
                                        className="rounded-xl border border-mentha-forest/10 p-3 dark:border-mentha-beige/10"
                                    >
                                        <Badge
                                            variant={
                                                event.severity === 'high' ? 'competitor' : 'warning'
                                            }
                                        >
                                            {event.severity}
                                        </Badge>
                                        <h3 className="mt-2 font-serif text-base">{event.title}</h3>
                                        <p className="mt-1 text-xs text-mentha-forest/60 dark:text-mentha-beige/60">
                                            {event.action}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Framework Adapters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {adapters.map((adapter) => (
                            <div
                                key={adapter.name}
                                className="rounded-xl border border-mentha-forest/10 p-4 dark:border-mentha-beige/10"
                            >
                                <h3 className="font-mono text-xs uppercase tracking-widest text-mentha-mint">
                                    {adapter.name}
                                </h3>
                                <p className="mt-2 text-xs text-mentha-forest/60 dark:text-mentha-beige/60">
                                    {adapter.instructions[0]}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Entity Relationship Map</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="gap-y-3">
                                    <div className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded animate-pulse" />
                                    <div className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded animate-pulse" />
                                    <div className="h-12 bg-mentha-forest/10 dark:bg-white/5 rounded animate-pulse" />
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
