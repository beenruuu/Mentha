'use client';

import { EngineBreakdown } from '@/components/dashboard/engine-breakdown';
import { MetricCards } from '@/components/dashboard/metric-cards';
import { RecentScans } from '@/components/dashboard/recent-scans';
import { TopBrands } from '@/components/dashboard/top-brands';
import { TopKeywords } from '@/components/dashboard/top-keywords';
import { VisibilityChartCard } from '@/components/dashboard/visibility-chart-card';

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-light text-mentha-forest dark:text-mentha-beige">
                    Dashboard
                </h1>
                <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 mt-1">
                    Overview of your brand&apos;s AI visibility performance
                </p>
            </div>

            <MetricCards />

            <VisibilityChartCard />

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
