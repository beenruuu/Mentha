'use client';

import { useEffect, useState } from 'react';

import { EngineIcon } from '@/components/ui/engine-icon';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

type ReportStatus = {
    status: 'empty' | 'collecting' | 'needs_connection' | 'ready_partial' | 'ready' | 'failed';
    runId: string | null;
    totalJobs: number;
    finishedJobs: number;
    completedJobs: number;
    blockedJobs: number;
    authRequiredJobs: number;
    captchaRequiredJobs: number;
    failedJobs: number;
    visibleCount: number;
    etaHours: number;
};

type ProviderConnection = {
    provider: string;
    connected: boolean;
    connecting: boolean;
    updatedAt: string | null;
    error: string | null;
};

const PROVIDERS = [
    { key: 'perplexity', label: 'Perplexity' },
    { key: 'chatgpt', label: 'ChatGPT' },
    { key: 'gemini', label: 'Gemini' },
    { key: 'claude', label: 'Claude' },
];

function statusCopy(status: ReportStatus | null) {
    if (!status || status.status === 'empty') {
        return {
            title: 'No report run yet',
            body: 'Create or trigger a scan to prepare the first AEO/GEO report.',
        };
    }
    if (status.status === 'collecting') {
        return {
            title: 'First AEO/GEO report is being prepared',
            body: `Mentha is asking every prompt across the configured providers. This can take up to ${status.etaHours} hours; results will unlock as the batch finishes.`,
        };
    }
    if (status.status === 'needs_connection') {
        return {
            title: 'Connect provider accounts to continue',
            body: 'Some providers require login or human verification before Mentha can collect reliable browser results.',
        };
    }
    if (status.status === 'ready_partial') {
        return {
            title: 'Partial report ready',
            body: 'Some provider answers are available, but one or more providers still need account connection or were blocked.',
        };
    }
    if (status.status === 'failed') {
        return {
            title: 'Report collection needs attention',
            body: 'No provider returned usable results. Connect accounts or retry later.',
        };
    }
    return {
        title: 'Report ready',
        body: 'The latest provider batch has finished and dashboard metrics are available.',
    };
}

export function ReportStatusBanner() {
    const { selectedProject } = useProject();
    const [status, setStatus] = useState<ReportStatus | null>(null);
    const [connections, setConnections] = useState<ProviderConnection[]>([]);
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedProject?.id) return;

        let cancelled = false;

        async function fetchStatus() {
            try {
                const [statusRes, connectionsRes] = await Promise.all([
                    fetchFromApi(`/dashboard/report-status?project_id=${selectedProject?.id}`),
                    fetchFromApi('/provider-connections'),
                ]);
                if (!cancelled) {
                    setStatus(statusRes.data);
                    setConnections(connectionsRes.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch report status', error);
            }
        }

        fetchStatus();
        const interval = window.setInterval(fetchStatus, 10000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [selectedProject?.id]);

    if (!selectedProject || !status || status.status === 'ready') return null;

    const copy = statusCopy(status);
    const progress =
        status.totalJobs > 0
            ? Math.min(Math.round((status.finishedJobs / status.totalJobs) * 100), 100)
            : 0;

    async function connectProvider(provider: string) {
        setLoadingProvider(provider);
        try {
            await fetchFromApi(`/provider-connections/${provider}/connect`, { method: 'POST' });
        } catch (error) {
            console.error('Failed to connect provider', error);
        } finally {
            setLoadingProvider(null);
        }
    }

    return (
        <section className="rounded-2xl border border-mentha-mint/20 bg-mentha-mint/5 p-5 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mentha-mint mb-2">
                        AEO/GEO collection
                    </p>
                    <h2 className="font-serif text-xl text-mentha-forest dark:text-mentha-beige">
                        {copy.title}
                    </h2>
                    <p className="text-sm text-mentha-forest/60 dark:text-mentha-beige/60 mt-1 max-w-2xl">
                        {copy.body}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-mono text-2xl text-mentha-forest dark:text-mentha-beige">
                        {progress}%
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-mentha-forest/40 dark:text-mentha-beige/40">
                        {status.finishedJobs}/{status.totalJobs} finished
                    </p>
                </div>
            </div>

            <div className="h-2 rounded-full bg-mentha-forest/10 dark:bg-white/10 overflow-hidden">
                <div
                    className="h-full bg-mentha-mint transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {(status.authRequiredJobs > 0 ||
                status.captchaRequiredJobs > 0 ||
                status.status === 'needs_connection') && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {PROVIDERS.map((provider) => {
                        const connection = connections.find(
                            (item) => item.provider === provider.key,
                        );
                        return (
                            <button
                                key={provider.key}
                                type="button"
                                onClick={() => connectProvider(provider.key)}
                                disabled={
                                    loadingProvider === provider.key || connection?.connecting
                                }
                                className="flex items-center justify-between gap-3 rounded-xl border border-mentha-forest/10 dark:border-mentha-beige/10 bg-white/60 dark:bg-white/5 p-3 text-left disabled:opacity-60"
                            >
                                <span className="flex items-center gap-2">
                                    <EngineIcon engine={provider.key} size={18} invert="light" />
                                    <span className="font-mono text-[10px] uppercase tracking-wider">
                                        {provider.label}
                                    </span>
                                </span>
                                <span className="font-mono text-[10px] text-mentha-forest/50 dark:text-mentha-beige/50">
                                    {connection?.connected
                                        ? 'Connected'
                                        : connection?.connecting || loadingProvider === provider.key
                                          ? 'Opening'
                                          : 'Connect'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
