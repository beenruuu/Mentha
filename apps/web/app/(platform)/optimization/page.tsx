'use client';

import { useEffect, useState } from 'react';

import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

export default function OptimizationPage() {
    const { selectedProject } = useProject();
    const [entities, setEntities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function loadEntities() {
            setLoading(true);
            try {
                const { data } = await fetchFromApi('/kg/entities');
                setEntities(data);
            } catch (e) {
                console.error('Failed to load entities', e);
            } finally {
                setLoading(false);
            }
        }
        loadEntities();
    }, []);

    return (
        <div className="container">
            <div className="header-center">
                <button className="period-selector">
                    <span>Knowledge Graph</span>
                </button>
            </div>

            {/* Metrics Based on Entities */}
            <section className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">Entities</span>
                        <span className="metric-dot dot-blue"></span>
                    </div>
                    <div className="metric-value">{entities.length}</div>
                    <div className="metric-delta positive">Detected in KG</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">Primary Entity</span>
                        <span className="metric-dot dot-green"></span>
                    </div>
                    <div className="metric-value">
                        {entities.find((e) => e.is_primary)?.name || 'None'}
                    </div>
                    <div className="metric-delta positive">Verified</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">KG Coverage</span>
                        <span className="metric-dot dot-purple"></span>
                    </div>
                    <div className="metric-value">{entities.length > 0 ? 'High' : 'None'}</div>
                    <div className="metric-delta positive">Schema.org ready</div>
                </div>
            </section>

            {/* Content List */}
            <section
                className="kg-content"
                style={{
                    marginTop: '24px',
                    background: 'var(--bg-card)',
                    padding: '24px',
                    borderRadius: '16px',
                }}
            >
                <div className="card-header">
                    <span className="card-title">Entity Relationship Map</span>
                </div>
                <div className="table-content">
                    {loading ? (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '20px',
                                color: 'var(--text-muted)',
                            }}
                        >
                            Scanning Knowledge Graph...
                        </div>
                    ) : entities.length > 0 ? (
                        entities.map((entity) => (
                            <div key={entity.id} className="table-row">
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="table-keyword" style={{ fontWeight: 600 }}>
                                        {entity.name}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        Type: {entity.entity_type}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <button className="card-link" style={{ fontSize: '11px' }}>
                                        View Schema
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '20px',
                                color: 'var(--text-muted)',
                            }}
                        >
                            No entities detected yet.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
