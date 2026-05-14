'use client';

import { EngineBreakdown } from '@/components/dashboard/engine-breakdown';
import { MetricCards } from '@/components/dashboard/metric-cards';
import { RecentScans } from '@/components/dashboard/recent-scans';
import { ReportStatusBanner } from '@/components/dashboard/report-status-banner';
import { TopBrands } from '@/components/dashboard/top-brands';
import { TopKeywords } from '@/components/dashboard/top-keywords';
import { VisibilityChartCard } from '@/components/dashboard/visibility-chart-card';
import { useProject } from '@/context/ProjectContext';
import { exportToZIP } from '@/lib/export';
import { fetchFromApi } from '@/lib/api';
import { useRef, useState } from 'react';

export default function DashboardPage() {
    const { selectedProject } = useProject();
    const [isExporting, setIsExporting] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);
    const [scanMode, setScanMode] = useState<string>('browser');
    const [isScanning, setIsScanning] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleScan = async () => {
        if (!selectedProject?.id) return;
        setIsScanning(true);
        try {
            await fetchFromApi(`/scans/trigger?project_id=${selectedProject.id}&mode=${scanMode}`, {
                method: 'POST',
            });
            setShowScanModal(false);
        } catch (error) {
            console.error('Failed to trigger scan', error);
            alert('Failed to trigger scan');
        } finally {
            setIsScanning(false);
        }
    };

    const handleExport = async () => {
        if (!selectedProject?.id) return;
        setIsExporting(true);
        const baseName = `mentha-export-${selectedProject.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;

        try {
            const datasets: { data: any[]; name: string }[] = [];

            // 1. Visibility Timeline
            const shareResponse = await fetchFromApi(
                `/dashboard/share-of-model?project_id=${selectedProject.id}`,
            );
            if (shareResponse.data?.timeline) {
                datasets.push({ data: shareResponse.data.timeline, name: 'visibility-trend' });
            }

            // 2. Keyword Performance
            const keywordsResponse = await fetchFromApi(
                `/dashboard/keywords?project_id=${selectedProject.id}&limit=1000`,
            );
            if (keywordsResponse.data) {
                datasets.push({ data: keywordsResponse.data, name: 'keywords-performance' });
            }

            // 3. Citations
            const citationsResponse = await fetchFromApi(
                `/dashboard/citations?project_id=${selectedProject.id}&limit=1000`,
            );
            if (citationsResponse.data) {
                datasets.push({ data: citationsResponse.data, name: 'top-citations' });
            }

            // 4. Competitors
            const brandsResponse = await fetchFromApi(
                `/dashboard/top-brands?project_id=${selectedProject.id}&limit=100`,
            );
            if (brandsResponse.data) {
                datasets.push({ data: brandsResponse.data, name: 'competitors-analysis' });
            }

            if (datasets.length > 0) {
                await exportToZIP(datasets, baseName);
            } else {
                alert('No data available to export');
            }
        } catch (error) {
            console.error('Failed to export data', error);
            alert('Failed to generate export');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-light text-mentha-forest dark:text-mentha-beige">
                        Dashboard
                    </h1>
                    <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 mt-1">
                        Overview of your brand&apos;s AI visibility performance
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowScanModal(!showScanModal)}
                            disabled={!selectedProject}
                            className="flex items-center gap-2 px-4 py-2 border border-mentha-mint text-mentha-forest dark:text-mentha-beige rounded-xl font-sans text-sm font-medium hover:bg-mentha-mint/5 transition-all disabled:opacity-50"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                            New Scan
                        </button>

                        {showScanModal && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowScanModal(false)} />
                                <div ref={modalRef} className="absolute right-0 top-12 z-20 w-80 rounded-2xl border border-mentha-forest/10 dark:border-mentha-beige/10 bg-white dark:bg-mentha-forest shadow-xl p-5 space-y-4">
                                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mentha-mint">
                                        Scan Execution Mode
                                    </p>
                                    <div className="space-y-2">
                                        {[
                                            { value: 'browser', label: 'Browser', desc: 'Camoufox navigates AI engine UIs — real responses, needs Python + Playwright' },
                                            { value: 'api', label: 'API', desc: 'Calls OpenRouter directly — fast, no browser needed' },
                                            { value: 'hybrid', label: 'Hybrid', desc: 'Both browser + API in parallel — maximum coverage' },
                                        ].map((opt) => (
                                            <label
                                                key={opt.value}
                                                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                                    scanMode === opt.value
                                                        ? 'bg-mentha-mint/10 border border-mentha-mint/30'
                                                        : 'hover:bg-mentha-forest/5 dark:hover:bg-white/5 border border-transparent'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="scanMode"
                                                    value={opt.value}
                                                    checked={scanMode === opt.value}
                                                    onChange={(e) => setScanMode(e.target.value)}
                                                    className="mt-0.5 accent-mentha-mint"
                                                />
                                                <div>
                                                    <p className="font-sans text-sm font-medium text-mentha-forest dark:text-mentha-beige">
                                                        {opt.label}
                                                    </p>
                                                    <p className="font-sans text-xs text-mentha-forest/50 dark:text-mentha-beige/50 mt-0.5">
                                                        {opt.desc}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleScan}
                                        disabled={isScanning}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-mentha-forest dark:bg-mentha-beige text-white dark:text-mentha-forest rounded-xl font-sans text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                                    >
                                        {isScanning ? 'Scanning...' : 'Start Scan'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting || !selectedProject}
                        className="flex items-center gap-2 px-4 py-2 bg-mentha-forest dark:bg-mentha-beige text-white dark:text-mentha-forest rounded-xl font-sans text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {isExporting ? 'Exporting...' : 'Export Data'}
                    </button>
                </div>
            </div>

            <ReportStatusBanner />

            <MetricCards />

            <div className="grid grid-cols-1 gap-6">
                <div className="w-full">
                    <VisibilityChartCard />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <EngineBreakdown />
                </div>
                <div className="lg:col-span-2">
                    <TopKeywords />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <TopBrands />
                </div>
                <div className="lg:col-span-2">
                    <RecentScans />
                </div>
            </div>
        </div>
    );
}
