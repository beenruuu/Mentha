'use client';

import { useEffect, useState } from 'react';

import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

export function MetricsGrid() {
    const { selectedProject } = useProject();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedProject) return;

        async function loadMetrics() {
            setLoading(true);
            try {
                const { data } = await fetchFromApi(
                    `/dashboard/share-of-model?project_id=${selectedProject?.id}`,
                );
                setMetrics(data.summary);
            } catch (e) {
                console.error('Failed to fetch metrics', e);
            } finally {
                setLoading(false);
            }
        }
        loadMetrics();
    }, [selectedProject?.id, selectedProject]);

    if (loading || !metrics) {
        return (
            <section className="metrics-grid">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="metric-card"
                        style={{
                            height: '100px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}
                    >
                        <div
                            className="skeleton"
                            style={{ width: '60%', height: '14px', borderRadius: '4px' }}
                        ></div>
                        <div
                            className="skeleton"
                            style={{ width: '40%', height: '24px', borderRadius: '4px' }}
                        ></div>
                        <div
                            className="skeleton"
                            style={{ width: '80%', height: '12px', borderRadius: '4px' }}
                        ></div>
                    </div>
                ))}
            </section>
        );
    }

    return (
        <section className="metrics-grid">
            <div className="metric-card">
                <div className="metric-header">
                    <span className="metric-label">Engine Visibility</span>
                    <span className="metric-dot dot-blue" style={{ background: '#10b982' }}></span>
                </div>
                <div className="metric-value">{metrics.visibilityRate}%</div>
                <div className="metric-delta positive">{metrics.visibleCount} instances found</div>
            </div>
            <div className="metric-card">
                <div className="metric-header">
                    <span className="metric-label">Total Scans</span>
                    <span className="metric-dot dot-green" style={{ background: '#10b982' }}></span>
                </div>
                <div className="metric-value">{metrics.totalScans}</div>
                <div className="metric-delta positive">Last {metrics.period}</div>
            </div>
            <div className="metric-card">
                <div className="metric-header">
                    <span className="metric-label">Avg Sentiment</span>
                    <span className="metric-dot dot-red"></span>
                </div>
                <div className="metric-value">{metrics.avgSentiment || '0.00'}</div>
                <div className="metric-delta positive">
                    {metrics.avgSentiment > 0 ? 'Positive' : 'Neutral'}
                </div>
            </div>
            <div className="metric-card">
                <div className="metric-header">
                    <span className="metric-label">Brand Mentions</span>
                    <span className="metric-dot dot-purple"></span>
                </div>
                <div className="metric-value">{metrics.visibleCount}</div>
                <div className="metric-delta positive">Cloud Synced</div>
            </div>
        </section>
    );
}
