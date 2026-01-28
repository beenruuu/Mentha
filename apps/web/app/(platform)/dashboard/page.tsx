"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MetricsGrid } from "@/components/ui/MetricsGrid";
import { VisibilityChart } from "@/components/ui/VisibilityChart";
import { SentimentChart } from "@/components/ui/SentimentChart";
import { useProject } from "@/context/ProjectContext";
import { fetchFromApi } from "@/lib/api";

export default function Home() {
    const { selectedProject } = useProject();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [keywords, setKeywords] = useState<any[]>([]);
    const [scans, setScans] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedScan, setSelectedScan] = useState<any>(null);
    const [expandedKeywords, setExpandedKeywords] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!selectedProject?.id) return;

        async function loadData() {
            setLoading(true);
            try {
                const [dashRes, keyRes, scanRes] = await Promise.all([
                    fetchFromApi(`/dashboard/share-of-model?project_id=${selectedProject!.id}`),
                    fetchFromApi(`/dashboard/keywords?project_id=${selectedProject!.id}`),
                    fetchFromApi(`/scans?project_id=${selectedProject!.id}&limit=10`)
                ]);
                setDashboardData(dashRes.data);
                setKeywords(keyRes.data);
                setScans(scanRes.data);
            } catch (e) {
                console.error("Failed to load dashboard statistics", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [selectedProject?.id]);

    const toggleKeyword = (id: string) => {
        const newExpanded = new Set(expandedKeywords);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedKeywords(newExpanded);
    };

    const toggleAllKeywords = () => {
        if (expandedKeywords.size === keywords.length) {
            setExpandedKeywords(new Set());
        } else {
            setExpandedKeywords(new Set(keywords.map(kw => kw.id)));
        }
    };

    const summary = dashboardData?.summary;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px' }}>
            <MetricsGrid />

            {/* 2. Visibility Chart */}
            <div className="chart-section minimal" style={{ marginTop: '0px', marginBottom: '40px' }}>
                <div className="chart-container" style={{ height: '400px' }}>
                    {dashboardData?.timeline ? (
                        <VisibilityChart data={dashboardData.timeline} />
                    ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>No live data available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Cards Row */}
            <div className="cards-row">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Analysis Scans</span>
                        <span className="metric-dot dot-blue" style={{ background: '#10b982' }}></span>
                    </div>
                    <div className="realtime-stats">
                        <span className="realtime-number">{summary?.totalScans || 0}</span>
                        <span className="realtime-label">total scans performed</span>
                    </div>
                    <div className="mini-bars" style={{ height: '40px', marginTop: '12px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                        {dashboardData?.timeline?.map((day: any, i: number) => (
                            <div
                                key={i}
                                className="mini-bar"
                                title={`${day.scans} scans on ${day.date}`}
                                style={{
                                    flex: 1,
                                    height: `${Math.min(100, (day.scans / (Math.max(...dashboardData.timeline.map((d: any) => d.scans)) || 1)) * 100)}%`,
                                    background: '#10b982',
                                    borderRadius: '2px',
                                    opacity: 0.4 + (i * 0.1)
                                }}
                            ></div>
                        ))}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Daily scan volume (Last 7 days)</p>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Visibility Score</span>
                        <button className="card-link">View Details</button>
                    </div>
                    <div className="score-content">
                        <div className="score-circle">
                            <svg viewBox="0 0 100 100">
                                <circle className="score-bg" cx="50" cy="50" r="45"></circle>
                                <circle
                                    className="score-progress"
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    strokeDasharray="283"
                                    strokeDashoffset={283 - (2.83 * (summary?.visibilityRate || 0))}
                                    style={{ stroke: '#10b982' }}
                                ></circle>
                            </svg>
                            <div className="score-value" style={{ color: '#10b982' }}>{summary?.visibilityRate || 0}%</div>
                        </div>
                        <div className="score-info">
                            <span className="score-label">{summary?.visibilityRate > 50 ? 'Optimized' : 'Improving'}</span>
                            <span className="score-description">Based on {summary?.totalScans || 0} recent scans across AI models.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Top Keywords Table (Expandable Rows) */}
            <div className="table-section">
                <div className="table-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex' }}>
                        <button className="tab active">Top Keywords</button>
                        <button className="tab" onClick={toggleAllKeywords}>
                            {expandedKeywords.size === keywords.length ? 'Fold All' : 'Expand All'}
                        </button>
                    </div>
                    <Link href="/keywords" style={{ fontSize: '12px', color: 'var(--blue)', textDecoration: 'none', marginRight: '20px' }}>
                        View All
                    </Link>
                </div>
                <div className="table-content">
                    {loading ? (
                        <div className="table-row">Fetching keyword metrics...</div>
                    ) : keywords.length > 0 ? (
                        keywords.map((kw, i) => (
                            <div key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <div
                                    className="table-row"
                                    onClick={() => toggleKeyword(kw.id)}
                                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', transform: expandedKeywords.has(kw.id) ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
                                        <span className="table-keyword">{kw.keyword}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span className="table-value" style={{ color: kw.visibilityRate > 50 ? 'var(--green)' : 'var(--text-muted)' }}>
                                            {kw.visibilityRate}% visibility
                                        </span>
                                    </div>
                                </div>
                                {expandedKeywords.has(kw.id) && kw.latestResult && (
                                    <div style={{ padding: '0 20px 20px 44px', animation: 'fadeIn 0.3s ease' }}>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #10b982' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                    Latest AI Response ({kw.latestResult.scan_jobs?.engine})
                                                </span>
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                                    Sentiment: <strong style={{ color: kw.latestResult.sentiment_score > 0 ? 'var(--green)' : 'var(--red)' }}>{kw.latestResult.sentiment_score}</strong>
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
                                                {kw.latestResult.analysis_json?.summary || "No analysis generated for this scan."}
                                            </p>
                                            <div style={{ marginTop: '12px' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                                    Raw Output
                                                </span>
                                                <pre style={{
                                                    background: '#0a0a0a',
                                                    color: '#d1d5db',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    fontSize: '11px',
                                                    whiteSpace: 'pre-wrap',
                                                    maxHeight: '150px',
                                                    overflowY: 'auto',
                                                    fontFamily: 'monospace',
                                                    border: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    {kw.latestResult.raw_response || "No raw response captured."}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="table-row">No scan data found for this brand yet.</div>
                    )}
                </div>
            </div>

            {/* 5. NEW SECTIONS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="card" style={{ height: '320px' }}>
                    <div className="card-header">
                        <span className="card-title">Sentiment Trend</span>
                        <span className="metric-dot dot-red"></span>
                    </div>
                    <div style={{ height: '180px', marginTop: '20px' }}>
                        {dashboardData?.timeline ? (
                            <SentimentChart data={dashboardData.timeline} />
                        ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                                <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>No sentiment data</p>
                            </div>
                        )}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>AI sentiment score from -1 (Negative) to 1 (Positive)</p>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">AI Provider Breakdown</span>
                        <span className="metric-dot dot-green" style={{ background: '#10b982' }}></span>
                    </div>
                    <div className="table-content" style={{ marginTop: '16px' }}>
                        {dashboardData?.byEngine ? Object.entries(dashboardData.byEngine).map(([engine, stats]: [string, any]) => {
                            const isOpenAI = engine.toLowerCase().includes('openai');
                            const displayName = isOpenAI ? 'OpenAI' : engine.charAt(0).toUpperCase() + engine.slice(1);

                            return (
                                <div key={engine} style={{ display: 'flex', flexDirection: 'column', marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                                        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {isOpenAI && (
                                                <Image src="/OpenAI-black-monoblossom.svg" width={18} height={18} alt="OpenAI" />
                                            )}
                                            {displayName}
                                        </span>
                                        <span style={{ fontWeight: 600 }}>{stats.rate}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${stats.rate}%`, height: '100%', background: '#10b982', transition: 'width 0.5s' }}></div>
                                    </div>
                                </div>
                            );
                        }) : null}
                    </div>
                </div>
            </div>

            <div className="table-section">
                <div className="card-header">
                    <span className="card-title">Detailed Scan Logs</span>
                    <button className="card-link" onClick={() => setSelectedScan(null)}>Latest Activity</button>
                </div>
                <div className="table-content">
                    {loading ? (
                        <div className="table-row">Fetching logs...</div>
                    ) : scans.length > 0 ? (
                        scans.map((scan, i) => (
                            <div
                                key={i}
                                className="table-row-hover"
                                onClick={() => setSelectedScan(scan)}
                                style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 100px', alignItems: 'center', gap: '15px', cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{scan.scan_jobs?.engine}</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(scan.created_at).toLocaleTimeString()}</span>
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 500 }}>{scan.scan_jobs?.keywords?.query}</span>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {scan.analysis_json?.summary || "No analysis available"}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        background: scan.brand_visibility ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                        color: scan.brand_visibility ? 'var(--green)' : 'var(--red)'
                                    }}>
                                        {scan.brand_visibility ? "VISIBLE" : "ABSENT"}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="table-row">No scan logs found.</div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedScan && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setSelectedScan(null)}>
                    <div style={{ background: 'var(--bg-card)', width: '90%', maxWidth: '700px', borderRadius: '16px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid var(--border)', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Detailed Analysis</h3>
                            <button onClick={() => setSelectedScan(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>KEYWORD</p>
                                <p style={{ margin: 0, fontWeight: 600 }}>{selectedScan.scan_jobs?.keywords?.query}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>AI ANALYSIS</p>
                                <div style={{ background: 'var(--bg-secondary)', padding: '15px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6' }}>
                                    {selectedScan.analysis_json?.summary || "No analysis provided."}
                                </div>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>RAW RESPONSE</p>
                                <pre style={{ background: '#000', color: '#0f0', padding: '15px', borderRadius: '8px', fontSize: '11px', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                                    {selectedScan.raw_response}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .table-row-hover:hover {
                    background: rgba(255,255,255,0.02) !important;
                }
            `}</style>
        </div>
    );
}
