"use client";

import React, { useEffect, useState } from "react";
import { useProject } from "@/context/ProjectContext";

export default function SettingsPage() {
    const { selectedProject } = useProject();
    const [formData, setFormData] = useState({
        name: "",
        domain: ""
    });

    useEffect(() => {
        if (selectedProject) {
            setFormData({
                name: selectedProject.name,
                domain: selectedProject.domain
            });
        }
    }, [selectedProject]);

    return (
        <div className="container">
            <div className="header-center">
                <button className="period-selector">
                    <span>Configuration</span>
                </button>
            </div>

            <div className="settings-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
                {/* Project Settings */}
                <section className="card">
                    <div className="card-header">
                        <span className="card-title">Project Details</span>
                    </div>
                    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div className="form-group">
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Brand Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                readOnly
                                style={{ width: "100%", padding: "10px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", opacity: 0.7 }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Domain URL</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.domain}
                                readOnly
                                style={{ width: "100%", padding: "10px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", opacity: 0.7 }}
                            />
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Editing projects is coming soon to the SaaS interface. Contact support to change these values.</p>
                    </div>
                </section>

                {/* Platform Stats */}
                <section className="card">
                    <div className="card-header">
                        <span className="card-title">Instance Health</span>
                    </div>
                    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Status</span>
                            <span style={{ fontSize: '14px', color: 'var(--green)', fontWeight: 600 }}>Active</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>DB Connection</span>
                            <span style={{ fontSize: '14px', color: 'var(--green)', fontWeight: 600 }}>Connected</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
