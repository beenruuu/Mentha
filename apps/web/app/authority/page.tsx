"use client";

import React, { useEffect, useState } from "react";
import { useProject } from "@/context/ProjectContext";
import { fetchFromApi } from "@/lib/api";

export default function AuthorityPage() {
    const { selectedProject } = useProject();
    const [citationData, setCitationData] = useState<{ data: any[], raw: any[] }>({ data: [], raw: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedProject?.id) return;

        async function loadCitations() {
            setLoading(true);
            try {
                const res = await fetchFromApi(`/dashboard/citations?project_id=${selectedProject!.id}`);
                setCitationData(res);
            } catch (e) {
                console.error("Failed to load citations", e);
            } finally {
                setLoading(false);
            }
        }
        loadCitations();
    }, [selectedProject?.id]);

    const { data: aggregated, raw: detailed } = citationData;

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px' }}>
            <div className="header-center">
                <button className="period-selector">
                    <span>Source Authority Detail</span>
                </button>
            </div>

            {/* Authority Metrics */}
            <section className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-header"><span className="metric-label">Total Citations</span><span className="metric-dot dot-blue"></span></div>
                    <div className="metric-value">{detailed.length}</div>
                    <div className="metric-delta positive">Reference links detected</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header"><span className="metric-label">Unique Domains</span><span className="metric-dot dot-green"></span></div>
                    <div className="metric-value">{aggregated.length}</div>
                    <div className="metric-delta positive">Authored sources</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header"><span className="metric-label">Brand Presence</span><span className="metric-dot dot-purple"></span></div>
                    <div className="metric-value">
                        {Math.round((aggregated.filter(c => c.isBrand).length / (aggregated.length || 1)) * 100)}%
                    </div>
                    <div className="metric-delta positive">Owned vs Earned</div>
                </div>
            </section>

            <div className="authority-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 2.5fr", gap: "24px" }}>
                {/* Domains Sidebar */}
                <section className="card">
                    <div className="card-header">
                        <span className="card-title">Top Cited Domains</span>
                    </div>
                    <div className="table-content" style={{ marginTop: '16px' }}>
                        {loading ? (
                            <div className="table-row">Fetching domains...</div>
                        ) : aggregated.length > 0 ? (
                            aggregated.map((c, i) => (
                                <div key={i} className="table-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.isBrand ? 'var(--blue)' : 'var(--green)' }}></div>
                                        <span className="table-keyword" style={{ fontSize: '13px', fontWeight: 600 }}>{c.domain}</span>
                                    </div>
                                    <span className="table-value" style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                        {c.count} mentions
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="table-row">No domains recorded.</div>
                        )}
                    </div>
                </section>

                {/* Detailed Citations List */}
                <section className="table-section">
                    <div className="card-header">
                        <span className="card-title">Latest Knowledge Proofs</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Citations provided by AI engines</span>
                    </div>
                    <div className="table-content">
                        {loading ? (
                            <div className="table-row">Loading citations...</div>
                        ) : detailed.length > 0 ? (
                            detailed.map((cite, i) => (
                                <div key={i} className="table-row" style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <a href={cite.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--blue)', textDecoration: 'none' }}>
                                            {cite.title || cite.domain}
                                        </a>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                                            {cite.domain}
                                        </span>
                                    </div>
                                    {cite.snippet && (
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, fontStyle: 'italic' }}>
                                            &quot;{cite.snippet}&quot;
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {cite.is_brand_domain && <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--blue)', border: '1px solid var(--blue)', padding: '1px 5px', borderRadius: '3px' }}>BRAND SOURCE</span>}
                                        {cite.is_competitor_domain && <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--red)', border: '1px solid var(--red)', padding: '1px 5px', borderRadius: '3px' }}>COMPETITOR</span>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="table-row">No detailed citations found.</div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}


