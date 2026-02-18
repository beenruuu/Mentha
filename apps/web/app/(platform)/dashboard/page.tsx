'use client';

import { EngineBreakdown } from '@/components/dashboard/EngineBreakdown';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { RecentScans } from '@/components/dashboard/RecentScans';
import { TopKeywords } from '@/components/dashboard/TopKeywords';
import { VisibilityChartCard } from '@/components/dashboard/VisibilityChartCard';

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

            <RecentScans />
        </div>
    );
}
