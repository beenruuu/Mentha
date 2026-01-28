"use client";

import React, { useEffect, useState } from "react";
import { useProject } from "@/context/ProjectContext";
import { fetchFromApi } from "@/lib/api";

export default function KeywordsPage() {
    const { selectedProject } = useProject();
    const [keywords, setKeywords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!selectedProject?.id) return;

        async function loadKeywords() {
            setLoading(true);
            try {
                const { data } = await fetchFromApi(`/dashboard/keywords?project_id=${selectedProject!.id}`);
                setKeywords(data);
            } catch (e) {
                console.error("Failed to load keywords", e);
            } finally {
                setLoading(false);
            }
        }
        loadKeywords();
    }, [selectedProject?.id]);

    const filteredKeywords = keywords.filter(k =>
        k.keyword.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container">
            <div className="header-center">
                <button className="period-selector">
                    <span>All Keywords</span>
                </button>
            </div>

            <div className="table-section" style={{ marginTop: "24px" }}>
                <div style={{ padding: "20px", borderBottom: "1px solid var(--border-light)" }}>
                    <input
                        type="text"
                        placeholder="Search keywords..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px",
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            color: "var(--text-primary)"
                        }}
                    />
                </div>

                <div className="table-content">
                    {loading ? (
                        <div className="table-row">Fetching your keyword database...</div>
                    ) : filteredKeywords.length > 0 ? (
                        filteredKeywords.map((kw, i) => (
                            <div className="table-row" key={kw.id || i}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="table-keyword" style={{ fontWeight: 600 }}>{kw.keyword}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        Last scanned: {kw.lastScanned ? new Date(kw.lastScanned).toLocaleDateString() : 'Never'}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="table-value" style={{ color: kw.visibilityRate > 50 ? 'var(--green)' : 'var(--text-muted)' }}>
                                        {kw.visibilityRate}% visibility
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {kw.totalScans} total scans
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="table-row">No keywords found matching your search.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
